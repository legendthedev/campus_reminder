<?php
declare(strict_types=1);

namespace App\Routes;

use App\Core\Database;
use App\Services\TimetableService;
use App\Services\GeofenceService;
use App\Services\NotificationService;
use App\Services\SurveyService;
use App\Services\AnalyticsService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

class AllRoutes
{
    public static function register(App $app): void
    {
        self::registerCourses($app);
        self::registerTimetable($app);
        self::registerGeofence($app);
        self::registerReminders($app);
        self::registerNotifications($app);
        self::registerSurvey($app);
        self::registerAnalytics($app);
    }

    // ─── COURSES ─────────────────────────────────────────────────────────────

    private static function registerCourses(App $app): void
    {
        $app->get('/api/courses', function (Request $request, Response $response) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $rows = $pdo->query('SELECT * FROM courses ORDER BY course_code')->fetchAll();
            $response->getBody()->write(json_encode($rows));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/courses', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $data = (array)$request->getParsedBody();
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('INSERT INTO courses (course_code, course_name, lecturer_id) VALUES (?, ?, ?) RETURNING *');
            $stmt->execute([$data['course_code'], $data['course_name'], $data['lecturer_id']]);
            $response->getBody()->write(json_encode($stmt->fetch()));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        });

        $app->get('/api/courses/{course_id}', function (Request $request, Response $response, array $args) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT * FROM courses WHERE id = ?');
            $stmt->execute([$args['course_id']]);
            $c = $stmt->fetch();
            if (!$c) return self::err($response, 'Course not found', 404);
            $response->getBody()->write(json_encode($c));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->put('/api/courses/{course_id}', function (Request $request, Response $response, array $args) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $data    = (array)$request->getParsedBody();
            $pdo     = Database::getConnection();
            $allowed = ['course_code', 'course_name', 'lecturer_id'];
            [$sets, $values] = self::buildUpdate($data, $allowed);
            if (!empty($sets)) {
                $values[] = $args['course_id'];
                $pdo->prepare('UPDATE courses SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($values);
            }
            $stmt = $pdo->prepare('SELECT * FROM courses WHERE id = ?');
            $stmt->execute([$args['course_id']]);
            $response->getBody()->write(json_encode($stmt->fetch()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->delete('/api/courses/{course_id}', function (Request $request, Response $response, array $args) {
            if (!self::admin($request)) return self::err($response, 'Admin access required', 403);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT id FROM courses WHERE id = ?');
            $stmt->execute([$args['course_id']]);
            if (!$stmt->fetch()) return self::err($response, 'Course not found', 404);
            $pdo->prepare('DELETE FROM courses WHERE id = ?')->execute([$args['course_id']]);
            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/courses/{course_id}/enroll', function (Request $request, Response $response, array $args) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $data = (array)$request->getParsedBody();
            $pdo  = Database::getConnection();
            $pdo->prepare('INSERT INTO course_enrollments (student_id, course_id) VALUES (?, ?)')->execute([$data['student_id'], $args['course_id']]);
            $response->getBody()->write(json_encode(['message' => 'Enrolled']));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->delete('/api/courses/{course_id}/enroll/{student_id}', function (Request $request, Response $response, array $args) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $pdo  = Database::getConnection();
            $pdo->prepare('DELETE FROM course_enrollments WHERE course_id = ? AND student_id = ?')->execute([$args['course_id'], $args['student_id']]);
            $response->getBody()->write(json_encode(['message' => 'Unenrolled']));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/courses/{course_id}/students', function (Request $request, Response $response, array $args) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT u.* FROM users u JOIN course_enrollments ce ON ce.student_id = u.id WHERE ce.course_id = ?');
            $stmt->execute([$args['course_id']]);
            $response->getBody()->write(json_encode($stmt->fetchAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    // ─── TIMETABLE ───────────────────────────────────────────────────────────

    private static function registerTimetable(App $app): void
    {
        $app->get('/api/timetable', function (Request $request, Response $response) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $response->getBody()->write(json_encode(TimetableService::getAllTimetable()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/timetable/today', function (Request $request, Response $response) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $response->getBody()->write(json_encode(TimetableService::getTodayTimetable()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/timetable/week', function (Request $request, Response $response) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $response->getBody()->write(json_encode(TimetableService::getAllTimetable()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/timetable', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $data  = (array)$request->getParsedBody();
            $entry = TimetableService::createTimetableEntry($data);
            $response->getBody()->write(json_encode($entry));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        });

        $app->get('/api/timetable/{entry_id}', function (Request $request, Response $response, array $args) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT * FROM timetable_entries WHERE id = ?');
            $stmt->execute([$args['entry_id']]);
            $e = $stmt->fetch();
            if (!$e) return self::err($response, 'Entry not found', 404);
            $response->getBody()->write(json_encode($e));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->put('/api/timetable/{entry_id}', function (Request $request, Response $response, array $args) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $data = (array)$request->getParsedBody();
            $e    = TimetableService::updateTimetableEntry($args['entry_id'], $data);
            if (!$e) return self::err($response, 'Entry not found', 404);
            $response->getBody()->write(json_encode($e));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->delete('/api/timetable/{entry_id}', function (Request $request, Response $response, array $args) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $e = TimetableService::deleteTimetableEntry($args['entry_id']);
            if (!$e) return self::err($response, 'Entry not found', 404);
            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    // ─── GEOFENCE ────────────────────────────────────────────────────────────

    private static function registerGeofence(App $app): void
    {
        $app->get('/api/geofence', function (Request $request, Response $response) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $rows = $pdo->query('SELECT * FROM campus_geofences')->fetchAll();
            $response->getBody()->write(json_encode($rows));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/geofence', function (Request $request, Response $response) {
            if (!self::admin($request)) return self::err($response, 'Admin access required', 403);
            $data = (array)$request->getParsedBody();
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('INSERT INTO campus_geofences (name, centre_latitude, centre_longitude, radius_metres, is_active) VALUES (?, ?, ?, ?, ?) RETURNING *');
            $stmt->execute([
                $data['name'],
                $data['centre_latitude'],
                $data['centre_longitude'],
                $data['radius_metres'] ?? 500,
                isset($data['is_active']) ? ($data['is_active'] ? 'TRUE' : 'FALSE') : 'TRUE',
            ]);
            $response->getBody()->write(json_encode($stmt->fetch()));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        });

        $app->put('/api/geofence/{geofence_id}', function (Request $request, Response $response, array $args) {
            if (!self::admin($request)) return self::err($response, 'Admin access required', 403);
            $data    = (array)$request->getParsedBody();
            $pdo     = Database::getConnection();
            $allowed = ['name', 'centre_latitude', 'centre_longitude', 'radius_metres', 'is_active'];
            [$sets, $values] = self::buildUpdate($data, $allowed);
            if (!empty($sets)) {
                $values[] = $args['geofence_id'];
                $pdo->prepare('UPDATE campus_geofences SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = ?')->execute($values);
            }
            $stmt = $pdo->prepare('SELECT * FROM campus_geofences WHERE id = ?');
            $stmt->execute([$args['geofence_id']]);
            $g = $stmt->fetch();
            if (!$g) return self::err($response, 'Geofence not found', 404);
            $response->getBody()->write(json_encode($g));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/geofence/check-position', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $data   = (array)$request->getParsedBody();
            $result = GeofenceService::checkPosition($user['id'], (float)$data['latitude'], (float)$data['longitude'], $data['platform'] ?? null);
            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/geofence/on-campus-now', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $cutoff = (new \DateTime('-10 minutes', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s');
            $pdo    = Database::getConnection();
            $stmt   = $pdo->prepare("SELECT * FROM student_locations WHERE is_on_campus = TRUE AND recorded_at >= ?");
            $stmt->execute([$cutoff]);
            $response->getBody()->write(json_encode($stmt->fetchAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    // ─── REMINDERS ───────────────────────────────────────────────────────────

    private static function registerReminders(App $app): void
    {
        $app->get('/api/reminders/logs', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $pdo  = Database::getConnection();
            $rows = $pdo->query('SELECT * FROM reminder_logs ORDER BY sent_at DESC LIMIT 500')->fetchAll();
            $response->getBody()->write(json_encode($rows));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/reminders/logs/{student_id}', function (Request $request, Response $response, array $args) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT * FROM reminder_logs WHERE student_id = ? ORDER BY sent_at DESC');
            $stmt->execute([$args['student_id']]);
            $response->getBody()->write(json_encode($stmt->fetchAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/reminders/logs/course/{course_id}', function (Request $request, Response $response, array $args) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT * FROM reminder_logs WHERE course_id = ? ORDER BY sent_at DESC');
            $stmt->execute([$args['course_id']]);
            $response->getBody()->write(json_encode($stmt->fetchAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/reminders/trigger-manual', function (Request $request, Response $response) {
            if (!self::admin($request)) return self::err($response, 'Admin access required', 403);
            require_once dirname(__DIR__, 2) . '/tasks/reminder_task.php';
            checkUpcomingClasses();
            $response->getBody()->write(json_encode(['message' => 'Manual reminder check triggered']));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    // ─── NOTIFICATIONS ───────────────────────────────────────────────────────

    private static function registerNotifications(App $app): void
    {
        $app->get('/api/notifications', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT * FROM notifications WHERE recipient_id = ? ORDER BY sent_at DESC');
            $stmt->execute([$user['id']]);
            $response->getBody()->write(json_encode($stmt->fetchAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/notifications/unread-count', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE recipient_id = ? AND is_read = FALSE');
            $stmt->execute([$user['id']]);
            $response->getBody()->write(json_encode(['count' => (int)$stmt->fetchColumn()]));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/notifications/broadcast', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $data = (array)$request->getParsedBody();
            $sent = NotificationService::broadcastNotification($data['title'], $data['body'], $data['target'] ?? 'all');
            $response->getBody()->write(json_encode(['message' => "Broadcast sent to {$sent} students"]));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->put('/api/notifications/{notification_id}/read', function (Request $request, Response $response, array $args) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $pdo = Database::getConnection();
            $pdo->prepare('UPDATE notifications SET is_read = TRUE WHERE id = ?')->execute([$args['notification_id']]);
            $response->getBody()->write(json_encode(['message' => 'Marked as read']));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/notifications/mark-all-read', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $pdo = Database::getConnection();
            $pdo->prepare('UPDATE notifications SET is_read = TRUE WHERE recipient_id = ? AND is_read = FALSE')->execute([$user['id']]);
            $response->getBody()->write(json_encode(['message' => 'All marked as read']));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->post('/api/notifications/update-fcm-token', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $data = (array)$request->getParsedBody();
            $pdo  = Database::getConnection();
            $pdo->prepare('UPDATE users SET fcm_token = ?, platform = ? WHERE id = ?')->execute([$data['fcm_token'] ?? null, $data['platform'] ?? null, $user['id']]);
            $response->getBody()->write(json_encode(['message' => 'FCM token updated']));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    // ─── SURVEY ──────────────────────────────────────────────────────────────

    private static function registerSurvey(App $app): void
    {
        $app->post('/api/survey/submit', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $data = (array)$request->getParsedBody();
            try {
                $result = SurveyService::submitSurvey($user['id'], $data);
                $response->getBody()->write(json_encode($result));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (\RuntimeException $e) {
                return self::err($response, $e->getMessage(), (int)$e->getCode() ?: 400);
            }
        });

        $app->get('/api/survey/responses', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $response->getBody()->write(json_encode(SurveyService::getAllSurveys()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/survey/responses/{student_id}', function (Request $request, Response $response, array $args) {
            if (!self::auth($request)) return self::err($response, 'Not authenticated', 401);
            $response->getBody()->write(json_encode(SurveyService::getStudentSurveys($args['student_id'])));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/survey/current-week', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $week     = SurveyService::getCurrentWeekNumber();
            $weekStart = SurveyService::getWeekStartDate($week);
            $weekEnd  = (new \DateTime($weekStart))->modify('+6 days')->format('Y-m-d');
            $submitted = SurveyService::checkSubmitted($user['id'], $week);
            $response->getBody()->write(json_encode([
                'week_number'    => $week,
                'week_start_date' => $weekStart,
                'week_end_date'  => $weekEnd,
                'has_submitted'  => $submitted,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/survey/check-submitted/{week_number}', function (Request $request, Response $response, array $args) {
            $user = $request->getAttribute('user');
            if (!$user) return self::err($response, 'Not authenticated', 401);
            $submitted = SurveyService::checkSubmitted($user['id'], (int)$args['week_number']);
            $response->getBody()->write(json_encode(['submitted' => $submitted]));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    // ─── ANALYTICS ───────────────────────────────────────────────────────────

    private static function registerAnalytics(App $app): void
    {
        $app->get('/api/analytics/punctuality-summary', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $response->getBody()->write(json_encode(AnalyticsService::getPunctualitySummary()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/analytics/reminder-effectiveness', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $response->getBody()->write(json_encode(AnalyticsService::getReminderEffectiveness()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/analytics/survey-summary', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $response->getBody()->write(json_encode(AnalyticsService::getPunctualitySummary()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/analytics/geofence-stats', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $response->getBody()->write(json_encode(AnalyticsService::getGeofenceStats()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/analytics/weekly-trend', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $response->getBody()->write(json_encode(AnalyticsService::getWeeklyTrend()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/analytics/platform-breakdown', function (Request $request, Response $response) {
            if (!self::lecturerOrAdmin($request)) return self::err($response, 'Access denied', 403);
            $response->getBody()->write(json_encode(AnalyticsService::getPlatformBreakdown()));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private static function auth(Request $request): bool
    {
        return $request->getAttribute('user') !== null;
    }

    private static function lecturerOrAdmin(Request $request): bool
    {
        $user = $request->getAttribute('user');
        return $user && in_array($user['role'], ['admin', 'lecturer'], true);
    }

    private static function admin(Request $request): bool
    {
        $user = $request->getAttribute('user');
        return $user && $user['role'] === 'admin';
    }

    private static function err(Response $response, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode(['detail' => $message]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    private static function buildUpdate(array $data, array $allowed): array
    {
        $sets   = [];
        $values = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[]  = "{$field} = ?";
                $values[] = $data[$field];
            }
        }
        return [$sets, $values];
    }
}
