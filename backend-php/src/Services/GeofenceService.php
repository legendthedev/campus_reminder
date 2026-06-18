<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\RedisClient;

class GeofenceService
{
    public static function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R      = 6371000;
        $phi1   = deg2rad($lat1);
        $phi2   = deg2rad($lat2);
        $dphi   = deg2rad($lat2 - $lat1);
        $dlambda = deg2rad($lon2 - $lon1);
        $a = sin($dphi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($dlambda / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    public static function getActiveGeofence(): ?array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->query('SELECT * FROM campus_geofences WHERE is_active = TRUE LIMIT 1');
        return $stmt->fetch() ?: null;
    }

    public static function checkPosition(string $studentId, float $latitude, float $longitude, ?string $platform = null): array
    {
        $geofence = self::getActiveGeofence();
        if (!$geofence) {
            return [
                'is_on_campus'   => false,
                'distance_metres' => 9999.0,
                'campus_name'    => 'Unknown',
                'radius_metres'  => 500,
            ];
        }

        $distance   = self::haversineDistance($latitude, $longitude, (float)$geofence['centre_latitude'], (float)$geofence['centre_longitude']);
        $isOnCampus = $distance <= (int)$geofence['radius_metres'];
        $rounded    = round($distance, 1);

        $locationData = [
            'latitude'        => $latitude,
            'longitude'       => $longitude,
            'is_on_campus'    => $isOnCampus,
            'distance_metres' => $rounded,
            'platform'        => $platform,
            'recorded_at'     => (new \DateTime('now', new \DateTimeZone('UTC')))->format(\DateTime::ATOM),
        ];
        RedisClient::setLocation($studentId, $locationData);

        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('
            INSERT INTO student_locations (student_id, latitude, longitude, is_on_campus, distance_metres, platform)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$studentId, $latitude, $longitude, $isOnCampus ? 'TRUE' : 'FALSE', $rounded, $platform]);

        return [
            'is_on_campus'    => $isOnCampus,
            'distance_metres' => $rounded,
            'campus_name'     => $geofence['name'],
            'radius_metres'   => (int)$geofence['radius_metres'],
        ];
    }

    public static function getCachedLocation(string $studentId): ?array
    {
        return RedisClient::getLocation($studentId);
    }
}
