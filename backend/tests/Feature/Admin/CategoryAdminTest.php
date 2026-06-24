<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_category_with_an_auto_slug(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/v1/admin/categories', ['name' => 'Healthy Snacks'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Healthy Snacks')
            ->assertJsonPath('data.slug', 'healthy-snacks')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('categories', ['slug' => 'healthy-snacks']);
    }

    public function test_admin_can_update_a_category(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $category = Category::factory()->create();

        $this->patchJson("/api/v1/admin/categories/{$category->id}", ['name' => 'Renamed', 'description' => 'Updated'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed')
            ->assertJsonPath('data.description', 'Updated');
    }

    public function test_deleting_a_category_soft_deletes_it(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $category = Category::factory()->create(['is_active' => true]);

        $this->deleteJson("/api/v1/admin/categories/{$category->id}")->assertOk();

        $this->assertDatabaseHas('categories', ['id' => $category->id, 'is_active' => false]);
    }

    public function test_non_admins_cannot_manage_categories(): void
    {
        Sanctum::actingAs(User::factory()->customer()->create());

        $this->getJson('/api/v1/admin/categories')->assertStatus(403);
        $this->postJson('/api/v1/admin/categories', ['name' => 'X'])->assertStatus(403);
    }
}
