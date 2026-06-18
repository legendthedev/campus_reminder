<?php
declare(strict_types=1);

/**
 * Database seeder — equivalent of seed_database() in app/main.py
 * Run once: php seed.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Core\Config;
use App\Core\Database;
use App\Core\Security;

$pdo = Database::getConnection();

// Skip if already seeded
$count = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
if ((int)$count > 0) {
    echo "Database already seeded, skipping.\n";
    exit(0);
}

echo "Seeding database...\n";

$cfg        = Config::getInstance();
$studyStart = new \DateTime($cfg->get('study_start_date', '2024-09-01'));

// ─── USERS ───────────────────────────────────────────────────────────────────

$insertUser = $pdo->prepare('
    INSERT INTO users (full_name, email, password_hash, role, student_id, platform)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
');

$insertUser->execute(['Dr. Adebayo Okafor', 'adebayo@university.edu', Security::hashPassword('lecturer123'), 'lecturer', null, null]);
$lecturer1Id = $insertUser->fetchColumn();

$insertUser->execute(['Dr. Ngozi Eze', 'ngozi@university.edu', Security::hashPassword('lecturer123'), 'lecturer', null, null]);
$lecturer2Id = $insertUser->fetchColumn();

$insertUser->execute(['Admin User', 'admin@university.edu', Security::hashPassword('admin123'), 'admin', null, null]);

$studentsData = [
    ['Chidi Nwosu',   'chidi@student.edu',  'STU001', 'android'],
    ['Amaka Obi',     'amaka@student.edu',  'STU002', 'ios'],
    ['Emeka Chukwu',  'emeka@student.edu',  'STU003', 'android'],
    ['Fatima Bello',  'fatima@student.edu', 'STU004', 'ios'],
    ['Tunde Adeleke', 'tunde@student.edu',  'STU005', 'android'],
];

$studentIds = [];
foreach ($studentsData as [$name, $email, $sid, $platform]) {
    $insertUser->execute([$name, $email, Security::hashPassword('student123'), 'student', $sid, $platform]);
    $studentIds[] = $insertUser->fetchColumn();
}

// ─── COURSES ─────────────────────────────────────────────────────────────────

$insertCourse = $pdo->prepare('INSERT INTO courses (course_code, course_name, lecturer_id) VALUES (?, ?, ?) RETURNING id');

$insertCourse->execute(['CS401', 'Mobile Computing', $lecturer1Id]);
$cs401Id = $insertCourse->fetchColumn();

$insertCourse->execute(['CS302', 'Database Systems', $lecturer2Id]);
$cs302Id = $insertCourse->fetchColumn();

$insertCourse->execute(['CS205', 'Web Development', $lecturer1Id]);
$cs205Id = $insertCourse->fetchColumn();

// ─── ENROLLMENTS ─────────────────────────────────────────────────────────────

$insertEnroll = $pdo->prepare('INSERT INTO course_enrollments (student_id, course_id) VALUES (?, ?)');

foreach ($studentIds as $sid) {
    $insertEnroll->execute([$sid, $cs401Id]);
}
foreach (array_slice($studentIds, 0, 3) as $sid) {
    $insertEnroll->execute([$sid, $cs302Id]);
}
foreach (array_slice($studentIds, 2, 3) as $sid) {
    $insertEnroll->execute([$sid, $cs205Id]);
}

// ─── TIMETABLE ───────────────────────────────────────────────────────────────

$insertEntry = $pdo->prepare('
    INSERT INTO timetable_entries (course_id, day_of_week, start_time, end_time, room_name, building_name)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
');

$entries = [
    [$cs401Id, 'monday',    '10:00', '12:00', 'Lab 101',  'CS Block', $studentIds],
    [$cs401Id, 'wednesday', '10:00', '12:00', 'Lab 101',  'CS Block', $studentIds],
    [$cs302Id, 'tuesday',   '14:00', '16:00', 'Room 102', 'CS Block', array_slice($studentIds, 0, 3)],
    [$cs302Id, 'thursday',  '14:00', '16:00', 'Room 102', 'CS Block', array_slice($studentIds, 0, 3)],
    [$cs205Id, 'friday',    '09:00', '12:00', 'Room 103', 'CS Block', array_slice($studentIds, 2, 3)],
];

$entryIds = [];
foreach ($entries as &$entry) {
    $insertEntry->execute([$entry[0], $entry[1], $entry[2], $entry[3], $entry[4], $entry[5]]);
    $entry['id'] = $insertEntry->fetchColumn();
}
unset($entry);

// ─── GEOFENCE ────────────────────────────────────────────────────────────────

$pdo->prepare('INSERT INTO campus_geofences (name, centre_latitude, centre_longitude, radius_metres, is_active) VALUES (?, ?, ?, ?, TRUE)')
    ->execute(['Main Campus', $cfg->get('campus_geofence_lat'), $cfg->get('campus_geofence_lng'), $cfg->get('campus_geofence_radius')]);

// ─── REMINDER LOGS & SURVEYS (seed 3 weeks) ──────────────────────────────────

$dayMap = ['monday' => 0, 'tuesday' => 1, 'wednesday' => 2, 'thursday' => 3, 'friday' => 4];
$locationPreferences = ['on_campus_only', 'always', 'never'];
$lpWeights = [0.6, 0.3, 0.1];

$insertLog = $pdo->prepare('
    INSERT INTO reminder_logs
        (student_id, timetable_entry_id, course_id, reminder_type, was_on_campus,
         student_latitude, student_longitude, distance_metres, fcm_delivered, class_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
');

$insertSurvey = $pdo->prepare('
    INSERT INTO survey_responses
        (student_id, survey_week, week_start_date, q1_punctuality_rating, q2_missed_classes,
         q3_reminder_helpful, q4_location_preference, q5_privacy_comfort, q6_open_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
');

for ($weekNum = 0; $weekNum < 3; $weekNum++) {
    foreach ($entries as $entry) {
        $dayOffset = $dayMap[$entry[1]];
        $classDate = (clone $studyStart)->modify('+' . ($weekNum * 7 + $dayOffset) . ' days')->format('Y-m-d');

        foreach ($entry[6] as $sid) {
            $onCampus = (mt_rand(0, 99) < 70);
            $distance = $onCampus ? mt_rand(0, 80) + mt_rand(0, 100) / 100 : mt_rand(150, 800) + mt_rand(0, 100) / 100;
            $lat      = $cfg->get('campus_geofence_lat') + (mt_rand(-100, 100) / 100000);
            $lng      = $cfg->get('campus_geofence_lng') + (mt_rand(-100, 100) / 100000);

            $insertLog->execute([
                $sid,
                $entry['id'],
                $entry[0],
                $onCampus ? 'on_campus' : 'off_campus',
                $onCampus ? 'TRUE' : 'FALSE',
                $lat,
                $lng,
                round($distance, 1),
                (mt_rand(0, 99) < 95) ? 'TRUE' : 'FALSE',
                $classDate,
            ]);
        }
    }

    $weekStartDate = (clone $studyStart)->modify('+' . ($weekNum * 7) . ' days')->format('Y-m-d');

    // Weighted random for location preference
    $lpChooser = function () use ($locationPreferences, $lpWeights) {
        $rand = mt_rand(0, 99) / 100;
        $cumul = 0;
        foreach ($locationPreferences as $i => $lp) {
            $cumul += $lpWeights[$i];
            if ($rand < $cumul) return $lp;
        }
        return $locationPreferences[0];
    };

    foreach ($studentIds as $idx => $sid) {
        $q6Map = [
            '1_1' => 'The reminders are very helpful, especially on campus.',
            '2_3' => 'I prefer not to be tracked when far from campus.',
        ];
        $q6Key = ($weekNum + 1) . '_' . ($idx + 1);
        $q6    = $q6Map[$q6Key] ?? null;

        $insertSurvey->execute([
            $sid,
            $weekNum + 1,
            $weekStartDate,
            mt_rand(3, 5),
            mt_rand(0, 2),
            (mt_rand(0, 99) < 80) ? 'TRUE' : 'FALSE',
            $lpChooser(),
            mt_rand(3, 5),
            $q6,
        ]);
    }
}

echo "Database seeded successfully.\n";
