import { User, AttendanceRecord, WeeklyReport, Message, MessageConversation, DashboardMetrics, SystemConfig, UpcomingClass } from './types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    staffId: 'AR001',
    name: 'Alex Rivera',
    email: 'a.rivera@toko.edu',
    department: 'IT',
    role: 'department_head',
    status: 'online',
  },
  {
    id: 'user-2',
    staffId: 'SJ002',
    name: 'Sarah Jenkins',
    email: 's.jenkins@toko.edu',
    department: 'Marketing',
    role: 'department_head',
    status: 'online',
  },
  {
    id: 'user-3',
    staffId: 'JM003',
    name: 'Jordan Miller',
    email: 'j.miller@toko.edu',
    department: 'Communications',
    role: 'department_head',
    status: 'online',
  },
  {
    id: 'user-4',
    staffId: 'AC004',
    name: 'Alex Chen',
    email: 'a.chen@toko.edu',
    department: 'Student Support',
    role: 'department_head',
    status: 'online',
  },
  {
    id: 'user-5',
    staffId: 'DI005',
    name: 'Daniel Ishaku',
    email: 'd.ishaku@toko.edu',
    department: 'Business Intelligence',
    role: 'admin',
    status: 'online',
  },
  {
    id: 'user-6',
    staffId: 'JD006',
    name: 'Julian Drax',
    email: 'j.drax@toko.edu',
    department: 'Finance',
    role: 'department_head',
    status: 'online',
  },
  {
    id: 'user-7',
    staffId: 'DM007',
    name: 'David Miller',
    email: 'd.miller@toko.edu',
    department: 'Logistics & Procurement',
    role: 'department_head',
    status: 'online',
  },
  {
    id: 'user-8',
    staffId: 'MC008',
    name: 'Management Channel',
    email: 'management@toko.edu',
    department: 'Internship & SIWES',
    role: 'department_head',
    status: 'online',
  },
  {
    id: 'user-9',
    staffId: 'AY009',
    name: 'Abdulazeez Yunusa',
    email: 'a.yunusa@toko.edu',
    department: 'IT',
    role: 'staff',
    status: 'online',
  },
];

export const mockAttendance: AttendanceRecord[] = [];

export const mockReports: WeeklyReport[] = [];

export const mockMessages: Message[] = [];

export const mockConversations: MessageConversation[] = [];

export const mockDashboardMetrics: DashboardMetrics = {
  activeStaff: 0,
  attendanceRate: 0,
  avgProductivity: 0,
  lateInstances: 0,
};

export const mockSystemConfig: SystemConfig = {
  lateArrivalThreshold: 15,
  attendanceMethod: 'in_app',
  darkModeForced: true,
  systemNotificationsEnabled: true,
  apiLatency: 0,
  databaseLoad: 0,
};

export const mockUpcomingClasses: UpcomingClass[] = [];

export const mockSharedFiles = [];
