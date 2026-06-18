# Campus Reminder System — PHP Backend

PHP 8.1 port of the Python/FastAPI backend. Provides the same REST API using **Slim 4**, **PDO (PostgreSQL)**, **Predis (Redis)**, and **firebase/php-jwt**. All endpoints, auth logic, geofence math, and seed data are a direct conversion from the original Python source.

---

## Table of Contents

- [Requirements](#requirements)
- [External Services](#external-services)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [Connecting the Dashboard](#connecting-the-dashboard)
- [Connecting the Mobile App](#connecting-the-mobile-app)
- [Connecting the Web App](#connecting-the-web-app)
- [Scheduled Tasks (Cron)](#scheduled-tasks-cron)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)

---

## Requirements

| Requirement | Minimum Version |
|-------------|----------------|
| PHP | 8.1 |
| Composer | 2.x |
| PostgreSQL | 14+ |
| Redis | 6+ |
| PHP extensions | `pdo_pgsql`, `curl`, `json`, `mbstring` |

Check your PHP extensions:

```bash
php -m | grep -E "pdo_pgsql|curl|json|mbstring"
```
php -m | findstr "pdo_pgsql curl json mbstring"
---

## External Services

Two external services are **required** and two are **optional** depending on which features you need.

### Required

#### 1. PostgreSQL
Stores all application data (users, courses, timetable, reminders, surveys).

- Default connection: `postgresql://campus_user:campus_pass@localhost:5432/campus_reminder_db`
- Create the database and user before running the app:

```sql
CREATE USER campus_user WITH PASSWORD 'campus_pass';
CREATE DATABASE campus_reminder_db OWNER campus_user;
GRANT ALL PRIVILEGES ON DATABASE campus_reminder_db TO campus_user;
```

> The PHP backend creates all tables automatically on first request via `Database::createTables()`. You do **not** need to run any migration files manually.

#### 2. Redis
Caches student GPS locations (10-minute TTL) and weekly analytics snapshots.

- Default connection: `redis://localhost:6379/0`
- Install and start Redis:

```bash
# Ubuntu / Debian
sudo apt install redis-server && sudo systemctl start redis

# macOS
brew install redis && brew services start redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
# or use WSL2 with the Ubuntu instructions above
```

- Verify Redis is running:

```bash
redis-cli ping   # should respond: PONG
```

> The app degrades gracefully if Redis is unavailable — location-based reminders fall back to the most recent database record.

### Optional

#### 3. Firebase Cloud Messaging (FCM)
Required only for **push notifications** to the mobile app. If the key is not set, reminders and survey invites are saved to the database (in-app notifications) but no push is sent.

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Cloud Messaging
2. Copy the **Server Key** (Legacy API key)
3. Set `FCM_SERVER_KEY` in your `.env` file

#### 4. Google Maps API
Required only if the mobile app's **map screen** is used. The PHP backend itself does not call the Maps API — the keys are stored in `.env` for reference alongside the other config.

1. Enable the **Maps SDK for Android** and **Maps SDK for iOS** in [Google Cloud Console](https://console.cloud.google.com)
2. Set `GOOGLE_MAPS_ANDROID_KEY` and `GOOGLE_MAPS_IOS_KEY` in your `.env` file

---

## Installation

```bash
cd campus/backend-php
composer install
```

---

## Configuration

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and edit:

```env
# PostgreSQL — use standard postgresql:// (not the asyncpg:// variant from the Python backend)
DATABASE_URL=postgresql://campus_user:campus_pass@localhost:5432/campus_reminder_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT — change this to a long random string in production
SECRET_KEY=change-this-to-a-long-random-secret-key-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Firebase — leave blank to disable push notifications
FCM_SERVER_KEY=your-firebase-server-key-here

# Google Maps — used by the mobile app, not the PHP server directly
GOOGLE_MAPS_ANDROID_KEY=your-android-maps-key-here
GOOGLE_MAPS_IOS_KEY=your-ios-maps-key-here

# Geofence centre point and radius (metres)
CAMPUS_GEOFENCE_LAT=6.5244
CAMPUS_GEOFENCE_LNG=3.3792
CAMPUS_GEOFENCE_RADIUS=500

# Week 1 of the academic calendar
STUDY_START_DATE=2024-09-01

# development | production
ENVIRONMENT=development

# Comma-separated origins allowed for CORS (dashboard and web app URLs go here)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Database Setup

Tables are created automatically when the server starts. To also populate sample users, courses, timetable entries, and 3 weeks of seeded reminder/survey data, run the seeder once:

```bash
php seed.php
```

Seeded accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@university.edu` | `admin123` |
| Lecturer | `adebayo@university.edu` | `lecturer123` |
| Lecturer | `ngozi@university.edu` | `lecturer123` |
| Student | `chidi@student.edu` | `student123` |
| Student | `amaka@student.edu` | `student123` |
| Student | `emeka@student.edu` | `student123` |
| Student | `fatima@student.edu` | `student123` |
| Student | `tunde@student.edu` | `student123` |

> Run `php seed.php` only once. It checks for existing data and skips seeding if any users are found.

---

## Running the Server

### Development (PHP built-in server)

```bash
php -S 0.0.0.0:8000 public/index.php
```

The API is now available at `http://localhost:8000`.

### Production (Apache / Nginx)

**Apache** — point `DocumentRoot` to the `public/` folder and add a `.htaccess`:

```apache
# public/.htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

**Nginx** — `try_files` to `index.php`:

```nginx
server {
    listen 8000;
    root /path/to/backend-php/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

Verify the server is responding:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

---

## Connecting the Dashboard

The React dashboard (`campus/dashboard`) is pre-configured to call `http://localhost:8000`. No changes are needed as long as the PHP backend runs on port **8000**.

### Start the dashboard

```bash
cd campus/dashboard
npm install
npm start
```

The dashboard opens at **http://localhost:3000** and connects to the PHP backend automatically.

### If you change the backend port

Edit `campus/dashboard/src/services/api.js` and update the `baseURL`:

```js
const api = axios.create({
  baseURL: 'http://localhost:YOUR_PORT',
});
```

Also update `ALLOWED_ORIGINS` in the backend `.env` to match the dashboard origin.

---

## Connecting the Mobile App

The Flutter mobile app (`campus/mobile`) connects to different URLs depending on the platform.

### Android emulator → `http://10.0.2.2:8000`

`10.0.2.2` is the Android emulator's alias for the host machine's localhost. The app is already configured with this address in `lib/services/api_service.dart`.

```bash
cd campus/mobile
flutter pub get
flutter run     # targets the connected Android emulator by default
```

### iOS simulator → `http://localhost:8000`

The iOS simulator shares the host machine's network, so `localhost` works directly. If the app shows `10.0.2.2` as the base URL, update `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://localhost:8000';
```

### Physical device (Android or iOS)

The device must be on the **same Wi-Fi network** as your development machine. Replace `localhost` / `10.0.2.2` with your machine's local IP address:

```bash
# Find your local IP
ipconfig        # Windows
ifconfig | grep "inet "   # macOS / Linux
```

Then update `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://192.168.X.X:8000';
```

And add that IP to `ALLOWED_ORIGINS` in the backend `.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.X.X:3000
```

### Firebase setup for push notifications (mobile)

The mobile app uses Firebase Messaging. To enable push notifications end-to-end:

1. Add `google-services.json` (Android) to `campus/mobile/android/app/`
2. Add `GoogleService-Info.plist` (iOS) to `campus/mobile/ios/Runner/`
3. Set `FCM_SERVER_KEY` in the backend `.env`

The mobile app sends its FCM token to `POST /api/notifications/update-fcm-token` after login; the backend uses it to deliver push reminders.

---

## Connecting the Web App

`campus/web/` is a React 18 student-facing web application that mirrors the mobile app's features — home dashboard, timetable, campus map, notifications, survey, and settings — and connects to this PHP backend on port 8000.

### Install and start

```bash
cd campus/web
npm install
```

**Windows:**

```cmd
set PORT=3001 && npm start
```

**macOS / Linux:**

```bash
PORT=3001 npm start
```

The web app opens at **http://localhost:3001**.

> The dashboard already runs on port 3000, so the web app must use port 3001. Without the `PORT` override, `react-scripts` defaults to 3000 and the two will conflict.

### Pages

| Route | Description |
|-------|-------------|
| `/` | Home — greeting, geofence status, today's classes |
| `/timetable` | Weekly timetable grid |
| `/map` | Interactive campus map with geofence boundary overlay |
| `/notifications` | Push notification history |
| `/survey` | Weekly student feedback survey |
| `/settings` | Account info, FCM token, sign out |

The map uses **OpenStreetMap via react-leaflet** — no API key is required.

### CORS — allow the web app origin

The `.env` `ALLOWED_ORIGINS` must include the web app URL alongside the dashboard:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

Restart the PHP server after changing `.env`.

### Authentication

The web app stores the JWT access token in `localStorage` (key `token`) and the refresh token in `localStorage` (key `refreshToken`). Login hits `POST /api/auth/login` — the same endpoint used by the dashboard and mobile app.

---

## Scheduled Tasks (Cron)

The Python backend used APScheduler to run background jobs in-process. The PHP equivalent uses three standalone CLI scripts that should be scheduled via **cron**.

| Task | Script | Schedule | What it does |
|------|--------|----------|--------------|
| Class reminders | `tasks/reminder_task.php` | Every 5 min | Checks timetable for classes starting in 10–20 min, looks up student locations, sends FCM push + saves notification |
| Weekly survey | `tasks/survey_task.php` | Monday 08:00 | Sends survey invite notifications to all active students |
| Analytics snapshot | `tasks/analytics_task.php` | Sunday 23:00 | Aggregates weekly stats and caches them in Redis |

### Add to crontab

```bash
crontab -e
```

Add these lines (adjust the path):

```cron
*/5 * * * *   php /path/to/backend-php/tasks/reminder_task.php >> /var/log/campus_reminder.log 2>&1
0 8 * * 1     php /path/to/backend-php/tasks/survey_task.php   >> /var/log/campus_survey.log 2>&1
0 23 * * 0    php /path/to/backend-php/tasks/analytics_task.php >> /var/log/campus_analytics.log 2>&1
```

### Run a task manually

```bash
php tasks/reminder_task.php
php tasks/survey_task.php
php tasks/analytics_task.php
```

The reminder task can also be triggered via the API (admin only):

```bash
curl -X POST http://localhost:8000/api/reminders/trigger-manual \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## API Reference

All endpoints match the Python backend exactly. The base URL is `http://localhost:8000`.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | No | Exchange refresh token for new access token |
| POST | `/api/auth/logout` | No | Logout (client-side token discard) |
| GET | `/api/auth/me` | User | Get current user profile |

### Students — `/api/students`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/students` | Lecturer/Admin | List all students |
| GET | `/api/students/{id}` | User | Get student by ID |
| PUT | `/api/students/{id}` | User | Update student profile |
| DELETE | `/api/students/{id}` | Lecturer/Admin | Deactivate student |
| GET | `/api/students/{id}/timetable` | User | Student's enrolled timetable |
| GET | `/api/students/{id}/reminder-history` | User | Reminder logs for student |
| GET | `/api/students/{id}/survey-responses` | User | Survey submissions for student |
| GET | `/api/students/{id}/location` | Lecturer/Admin | Last cached GPS location |

### Courses — `/api/courses`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/courses` | User | List all courses |
| POST | `/api/courses` | Lecturer/Admin | Create course |
| GET | `/api/courses/{id}` | User | Get course by ID |
| PUT | `/api/courses/{id}` | Lecturer/Admin | Update course |
| DELETE | `/api/courses/{id}` | Admin | Delete course |
| POST | `/api/courses/{id}/enroll` | Lecturer/Admin | Enrol a student |
| DELETE | `/api/courses/{id}/enroll/{student_id}` | Lecturer/Admin | Unenrol a student |
| GET | `/api/courses/{id}/students` | User | List enrolled students |

### Timetable — `/api/timetable`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/timetable` | User | All timetable entries |
| GET | `/api/timetable/today` | User | Today's classes only |
| GET | `/api/timetable/week` | User | Full week view |
| POST | `/api/timetable` | Lecturer/Admin | Add timetable entry |
| GET | `/api/timetable/{id}` | User | Get entry by ID |
| PUT | `/api/timetable/{id}` | Lecturer/Admin | Update entry |
| DELETE | `/api/timetable/{id}` | Lecturer/Admin | Delete entry |

### Geofence — `/api/geofence`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/geofence` | User | List geofences |
| POST | `/api/geofence` | Admin | Create geofence |
| PUT | `/api/geofence/{id}` | Admin | Update geofence |
| POST | `/api/geofence/check-position` | User | Submit GPS, returns on-campus status |
| GET | `/api/geofence/on-campus-now` | Lecturer/Admin | Students on campus in last 10 min |

### Reminders — `/api/reminders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reminders/logs` | Lecturer/Admin | All reminder logs (last 500) |
| GET | `/api/reminders/logs/{student_id}` | User | Logs for a student |
| GET | `/api/reminders/logs/course/{course_id}` | Lecturer/Admin | Logs for a course |
| POST | `/api/reminders/trigger-manual` | Admin | Manually trigger reminder check |

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | User | Current user's notifications |
| GET | `/api/notifications/unread-count` | User | Count of unread notifications |
| POST | `/api/notifications/broadcast` | Lecturer/Admin | Broadcast to all or a course |
| PUT | `/api/notifications/{id}/read` | User | Mark notification as read |
| POST | `/api/notifications/mark-all-read` | User | Mark all as read |
| POST | `/api/notifications/update-fcm-token` | User | Update device FCM token |

### Survey — `/api/survey`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/survey/submit` | User | Submit weekly survey |
| GET | `/api/survey/responses` | Lecturer/Admin | All survey responses |
| GET | `/api/survey/responses/{student_id}` | User | Responses for a student |
| GET | `/api/survey/current-week` | User | Current week info + submission status |
| GET | `/api/survey/check-submitted/{week}` | User | Check if student submitted for week |

### Analytics — `/api/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/analytics/punctuality-summary` | Lecturer/Admin | Average ratings across all surveys |
| GET | `/api/analytics/reminder-effectiveness` | Lecturer/Admin | Correlation: reminder count vs punctuality |
| GET | `/api/analytics/survey-summary` | Lecturer/Admin | Survey aggregate summary |
| GET | `/api/analytics/geofence-stats` | Lecturer/Admin | On/off campus counts for today |
| GET | `/api/analytics/weekly-trend` | Lecturer/Admin | Week-by-week punctuality trend |
| GET | `/api/analytics/platform-breakdown` | Lecturer/Admin | Android vs iOS student count |

### Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained from `POST /api/auth/login`. Access tokens expire after 30 minutes; use `POST /api/auth/refresh` with the refresh token to get a new pair.

---

## Project Structure

```
backend-php/
├── composer.json              # Slim 4, firebase/php-jwt, predis, phpdotenv, ramsey/uuid
├── .env.example               # Environment variable template
├── seed.php                   # One-time database seeder
│
├── public/
│   └── index.php              # Entry point — boots app, registers routes
│
├── src/
│   ├── Core/
│   │   ├── Config.php         # Reads .env, singleton config accessor
│   │   ├── Database.php       # PDO connection + CREATE TABLE statements
│   │   ├── Security.php       # JWT encode/decode, bcrypt hash/verify
│   │   └── RedisClient.php    # Predis wrapper — location & analytics cache
│   │
│   ├── Middleware/
│   │   └── AuthMiddleware.php # Reads Bearer token, adds user to request attrs
│   │
│   ├── Services/
│   │   ├── AuthService.php    # Register, login, token generation
│   │   ├── TimetableService.php # CRUD for timetable entries
│   │   ├── GeofenceService.php  # Haversine distance, campus check, location save
│   │   ├── NotificationService.php # FCM push via curl, save to DB, broadcast
│   │   ├── SurveyService.php    # Submit, retrieve surveys, week calculation
│   │   └── AnalyticsService.php # Punctuality stats, trends, correlations
│   │
│   └── Routes/
│       ├── AuthRoutes.php     # POST /api/auth/*
│       ├── StudentRoutes.php  # GET|PUT|DELETE /api/students/*
│       └── AllRoutes.php      # Courses, timetable, geofence, reminders,
│                              #   notifications, survey, analytics
│
└── tasks/                     # CLI scripts — run via cron
    ├── reminder_task.php      # Every 5 min: check classes, send reminders
    ├── survey_task.php        # Monday 08:00: send weekly survey invites
    └── analytics_task.php     # Sunday 23:00: aggregate and cache analytics
```

---

## Quick-Start Checklist

```
[ ] PostgreSQL running, database and user created
[ ] Redis running
[ ] composer install
[ ] cp .env.example .env  →  fill in DATABASE_URL, SECRET_KEY
[ ] php seed.php          →  creates tables + sample data
[ ] php -S 0.0.0.0:8000 public/index.php
[ ] curl http://localhost:8000/health  →  {"status":"ok"}
[ ] cd ../dashboard && npm install && npm start          →  http://localhost:3000
[ ] cd ../web && npm install && set PORT=3001 && npm start  →  http://localhost:3001
[ ] cd ../mobile && flutter pub get && flutter run
[ ] (optional) crontab -e  →  add the three task schedules
[ ] (optional) Set FCM_SERVER_KEY for push notifications
```
