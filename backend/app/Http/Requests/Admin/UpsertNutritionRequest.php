<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpsertNutritionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'serving_size' => ['sometimes', 'nullable', 'string', 'max:100'],
            'calories' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'protein_g' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'carbs_g' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'fat_g' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'fiber_g' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sugar_g' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sodium_mg' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'ingredients' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
