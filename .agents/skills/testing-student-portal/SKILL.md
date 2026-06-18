---
name: testing-student-portal
description: Test the student portal frontend end-to-end. Use when verifying student portal UI, sidebar navigation, or layout changes.
---

# Testing the Student Portal

## Setup

1. Install dependencies:
   ```bash
   cd student-portal && npm install
   ```

2. Start the dev server:
   ```bash
   npx react-scripts start
   ```
   - Default port is 3000; if occupied, it will prompt to use 3001
   - The app proxies API requests to `localhost:8000` (backend)

3. If backend is not running, the UI still renders — API calls fail gracefully with "Offline — showing cached data" banner. This is sufficient for layout/navigation testing.

## Mocking Authentication (No Backend)

The auth check (`isLoggedIn()`) only looks for `access_token` in localStorage. To bypass login without a backend:

```javascript
// Run in browser console
localStorage.setItem('access_token', 'mock_token');
localStorage.setItem('refresh_token', 'mock_refresh');
localStorage.setItem('user', JSON.stringify({
  id: 1,
  full_name: 'Chidi Okonkwo',
  email: 'chidi@student.edu',
  role: 'student',
  student_id: 'STU/2024/001',
  platform: 'web'
}));
window.location.href = '/';
```

## Key Pages to Verify

| Route | Page | Key Elements |
|---|---|---|
| `/login` | Login | Green gradient icon, form, demo buttons, no bottom nav |
| `/` | Dashboard | Stats grid (location, classes, survey), today's schedule |
| `/timetable` | Timetable | Day tabs (Mon-Fri), class cards with time/room |
| `/map` | Campus Map | Leaflet map, "Locate me" button, status bar |
| `/notifications` | Notifications | Notification cards or empty state |
| `/survey` | Weekly Survey | 6 numbered question sections with interactive buttons |
| `/settings` | Settings | Account info, FCM token input, privacy toggle, sign out |

## Sidebar Verification Checklist

- Fixed left sidebar (260px width)
- School branding at top: green gradient icon + "Campus Reminder" + "Student Portal"
- 6 navigation items with SVG icons (not emojis)
- Active state: green text + left indicator bar + green background tint
- Notification badge (when unread count > 0)
- User profile at bottom: initials avatar + name + role + sign-out button
- Sidebar persists across all page navigations

## Color Scheme

- Primary green: `#22c55e`
- Backgrounds: `#0f0f0f`, `#1a1a1a`, `#1e1e1e`
- Borders: `#2a2a2a`
- Active tint: `#052e16`
- Text: `#ffffff` (primary), `#9ca3af` (secondary), `#6b7280` (dim)

## Tips

- The location permission popup may appear on first load — dismiss it ("Never allow" is fine for testing)
- If port 3000 is in use, the CRA dev server will suggest port 3001
- The Leaflet map may have some tiles fail to load (black rectangles) — this is a tile server issue, not a bug
- Demo credentials (when backend is running): `chidi@student.edu` / `student123`

## Devin Secrets Needed

None required for frontend-only testing. If testing with backend:
- PostgreSQL connection (see `backend/.env`)
- Redis connection
