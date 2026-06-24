<?php

namespace App\Exceptions;

use RuntimeException;

/** Domain error during delivery management; carries an envelope code + HTTP status. */
class DeliveryException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 422,
    ) {
        parent::__construct($message);
    }
}
