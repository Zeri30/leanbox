<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use InvalidArgumentException;

class Delivery extends Model
{
    use HasFactory;

    protected $table = 'deliveries';

    protected $fillable = [
        'order_id',
        'subscription_id',
        'rider_id',
        'delivery_address_id',
        'status',
        'assigned_at',
        'delivered_at',
        'proof_image_url',
        'delivery_notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryStatus::class,
            'assigned_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    /**
     * Enforce the DB CHECK at the model level too: a delivery must reference
     * exactly one of an order or a subscription cycle.
     */
    protected static function booted(): void
    {
        static::saving(function (Delivery $delivery): void {
            $hasOrder = ! is_null($delivery->order_id);
            $hasSubscription = ! is_null($delivery->subscription_id);

            if ($hasOrder === $hasSubscription) {
                throw new InvalidArgumentException(
                    'A delivery must reference exactly one of an order or a subscription.'
                );
            }
        });
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function deliveryAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'delivery_address_id');
    }

    /** @param  Builder<Delivery>  $query */
    public function scopeForRider(Builder $query, int $riderId): void
    {
        $query->where('rider_id', $riderId);
    }

    /** @param  Builder<Delivery>  $query */
    public function scopeWithStatus(Builder $query, DeliveryStatus $status): void
    {
        $query->where('status', $status);
    }
}
