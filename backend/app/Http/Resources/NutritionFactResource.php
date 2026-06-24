<?php

namespace App\Http\Resources;

use App\Models\NutritionFact;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin NutritionFact
 */
class NutritionFactResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'serving_size' => $this->serving_size,
            'calories' => $this->calories,
            'protein_g' => $this->protein_g,
            'carbs_g' => $this->carbs_g,
            'fat_g' => $this->fat_g,
            'fiber_g' => $this->fiber_g,
            'sugar_g' => $this->sugar_g,
            'sodium_mg' => $this->sodium_mg,
            'ingredients' => $this->ingredients,
        ];
    }
}
