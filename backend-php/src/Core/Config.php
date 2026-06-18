<?php
declare(strict_types=1);

namespace App\Core;

use Dotenv\Dotenv;

class Config
{
    private static ?Config $instance = null;
    private array $config = [];

    private function __construct()
    {
        $dotenv = Dotenv::createImmutable(dirname(__DIR__, 2));
        $dotenv->safeLoad();

        $this->config = [
            'database_url'                => $_ENV['DATABASE_URL'] ?? 'postgresql://campus_user:campus_pass@localhost:5432/campus_reminder_db',
            'redis_url'                   => $_ENV['REDIS_URL'] ?? 'redis://localhost:6379/0',
            'secret_key'                  => $_ENV['SECRET_KEY'] ?? 'change-this-secret-key-in-production',
            'algorithm'                   => $_ENV['ALGORITHM'] ?? 'HS256',
            'access_token_expire_minutes' => (int)($_ENV['ACCESS_TOKEN_EXPIRE_MINUTES'] ?? 30),
            'refresh_token_expire_days'   => (int)($_ENV['REFRESH_TOKEN_EXPIRE_DAYS'] ?? 7),
            'fcm_server_key'              => $_ENV['FCM_SERVER_KEY'] ?? '',
            'campus_geofence_lat'         => (float)($_ENV['CAMPUS_GEOFENCE_LAT'] ?? 6.5244),
            'campus_geofence_lng'         => (float)($_ENV['CAMPUS_GEOFENCE_LNG'] ?? 3.3792),
            'campus_geofence_radius'      => (int)($_ENV['CAMPUS_GEOFENCE_RADIUS'] ?? 500),
            'study_start_date'            => $_ENV['STUDY_START_DATE'] ?? '2024-09-01',
            'environment'                 => $_ENV['ENVIRONMENT'] ?? 'development',
            'allowed_origins'             => $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000',
        ];
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }
}
