<?php

namespace Tests\Feature\Auth;

use App\Models\Cart;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use App\Policies\CartPolicy;
use App\Policies\DeliveryPolicy;
use App\Policies\OrderPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_is_accessible_only_to_its_owner_or_an_admin(): void
    {
        $owner = User::factory()->customer()->create();
        $stranger = User::factory()->customer()->create();
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['user_id' => $owner->id]);

        $policy = new OrderPolicy;
        $this->assertTrue($policy->view($owner, $order));
        $this->assertFalse($policy->view($stranger, $order));
        $this->assertTrue($policy->view($admin, $order));
    }

    public function test_cart_is_accessible_only_to_its_owner(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $cart = Cart::factory()->create(['user_id' => $owner->id]);

        $policy = new CartPolicy;
        $this->assertTrue($policy->view($owner, $cart));
        $this->assertFalse($policy->view($other, $cart));
    }

    public function test_delivery_is_accessible_to_its_assigned_rider_or_an_admin(): void
    {
        $rider = User::factory()->rider()->create();
        $otherRider = User::factory()->rider()->create();
        $admin = User::factory()->admin()->create();
        $delivery = Delivery::factory()->assigned($rider->id)->create();

        $policy = new DeliveryPolicy;
        $this->assertTrue($policy->view($rider, $delivery));
        $this->assertFalse($policy->view($otherRider, $delivery));
        $this->assertTrue($policy->view($admin, $delivery));
    }
}
