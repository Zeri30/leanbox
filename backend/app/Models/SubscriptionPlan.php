<?php

namespace App\Models;

use App\Enums\BillingInterval;
use App\Enums\MealType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'meal_type',
        'price',
        'billing_interval',
        'meals_per_cycle',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'meal_type' => MealType::class,
            'billing_interval' => BillingInterval::class,
            'price' => 'decimal:2',
            'meals_per_cycle' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    /** @param  Builder<SubscriptionPlan>  $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
