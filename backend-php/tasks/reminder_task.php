<?php
declare(strict_types=1);

/**
 * Reminder Task — equivalent of app/tasks/reminder_tasks.py
 * Run via cron every 5 minutes:
 *   * /5 * * * *  php /path/to/backend-php/tasks/reminder_task.php
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';

use App\Core\Database;
use App\Core\RedisClient;
use App\Services\GeofenceService;
use App\Services\NotificationService;

function checkUpcomingClasses(): void
{
    $now = new \DateTime('now', new \DateTimeZone('Africa/Lagos'));
    $dow = (int)$now->format('N'); // 1=Mon … 7=Sun
    if ($dow >= 6) {
        return;
    }
    $hour = (int)$now->format('H');
    if ($hour < 7 || $hour >= 20) {
        return;
    }

    $windowStart = (clone $now)->modify('+10 minutes')->format('H:i:s');
    $windowEnd   = (clone $now)->modify('+20 minutes')->format('H:i:s');
    $todayName   = strtolower($now->format('l'));
    $todayDate   = $now->format('Y-m-d');

    $pdo = Database::getConnection();

    $stmt = $pdo->prepare('
        SELECT t.*, c.course_name, c.id AS cid
        FROM timetable_entries t
        JOIN courses c ON c.id = t.course_id
        WHERE t.day_of_week = ?
          AND t.start_time >= ?
          AND t.start_time <= ?
    ');
    $stmt->execute([$todayName, $windowStart, $windowEnd]);
    $entries = $stmt->fetchAll();

    $geofence = GeofenceService::getActiveGeofence();

    foreach ($entries as $entry) {
        $stuStmt = $pdo->prepare('
            SELECT u.* FROM users u
            JOIN course_enrollments ce ON ce.student_id = u.id
            WHERE ce.course_id = ? AND u.is_active = TRUE
        ');
        $stuStmt->execute([$entry['course_id']]);
        $students = $stuStmt->fetchAll();

        foreach ($students as $student) {
            // Skip if already sent today
            $ex = $pdo->prepare('SELECT id FROM reminder_logs WHERE student_id = ? AND timetable_entry_id = ? AND class_date = ?');
            $ex->execute([$student['id'], $entry['id'], $todayDate]);
            if ($ex->fetch()) {
                continue;
            }

            // Get location from Redis or DB
            $loc = RedisClient::getLocation($student['id']);
            if (!$loc) {
                $locStmt = $pdo->prepare('SELECT * FROM student_locations WHERE student_id = ? ORDER BY recorded_at DESC LIMIT 1');
                $locStmt->execute([$student['id']]);
                $locRow = $locStmt->fetch();
                if ($locRow) {
                    $age = time() - strtotime($locRow['recorded_at']);
                    if ($age < 1800) {
                        $loc = [
                            'latitude'        => (float)$locRow['latitude'],
                            'longitude'       => (float)$locRow['longitude'],
                            'is_on_campus'    => (bool)$locRow['is_on_campus'],
                            'distance_metres' => (float)$locRow['distance_metres'],
                        ];
                    }
                }
            }

            if ($loc && $geofence) {
                $isOnCampus = (bool)$loc['is_on_campus'];
                $distance   = (float)$loc['distance_metres'];
                $lat        = (float)$loc['latitude'];
                $lng        = (float)$loc['longitude'];
            } else {
                $isOnCampus = true;
                $distance   = 0.0;
                $lat        = null;
                $lng        = null;
            }

            $startStr    = substr($entry['start_time'], 0, 5);
            $courseName  = $entry['course_name'];
            $room        = $entry['room_name'];
            $building    = $entry['building_name'];
            $reminderType = $isOnCampus ? 'on_campus' : 'off_campus';
            $title       = 'Class reminder';
            $body        = $isOnCampus
                ? "{$courseName} starts at {$startStr} — {$room}, {$building}. You're already on campus!"
                : "{$courseName} starts at {$startStr} — {$room}, {$building}. Head to campus now.";

            $delivered = false;
            if (!empty($student['fcm_token'])) {
                $delivered = NotificationService::sendPushNotification($student['fcm_token'], $title, $body);
            }

            $pdo->prepare('
                INSERT INTO reminder_logs
                    (student_id, timetable_entry_id, course_id, reminder_type, was_on_campus,
                     student_latitude, student_longitude, distance_metres, fcm_delivered, class_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ')->execute([
                $student['id'],
                $entry['id'],
                $entry['course_id'],
                $reminderType,
                $isOnCampus ? 'TRUE' : 'FALSE',
                $lat,
                $lng,
                $distance,
                $delivered ? 'TRUE' : 'FALSE',
                $todayDate,
            ]);

            $pdo->prepare('
                INSERT INTO notifications (recipient_id, title, body, type) VALUES (?, ?, ?, ?)
            ')->execute([$student['id'], $title, $body, 'class_reminder']);
        }
    }

    echo "Reminder check done for {$todayName} {$windowStart}–{$windowEnd}\n";
}

// Run when called directly from CLI
if (php_sapi_name() === 'cli') {
    checkUpcomingClasses();
}
