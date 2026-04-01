'use client';

import { ApprovedReportsTable } from './ApprovedReportsTable';
import type { Department, User } from '@/lib/types';

interface ApprovedReportsListProps {
  userRole: 'admin' | 'staff';
  userId: string;
  userDepartment?: Department;
  availableDepartments: Department[];
  availableUsers: User[];
}

export function ApprovedReportsList({
  userRole,
  userId,
  userDepartment,
  availableDepartments,
  availableUsers,
}: ApprovedReportsListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Approved Reports</h1>
        <p className="text-muted-foreground mt-1">
          {userRole === 'admin'
            ? 'View and manage all approved reports across all departments'
            : 'View approved reports accessible to you'}
        </p>
      </div>

      <ApprovedReportsTable
        userRole={userRole}
        userId={userId}
        availableDepartments={availableDepartments}
        availableUsers={availableUsers}
      />
    </div>
  );
}
