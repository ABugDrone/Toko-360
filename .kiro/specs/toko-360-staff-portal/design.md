# Design Document: Toko 360 Staff Portal

## Overview

The Toko 360 Staff Portal is a single-page React application (SPA) that provides role-based access to attendance tracking, performance reporting, internal messaging, and administrative analytics for Toko Academy staff. The application operates entirely client-side with mock data and local state management, featuring a dark cyberpunk-lite design aesthetic with neon accents.

### Key Design Principles

1. **Client-Side Only**: No backend dependencies; all data is mocked and state is managed locally
2. **Role-Based UI**: Different user roles see different navigation options and pages
3. **Responsive Design**: Mobile-first approach with collapsible sidebar on small screens
4. **Real-Time Updates**: Live clock, instant state updates, and reactive UI components
5. **Cyberpunk Aesthetic**: Dark theme with neon green/cyan/magenta accents and glassmorphism effects

### Technology Stack

- **Framework**: React 18+ with Vite for build tooling
- **Routing**: React Router v6 for client-side navigation
- **State Management**: Zustand for global state (auth, user data, reports, attendance, messages)
- **Styling**: Tailwind CSS with custom theme extensions
- **Charts**: Recharts library for data visualization
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Inter (Google Fonts) for UI text, monospace for clocks/IDs

## Architecture

### Application Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI primitives
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx
│   │   ├── Toggle.jsx
│   │   ├── MetricCard.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Avatar.jsx
│   │   └── Toast.jsx
│   └── layout/                # Layout components
│       ├── Sidebar.jsx
│       ├── Topbar.jsx
│       └── Layout.jsx
├── pages/                     # Page components
│   ├── Login/
│   │   └── Login.jsx
│   ├── Dashboard/
│   │   └── Dashboard.jsx
│   ├── Reports/
│   │   ├── ReportsList.jsx
│   │   └── NewReport.jsx
│   ├── Attendance/
│   │   └── Attendance.jsx
│   ├── Messaging/
│   │   └── Messaging.jsx
│   ├── Profile/
│   │   └── Profile.jsx
│   └── Admin/
│       ├── Overview.jsx
│       ├── StaffDirectory.jsx
│       └── Config.jsx
├── data/                      # Mock JSON data
│   ├── users.json
│   ├── reports.json
│   ├── attendance.json
│   ├── messages.json
│   └── analytics.json
├── store/                     # Zustand stores
│   ├── authStore.js
│   ├── userStore.js
│   ├── reportsStore.js
│   ├── attendanceStore.js
│   └── messagesStore.js
├── utils/                     # Helper functions
│   ├── dateUtils.js
│   ├── validators.js
│   └── formatters.js
├── App.jsx                    # Root component with router
└── main.jsx                   # Entry point

```

### Routing Architecture

The application uses React Router v6 with a protected route pattern:

```
/ (redirect to /login or /dashboard based on auth)
/login
/dashboard (protected)
/attendance (protected)
/reports (protected)
/reports/new (protected)
/messages (protected)
/profile (protected)
/admin (protected, admin+ only)
/admin/staff (protected, admin+ only)
/admin/config (protected, super_admin only)
```

### State Management Architecture

Zustand stores are organized by domain:

1. **authStore**: Current user session, login/logout actions
2. **userStore**: User profile data, update actions
3. **reportsStore**: Performance reports, CRUD operations
4. **attendanceStore**: Attendance records, check-in/check-out actions
5. **messagesStore**: Message threads, send message actions

Each store follows this pattern:
- State slice with initial data
- Actions for mutations
- Selectors for derived data
- Persistence to localStorage where appropriate

## Components and Interfaces

### UI Component Library

#### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
```

