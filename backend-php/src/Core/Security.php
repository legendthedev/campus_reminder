<?php
declare(strict_types=1);

namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class Security
{
    public static function hashPassword(string $password): string
    {
        return password_hash(substr($password, 0, 72), PASSWORD_BCRYPT);
    }

    public static function verifyPassword(string $plain, string $hashed): bool
    {
        return password_verify(substr($plain, 0, 72), $hashed);
    }

    public static function createAccessToken(array $data): string
    {
        $config = Config::getInstance();
        $minutes = $config->get('access_token_expire_minutes', 30);
        $payload = array_merge($data, [
            'exp'  => time() + ($minutes * 60),
            'iat'  => time(),
            'type' => 'access',
        ]);
        return JWT::encode($payload, $config->get('secret_key'), $config->get('algorithm', 'HS256'));
    }

    public static function createRefreshToken(array $data): string
    {
        $config = Config::getInstance();
        $days = $config->get('refresh_token_expire_days', 7);
        $payload = array_merge($data, [
            'exp'  => time() + ($days * 86400),
            'iat'  => time(),
            'type' => 'refresh',
        ]);
        return JWT::encode($payload, $config->get('secret_key'), $config->get('algorithm', 'HS256'));
    }

    public static function decodeToken(string $token): array
    {
        $config = Config::getInstance();
        try {
            $decoded = JWT::decode($token, new Key($config->get('secret_key'), $config->get('algorithm', 'HS256')));
            return (array) $decoded;
        } catch (ExpiredException $e) {
            throw new \RuntimeException('Token has expired', 401);
        } catch (SignatureInvalidException $e) {
            throw new \RuntimeException('Token signature invalid', 401);
        } catch (\Exception $e) {
            throw new \RuntimeException('Could not validate credentials', 401);
        }
    }

    public static function getBearerToken(\Psr\Http\Message\ServerRequestInterface $request): ?string
    {
        $authHeader = $request->getHeaderLine('Authorization');
        if (str_starts_with($authHeader, 'Bearer ')) {
            return substr($authHeader, 7);
        }
        return null;
    }
}
