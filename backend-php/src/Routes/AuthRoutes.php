<?php
declare(strict_types=1);

namespace App\Routes;

use App\Core\Security;
use App\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

class AuthRoutes
{
    public static function register(App $app): void
    {
        $app->post('/api/auth/register', function (Request $request, Response $response) {
            $data = (array)$request->getParsedBody();
            try {
                $user = AuthService::createUser($data);
                $out  = self::userOut($user);
                $response->getBody()->write(json_encode($out));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            } catch (\RuntimeException $e) {
                return self::error($response, $e->getMessage(), (int)$e->getCode() ?: 400);
            }
        });

        $app->post('/api/auth/login', function (Request $request, Response $response) {
            $data = (array)$request->getParsedBody();
            try {
                $user = AuthService::authenticateUser($data['email'] ?? '', $data['password'] ?? '');
                [$accessToken, $refreshToken] = AuthService::generateTokens($user);
                $response->getBody()->write(json_encode([
                    'access_token'  => $accessToken,
                    'refresh_token' => $refreshToken,
                    'token_type'    => 'bearer',
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (\RuntimeException $e) {
                return self::error($response, $e->getMessage(), (int)$e->getCode() ?: 401);
            }
        });

        $app->post('/api/auth/refresh', function (Request $request, Response $response) {
            $data         = (array)$request->getParsedBody();
            $refreshToken = $data['refresh_token'] ?? $request->getQueryParams()['refresh_token'] ?? '';
            try {
                $payload = Security::decodeToken($refreshToken);
                if (($payload['type'] ?? '') !== 'refresh') {
                    return self::error($response, 'Invalid refresh token', 401);
                }
                $user = AuthService::getUserById($payload['sub']);
                if (!$user) {
                    return self::error($response, 'User not found', 401);
                }
                [$accessToken, $newRefresh] = AuthService::generateTokens($user);
                $response->getBody()->write(json_encode([
                    'access_token'  => $accessToken,
                    'refresh_token' => $newRefresh,
                    'token_type'    => 'bearer',
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (\RuntimeException $e) {
                return self::error($response, $e->getMessage(), 401);
            }
        });

        $app->post('/api/auth/logout', function (Request $request, Response $response) {
            $response->getBody()->write(json_encode(['message' => 'Logged out successfully']));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $app->get('/api/auth/me', function (Request $request, Response $response) {
            $user = $request->getAttribute('user');
            if (!$user) {
                return self::error($response, 'Not authenticated', 401);
            }
            $response->getBody()->write(json_encode(self::userOut($user)));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }

    private static function userOut(array $user): array
    {
        return [
            'id'           => $user['id'],
            'full_name'    => $user['full_name'],
            'email'        => $user['email'],
            'role'         => $user['role'],
            'student_id'   => $user['student_id'],
            'platform'     => $user['platform'],
            'phone_number' => $user['phone_number'],
            'is_active'    => (bool)$user['is_active'],
            'created_at'   => $user['created_at'],
        ];
    }

    private static function error(Response $response, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode(['detail' => $message]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
