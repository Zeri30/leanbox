<?php

namespace App\Http\Requests\Admin;

use App\Enums\BillingInterval;
use App\Enums\MealType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlanRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'meal_type' => ['sometimes', Rule::enum(MealType::class)],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'billing_interval' => ['sometimes', Rule::enum(BillingInterval::class)],
            'meals_per_cycle' => ['sometimes', 'required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
