<?php

namespace App\Exceptions;

use RuntimeException;

/** Domain error when creating a review; carries an envelope code + HTTP status. */
class ReviewException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 422,
    ) {
        parent::__construct($message);
    }
}
