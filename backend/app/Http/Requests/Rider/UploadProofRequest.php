<?php

namespace App\Http\Requests\Rider;

use Illuminate\Foundation\Http\FormRequest;

class UploadProofRequest extends FormRequest
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
            'image' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
