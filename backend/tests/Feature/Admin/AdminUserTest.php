<?php

namespace Tests\Feature\Admin;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_only_customers(): void
    {
        User::factory()->count(3)->customer()->create();
        User::factory()->rider()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $res = $this->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'full_name', 'email', 'role']],
                'meta' => ['pagination' => ['current_page', 'last_page', 'per_page', 'total']],
                'error',
            ]);

        $this->assertSame(3, $res->json('meta.pagination.total'));
        foreach ($res->json('data') as $u) {
            $this->assertSame('customer', $u['role']);
        }
    }

    public function test_admin_can_search_customers(): void
    {
        User::factory()->customer()->create(['full_name' => 'Alice Cruz', 'email' => 'alice@example.com']);
        User::factory()->customer()->create(['full_name' => 'Bob Reyes', 'email' => 'bob@example.com']);
        Sanctum::actingAs(User::factory()->admin()->create());

        $res = $this->getJson('/api/v1/admin/users?search=alice')->assertOk();

        $this->assertSame(1, $res->json('meta.pagination.total'));
        $this->assertSame('alice@example.com', $res->json('data.0.email'));
    }

    public function test_admin_can_suspend_and_reactivate_a_customer(): void
    {
        $customer = User::factory()->customer()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$customer->id}/status", ['status' => 'suspended'])
            ->assertOk()->assertJsonPath('data.status', 'suspended');
        $this->assertSame(UserStatus::Suspended, $customer->fresh()->status);

        $this->patchJson("/api/v1/admin/users/{$customer->id}/status", ['status' => 'active'])
            ->assertOk()->assertJsonPath('data.status', 'active');
    }

    public function test_admin_cannot_change_another_admins_status(): void
    {
        $targetAdmin = User::factory()->admin()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$targetAdmin->id}/status", ['status' => 'suspended'])
            ->assertStatus(403);
    }

    public function test_status_update_rejects_an_invalid_value(): void
    {
        $customer = User::factory()->customer()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$customer->id}/status", ['status' => 'banned'])
            ->assertStatus(422);
    }

    public function test_non_admins_cannot_access_admin_user_endpoints(): void
    {
        $customer = User::factory()->customer()->create();
        Sanctum::actingAs($customer);

        $this->getJson('/api/v1/admin/users')->assertStatus(403);
        $this->patchJson("/api/v1/admin/users/{$customer->id}/status", ['status' => 'suspended'])
            ->assertStatus(403);
    }
}
