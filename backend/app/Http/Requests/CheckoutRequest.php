<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
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
            'delivery_address_id' => [
                'required', 'integer',
                // Must be one of the authenticated user's own addresses.
                Rule::exists('addresses', 'id')->where(fn ($q) => $q->where('user_id', $this->user()->id)),
            ],
            // Only configured gateways are accepted (COD only for now).
            'payment_method' => ['sometimes', 'string', Rule::in(array_keys(config('payments.gateways')))],
        ];
    }
}
