<?php
declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $connection = null;

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            $config = Config::getInstance();
            $url = $config->get('database_url');
            $parts = parse_url($url);

            $host   = $parts['host'];
            $port   = $parts['port'] ?? 5432;
            $dbname = ltrim($parts['path'], '/');
            $user   = $parts['user'];
            $pass   = $parts['pass'];

            $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
            self::$connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }
        return self::$connection;
    }

    public static function createTables(): void
    {
        $pdo = self::getConnection();
        $pdo->exec("
            CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";

            DO \$\$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                    CREATE TYPE userrole AS ENUM ('student', 'lecturer', 'admin');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform') THEN
                    CREATE TYPE platform AS ENUM ('android', 'ios');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dayofweek') THEN
                    CREATE TYPE dayofweek AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remindertype') THEN
                    CREATE TYPE remindertype AS ENUM ('on_campus', 'off_campus');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationtype') THEN
                    CREATE TYPE notificationtype AS ENUM ('class_reminder', 'announcement', 'survey_invite');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'locationpreference') THEN
                    CREATE TYPE locationpreference AS ENUM ('on_campus_only', 'always', 'never');
                END IF;
            END \$\$;

            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name VARCHAR NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                password_hash VARCHAR NOT NULL,
                role userrole NOT NULL DEFAULT 'student',
                student_id VARCHAR UNIQUE,
                fcm_token VARCHAR,
                platform platform,
                phone_number VARCHAR,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                course_code VARCHAR UNIQUE NOT NULL,
                course_name VARCHAR NOT NULL,
                lecturer_id UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS course_enrollments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL REFERENCES users(id),
                course_id UUID NOT NULL REFERENCES courses(id),
                enrolled_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS timetable_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                course_id UUID NOT NULL REFERENCES courses(id),
                day_of_week dayofweek NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room_name VARCHAR NOT NULL,
                building_name VARCHAR NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS campus_geofences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR NOT NULL,
                centre_latitude DOUBLE PRECISION NOT NULL,
                centre_longitude DOUBLE PRECISION NOT NULL,
                radius_metres INTEGER DEFAULT 500,
                is_active BOOLEAN DEFAULT TRUE,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS student_locations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL REFERENCES users(id),
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                is_on_campus BOOLEAN NOT NULL,
                distance_metres DOUBLE PRECISION NOT NULL,
                platform VARCHAR,
                recorded_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS reminder_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL REFERENCES users(id),
                timetable_entry_id UUID NOT NULL REFERENCES timetable_entries(id),
                course_id UUID NOT NULL REFERENCES courses(id),
                reminder_type remindertype NOT NULL,
                was_on_campus BOOLEAN NOT NULL,
                student_latitude DOUBLE PRECISION,
                student_longitude DOUBLE PRECISION,
                distance_metres DOUBLE PRECISION,
                fcm_delivered BOOLEAN DEFAULT FALSE,
                class_date DATE NOT NULL,
                sent_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                recipient_id UUID NOT NULL REFERENCES users(id),
                title VARCHAR NOT NULL,
                body VARCHAR NOT NULL,
                type notificationtype NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS survey_responses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL REFERENCES users(id),
                survey_week INTEGER NOT NULL,
                week_start_date DATE NOT NULL,
                q1_punctuality_rating INTEGER NOT NULL,
                q2_missed_classes INTEGER NOT NULL,
                q3_reminder_helpful BOOLEAN NOT NULL,
                q4_location_preference locationpreference NOT NULL,
                q5_privacy_comfort INTEGER NOT NULL,
                q6_open_feedback TEXT,
                submitted_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT uq_student_survey_week UNIQUE (student_id, survey_week)
            );
        ");
    }
}
