<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class CreateDeliveryRequest extends FormRequest
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
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'subscription_id' => ['nullable', 'integer', 'exists:subscriptions,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $hasOrder = filled($this->input('order_id'));
            $hasSubscription = filled($this->input('subscription_id'));

            if ($hasOrder === $hasSubscription) {
                $validator->errors()->add('order_id', 'Provide exactly one of order_id or subscription_id.');
            }
        });
    }
}
