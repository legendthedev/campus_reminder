<?php
declare(strict_types=1);

namespace App\Routes;

use App\Core\Database;
use App\Core\RedisClient;
use App\Services\SurveyService;
use App\Services\TimetableService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

class StudentRoutes
{
    public static function register(App $app): void
    {
        $app->get('/api/students', function (Request $request, Response $response) {
            if (!self::requireLecturerOrAdmin($request, $response)) {
                return self::error($response, 'Lecturer or admin access required', 403);
            }
            $pdo  = Database::getConnection();
            $stmt = $pdo->query("SELECT * FROM users WHERE role = 'student'");
            $response->getBody()->write(json_encode($stmt->fetchAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/students/{student_id}', function (Request $request, Response $response, array $args) {
            if (!self::requireAuth($request)) {
                return self::error($response, 'Not authenticated', 401);
            }
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
            $stmt->execute([$args['student_id']]);
            $student = $stmt->fetch();
            if (!$student) {
                return self::error($response, 'Student not found', 404);
            }
            $response->getBody()->write(json_encode($student));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->put('/api/students/{student_id}', function (Request $request, Response $response, array $args) {
            if (!self::requireAuth($request)) {
                return self::error($response, 'Not authenticated', 401);
            }
            $data    = (array)$request->getParsedBody();
            $pdo     = Database::getConnection();
            $allowed = ['full_name', 'phone_number', 'is_active'];
            $sets    = [];
            $values  = [];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    $sets[]  = "{$field} = ?";
                    $values[] = $data[$field];
                }
            }
            if (!empty($sets)) {
                $values[] = $args['student_id'];
                $pdo->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($values);
            }
            $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
            $stmt->execute([$args['student_id']]);
            $response->getBody()->write(json_encode($stmt->fetch()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->delete('/api/students/{student_id}', function (Request $request, Response $response, array $args) {
            if (!self::requireLecturerOrAdmin($request, $response)) {
                return self::error($response, 'Lecturer or admin access required', 403);
            }
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
            $stmt->execute([$args['student_id']]);
            if (!$stmt->fetch()) {
                return self::error($response, 'Student not found', 404);
            }
            $pdo->prepare('UPDATE users SET is_active = FALSE WHERE id = ?')->execute([$args['student_id']]);
            $response->getBody()->write(json_encode(['message' => 'Student deactivated']));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/students/{student_id}/timetable', function (Request $request, Response $response, array $args) {
            if (!self::requireAuth($request)) {
                return self::error($response, 'Not authenticated', 401);
            }
            $entries = TimetableService::getStudentTimetable($args['student_id']);
            $response->getBody()->write(json_encode($entries));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/students/{student_id}/reminder-history', function (Request $request, Response $response, array $args) {
            if (!self::requireAuth($request)) {
                return self::error($response, 'Not authenticated', 401);
            }
            $pdo  = Database::getConnection();
            $stmt = $pdo->prepare('SELECT * FROM reminder_logs WHERE student_id = ? ORDER BY sent_at DESC');
            $stmt->execute([$args['student_id']]);
            $response->getBody()->write(json_encode($stmt->fetchAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/students/{student_id}/survey-responses', function (Request $request, Response $response, array $args) {
            if (!self::requireAuth($request)) {
                return self::error($response, 'Not authenticated', 401);
            }
            $surveys = SurveyService::getStudentSurveys($args['student_id']);
            $response->getBody()->write(json_encode($surveys));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/students/{student_id}/location', function (Request $request, Response $response, array $args) {
            if (!self::requireLecturerOrAdmin($request, $response)) {
                return self::error($response, 'Lecturer or admin access required', 403);
            }
            $loc = RedisClient::getLocation($args['student_id']);
            $response->getBody()->write(json_encode($loc ?? ['message' => 'No recent location data']));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    private static function requireAuth(Request $request): bool
    {
        return $request->getAttribute('user') !== null;
    }

    private static function requireLecturerOrAdmin(Request $request, Response $response): bool
    {
        $user = $request->getAttribute('user');
        return $user && in_array($user['role'], ['admin', 'lecturer'], true);
    }

    private static function error(Response $response, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode(['detail' => $message]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
