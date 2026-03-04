# Toko 360 — Technical Documentation

**Version:** 1.0.0  
**Last Updated:** 2024  
**Project:** Toko Academy Staff Internal Reporting & Attendance System

---

## 1. System Architecture

### 1.1 Overview

Toko 360 is a single-page application (SPA) built with React. It interfaces with a REST API backend and uses WebSockets for real-time messaging and attendance updates. All data is persisted in a relational database (PostgreSQL).

```
┌─────────────────────────────────────────────────────────┐
│                        BROWSER                          │
│   ┌──────────────────────────────────────────────────┐  │
│   │     React SPA (Vite + Tailwind + Zustand)        │  │
│   │  Login → Dashboard → Reports → Messaging → Admin │  │
│   └──────────────┬──────────────────────┬────────────┘  │
└──────────────────┼──────────────────────┼───────────────┘
                   │ REST API             │ WebSocket
         ┌─────────▼──────────┐  ┌───────▼────────┐
         │   Express API      │  │  Socket.IO      │
         │   (Node.js)        │  │  (Real-time)    │
         └─────────┬──────────┘  └───────┬────────┘
                   │                     │
         ┌─────────▼─────────────────────▼────────┐
         │            PostgreSQL Database          │
         └────────────────────────────────────────┘
```

### 1.2 Authentication Flow

```
1. User enters Staff ID + Password → POST /api/auth/login
2. Server validates credentials → returns JWT (access token, 8h) + Refresh Token (30d if "stay signed in")
3. JWT stored in memory (Zustand); Refresh token in httpOnly cookie
4. All API requests include Authorization: Bearer <token>
5. On 401 → auto-refresh via /api/auth/refresh
6. Logout → DELETE /api/auth/logout (revokes refresh token)
```

---

## 2. Data Models

### 2.1 User

```sql
users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        VARCHAR(20) UNIQUE NOT NULL,        -- e.g. "TA-2024-001"
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('intern','staff','dept_head','admin','super_admin') DEFAULT 'staff',
  department_id   UUID REFERENCES departments(id),
  avatar_url      VARCHAR(255),
  is_active       BOOLEAN DEFAULT true,
  reward_points   INTEGER DEFAULT 0,
  last_password_change TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 2.2 Department

```sql
departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  parent_id       UUID REFERENCES departments(id),   -- NULL for top-level
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

**Seed Departments:**
- IT, Marketing, Communications, Student Support, Business Intelligence, Finance, Logistics & Procurement, Internship & SIWES

### 2.3 Attendance

```sql
attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  date            DATE NOT NULL,
  check_in_time   TIMESTAMPTZ,
  check_out_time  TIMESTAMPTZ,
  method          ENUM('qr_scanner','biometric','manual') DEFAULT 'qr_scanner',
  status          ENUM('on_time','late','absent','pending') DEFAULT 'pending',
  admin_status    ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_feedback  VARCHAR(100),                       -- Max ~100 words
  reviewed_by     UUID REFERENCES users(id),
  UNIQUE(user_id, date)
)
```

### 2.4 Report

