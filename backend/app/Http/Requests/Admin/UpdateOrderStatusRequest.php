<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
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
            // Admins advance forward only; `delivered` is the rider's action,
            // and cancellation uses the dedicated cancel endpoint.
            'status' => ['required', Rule::in(['confirmed', 'preparing', 'shipped'])],
        ];
    }
}
