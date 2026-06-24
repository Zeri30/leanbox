<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('supabase');
    }

    public function test_admin_can_upload_a_primary_product_image(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();

        $res = $this->post(
            "/api/v1/admin/products/{$product->id}/images",
            ['image' => UploadedFile::fake()->create('bowl.jpg', 200, 'image/jpeg'), 'is_primary' => true],
            ['Accept' => 'application/json'],
        )->assertCreated()->assertJsonPath('data.is_primary', true);

        $image = ProductImage::findOrFail($res->json('data.id'));
        $this->assertSame($product->id, $image->product_id);
        Storage::disk('supabase')->assertExists($image->path);
    }

    public function test_setting_a_new_primary_unsets_the_previous_one(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();
        $first = ProductImage::factory()->primary()->for($product)->create();
        $second = ProductImage::factory()->for($product)->create(['is_primary' => false]);

        $this->patchJson("/api/v1/admin/products/{$product->id}/images/{$second->id}", ['is_primary' => true])
            ->assertOk()->assertJsonPath('data.is_primary', true);

        $this->assertFalse($first->fresh()->is_primary);
        $this->assertTrue($second->fresh()->is_primary);
    }

    public function test_admin_can_reorder_images(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();
        $a = ProductImage::factory()->for($product)->create(['sort_order' => 0]);
        $b = ProductImage::factory()->for($product)->create(['sort_order' => 1]);

        $this->patchJson("/api/v1/admin/products/{$product->id}/images/reorder", ['order' => [$b->id, $a->id]])
            ->assertOk();

        $this->assertSame(0, $b->fresh()->sort_order);
        $this->assertSame(1, $a->fresh()->sort_order);
    }

    public function test_reorder_rejects_ids_from_another_product(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();
        $own = ProductImage::factory()->for($product)->create();
        $foreign = ProductImage::factory()->create();

        $this->patchJson("/api/v1/admin/products/{$product->id}/images/reorder", ['order' => [$own->id, $foreign->id]])
            ->assertStatus(422)->assertJsonPath('error.code', 'invalid_order');
    }

    public function test_admin_can_delete_an_image_and_its_file(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();

        $res = $this->post(
            "/api/v1/admin/products/{$product->id}/images",
            ['image' => UploadedFile::fake()->create('p.png', 100, 'image/png')],
            ['Accept' => 'application/json'],
        )->assertCreated();
        $image = ProductImage::findOrFail($res->json('data.id'));
        Storage::disk('supabase')->assertExists($image->path);

        $this->deleteJson("/api/v1/admin/products/{$product->id}/images/{$image->id}")->assertOk();

        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
        Storage::disk('supabase')->assertMissing($image->path);
    }

    public function test_upload_rejects_a_non_image_file(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $product = Product::factory()->create();

        $this->post(
            "/api/v1/admin/products/{$product->id}/images",
            ['image' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')],
            ['Accept' => 'application/json'],
        )->assertStatus(422)->assertJsonPath('error.code', 'validation_error');
    }

    public function test_non_admins_cannot_upload_images(): void
    {
        Sanctum::actingAs(User::factory()->customer()->create());
        $product = Product::factory()->create();

        $this->post(
            "/api/v1/admin/products/{$product->id}/images",
            ['image' => UploadedFile::fake()->create('p.jpg', 100, 'image/jpeg')],
            ['Accept' => 'application/json'],
        )->assertStatus(403);
    }
}
