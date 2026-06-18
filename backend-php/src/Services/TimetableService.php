<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

class TimetableService
{
    public static function getAllTimetable(): array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->query('
            SELECT t.*, c.course_code, c.course_name, c.lecturer_id
            FROM timetable_entries t
            JOIN courses c ON c.id = t.course_id
            ORDER BY t.day_of_week, t.start_time
        ');
        return $stmt->fetchAll();
    }

    public static function getTodayTimetable(): array
    {
        $today = strtolower(date('l'));
        $pdo   = Database::getConnection();
        $stmt  = $pdo->prepare('
            SELECT t.*, c.course_code, c.course_name, c.lecturer_id
            FROM timetable_entries t
            JOIN courses c ON c.id = t.course_id
            WHERE t.day_of_week = ?
            ORDER BY t.start_time
        ');
        $stmt->execute([$today]);
        return $stmt->fetchAll();
    }

    public static function getStudentTimetable(string $studentId): array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('
            SELECT t.*, c.course_code, c.course_name, c.lecturer_id
            FROM timetable_entries t
            JOIN courses c ON c.id = t.course_id
            JOIN course_enrollments ce ON ce.course_id = c.id
            WHERE ce.student_id = ?
            ORDER BY t.day_of_week, t.start_time
        ');
        $stmt->execute([$studentId]);
        return $stmt->fetchAll();
    }

    public static function createTimetableEntry(array $data): array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('
            INSERT INTO timetable_entries (course_id, day_of_week, start_time, end_time, room_name, building_name)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING *
        ');
        $stmt->execute([
            $data['course_id'],
            $data['day_of_week'],
            $data['start_time'],
            $data['end_time'],
            $data['room_name'],
            $data['building_name'],
        ]);
        return $stmt->fetch();
    }

    public static function updateTimetableEntry(string $entryId, array $data): ?array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('SELECT * FROM timetable_entries WHERE id = ?');
        $stmt->execute([$entryId]);
        $entry = $stmt->fetch();
        if (!$entry) {
            return null;
        }

        $allowed = ['course_id', 'day_of_week', 'start_time', 'end_time', 'room_name', 'building_name'];
        $sets    = [];
        $values  = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[]  = "{$field} = ?";
                $values[] = $data[$field];
            }
        }
        if (empty($sets)) {
            return $entry;
        }

        $values[] = $entryId;
        $pdo->prepare('UPDATE timetable_entries SET ' . implode(', ', $sets) . ' WHERE id = ?')
            ->execute($values);

        $stmt = $pdo->prepare('SELECT * FROM timetable_entries WHERE id = ?');
        $stmt->execute([$entryId]);
        return $stmt->fetch();
    }

    public static function deleteTimetableEntry(string $entryId): ?array
    {
        $pdo  = Database::getConnection();
        $stmt = $pdo->prepare('SELECT * FROM timetable_entries WHERE id = ?');
        $stmt->execute([$entryId]);
        $entry = $stmt->fetch();
        if ($entry) {
            $pdo->prepare('DELETE FROM timetable_entries WHERE id = ?')->execute([$entryId]);
        }
        return $entry ?: null;
    }
}
