<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Config;

class NotificationService
{
    public static function sendPushNotification(string $fcmToken, string $title, string $body): bool
    {
        $serverKey = Config::getInstance()->get('fcm_server_key', '');
        if (empty($serverKey) || $serverKey === 'your-firebase-server-key-here' || empty($fcmToken)) {
            error_log('FCM not configured or no token — skipping push');
            return false;
        }

        $payload = json_encode([
            'to'           => $fcmToken,
            'notification' => ['title' => $title, 'body' => $body],
        ]);

        $ch = curl_init('https://fcm.googleapis.com/fcm/send');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Authorization: key=' . $serverKey,
                'Content-Type: application/json',
            ],
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response === false) {
            return false;
        }
        $result = json_decode($response, true);
        return ($result['success'] ?? 0) === 1;
    }

    public static function saveNotification(string $recipientId, string $title, string $body, string $type): array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('
            INSERT INTO notifications (recipient_id, title, body, type)
            VALUES (?, ?, ?, ?)
            RETURNING *
        ');
        $stmt->execute([$recipientId, $title, $body, $type]);
        return $stmt->fetch();
    }

    public static function broadcastNotification(string $title, string $body, string $target = 'all'): int
    {
        $pdo = Database::getConnection();

        if ($target === 'all') {
            $stmt = $pdo->query("SELECT * FROM users WHERE is_active = TRUE AND role = 'student'");
            $students = $stmt->fetchAll();
        } else {
            $stmt = $pdo->prepare('
                SELECT u.* FROM users u
                JOIN course_enrollments ce ON ce.student_id = u.id
                WHERE ce.course_id = ?
            ');
            $stmt->execute([$target]);
            $students = $stmt->fetchAll();
        }

        $sent = 0;
        foreach ($students as $student) {
            self::saveNotification($student['id'], $title, $body, 'announcement');
            if (!empty($student['fcm_token'])) {
                self::sendPushNotification($student['fcm_token'], $title, $body);
                $sent++;
            }
        }
        return $sent;
    }
}
