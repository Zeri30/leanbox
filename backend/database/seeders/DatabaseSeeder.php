<?php

namespace Database\Seeders;

use App\Enums\BillingInterval;
use App\Enums\DeliveryStatus;
use App\Enums\MealType;
use App\Enums\NotificationType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Notification;
use App\Models\NutritionFact;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed a browsable demo dataset covering all roles, categories, and statuses.
     * Run with `php artisan migrate:fresh --seed`.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // ---------- Users (known demo accounts; password = "password") ----------
            $admin = User::factory()->admin()->create(['full_name' => 'Leanbox Admin', 'email' => 'admin@leanbox.test']);
            $demoCustomer = User::factory()->customer()->create(['full_name' => 'Maya Customer', 'email' => 'customer@leanbox.test']);
            $demoRider = User::factory()->rider()->create(['full_name' => 'Ramon Rider', 'email' => 'rider@leanbox.test']);

            $customers = User::factory()->count(4)->customer()->create()->prepend($demoCustomer);
            $riders = User::factory()->count(1)->rider()->create()->prepend($demoRider);

            $addressByUser = [];
            foreach ($customers as $customer) {
                $addressByUser[$customer->id] = Address::factory()->create(['user_id' => $customer->id]);
            }

            // ---------- Catalog: the 5 real categories ----------
            $categories = [
                ['Vegetarian Meals', 'vegetarian-meals', true],
                ['High-Protein Meals', 'high-protein-meals', true],
                ['Supplements', 'supplements', true],
                ['Healthy Snacks', 'healthy-snacks', true],
                ['Wellness', 'wellness', false],
            ];

            $products = collect();
            foreach ($categories as [$name, $slug, $edible]) {
                $category = Category::create([
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $name.' for a fit lifestyle.',
                    'is_active' => true,
                ]);

                $catProducts = Product::factory()->count(4)->for($category)->create();
                $catProducts->push(Product::factory()->lowStock()->for($category)->create());

                foreach ($catProducts as $product) {
                    ProductImage::factory()->primary()->for($product)->create();
                    ProductImage::factory()->for($product)->create(['sort_order' => 1]);
                    if ($edible) {
                        NutritionFact::factory()->for($product)->create();
                    }
                }

                $products = $products->concat($catProducts);
            }

            // ---------- A cart for the demo customer ----------
            $cart = Cart::factory()->create(['user_id' => $demoCustomer->id]);
            foreach ($products->random(2) as $product) {
                $cart->items()->create([
                    'product_id' => $product->id,
                    'quantity' => fake()->numberBetween(1, 3),
                    'unit_price' => $product->price,
                ]);
            }

            // ---------- Orders across every status ----------
            $statusPlan = [
                [OrderStatus::Pending, 2],
                [OrderStatus::Confirmed, 1],
                [OrderStatus::Preparing, 1],
                [OrderStatus::Shipped, 1],
                [OrderStatus::Delivered, 2],
                [OrderStatus::Cancelled, 1],
            ];

            $firstReviewHidden = true;
            foreach ($statusPlan as [$status, $count]) {
                for ($n = 0; $n < $count; $n++) {
                    $customer = $customers->random();
                    $address = $addressByUser[$customer->id];
                    $picked = $products->random(fake()->numberBetween(1, 3));

                    $subtotal = 0.0;
                    $itemsData = [];
                    foreach ($picked as $product) {
                        $qty = fake()->numberBetween(1, 3);
                        $line = round((float) $product->price * $qty, 2);
                        $subtotal += $line;
                        $itemsData[] = [
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'quantity' => $qty,
                            'unit_price' => $product->price,
                            'line_total' => $line,
                        ];
                    }

                    $shipping = 49;
                    $order = Order::create([
                        'user_id' => $customer->id,
                        'delivery_address_id' => $address->id,
                        'order_number' => 'ORD-'.strtoupper(Str::random(8)),
                        'status' => $status,
                        'subtotal' => $subtotal,
                        'shipping_fee' => $shipping,
                        'tax' => 0,
                        'total' => $subtotal + $shipping,
                        'placed_at' => now()->subDays(fake()->numberBetween(0, 20)),
                    ]);
                    $order->items()->createMany($itemsData);

                    $order->payment()->create([
                        'method' => PaymentMethod::Cod,
                        'status' => $status === OrderStatus::Delivered ? PaymentStatus::Paid : PaymentStatus::Pending,
                        'amount' => $order->total,
                        'paid_at' => $status === OrderStatus::Delivered ? now() : null,
                    ]);

                    // Deliveries + reviews per lifecycle stage
                    if ($status === OrderStatus::Delivered) {
                        Delivery::factory()->delivered($riders->random()->id)->create([
                            'order_id' => $order->id,
                            'delivery_address_id' => $address->id,
                        ]);
                        foreach ($picked as $product) {
                            Review::factory()->create([
                                'user_id' => $customer->id,
                                'product_id' => $product->id,
                                'order_id' => $order->id,
                                'is_hidden' => $firstReviewHidden,
                            ]);
                            $firstReviewHidden = false;
                        }
                    } elseif ($status === OrderStatus::Shipped) {
                        Delivery::factory()->assigned($riders->random()->id)->create([
                            'order_id' => $order->id,
                            'delivery_address_id' => $address->id,
                            'status' => DeliveryStatus::OutForDelivery,
                        ]);
                    } elseif ($status === OrderStatus::Preparing) {
                        Delivery::factory()->assigned($riders->random()->id)->create([
                            'order_id' => $order->id,
                            'delivery_address_id' => $address->id,
                        ]);
                    } elseif ($status === OrderStatus::Confirmed) {
                        Delivery::factory()->create([
                            'order_id' => $order->id,
                            'delivery_address_id' => $address->id,
                        ]); // pending, awaiting admin assignment
                    }
                }
            }

            // ---------- Subscription plans ----------
            $planA = SubscriptionPlan::create([
                'name' => 'Veggie Starter', 'description' => 'Plant-based meals delivered weekly.',
                'meal_type' => MealType::Vegetarian, 'price' => 1499, 'billing_interval' => BillingInterval::Weekly,
                'meals_per_cycle' => 5, 'is_active' => true,
            ]);
            $planB = SubscriptionPlan::create([
                'name' => 'High-Protein Pro', 'description' => 'High-protein meals billed monthly.',
                'meal_type' => MealType::HighProtein, 'price' => 4999, 'billing_interval' => BillingInterval::Monthly,
                'meals_per_cycle' => 14, 'is_active' => true,
            ]);
            SubscriptionPlan::create([
                'name' => 'Balanced Mixed', 'description' => 'A balanced mix, weekly.',
                'meal_type' => MealType::Mixed, 'price' => 1999, 'billing_interval' => BillingInterval::Weekly,
                'meals_per_cycle' => 7, 'is_active' => true,
            ]);

            // Active subscription for the demo customer, with two billed cycles + a delivered cycle.
            $subscription = Subscription::factory()->create([
                'user_id' => $demoCustomer->id,
                'plan_id' => $planA->id,
                'delivery_address_id' => $addressByUser[$demoCustomer->id]->id,
                'status' => SubscriptionStatus::Active,
            ]);
            SubscriptionPayment::factory()->create([
                'subscription_id' => $subscription->id, 'amount' => $planA->price,
                'billing_date' => now()->subWeek()->toDateString(), 'paid_at' => now()->subWeek(),
            ]);
            SubscriptionPayment::factory()->create([
                'subscription_id' => $subscription->id, 'amount' => $planA->price,
                'billing_date' => now()->toDateString(), 'paid_at' => now(),
            ]);
            Delivery::factory()->forSubscription($subscription)->delivered($demoRider->id)->create();

            // A cancelled subscription for variety.
            $otherCustomer = $customers->firstWhere('id', '!=', $demoCustomer->id);
            Subscription::factory()->cancelled()->create([
                'user_id' => $otherCustomer->id,
                'plan_id' => $planB->id,
                'delivery_address_id' => $addressByUser[$otherCustomer->id]->id,
            ]);

            // ---------- Notifications ----------
            Notification::factory()->count(2)->create(['user_id' => $admin->id, 'type' => NotificationType::NewOrder]);
            Notification::factory()->create(['user_id' => $admin->id, 'type' => NotificationType::LowStock, 'is_read' => false]);
            Notification::factory()->count(2)->create(['user_id' => $demoCustomer->id, 'type' => NotificationType::OrderUpdate]);
            Notification::factory()->create(['user_id' => $demoRider->id, 'type' => NotificationType::DeliveryAssigned, 'is_read' => false]);
        });

        $this->command->info('Seeded: '.User::count().' users, '.Category::count().' categories, '
            .Product::count().' products, '.Order::count().' orders, '.Subscription::count().' subscriptions, '
            .Delivery::count().' deliveries, '.Review::count().' reviews.');
        $this->command->info('Demo logins (password "password"): admin@leanbox.test, customer@leanbox.test, rider@leanbox.test');
    }
}
