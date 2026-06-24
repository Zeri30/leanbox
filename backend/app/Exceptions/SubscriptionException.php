<?php

namespace App\Exceptions;

use RuntimeException;

/** Domain error during subscription management; carries an envelope code + HTTP status. */
class SubscriptionException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 422,
    ) {
        parent::__construct($message);
    }
}
