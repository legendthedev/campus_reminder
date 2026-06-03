# Campus Reminder System
### Mobile & Ubiquitous Computing — GPS-Based Class Reminder Prototype

A full-stack university attendance reminder system using GPS geofencing to detect
when students are on campus and send context-aware push notifications 15 minutes
before each scheduled class. Includes a research survey module for evaluating
whether location-aware reminders improve student punctuality.

---

## System overview

| Layer | Technology |
|---|---|
| Backend API | Python 3.11 + FastAPI + PostgreSQL + Redis + APScheduler |
| Mobile app | Flutter 3 (Android + iOS) |
| Web dashboard | React 18 + Recharts + TailwindCSS |
| Push notifications | Firebase Cloud Messaging (Android) + APNs (iOS) |
| Maps | Google Maps Flutter + Maps Embed API |

---

## Prerequisites

Install all of the following before proceeding:

- **Python 3.11+** — https://python.org
- **PostgreSQL 15** — https://postgresql.org/download
- **pgAdmin 4** — https://pgadmin.org (installed with PostgreSQL)
- **Redis** — see platform-specific instructions below
- **Flutter 3.x** — https://docs.flutter.dev/get-started/install
- **Node.js 18+** — https://nodejs.org
- **Git** — https://git-scm.com
- **Firebase project** — https://console.firebase.google.com
- **Google Cloud account** (for Maps API keys)
- **Apple Developer account** (iOS only, for APNs push notifications)

---

## Step 1 — PostgreSQL native setup

### Install PostgreSQL 15
- **Windows**: Download installer from postgresql.org, run it, note the password you set for the `postgres` superuser
- **macOS**: `brew install postgresql@15 && brew services start postgresql@15`
- **Ubuntu/Debian**: `sudo apt install postgresql-15 && sudo systemctl start postgresql`

### Create database and user
```bash
# Connect as superuser
psql -U postgres -f setup_postgres.sql

# Or run manually:
psql -U postgres
```
```sql
CREATE USER campus_user WITH PASSWORD 'campus_pass';
CREATE DATABASE campus_reminder_db OWNER campus_user;
GRANT ALL PRIVILEGES ON DATABASE campus_reminder_db TO campus_user;
\connect campus_reminder_db
GRANT ALL ON SCHEMA public TO campus_user;
\q
```

---

## Step 2 — Redis native setup

### macOS
```bash
brew install redis
brew services start redis
redis-cli ping   # should return PONG
```

### Ubuntu/Debian
```bash
sudo apt install redis-server
sudo systemctl start redis
redis-cli ping
```

### Windows
Option A — WSL2 (recommended):
```bash
# In WSL2 terminal:
sudo apt install redis-server
sudo service redis-server start
redis-cli ping
```

Option B — Memurai (native Windows Redis):
Download from https://www.memurai.com — free for development.
Install and it runs as a Windows service automatically.

---

## Step 3 — Firebase project setup

1. Go to https://console.firebase.google.com
2. Create a new project called `campus-reminder`
3. Enable **Cloud Messaging** under Project Settings → Cloud Messaging

### Android (google-services.json)
1. Add an Android app with package name `com.example.campus_reminder`
2. Download `google-services.json`
3. Place it at: `mobile/android/app/google-services.json`

