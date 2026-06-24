<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\Notification;

class NotificationService
{
    /** Create an in-app notification for a user. */
    public function notify(int $userId, NotificationType $type, string $title, string $message): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'is_read' => false,
        ]);
    }
}
