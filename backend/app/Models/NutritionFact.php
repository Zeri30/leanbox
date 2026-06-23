<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NutritionFact extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'serving_size',
        'calories',
        'protein_g',
        'carbs_g',
        'fat_g',
        'fiber_g',
        'sugar_g',
        'sodium_mg',
        'ingredients',
    ];

    protected function casts(): array
    {
        return [
            'calories' => 'integer',
            'protein_g' => 'decimal:2',
            'carbs_g' => 'decimal:2',
            'fat_g' => 'decimal:2',
            'fiber_g' => 'decimal:2',
            'sugar_g' => 'decimal:2',
            'sodium_mg' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
