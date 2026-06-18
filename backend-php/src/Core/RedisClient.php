<?php
declare(strict_types=1);

namespace App\Core;

use Predis\Client;

class RedisClient
{
    private static ?Client $client = null;

    public static function getClient(): Client
    {
        if (self::$client === null) {
            $url = Config::getInstance()->get('redis_url', 'redis://localhost:6379/0');
            self::$client = new Client($url);
        }
        return self::$client;
    }

    public static function setLocation(string $studentId, array $data, int $ttl = 600): void
    {
        self::getClient()->setex("location:{$studentId}", $ttl, json_encode($data));
    }

    public static function getLocation(string $studentId): ?array
    {
        $val = self::getClient()->get("location:{$studentId}");
        return $val ? json_decode($val, true) : null;
    }

    public static function setAnalytics(int $week, array $data): void
    {
        self::getClient()->set("analytics:week:{$week}", json_encode($data));
    }

    public static function getAnalytics(int $week): ?array
    {
        $val = self::getClient()->get("analytics:week:{$week}");
        return $val ? json_decode($val, true) : null;
    }
}
