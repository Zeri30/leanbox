<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->foreignId('delivery_address_id')->constrained('addresses')->restrictOnDelete();
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->enum('delivery_schedule', ['daily', 'weekly', 'biweekly']);
            $table->date('start_date');
            $table->date('next_delivery_date')->nullable();
            $table->date('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