Variants:
- `primary`: Green background (#00ff41), black text, glow effect on hover
- `secondary`: Transparent with border, white text
- `danger`: Red background (#ef4444), white text
- `ghost`: No background, hover shows subtle bg

#### Card Component
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  elevated?: boolean;
}
```

Styling: Dark background (#111a11), rounded-xl, subtle border, optional glow effect

#### Input Component
```typescript
interface InputProps {
  type: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
}
```

Features: Left icon slot, error state with red border and message, show/hide toggle for password

#### Badge Component
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  outlined?: boolean;
  children: React.ReactNode;
}
```

Color mapping:
- success: green (#22c55e)
- warning: amber (#f59e0b)
- error: red (#ef4444)
- info: cyan (#00e5ff)
- neutral: gray

#### MetricCard Component
```typescript
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  accentColor?: string;
}
```

Layout: Icon in colored circle, label text, large value, optional trend indicator

#### Avatar Component
```typescript
interface AvatarProps {
  src?: string;
  name: string;
  size: 'sm' | 'md' | 'lg';
  online?: boolean;
}
```

Features: Circular image, fallback to initials, optional online indicator dot

### Layout Components

#### Sidebar Component
```typescript
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole: 'staff' | 'admin' | 'dept_head' | 'super_admin';
}
```

Features:
- Logo and portal title at top
- Navigation links filtered by role
- Active link highlighting with green background
- User profile section at bottom
- Collapsible on mobile with hamburger toggle

Navigation structure by role:
- **staff**: Dashboard, Attendance, Reports, Messaging, Profile
- **admin**: All staff pages + Admin Overview, Staff Directory
- **dept_head**: All admin pages
- **super_admin**: All pages + System Config

#### Layout Component
```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

Composition: Sidebar + main content area with responsive grid

### Page Components

#### Login Page
- Full viewport centered card
- Logo and branding
- Staff ID and password inputs
- "Stay signed in" checkbox
- Sign in button
- Footer with help links and system status

Authentication flow:
1. User enters credentials
2. Validate against users.json
3. On success: store session in authStore and localStorage, redirect to /dashboard
4. On failure: show error message with red border

#### Dashboard Page
Layout: Two-column responsive grid

Left column (60%):
- Page header with title and subtitle
- Session clock card with live time display (HH:MM:SS)
- Check-in/check-out button (toggles based on attendance state)
- Reporting summary section with 4 report cards

Right column (40%):
- Quick metrics grid (2x2):
  - Pending tasks count
  - Hours worked this week
  - Attendance rate percentage
  - Reward points total
- Upcoming classes/events list

#### Reports Page
Two views:
1. **List view** (/reports): Table of all reports with status badges, filters, search
2. **New report view** (/reports/new): Three-section form for creating reports

Report form sections:
- Section 01: Weekly Summary (large textarea)
- Section 02: Challenges (medium textarea)
- Section 03: Future Goals (medium textarea)

Actions: Save draft, submit report
Status flow: draft → submitted → reviewed

#### Attendance Page
- Calendar view of current month
- Daily attendance records with check-in/check-out times
- Total hours calculation
- Attendance statistics (days present, attendance rate)
- History table for past 30 days

#### Messaging Page
Three-column layout:

Column 1 (280px fixed):
- Conversations list
- Search input
- Contact items with avatar, name, last message preview, timestamp, online status

Column 2 (flexible):
- Chat header with contact info and action buttons
- Message thread with date dividers
- Message bubbles (left for received, right for sent)
- Typing indicator
- Message composer with attachment, emoji, send button
- Encryption indicator footer

Column 3 (320px fixed):
- Contact details panel
- Avatar and title
- Quick actions (profile, mute)
- Shared files list
- Department information

#### Profile Page
Sections:
- Profile card with avatar, name, title, department
- Edit photo/remove avatar buttons
- Security & Access: password change form with validation
- System Preferences: dark mode toggle, notification settings
- Action buttons: Save changes, cancel, delete account (admin only)

#### Admin Overview Page (admin+ roles)
Layout:
- System status indicator
- KPI cards row (4 metrics):
  - Active staff count with trend
  - Attendance rate with trend
  - Average productivity with trend
  - Late instances count with trend
- Two-column charts:
  - Left: Attendance velocity line chart (14-day data)
  - Right: System productivity radial gauge
- Live activity feed table with staff check-ins and status

#### Staff Directory Page (admin+ roles)
- Search and filter controls
- Staff table with columns: Name, Staff ID, Department, Role, Status, Actions
- Pagination
- Quick actions: view profile, edit, deactivate

#### System Config Page (super_admin only)
Two-column layout:

Left panel:
- General settings card with system-wide toggles
- User management card with add user button and user table

Right panel:
- Check-in rules card with threshold slider and method selector
- Core system integrity card with API latency and database load metrics

Actions: Discard changes, save configuration

## Data Models

### User Model
```typescript
interface User {
  id: string;
  staffId: string;           // Format: TA-YYYY-NNN
  name: string;
  role: 'staff' | 'admin' | 'dept_head' | 'super_admin';
  title: string;
  department: string;
  email?: string;
  avatar?: string | null;
  rewardPoints: number;
  attendanceRate: number;
  preferences?: {
    darkMode: boolean;
    notifications: boolean;
  };
}
```

### Attendance Record Model
```typescript
interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;              // ISO date string
  checkInTime: string | null;  // ISO datetime string
  checkOutTime: string | null; // ISO datetime string
  totalHours: number;
  status: 'checked-in' | 'checked-out' | 'not-checked-in' | 'late' | 'absent';
}
```

### Performance Report Model
```typescript
interface PerformanceReport {
  id: string;
  userId: string;
  weekStart: string;         // ISO date string
  weekEnd: string;           // ISO date string
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
  sections: {
    weeklySummary: string;
    challenges: string;
    futureGoals: string;
  };
  submittedAt?: string;      // ISO datetime string
  reviewedBy?: string;       // User ID
  reviewedAt?: string;       // ISO datetime string
}
```

### Message Model
```typescript
interface Message {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;         // ISO datetime string
  read: boolean;
  encrypted: boolean;
}

interface MessageThread {
  id: string;
  participants: string[];    // Array of user IDs
  lastMessage: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
}
```

### Analytics Model
```typescript
interface KPIMetric {
  label: string;
  value: number;
  trend: {
    direction: 'up' | 'down';
    value: number;
  };
  unit?: string;
}

interface AttendanceVelocity {
  date: string;
  attendanceRate: number;
}

interface ActivityFeedItem {
  id: string;
  staffMember: string;
  staffId: string;
  department: string;
  checkInTime: string;
  productivity: number;
  status: 'on-time' | 'late' | 'absent';
  timestamp: string;
}

interface Analytics {
  kpis: KPIMetric[];
  attendanceVelocity: AttendanceVelocity[];
  activityFeed: ActivityFeedItem[];
}
```

### Configuration Model
```typescript
interface SystemConfig {
  general: {
    systemNotifications: boolean;
    darkModeForceSync: boolean;
  };
  attendance: {
    lateThresholdMinutes: number;
    checkInMethod: 'qr' | 'biometric';
  };
  system: {
    apiLatency: number;
    databaseLoad: number;
  };
}
```

## Design System

### Color Palette

```css
/* Background Colors */
--bg-primary: #0a0e27;        /* Main background */
--bg-card: #111a11;           /* Card background start */
--bg-card-end: #131d13;       /* Card background end (gradient) */
--bg-elevated: #1a241a;       /* Elevated surfaces */

/* Accent Colors */
--accent-green: #00ff41;      /* Primary CTA, active states */
--accent-green-alt: #22c55e;  /* Success states */
--accent-cyan: #00e5ff;       /* Secondary accents, links */
--accent-magenta: #ff00ff;    /* Tertiary accents */
--accent-magenta-alt: #d946ef;/* Alternative magenta */

/* Text Colors */
--text-primary: #ffffff;      /* Primary text */
--text-secondary: #9ca3af;    /* Secondary text, labels */
--text-muted: #6b7280;        /* Muted text, placeholders */

/* Semantic Colors */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #00e5ff;

/* Border and Dividers */
--border: rgba(255, 255, 255, 0.08);
--border-hover: rgba(255, 255, 255, 0.16);
```

### Typography

```css
/* Font Family */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Circular */
```

### Visual Effects

#### Glassmorphism
```css
.glass-panel {
  background: rgba(17, 26, 17, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

#### Glow Effects
```css
.glow-green {
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
}

.glow-cyan {
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
}

.glow-magenta {
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.2);
}
```

#### Hover States
```css
.interactive-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.interactive-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 255, 65, 0.15);
}
```

### Component Styling Guidelines

1. **Cards**: Use rounded-xl, dark background with subtle gradient, 1px border
2. **Buttons**: Bold text, rounded-lg, transition on hover, glow effect for primary
3. **Inputs**: Dark background, rounded-md, focus ring with accent color
4. **Badges**: Small rounded-full pills with semantic colors
5. **Tables**: Alternating row backgrounds, hover highlight, sticky headers
6. **Charts**: Use theme colors, smooth animations, tooltips on hover

### Responsive Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

Mobile behavior:
- Sidebar collapses to hamburger menu below 768px
- Two-column layouts stack vertically on mobile
- Three-column messaging layout becomes tabbed interface
- Font sizes scale down slightly
- Touch targets minimum 44x44px

