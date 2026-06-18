<?php
declare(strict_types=1);

/**
 * Analytics Task — equivalent of app/tasks/analytics_tasks.py
 * Run via cron every Sunday at 23:00:
 *   0 23 * * 0  php /path/to/backend-php/tasks/analytics_task.php
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';

use App\Core\RedisClient;
use App\Services\SurveyService;
use App\Services\AnalyticsService;

function generateWeeklyAnalytics(): void
{
    $week = SurveyService::getCurrentWeekNumber();

    $summary = [
        'week'          => $week,
        'trend'         => AnalyticsService::getWeeklyTrend(),
        'effectiveness' => AnalyticsService::getReminderEffectiveness(),
        'platforms'     => AnalyticsService::getPlatformBreakdown(),
    ];

    RedisClient::setAnalytics($week, $summary);
    echo "Analytics generated for week {$week}\n";
}

if (php_sapi_name() === 'cli') {
    generateWeeklyAnalytics();
}
