<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Security;
use PDO;

class AuthService
{
    public static function getUserByEmail(string $email): ?array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public static function getUserById(string $userId): ?array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: null;
    }

    public static function createUser(array $data): array
    {
        $existing = self::getUserByEmail($data['email']);
        if ($existing) {
            throw new \RuntimeException('Email already registered', 400);
        }

        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('
            INSERT INTO users (full_name, email, password_hash, role, student_id, phone_number)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING *
        ');
        $stmt->execute([
            $data['full_name'],
            $data['email'],
            Security::hashPassword($data['password']),
            $data['role'] ?? 'student',
            $data['student_id'] ?? null,
            $data['phone_number'] ?? null,
        ]);
        return $stmt->fetch();
    }

    public static function authenticateUser(string $email, string $password): array
    {
        $user = self::getUserByEmail($email);
        if (!$user || !Security::verifyPassword($password, $user['password_hash'])) {
            throw new \RuntimeException('Incorrect email or password', 401);
        }
        if (!$user['is_active']) {
            throw new \RuntimeException('Account is inactive', 400);
        }
        return $user;
    }

    public static function generateTokens(array $user): array
    {
        $accessToken  = Security::createAccessToken(['sub' => $user['id'], 'role' => $user['role']]);
        $refreshToken = Security::createRefreshToken(['sub' => $user['id']]);
        return [$accessToken, $refreshToken];
    }
}