### iOS (GoogleService-Info.plist)
1. Add an iOS app with your bundle ID (e.g. `com.yourname.campusReminder`)
2. Download `GoogleService-Info.plist`
3. Drag it into `ios/Runner/` in Xcode (do not just copy the file — use Xcode's Add Files)

### APNs key (iOS push notifications)
1. Go to https://developer.apple.com → Certificates, IDs & Profiles
2. Create a new **APNs Auth Key** (.p8 file)
3. In Firebase Console → Project Settings → Cloud Messaging → Apple app configuration
4. Upload the .p8 key file, enter your Key ID and Team ID

---

## Step 4 — Google Maps API keys

1. Go to https://console.cloud.google.com
2. Enable **Maps SDK for Android** and **Maps SDK for iOS**
3. Create **two separate API keys** with restrictions:

**Android key:**
- Application restriction: Android apps
- Add your app's SHA-1 fingerprint and package name

**iOS key:**
- Application restriction: iOS apps
- Add your bundle ID

4. Place keys in:
   - `mobile/android/app/src/main/AndroidManifest.xml` — replace `${GOOGLE_MAPS_ANDROID_KEY}`
   - `mobile/ios/Runner/AppDelegate.swift` — replace `YOUR_IOS_GOOGLE_MAPS_KEY`

---

## Step 5 — Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your FCM server key and any other values

# Start the server (auto-seeds database on first run)
python run.py
```

Backend runs at: **http://localhost:8000**
Swagger API docs: **http://localhost:8000/docs**

On first run the database is automatically seeded with all test data.

---

## Step 6 — React dashboard setup

```bash
cd dashboard
npm install
npm start
```

Dashboard runs at: **http://localhost:3000**

---

## Step 7 — Flutter mobile app setup

```bash
cd mobile
flutter pub get
```

### Run on Android emulator
```bash
# Start emulator from Android Studio or:
emulator -avd YOUR_AVD_NAME

# Run the app
flutter run
```

### Run on iOS simulator (macOS only)
```bash
open -a Simulator
flutter run
```

### Enable iOS capabilities in Xcode
Open `mobile/ios/Runner.xcworkspace` in Xcode, then:
1. Select Runner target → Signing & Capabilities
2. Click **+ Capability** and add:
   - **Background Modes** — check: Location updates, Background fetch, Remote notifications
   - **Push Notifications**

---

## Step 8 — Simulating GPS location for testing

### Android Emulator
1. Open the emulator
2. Click the **⋮** (More) button → Location
3. Enter coordinates:
   - **On campus**: Latitude `6.5244`, Longitude `3.3792`
   - **Off campus**: Latitude `6.5100`, Longitude `3.3600`
4. Click **Send** — the app will detect the location change within 60 seconds

### iOS Simulator
1. With the simulator open, go to **Features → Location → Custom Location**
2. Enter the same coordinates above

---

## Step 9 — End-to-end test walkthrough

### Full reminder flow
1. Start the backend: `python run.py`
2. Start the dashboard: `npm start` in `/dashboard`
3. Log in to the dashboard as admin: `admin@university.edu` / `admin123`
4. Go to **Timetable** → add a class entry for today's day of week with a start time 15 minutes from now
5. Start the Flutter app and log in as a student: `chidi@student.edu` / `student123`
6. Set emulator GPS to on-campus coordinates
7. Wait up to 5 minutes — the APScheduler job fires every 5 minutes
8. A push notification should arrive: "Your [Course] starts in ~15 min — you're already on campus!"
9. In the dashboard → Overview, the reminder count should increment

### Survey submission
1. Log in to the Flutter app as any student
2. Tap the clipboard icon on the home screen or navigate to the Survey tab
3. Complete all 6 questions and submit
4. In the dashboard → Survey Results, select the current week
5. The new response should appear in all charts

---

## Seed credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@university.edu | admin123 |
| Lecturer | adebayo@university.edu | lecturer123 |
| Lecturer | ngozi@university.edu | lecturer123 |
| Student | chidi@student.edu | student123 |
| Student | amaka@student.edu | student123 |
| Student | emeka@student.edu | student123 |
| Student | fatima@student.edu | student123 |
| Student | tunde@student.edu | student123 |

---

## Seeded courses

| Code | Name | Lecturer | Enrolled students | Schedule |
|---|---|---|---|---|
| CS401 | Mobile Computing | Dr. Okafor | All 5 | Mon & Wed 10:00–12:00, Lab 101 |
| CS302 | Database Systems | Dr. Eze | STU001–003 | Tue & Thu 14:00–16:00, Room 102 |
| CS205 | Web Development | Dr. Okafor | STU003–005 | Fri 09:00–12:00, Room 103 |

---

## Architecture notes

- **APScheduler** runs inside the FastAPI process — no separate Celery worker needed
- **Redis** caches GPS locations (TTL 10 min) for fast reminder scheduler lookups
- **Offline sync** — Flutter queues GPS updates in SQLite when offline and syncs on reconnect
- **Platform detection** — iOS and Android use different `LocationSettings` for background GPS compliance
- **Survey data** — 3 weeks of historical seed data enables immediate chart visualisation
- **Haversine formula** — used for accurate GPS distance calculation in the geofence service

---

## Project structure

```
campus-reminder-system/
├── backend/           FastAPI backend, models, services, tasks
├── mobile/            Flutter app (Android + iOS)
│   ├── android/       AndroidManifest.xml
│   └── ios/Runner/    Info.plist, AppDelegate.swift
├── dashboard/         React web dashboard
├── setup_postgres.sql Database setup script
└── README.md
```
