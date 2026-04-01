/**
 * Tests for Approved Reports Viewer API
 * Validates Requirements: 1.1, 2.1, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getApprovedReports } from './reports';
import { supabase } from '../supabase';
import type { Department } from '../types';

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('getApprovedReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should fetch approved reports with default pagination', async () => {
      const mockData = [
        {
          id: 'report-1',
          staff_id: 'TA-2024-001',
          week: 'OCT 21 - OCT 27, 2024',
          summary: 'Summary 1',
          challenges: 'Challenges 1',
          goals: 'Goals 1',
          status: 'submitted',
          approval_status: 'approved',
          department: 'IT',
          created_at: '2024-10-27T10:00:00Z',
          reviewed_at: '2024-10-28T10:00:00Z',
          reviewed_by: 'admin-1',
          author: { name: 'John Doe', department: 'IT' },
          reviewer: { name: 'Admin User' },
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 1,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getApprovedReports('admin', 'admin-1');

      expect(result.reports).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.reports[0].authorName).toBe('John Doe');
    });

    it('should filter by approval_status = approved', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('approval_status', 'approved');
    });
  });

  describe('Pagination - Requirements 1.3, 2.3', () => {
    it('should apply custom page size', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', { pageSize: 10 });

      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
    });

    it('should calculate correct offset for page 2', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', { page: 2, pageSize: 20 });

      expect(mockQuery.range).toHaveBeenCalledWith(20, 39);
    });

    it('should calculate total pages correctly', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 45,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getApprovedReports('admin', 'admin-1', { pageSize: 20 });

      expect(result.totalPages).toBe(3); // 45 / 20 = 2.25, rounded up to 3
    });
  });

  describe('Date Range Filter - Requirement 8.1', () => {
    it('should filter by date range', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', {
        startDate: '2024-10-01',
        endDate: '2024-10-31',
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('reviewed_at', '2024-10-01T00:00:00.000Z');
      expect(mockQuery.lte).toHaveBeenCalledWith('reviewed_at', '2024-10-31T00:00:00.000Z');
    });
  });

  describe('Week and Year Filter - Requirement 9.1', () => {
    it('should filter by week and year', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', {
        week: 43,
        year: 2024,
      });

      // Should call gte and lte for the week date range
      expect(mockQuery.gte).toHaveBeenCalledWith('reviewed_at', expect.any(String));
      expect(mockQuery.lte).toHaveBeenCalledWith('reviewed_at', expect.any(String));
    });

    it('should filter by year only', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', {
        year: 2024,
      });

      // Check that gte and lte were called with ISO strings for the year
      expect(mockQuery.gte).toHaveBeenCalledWith('reviewed_at', expect.stringContaining('2024'));
      expect(mockQuery.lte).toHaveBeenCalledWith('reviewed_at', expect.stringContaining('2024'));
    });
  });

  describe('Name Filter - Requirement 10.1', () => {
    it('should filter by report name (case-insensitive)', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', {
        name: 'October',
      });

      expect(mockQuery.ilike).toHaveBeenCalledWith('week', '%October%');
    });
  });

  describe('Department Filter - Requirement 11.1', () => {
    it('should filter by department', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', {
        department: 'IT' as Department,
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('department', 'IT');
    });
  });

  describe('Author Filter - Requirement 12.1', () => {
    it('should filter by author name in memory', async () => {
      const mockData = [
        {
          id: 'report-1',
          staff_id: 'TA-2024-001',
          week: 'OCT 21 - OCT 27, 2024',
          summary: 'Summary 1',
          challenges: 'Challenges 1',
          goals: 'Goals 1',
          status: 'submitted',
          approval_status: 'approved',
          department: 'IT',
          created_at: '2024-10-27T10:00:00Z',
          reviewed_at: '2024-10-28T10:00:00Z',
          reviewed_by: 'admin-1',
          author: { name: 'John Doe', department: 'IT' },
          reviewer: { name: 'Admin User' },
        },
        {
          id: 'report-2',
          staff_id: 'TA-2024-002',
          week: 'OCT 21 - OCT 27, 2024',
          summary: 'Summary 2',
          challenges: 'Challenges 2',
          goals: 'Goals 2',
          status: 'submitted',
          approval_status: 'approved',
          department: 'Marketing',
          created_at: '2024-10-27T10:00:00Z',
          reviewed_at: '2024-10-28T10:00:00Z',
          reviewed_by: 'admin-1',
          author: { name: 'Jane Smith', department: 'Marketing' },
          reviewer: { name: 'Admin User' },
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 2,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getApprovedReports('admin', 'admin-1', {
        authorName: 'john',
      });

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].authorName).toBe('John Doe');
    });
  });

  describe('Multiple Filters - Requirement 13.1', () => {
    it('should apply multiple filters with AND logic', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1', {
        startDate: '2024-10-01',
        endDate: '2024-10-31',
        department: 'IT' as Department,
        name: 'October',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('approval_status', 'approved');
      expect(mockQuery.eq).toHaveBeenCalledWith('department', 'IT');
      expect(mockQuery.gte).toHaveBeenCalledWith('reviewed_at', expect.any(String));
      expect(mockQuery.lte).toHaveBeenCalledWith('reviewed_at', expect.any(String));
      expect(mockQuery.ilike).toHaveBeenCalledWith('week', '%October%');
    });
  });

  describe('Data Transformation', () => {
    it('should transform database records to application format', async () => {
      const mockData = [
        {
          id: 'report-1',
          staff_id: 'TA-2024-001',
          week: 'OCT 21 - OCT 27, 2024',
          summary: 'Summary 1',
          challenges: 'Challenges 1',
          goals: 'Goals 1',
          rich_content: { type: 'doc', content: [] },
          format_type: 'word',
          start_date: '2024-10-21',
          end_date: '2024-10-27',
          status: 'submitted',
          approval_status: 'approved',
          department: 'IT',
          media_links: [],
          created_at: '2024-10-27T10:00:00Z',
          submitted_at: '2024-10-27T12:00:00Z',
          reviewed_at: '2024-10-28T10:00:00Z',
          reviewed_by: 'admin-1',
          feedback: 'Great work!',
          notification_viewed: true,
          author: { name: 'John Doe', department: 'IT' },
          reviewer: { name: 'Admin User' },
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 1,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getApprovedReports('admin', 'admin-1');

      expect(result.reports[0]).toMatchObject({
        id: 'report-1',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Summary 1',
        authorName: 'John Doe',
        authorDepartment: 'IT',
        approvedByName: 'Admin User',
      });
    });

    it('should handle missing optional fields', async () => {
      const mockData = [
        {
          id: 'report-1',
          staff_id: 'TA-2024-001',
          week: 'OCT 21 - OCT 27, 2024',
          summary: 'Summary 1',
          challenges: 'Challenges 1',
          goals: 'Goals 1',
          status: 'submitted',
          approval_status: 'approved',
          department: 'IT',
          created_at: '2024-10-27T10:00:00Z',
          reviewed_at: '2024-10-28T10:00:00Z',
          reviewed_by: 'admin-1',
          author: { name: 'John Doe', department: 'IT' },
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 1,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getApprovedReports('admin', 'admin-1');

      expect(result.reports[0].approvedByName).toBeUndefined();
      expect(result.reports[0].feedback).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database query fails', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
          count: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await expect(getApprovedReports('admin', 'admin-1')).rejects.toThrow(
        'Failed to get approved reports: Database connection failed'
      );
    });
  });

  describe('Sorting', () => {
    it('should sort by reviewed_at in descending order', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await getApprovedReports('admin', 'admin-1');

      expect(mockQuery.order).toHaveBeenCalledWith('reviewed_at', { ascending: false });
    });
  });
});
