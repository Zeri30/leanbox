<?php

namespace App\Http\Requests\Subscription;

use App\Enums\DeliverySchedule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubscribeRequest extends FormRequest
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
            'plan_id' => ['required', 'integer', Rule::exists('subscription_plans', 'id')->where('is_active', true)],
            'delivery_address_id' => [
                'required', 'integer',
                Rule::exists('addresses', 'id')->where(fn ($q) => $q->where('user_id', $this->user()->id)),
            ],
            'delivery_schedule' => ['required', Rule::enum(DeliverySchedule::class)],
        ];
    }
}
