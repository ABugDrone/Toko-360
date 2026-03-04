# Toko 360 — Staff Internal Reporting & Attendance System

> A centralized internal platform for Toko Academy staff, interns, and administrators to manage attendance, submit weekly reports, communicate, and monitor operational performance.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Screens & Modules](#screens--modules)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

Toko Academy operates across multiple departments and requires a unified internal system for:
- Daily staff check-in/check-out attendance tracking
- Structured weekly performance report submission
- Admin-level oversight, approval, and feedback workflows
- Internal staff communication via encrypted messaging
- Operational analytics for system administrators

**Project Name:** Toko 360  
**Client:** Toko Academy  
**Type:** Staff Internal Portal (Web Application)  
**Status:** Design Phase → Development

---

## Features

### 🔐 Authentication
- Secure Staff ID + Password login
- Role-based access control (Staff / Admin / Super Admin)
- "Stay signed in for 30 days" session option
- Forgot password flow

### 📊 Staff Dashboard
- Live session clock with daily check-in button
- Quick metrics: Pending tasks, Hours worked, Attendance %, Reward points
- Upcoming class/session schedule
- Reporting summary cards (Student Progress, Equipment Log, Course Feedback, Payroll)

### 📝 Weekly Reporting
- Structured 3-section report: Weekly Summary, Challenges, Future Goals
- Draft save and final submission
- Review pipeline with visibility to department heads
- Report status tracking (Draft → Submitted → Approved/Rejected)
- Admin feedback (up to 100 words) on rejection

### 🕐 Attendance
- Daily check-in / check-out via QR scanner or biometric
- 15-minute late arrival threshold (configurable)
- Real-time attendance log synced to central database
- Admin approval/rejection of attendance records

### 💬 Messaging
- End-to-end encrypted internal messaging
- Direct messages and department/management channels
- File sharing (XLSX, PNG, PDF)
- Online presence indicators

### 👥 Admin Panel
- Operational Overview with live activity feed
- Staff Directory management
- Live Attendance monitoring
- Productivity Lab analytics
- Payroll Automator
- User management: Add / Edit / Delete staff accounts across all departments
- Department management: Create/edit departments and sub-departments

### ⚙️ System Configuration (Super Admin)
- Master Control Deck: Global notification toggles, Dark Mode force-sync
- Check-in rules: Late arrival threshold slider, Attendance method toggle
- User permission management
- Core system integrity monitoring (API latency, DB load)

### 👤 Profile Settings
- Avatar upload / removal
- Password change with 90-day security reminder
- Dark Mode (Neon View) preference toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| API Client | Axios |
| Backend (Recommended) | Node.js + Express or Next.js API Routes |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO (messaging) |
| Deployment | Vercel (frontend) / Railway or Render (backend) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/toko-academy/toko-360.git
cd toko-360

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
toko-360/
├── public/
│   └── assets/              # Static assets (logo, icons)
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (Button, Card, Input...)
│   │   ├── layout/          # Sidebar, Topbar, PageWrapper
│   │   └── shared/          # MetricCard, ReportCard, ActivityRow...
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Attendance/
│   │   ├── Reports/
│   │   ├── Messaging/
│   │   ├── Analytics/
│   │   ├── Admin/
│   │   │   ├── Overview/
│   │   │   ├── StaffDirectory/
│   │   │   ├── LiveAttendance/
│   │   │   └── Config/
│   │   └── Profile/
│   ├── store/               # Zustand state stores
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service functions
│   ├── utils/               # Helpers and formatters
│   ├── data/                # Mock/demo data (JSON)
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## User Roles

| Role | Access Level |
|---|---|
| **Staff / Instructor** | Dashboard, Attendance, Reports (own), Messaging, Profile |
| **Intern** | Dashboard, Attendance, Reports (own), Messaging |
| **Department Head** | Above + view team reports, approve/reject team attendance & reports |
| **Admin Manager** | Above + Staff Directory, User Management, Department Management |
| **Super Admin** | Full access including System Config / Master Control Deck |

---

## Screens & Modules

| # | Screen | Route | Roles |
|---|---|---|---|
| 1 | Login | `/login` | All |
| 2 | Staff Dashboard | `/dashboard` | Staff, Intern |
| 3 | Weekly Report Form | `/reports/new` | Staff, Intern |
| 4 | Messaging | `/messages` | All |
| 5 | Profile Settings | `/profile` | All |
| 6 | Admin Overview | `/admin` | Admin+ |
| 7 | Staff Directory | `/admin/staff` | Admin+ |
| 8 | Live Attendance | `/admin/attendance` | Admin+ |
| 9 | Productivity Lab | `/admin/analytics` | Admin+ |
| 10 | System Config | `/admin/config` | Super Admin |

---

## Environment Variables

```env
# .env.example
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_APP_NAME=Toko 360
```

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## Departments

- IT
- Marketing
- Communications
- Student Support
- Business Intelligence
- Finance
- Logistics & Procurement
- Internship & SIWES

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

Internal use only — Toko Academy © 2024. All rights reserved.