```sql
reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end   DATE NOT NULL,
  weekly_summary  TEXT,
  challenges      TEXT,
  future_goals    TEXT,
  status          ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
  admin_feedback  VARCHAR(700),                       -- ~100 words
  reviewed_by     UUID REFERENCES users(id),
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 2.5 Message

```sql
conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            ENUM('direct','group','channel'),
  name            VARCHAR(100),                       -- For group/channel
  department_id   UUID REFERENCES departments(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

conversation_members (
  conversation_id UUID REFERENCES conversations(id),
  user_id         UUID REFERENCES users(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
)

messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  sender_id       UUID REFERENCES users(id) NOT NULL,
  content         TEXT,
  attachment_url  VARCHAR(255),
  attachment_name VARCHAR(100),
  is_read         BOOLEAN DEFAULT false,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
)
```

---

## 3. API Endpoints

### 3.1 Auth

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/login` | Login with staff ID + password | No |
| POST | `/api/auth/refresh` | Refresh access token | Cookie |
| DELETE | `/api/auth/logout` | Logout & revoke token | Yes |
| POST | `/api/auth/forgot-password` | Send reset email | No |
| POST | `/api/auth/reset-password` | Set new password via token | No |

### 3.2 Users

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/users/me` | Get current user profile | Yes |
| PATCH | `/api/users/me` | Update profile / password | Yes |
| GET | `/api/users` | List all users (admin) | Admin+ |
| POST | `/api/users` | Create user (admin) | Admin+ |
| PATCH | `/api/users/:id` | Edit user (admin) | Admin+ |
| DELETE | `/api/users/:id` | Delete user (admin) | Admin+ |

### 3.3 Attendance

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/attendance/checkin` | Check in for today | Yes |
| POST | `/api/attendance/checkout` | Check out for today | Yes |
| GET | `/api/attendance/me` | My attendance history | Yes |
| GET | `/api/attendance` | All attendance (admin) | Admin+ |
| PATCH | `/api/attendance/:id/approve` | Approve record | Admin+ |
| PATCH | `/api/attendance/:id/reject` | Reject with feedback | Admin+ |

### 3.4 Reports

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/reports` | Create/save draft | Yes |
| PATCH | `/api/reports/:id` | Update draft | Yes |
| POST | `/api/reports/:id/submit` | Submit report | Yes |
| GET | `/api/reports/me` | My reports | Yes |
| GET | `/api/reports` | All reports (admin) | Admin+ |
| PATCH | `/api/reports/:id/approve` | Approve report | Admin+ |
| PATCH | `/api/reports/:id/reject` | Reject with feedback | Admin+ |

### 3.5 Messaging

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/conversations` | List conversations | Yes |
| POST | `/api/conversations` | Start conversation | Yes |
| GET | `/api/conversations/:id/messages` | Get messages | Yes |
| POST | `/api/conversations/:id/messages` | Send message | Yes |

### 3.6 Departments (Admin)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/departments` | List all departments | Yes |
| POST | `/api/departments` | Create department | Admin+ |
| PATCH | `/api/departments/:id` | Edit department | Admin+ |
| DELETE | `/api/departments/:id` | Delete department | Super Admin |

### 3.7 Analytics (Admin)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/analytics/overview` | System-wide metrics | Admin+ |
| GET | `/api/analytics/attendance-velocity` | 14-day attendance data | Admin+ |
| GET | `/api/analytics/productivity` | Productivity scores | Admin+ |
| GET | `/api/analytics/activity-feed` | Live activity feed | Admin+ |

---

## 4. Frontend Module Breakdown

### 4.1 Pages & Components

#### Login Page (`/login`)
- `LoginForm` — Staff ID + Password inputs, "Stay signed in" checkbox
- `BrandHeader` — Logo + title
- `FooterLinks` — Privacy policy, Terms, System status

#### Staff Dashboard (`/dashboard`)
- `SessionClock` — Live HH:MM:SS display
- `CheckInButton` — Toggle check-in / check-out, triggers POST to API
- `MetricCard` — Reusable card for Pending Tasks, Hours Worked, Attendance %, Reward Points
- `UpcomingClasses` — List of upcoming scheduled sessions
- `ReportingSummary` — 4 report-type cards with status indicators

#### Weekly Report (`/reports/new`, `/reports/:id`)
- `ReportHeader` — Period badge, status badge
- `ReportSection` — Labelled textarea (Section 01, 02, 03)
- `ReviewPipeline` — Avatar stack + visibility count
- `ReportActions` — Save Draft / Submit buttons

#### Attendance (`/attendance`)
- `AttendanceCalendar` — Monthly view with color-coded status dots
- `AttendanceTable` — Date, check-in, check-out, status, admin status
- `CheckInModal` — Confirmation dialog with method selection

#### Messaging (`/messages`)
- `ConversationList` — Sidebar with search, contact items, unread badges
- `ChatWindow` — Message bubbles, timestamp, read receipts, typing indicator
- `ContactInfo` — Right panel: profile, quick actions, shared files, department
- `MessageComposer` — Text input, emoji, attachment, send button

#### Profile (`/profile`)
- `AvatarEditor` — Upload / remove avatar
- `SecurityForm` — Current password + new password (min 12 chars)
- `PasswordAgeWarning` — Alert if > 90 days since last change
- `PreferenceToggles` — Dark Mode (Neon View) toggle

#### Admin Overview (`/admin`)
- `SystemStatusHeader` — Operational status indicator
- `KPIGrid` — Active Staff, Attendance Rate, Avg Productivity, Late Instances
- `AttendanceVelocityChart` — Line chart, daily/weekly toggle (Recharts)
- `SystemProductivityGauge` — Circular progress gauge
- `LiveActivityFeed` — Table: staff, department, check-in time, productivity bar, status, actions

#### Staff Directory (`/admin/staff`)
- `StaffSearch` + `DepartmentFilter`
- `StaffTable` — Name, ID, Department, Role, Status, Actions
- `AddStaffModal` — Create user form
- `EditStaffModal` — Edit role, department, status

#### System Config (`/admin/config`)
- `GeneralSettings` — Toggle: System-wide Notifications, Dark Mode Force-Sync
- `CheckInRules` — Late threshold slider (0–60min), Attendance Method radio (QR / Biometric)
- `UserManagement` — Inline table with Add New User button, permission role selector
- `SystemIntegrity` — API Latency + Database Load progress bars

---

## 5. State Management (Zustand)

```javascript
// Store structure
useAuthStore       → { user, token, login(), logout(), refreshToken() }
useAttendanceStore → { todayRecord, history, checkIn(), checkOut() }
useReportsStore    → { reports, currentDraft, saveReport(), submitReport() }
useMessagingStore  → { conversations, activeConvId, messages, sendMessage() }
useAdminStore      → { users, departments, analytics, fetchOverview() }
useUIStore         → { sidebarOpen, theme, notifications }
```

---

## 6. Role-Based Access Control

```javascript
// Route guard example
const ROLE_HIERARCHY = {
  intern: 1,
  staff: 2,
  dept_head: 3,
  admin: 4,
  super_admin: 5
};

// ProtectedRoute component checks:
// 1. User is authenticated (valid JWT)
// 2. User role level >= required level for route
// 3. If not → redirect to /dashboard or /login
```

---

## 7. Real-time (Socket.IO Events)

| Event | Direction | Payload | Description |
|---|---|---|---|
| `message:new` | Server → Client | `{ conversationId, message }` | New chat message |
| `message:send` | Client → Server | `{ conversationId, content, attachmentUrl }` | Send message |
| `attendance:updated` | Server → Client | `{ userId, status }` | Attendance status change |
| `report:reviewed` | Server → Client | `{ reportId, status, feedback }` | Report reviewed by admin |
| `user:online` | Server → Client | `{ userId }` | User came online |
| `user:offline` | Server → Client | `{ userId }` | User went offline |

---

## 8. Security Considerations

- All passwords hashed with bcrypt (salt rounds: 12)
- JWT signed with RS256 (asymmetric keys)
- Refresh tokens stored as httpOnly, Secure, SameSite=Strict cookies
- Rate limiting on `/api/auth/login` (5 attempts / 15 min)
- All messaging content end-to-end encrypted (noted in UI)
- File uploads validated by MIME type and size (max 10MB)
- Password minimum 12 characters; 90-day rotation recommended
- Admin-only routes enforce role middleware server-side

---

## 9. Demo Data

The frontend ships with mock data in `/src/data/` for rapid prototyping:

- `users.json` — 10 staff across all departments
- `attendance.json` — 30-day attendance history per user
- `reports.json` — Submitted and draft reports
- `messages.json` — Sample conversations
- `analytics.json` — KPI metrics and chart data

Toggle mock mode via `VITE_USE_MOCK_DATA=true` in `.env`.

---

## 10. Deployment Checklist

- [ ] Set all production environment variables
- [ ] Run `npm run build` and test production bundle
- [ ] Configure CORS for production API domain
- [ ] Set up SSL certificates (HTTPS required for httpOnly cookies)
- [ ] Configure PostgreSQL connection pool
- [ ] Run database migrations
- [ ] Seed initial departments and super admin user
- [ ] Set up Socket.IO behind a load balancer (sticky sessions or Redis adapter)
- [ ] Configure log aggregation (e.g., Logtail, Datadog)
- [ ] Enable database backups

---

*Documentation maintained by the Toko Academy Engineering team.*
