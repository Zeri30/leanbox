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

            // ---------- Catalog: 5 real categories with a curated, real-looking lineup ----------
            // Product photos are curated Unsplash images (host allow-listed in the web app's
            // next.config). Each item: [name, price, stock, featured, best_selling, photoId,
            // description, nutrition] where nutrition is null for non-food items, else
            // [serving_size, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, ingredients].
            $img = fn (string $id) => "https://images.unsplash.com/photo-{$id}?w=800&h=800&fit=crop";

            $catalog = [
                ['Vegetarian Meals', 'vegetarian-meals', 'Plant-based, chef-made meals.', [
                    ['Rainbow Buddha Bowl', 289, 60, true, false, '1512621776951-a57141f2eefd',
                        'A vibrant bowl of avocado, chickpeas, roasted sweet potato, and crisp veggies with a creamy tahini drizzle.',
                        ['1 bowl (400g)', 520, 18, 62, 22, 14, 9, 480, 'Avocado, chickpeas, cherry tomatoes, sweet potato, red cabbage, lettuce, microgreens, tahini dressing.']],
                    ['Garden Power Plate', 259, 45, false, true, '1490645935967-10de6ba17061',
                        'Zucchini noodles and kale with a soft-boiled egg, crunchy radish, and toasted seeds.',
                        ['1 plate (350g)', 410, 16, 38, 21, 10, 7, 420, 'Soft-boiled egg, zucchini noodles, kale, carrots, cherry tomatoes, radish, mixed seeds.']],
                    ['Tofu Teriyaki Bowl', 279, 50, false, false, '1546069901-ba9599a7e63c',
                        'Grilled tofu over brown rice with edamame, sweet corn, and a glossy teriyaki glaze.',
                        ['1 bowl (380g)', 480, 22, 55, 16, 8, 12, 690, 'Grilled tofu, brown rice, edamame, sweet corn, bell peppers, teriyaki glaze.']],
                    ['Mediterranean Lentil Bowl', 269, 6, false, false, '1512621776951-a57141f2eefd',
                        'Hearty lentils and quinoa with cucumber, olives, feta, and a bright lemon-herb dressing.',
                        ['1 bowl (380g)', 450, 19, 58, 14, 15, 8, 510, 'Lentils, quinoa, cucumber, tomato, olives, feta, lemon-herb dressing.']],
                ]],
                ['High-Protein Meals', 'high-protein-meals', 'Macro-friendly meals to hit your protein goals.', [
                    ['Grilled Steak Salad', 349, 40, true, false, '1607532941433-304659e8198a',
                        'Seared sirloin over butter lettuce with cherry tomatoes, walnuts, and a balsamic finish.',
                        ['1 plate (350g)', 560, 42, 18, 34, 5, 6, 620, 'Grilled beef sirloin, butter lettuce, cherry tomatoes, walnuts, herbs, balsamic.']],
                    ['Chicken & Rice Power Bowl', 319, 70, false, true, '1568093858174-0f391ea21c45',
                        'Shredded chicken in tomato salsa over fluffy jasmine rice with fresh cilantro.',
                        ['1 bowl (450g)', 620, 45, 68, 16, 4, 5, 740, 'Shredded chicken, jasmine rice, tomato salsa, cilantro.']],
                    ['Chicken Caesar Salad', 299, 55, false, false, '1512852939750-1305098529bf',
                        'Grilled chicken breast, crisp romaine, shaved parmesan, and crunchy croutons.',
                        ['1 plate (320g)', 480, 38, 16, 30, 3, 3, 820, 'Grilled chicken breast, romaine, parmesan, croutons, caesar dressing.']],
                    ['Smokehouse Protein Burger', 329, 0, false, false, '1610440042657-612c34d95e9f',
                        'A grass-fed beef patty with smoky BBQ glaze, fresh greens, and tomato on a brioche bun.',
                        ['1 burger (300g)', 720, 39, 48, 40, 4, 9, 980, 'Grass-fed beef patty, brioche bun, lettuce, tomato, onion, smoky BBQ glaze.']],
                ]],
                ['Supplements', 'supplements', 'Protein, vitamins, and performance support.', [
                    ['Whey Protein Isolate — Vanilla (1kg)', 1899, 80, true, true, '1593095948071-474c5cc2989d',
                        'Fast-absorbing whey isolate with 27g protein per scoop and barely any sugar.',
                        ['1 scoop (30g)', 120, 27, 3, 1.5, 0, 2, 60, 'Whey protein isolate, natural vanilla flavor, stevia, sunflower lecithin.']],
                    ['Daily Multivitamin (90 tablets)', 699, 120, false, false, '1607619056574-7b8d3ee536b2',
                        'A complete daily blend of essential vitamins and minerals for everyday wellness.',
                        ['1 tablet', 5, 0, 1, 0, 0, 0, 5, 'Vitamins A, C, D, E, B-complex, zinc, magnesium, selenium.']],
                    ['Plant Protein Blend — Choco (1kg)', 1699, 35, false, false, '1579722820308-d74e571900a9',
                        'A smooth pea-and-rice protein blend with rich cocoa — fully plant-based.',
                        ['1 scoop (33g)', 130, 24, 6, 3, 3, 2, 180, 'Pea protein, brown rice protein, cocoa powder, natural flavor, stevia.']],
                    ['Pre-Workout Energy — Berry', 1099, 8, false, false, '1517836357463-d25dfeac3438',
                        'Clean energy and focus with citrulline, beta-alanine, and a measured caffeine kick.',
                        ['1 scoop (12g)', 15, 0, 4, 0, 0, 0, 120, 'Citrulline malate, beta-alanine, caffeine, natural berry flavor.']],
                ]],
                ['Healthy Snacks', 'healthy-snacks', 'Better-for-you snacks and treats.', [
                    ['Dark Chocolate Almond Bark', 189, 90, true, false, '1606312619070-d48b4c652a52',
                        'Rich 72% dark chocolate studded with roasted almonds and a touch of sea salt.',
                        ['2 pieces (40g)', 220, 5, 18, 15, 4, 10, 25, '72% dark chocolate, roasted almonds, sea salt.']],
                    ['Mixed Berry Granola Cups', 169, 75, false, true, '1542691457-cbe4df041eb2',
                        'Crunchy oat granola layered with creamy yogurt and fresh berries.',
                        ['1 cup (60g)', 240, 7, 34, 8, 5, 12, 60, 'Rolled oats, almonds, honey, yogurt, strawberries, blueberries.']],
                    ['Fresh Fruit Snack Pack', 149, 60, false, false, '1564093497595-593b96d80180',
                        'A ready-to-eat medley of mango, berries, and banana over baby spinach.',
                        ['1 pack (200g)', 110, 2, 27, 0.5, 4, 20, 5, 'Mango, strawberries, blueberries, banana, baby spinach.']],
                    ['Oat Cookie Duo', 129, 7, false, false, '1544787219-7f47ccb76574',
                        'Two soft-baked whole-grain oat cookies with dark chocolate chips.',
                        ['2 cookies (50g)', 230, 4, 30, 10, 2, 14, 150, 'Whole-grain oats, butter, brown sugar, dark chocolate chips.']],
                ]],
                ['Wellness', 'wellness', 'Drinks and self-care for a balanced lifestyle.', [
                    ['Cold-Pressed Iced Tea', 99, 100, true, false, '1556679343-c7306c1976bc',
                        'A refreshing cold-pressed tea with a squeeze of lime — lightly sweetened.', null],
                    ['Detox Smoothie Trio', 259, 40, false, true, '1622597467836-f3285f2131b8',
                        'Three cold-pressed smoothies — green, berry, and tropical — for an easy reset.', null],
                    ['Glow Skincare Serum', 549, 50, false, false, '1556228578-8c89e6adf883',
                        'A lightweight daily serum to hydrate and brighten skin.', null],
                    ['Antioxidant Fruit Box', 229, 9, false, false, '1490818387583-1baba5e638af',
                        'A curated box of antioxidant-rich seasonal fruit, delivered fresh.', null],
                ]],
            ];

            $products = collect();
            foreach ($catalog as [$catName, $catSlug, $catDescription, $items]) {
                $category = Category::create([
                    'name' => $catName,
                    'slug' => $catSlug,
                    'description' => $catDescription,
                    'is_active' => true,
                ]);

                foreach ($items as [$pName, $price, $stock, $featured, $bestSelling, $photoId, $pDescription, $nutrition]) {
                    $product = Product::create([
                        'category_id' => $category->id,
                        'name' => $pName,
                        'slug' => Str::slug($pName),
                        'description' => $pDescription,
                        'price' => $price,
                        'stock_quantity' => $stock,
                        'low_stock_threshold' => 10,
                        'is_featured' => $featured,
                        'is_best_selling' => $bestSelling,
                        'is_active' => true,
                    ]);

                    ProductImage::create([
                        'product_id' => $product->id,
                        'url' => $img($photoId),
                        'alt_text' => $pName,
                        'is_primary' => true,
                        'sort_order' => 0,
                    ]);

                    if ($nutrition !== null) {
                        [$serving, $cal, $protein, $carbs, $fat, $fiber, $sugar, $sodium, $ingredients] = $nutrition;
                        NutritionFact::create([
                            'product_id' => $product->id,
                            'serving_size' => $serving,
                            'calories' => $cal,
                            'protein_g' => $protein,
                            'carbs_g' => $carbs,
                            'fat_g' => $fat,
                            'fiber_g' => $fiber,
                            'sugar_g' => $sugar,
                            'sodium_mg' => $sodium,
                            'ingredients' => $ingredients,
                        ]);
                    }

                    $products->push($product);
                }
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
