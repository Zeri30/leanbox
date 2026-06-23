<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            // A delivery belongs to EITHER an order OR a subscription cycle (enforced by CHECK below).
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('delivery_address_id')->constrained('addresses')->restrictOnDelete();
            $table->enum('status', [
                'pending', 'assigned', 'out_for_delivery', 'delivered', 'failed',
            ])->default('pending');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->string('proof_image_url')->nullable();
            $table->text('delivery_notes')->nullable();
            $table->timestamps();

            $table->index(['rider_id', 'status']);
            $table->index('order_id');
            $table->index('subscription_id');
        });

        // Exactly one of order_id / subscription_id must be set.
        DB::statement('ALTER TABLE deliveries ADD CONSTRAINT chk_deliveries_one_target
            CHECK ((order_id IS NOT NULL)::int + (subscription_id IS NOT NULL)::int = 1)');
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
