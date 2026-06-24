<?php

namespace App\Http\Requests\Admin;

use App\Enums\BillingInterval;
use App\Enums\MealType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'meal_type' => ['required', Rule::enum(MealType::class)],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_interval' => ['required', Rule::enum(BillingInterval::class)],
            'meals_per_cycle' => ['required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
