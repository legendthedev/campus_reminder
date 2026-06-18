<?php
declare(strict_types=1);

/**
 * Survey Task — equivalent of app/tasks/survey_tasks.py
 * Run via cron every Monday at 08:00:
 *   0 8 * * 1  php /path/to/backend-php/tasks/survey_task.php
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';

use App\Core\Database;
use App\Services\NotificationService;
use App\Services\SurveyService;

function sendWeeklySurveyInvite(): void
{
    $week = SurveyService::getCurrentWeekNumber();
    $pdo  = Database::getConnection();

    $stmt = $pdo->query("SELECT * FROM users WHERE role = 'student' AND is_active = TRUE");
    $students = $stmt->fetchAll();

    foreach ($students as $student) {
        $title = 'Weekly survey ready';
        $body  = 'How was your attendance this week? Takes 2 minutes. Your feedback matters.';

        $pdo->prepare('INSERT INTO notifications (recipient_id, title, body, type) VALUES (?, ?, ?, ?)')
            ->execute([$student['id'], $title, $body, 'survey_invite']);

        if (!empty($student['fcm_token'])) {
            NotificationService::sendPushNotification($student['fcm_token'], $title, $body);
        }
    }

    echo "Survey invites sent for week {$week} to " . count($students) . " students\n";
}

if (php_sapi_name() === 'cli') {
    sendWeeklySurveyInvite();
}
