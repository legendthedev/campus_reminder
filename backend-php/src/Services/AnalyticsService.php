<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Config;

class AnalyticsService
{
    public static function getPunctualitySummary(): array
    {
        $pdo  = Database::getConnection();
        $rows = $pdo->query('SELECT q1_punctuality_rating, q2_missed_classes, q3_reminder_helpful, q5_privacy_comfort FROM survey_responses')->fetchAll();

        if (empty($rows)) {
            return ['avg_punctuality' => null, 'avg_missed' => null, 'total_responses' => 0];
        }

        $q1 = array_column($rows, 'q1_punctuality_rating');
        $q2 = array_column($rows, 'q2_missed_classes');
        $q3 = array_column($rows, 'q3_reminder_helpful');
        $q5 = array_column($rows, 'q5_privacy_comfort');

        return [
            'avg_punctuality'    => round(array_sum($q1) / count($q1), 2),
            'avg_missed'         => round(array_sum($q2) / count($q2), 2),
            'total_responses'    => count($rows),
            'helpful_pct'        => round((array_sum(array_map(fn($v) => (int)$v, $q3)) / count($q3)) * 100, 1),
            'avg_privacy_comfort' => round(array_sum($q5) / count($q5), 2),
        ];
    }

    public static function getWeeklyTrend(): array
    {
        $pdo  = Database::getConnection();
        $rows = $pdo->query('SELECT survey_week, q1_punctuality_rating, q2_missed_classes FROM survey_responses ORDER BY survey_week')->fetchAll();

        if (empty($rows)) {
            return [];
        }

        $byWeek = [];
        foreach ($rows as $row) {
            $w = (int)$row['survey_week'];
            if (!isset($byWeek[$w])) {
                $byWeek[$w] = ['q1' => [], 'q2' => [], 'count' => 0];
            }
            $byWeek[$w]['q1'][]   = (float)$row['q1_punctuality_rating'];
            $byWeek[$w]['q2'][]   = (float)$row['q2_missed_classes'];
            $byWeek[$w]['count']++;
        }

        $studyStart = new \DateTime(Config::getInstance()->get('study_start_date', '2024-09-01'));
        $reminders  = $pdo->query('SELECT class_date FROM reminder_logs')->fetchAll();
        $reminderCounts = [];
        foreach ($reminders as $r) {
            $d    = new \DateTime($r['class_date']);
            $diff = $studyStart->diff($d)->days;
            $week = max(1, (int)($diff / 7) + 1);
            $reminderCounts[$week] = ($reminderCounts[$week] ?? 0) + 1;
        }

        $trend = [];
        foreach ($byWeek as $week => $data) {
            $trend[] = [
                'week'            => $week,
                'avg_punctuality' => round(array_sum($data['q1']) / count($data['q1']), 2),
                'avg_missed'      => round(array_sum($data['q2']) / count($data['q2']), 2),
                'response_count'  => $data['count'],
                'reminder_count'  => $reminderCounts[$week] ?? 0,
            ];
        }
        return $trend;
    }

    public static function getReminderEffectiveness(): array
    {
        $pdo     = Database::getConnection();
        $surveys = $pdo->query('SELECT student_id, q1_punctuality_rating FROM survey_responses')->fetchAll();
        $reminders = $pdo->query('SELECT student_id, COUNT(*) as cnt FROM reminder_logs GROUP BY student_id')->fetchAll();

        if (empty($surveys) || empty($reminders)) {
            return ['correlation' => null, 'interpretation' => 'Insufficient data'];
        }

        $sMap = [];
        foreach ($surveys as $s) {
            $sid = $s['student_id'];
            $sMap[$sid][] = (float)$s['q1_punctuality_rating'];
        }

        $rMap = [];
        foreach ($reminders as $r) {
            $rMap[$r['student_id']] = (int)$r['cnt'];
        }

        $data = [];
        foreach ($sMap as $sid => $ratings) {
            if (isset($rMap[$sid])) {
                $data[] = ['x' => $rMap[$sid], 'y' => array_sum($ratings) / count($ratings)];
            }
        }

        if (count($data) < 3) {
            return ['correlation' => null, 'interpretation' => 'Insufficient data'];
        }

        $n    = count($data);
        $xs   = array_column($data, 'x');
        $ys   = array_column($data, 'y');
        $xMean = array_sum($xs) / $n;
        $yMean = array_sum($ys) / $n;

        $num = 0;
        $dx2 = 0;
        $dy2 = 0;
        for ($i = 0; $i < $n; $i++) {
            $dx  = $xs[$i] - $xMean;
            $dy  = $ys[$i] - $yMean;
            $num += $dx * $dy;
            $dx2 += $dx * $dx;
            $dy2 += $dy * $dy;
        }
        $corr = ($dx2 * $dy2 > 0) ? $num / sqrt($dx2 * $dy2) : 0;

        if ($corr > 0.5) {
            $interpretation = 'Strong positive correlation — more reminders associated with higher punctuality ratings';
        } elseif ($corr > 0.2) {
            $interpretation = 'Moderate positive correlation — students who received more reminders rated punctuality slightly higher';
        } elseif ($corr > -0.2) {
            $interpretation = 'Weak or no correlation — reminder count shows little relationship with punctuality ratings';
        } else {
            $interpretation = 'Negative correlation — unexpected pattern; review data quality';
        }

        return ['correlation' => round($corr, 3), 'interpretation' => $interpretation];
    }

    public static function getPlatformBreakdown(): array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->query("
            SELECT platform, COUNT(*) as cnt
            FROM users
            WHERE role = 'student' AND is_active = TRUE
            GROUP BY platform
        ");
        $breakdown = ['android' => 0, 'ios' => 0, 'unknown' => 0];
        foreach ($stmt->fetchAll() as $row) {
            $key = $row['platform'] ?? 'unknown';
            $breakdown[$key] = (int)$row['cnt'];
        }
        return $breakdown;
    }

    public static function getGeofenceStats(): array
    {
        $pdo   = Database::getConnection();
        $today = date('Y-m-d');
        $stmt  = $pdo->prepare('SELECT was_on_campus FROM reminder_logs WHERE class_date = ?');
        $stmt->execute([$today]);
        $logs = $stmt->fetchAll();

        $onCampus  = count(array_filter($logs, fn($l) => (bool)$l['was_on_campus']));
        $offCampus = count($logs) - $onCampus;

        return [
            'reminders_today'     => count($logs),
            'on_campus_reminders' => $onCampus,
            'off_campus_reminders' => $offCampus,
        ];
    }
}
