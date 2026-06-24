<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_route_allows_admin_and_blocks_other_roles(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/v1/admin/ping')->assertOk()->assertJsonPath('data.scope', 'admin');

        Sanctum::actingAs(User::factory()->customer()->create());
        $this->getJson('/api/v1/admin/ping')->assertStatus(403)->assertJsonPath('error.code', 'forbidden');

        Sanctum::actingAs(User::factory()->rider()->create());
        $this->getJson('/api/v1/admin/ping')->assertStatus(403);
    }

    public function test_rider_route_allows_rider_and_blocks_other_roles(): void
    {
        Sanctum::actingAs(User::factory()->rider()->create());
        $this->getJson('/api/v1/rider/ping')->assertOk()->assertJsonPath('data.scope', 'rider');

        Sanctum::actingAs(User::factory()->customer()->create());
        $this->getJson('/api/v1/rider/ping')->assertStatus(403);

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/v1/rider/ping')->assertStatus(403);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/admin/ping')->assertStatus(401);
        $this->getJson('/api/v1/rider/ping')->assertStatus(401);
    }

    public function test_suspended_users_are_rejected_on_authenticated_requests(): void
    {
        Sanctum::actingAs(User::factory()->suspended()->create());

        $this->getJson('/api/v1/user')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'account_suspended');
    }
}
