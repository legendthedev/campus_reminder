<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\Security;
use App\Core\Database;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AuthMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $token = Security::getBearerToken($request);
        if ($token) {
            try {
                $payload = Security::decodeToken($token);
                $userId = $payload['sub'] ?? null;
                if ($userId) {
                    $pdo  = Database::getConnection();
                    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? AND is_active = TRUE');
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch();
                    if ($user) {
                        $request = $request->withAttribute('user', $user);
                        $request = $request->withAttribute('user_id', $userId);
                    }
                }
            } catch (\Exception $e) {
                // token invalid — continue without user (route handlers will reject if needed)
            }
        }
        return $handler->handle($request);
    }
}
