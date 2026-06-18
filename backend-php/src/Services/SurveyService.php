<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Config;

class SurveyService
{
    public static function getCurrentWeekNumber(): int
    {
        $studyStart = new \DateTime(Config::getInstance()->get('study_start_date', '2024-09-01'));
        $today      = new \DateTime('today');
        $delta      = $studyStart->diff($today)->days;
        return max(1, (int)($delta / 7) + 1);
    }

    public static function getWeekStartDate(int $weekNumber): string
    {
        $studyStart = new \DateTime(Config::getInstance()->get('study_start_date', '2024-09-01'));
        $studyStart->modify('+' . (($weekNumber - 1) * 7) . ' days');
        return $studyStart->format('Y-m-d');
    }

    public static function submitSurvey(string $studentId, array $data): array
    {
        $week = self::getCurrentWeekNumber();
        $pdo  = Database::getConnection();

        $stmt = $pdo->prepare('SELECT id FROM survey_responses WHERE student_id = ? AND survey_week = ?');
        $stmt->execute([$studentId, $week]);
        if ($stmt->fetch()) {
            throw new \RuntimeException('Already submitted survey for this week', 400);
        }

        $weekStart = self::getWeekStartDate($week);
        $stmt = $pdo->prepare('
            INSERT INTO survey_responses
                (student_id, survey_week, week_start_date, q1_punctuality_rating, q2_missed_classes,
                 q3_reminder_helpful, q4_location_preference, q5_privacy_comfort, q6_open_feedback)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        ');
        $stmt->execute([
            $studentId,
            $week,
            $weekStart,
            $data['q1_punctuality_rating'],
            $data['q2_missed_classes'],
            $data['q3_reminder_helpful'] ? 'TRUE' : 'FALSE',
            $data['q4_location_preference'],
            $data['q5_privacy_comfort'],
            $data['q6_open_feedback'] ?? null,
        ]);
        return $stmt->fetch();
    }

    public static function getStudentSurveys(string $studentId): array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('SELECT * FROM survey_responses WHERE student_id = ? ORDER BY survey_week');
        $stmt->execute([$studentId]);
        return $stmt->fetchAll();
    }

    public static function getAllSurveys(): array
    {
        $pdo = Database::getConnection();
        return $pdo->query('SELECT * FROM survey_responses ORDER BY survey_week')->fetchAll();
    }

    public static function checkSubmitted(string $studentId, int $week): bool
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('SELECT id FROM survey_responses WHERE student_id = ? AND survey_week = ?');
        $stmt->execute([$studentId, $week]);
        return (bool)$stmt->fetch();
    }
}
