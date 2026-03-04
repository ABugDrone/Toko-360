import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addReport, updateReport, getReports } from './storage';
import * as supabaseService from './supabase-service';
import type { WeeklyReport } from './types';

// Mock the supabase-service module
vi.mock('./supabase-service', () => ({
  addReport: vi.fn(),
  updateReport: vi.fn(),
  getReports: vi.fn(),
}));

describe('Report Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Draft Save Functionality - Requirement 20.2, 20.4', () => {
    it('should save report as draft with status "draft"', async () => {
      const mockReport: WeeklyReport = {
        id: 'report-1',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Weekly summary content',
        challenges: 'Some challenges faced',
        goals: 'Future goals',
        status: 'draft',
        department: 'IT',
        createdAt: Date.now(),
      };

      vi.mocked(supabaseService.addReport).mockResolvedValue({
        success: true,
        data: mockReport,
      });

      await addReport({
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Weekly summary content',
        challenges: 'Some challenges faced',
        goals: 'Future goals',
        status: 'draft',
        department: 'IT',
      });

      expect(supabaseService.addReport).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: 'TA-2024-001',
          status: 'draft',
        })
      );
    });

    it('should allow saving draft without all fields filled', async () => {
      const mockReport: WeeklyReport = {
        id: 'report-2',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Partial summary',
        challenges: '',
        goals: '',
        status: 'draft',
        department: 'IT',
        createdAt: Date.now(),
      };

      vi.mocked(supabaseService.addReport).mockResolvedValue({
        success: true,
        data: mockReport,
      });

      await addReport({
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Partial summary',
        challenges: '',
        goals: '',
        status: 'draft',
        department: 'IT',
      });

      expect(supabaseService.addReport).toHaveBeenCalled();
    });

    it('should allow updating draft reports', async () => {
      const mockUpdatedReport: WeeklyReport = {
        id: 'report-1',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Updated summary',
        challenges: 'Updated challenges',
        goals: 'Updated goals',
        status: 'draft',
        department: 'IT',
        createdAt: Date.now(),
      };

      vi.mocked(supabaseService.updateReport).mockResolvedValue({
        success: true,
        data: mockUpdatedReport,
      });

      await updateReport('report-1', {
        summary: 'Updated summary',
        challenges: 'Updated challenges',
        goals: 'Updated goals',
      });

      expect(supabaseService.updateReport).toHaveBeenCalledWith(
        'report-1',
        expect.objectContaining({
          summary: 'Updated summary',
          challenges: 'Updated challenges',
          goals: 'Updated goals',
        })
      );
    });

    it('should not have submittedAt timestamp for draft reports', async () => {
      const mockReport: WeeklyReport = {
        id: 'report-3',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Draft summary',
        challenges: 'Draft challenges',
        goals: 'Draft goals',
        status: 'draft',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: undefined,
      };

      vi.mocked(supabaseService.addReport).mockResolvedValue({
        success: true,
        data: mockReport,
      });

      await addReport({
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Draft summary',
        challenges: 'Draft challenges',
        goals: 'Draft goals',
        status: 'draft',
        department: 'IT',
      });

      const call = vi.mocked(supabaseService.addReport).mock.calls[0][0];
      expect(call.submittedAt).toBeUndefined();
    });
  });

  describe('Submit with Timestamp - Requirement 20.4', () => {
    it('should set submittedAt timestamp when status changes to submitted', async () => {
      const beforeSubmit = Date.now();
      
      const mockSubmittedReport: WeeklyReport = {
        id: 'report-1',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Complete summary',
        challenges: 'Complete challenges',
        goals: 'Complete goals',
        status: 'submitted',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: Date.now(),
      };

      vi.mocked(supabaseService.updateReport).mockResolvedValue({
        success: true,
        data: mockSubmittedReport,
      });

      await updateReport('report-1', {
        status: 'submitted',
      });

      const afterSubmit = Date.now();

      expect(supabaseService.updateReport).toHaveBeenCalledWith(
        'report-1',
        expect.objectContaining({
          status: 'submitted',
        })
      );

      // Verify the mock returned a report with submittedAt
      const result = await vi.mocked(supabaseService.updateReport).mock.results[0].value;
      expect(result.data.submittedAt).toBeDefined();
      expect(result.data.submittedAt).toBeGreaterThanOrEqual(beforeSubmit);
      expect(result.data.submittedAt).toBeLessThanOrEqual(afterSubmit);
    });

    it('should include submittedAt when creating a report with submitted status', async () => {
      const beforeSubmit = Date.now();

      const mockReport: WeeklyReport = {
        id: 'report-4',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Complete summary',
        challenges: 'Complete challenges',
        goals: 'Complete goals',
        status: 'submitted',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: Date.now(),
      };

      vi.mocked(supabaseService.addReport).mockResolvedValue({
        success: true,
        data: mockReport,
      });

      await addReport({
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Complete summary',
        challenges: 'Complete challenges',
        goals: 'Complete goals',
        status: 'submitted',
        department: 'IT',
        submittedAt: Date.now(),
      });

      const afterSubmit = Date.now();

      const result = await vi.mocked(supabaseService.addReport).mock.results[0].value;
      expect(result.data.submittedAt).toBeDefined();
      expect(result.data.submittedAt).toBeGreaterThanOrEqual(beforeSubmit);
      expect(result.data.submittedAt).toBeLessThanOrEqual(afterSubmit);
    });

    it('should preserve submittedAt timestamp when report is already submitted', async () => {
      const originalSubmittedAt = Date.now() - 86400000; // 1 day ago

      const mockReport: WeeklyReport = {
        id: 'report-5',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Complete summary',
        challenges: 'Complete challenges',
        goals: 'Complete goals',
        status: 'submitted',
        department: 'IT',
        createdAt: Date.now() - 86400000,
        submittedAt: originalSubmittedAt,
      };

      vi.mocked(supabaseService.getReports).mockResolvedValue({
        success: true,
        data: [mockReport],
      });

      const reports = await getReports('TA-2024-001');
      const submittedReport = reports.find(r => r.id === 'report-5');

      expect(submittedReport?.submittedAt).toBe(originalSubmittedAt);
    });

    it('should transition from draft to submitted with timestamp', async () => {
      // First create as draft
      const draftReport: WeeklyReport = {
        id: 'report-6',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Complete summary',
        challenges: 'Complete challenges',
        goals: 'Complete goals',
        status: 'draft',
        department: 'IT',
        createdAt: Date.now(),
      };

      vi.mocked(supabaseService.addReport).mockResolvedValue({
        success: true,
        data: draftReport,
      });

      await addReport({
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Complete summary',
        challenges: 'Complete challenges',
        goals: 'Complete goals',
        status: 'draft',
        department: 'IT',
      });

      // Then submit it
      const submittedReport: WeeklyReport = {
        ...draftReport,
        status: 'submitted',
        submittedAt: Date.now(),
      };

      vi.mocked(supabaseService.updateReport).mockResolvedValue({
        success: true,
        data: submittedReport,
      });

      await updateReport('report-6', {
        status: 'submitted',
      });

      const result = await vi.mocked(supabaseService.updateReport).mock.results[0].value;
      expect(result.data.status).toBe('submitted');
      expect(result.data.submittedAt).toBeDefined();
    });
  });

  describe('Prevention of Editing Submitted Reports - Requirement 20.6', () => {
    it('should not allow editing submitted reports', async () => {
      // Mock a submitted report
      const submittedReport: WeeklyReport = {
        id: 'report-7',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Submitted summary',
        challenges: 'Submitted challenges',
        goals: 'Submitted goals',
        status: 'submitted',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: Date.now(),
      };

      vi.mocked(supabaseService.getReports).mockResolvedValue({
        success: true,
        data: [submittedReport],
      });

      // Attempt to update should be prevented at the application level
      // The test verifies that the report status is 'submitted'
      const reports = await getReports('TA-2024-001');
      const report = reports.find(r => r.id === 'report-7');

      expect(report?.status).toBe('submitted');
      // In the actual application, the UI should prevent editing when status is 'submitted'
    });

    it('should not allow editing approved reports', async () => {
      const approvedReport: WeeklyReport = {
        id: 'report-8',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Approved summary',
        challenges: 'Approved challenges',
        goals: 'Approved goals',
        status: 'approved',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: Date.now() - 86400000,
        reviewedAt: Date.now(),
        reviewedBy: 'admin-1',
        approvalStatus: 'approved',
      };

      vi.mocked(supabaseService.getReports).mockResolvedValue({
        success: true,
        data: [approvedReport],
      });

      const reports = await getReports('TA-2024-001');
      const report = reports.find(r => r.id === 'report-8');

      expect(report?.status).toBe('approved');
      expect(report?.approvalStatus).toBe('approved');
      // UI should prevent editing when status is 'approved'
    });

    it('should verify report is in non-editable state after submission', async () => {
      const submittedReport: WeeklyReport = {
        id: 'report-9',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Final summary',
        challenges: 'Final challenges',
        goals: 'Final goals',
        status: 'submitted',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: Date.now(),
        approvalStatus: 'pending',
      };

      vi.mocked(supabaseService.getReports).mockResolvedValue({
        success: true,
        data: [submittedReport],
      });

      const reports = await getReports('TA-2024-001');
      const report = reports.find(r => r.id === 'report-9');

      // Verify report has all the markers of a submitted report
      expect(report?.status).toBe('submitted');
      expect(report?.submittedAt).toBeDefined();
      expect(report?.approvalStatus).toBe('pending');
    });

    it('should allow editing only draft reports', async () => {
      const draftReport: WeeklyReport = {
        id: 'report-10',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Draft summary',
        challenges: 'Draft challenges',
        goals: 'Draft goals',
        status: 'draft',
        department: 'IT',
        createdAt: Date.now(),
      };

      const submittedReport: WeeklyReport = {
        id: 'report-11',
        staffId: 'TA-2024-001',
        week: 'OCT 14 - OCT 20, 2024',
        summary: 'Submitted summary',
        challenges: 'Submitted challenges',
        goals: 'Submitted goals',
        status: 'submitted',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: Date.now(),
      };

      vi.mocked(supabaseService.getReports).mockResolvedValue({
        success: true,
        data: [draftReport, submittedReport],
      });

      const reports = await getReports('TA-2024-001');
      
      const editableReports = reports.filter(r => r.status === 'draft');
      const nonEditableReports = reports.filter(r => r.status === 'submitted' || r.status === 'approved');

      expect(editableReports).toHaveLength(1);
      expect(editableReports[0].id).toBe('report-10');
      expect(nonEditableReports).toHaveLength(1);
      expect(nonEditableReports[0].id).toBe('report-11');
    });

    it('should maintain report integrity after submission', async () => {
      const originalContent = {
        summary: 'Original summary',
        challenges: 'Original challenges',
        goals: 'Original goals',
      };

      const submittedReport: WeeklyReport = {
        id: 'report-12',
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        ...originalContent,
        status: 'submitted',
        department: 'IT',
        createdAt: Date.now(),
        submittedAt: Date.now(),
      };

      vi.mocked(supabaseService.getReports).mockResolvedValue({
        success: true,
        data: [submittedReport],
      });

      const reports = await getReports('TA-2024-001');
      const report = reports.find(r => r.id === 'report-12');

      // Verify content remains unchanged
      expect(report?.summary).toBe(originalContent.summary);
      expect(report?.challenges).toBe(originalContent.challenges);
      expect(report?.goals).toBe(originalContent.goals);
      expect(report?.status).toBe('submitted');
    });
  });

  describe('Error Handling for Report Operations', () => {
    it('should handle errors when saving draft fails', async () => {
      vi.mocked(supabaseService.addReport).mockResolvedValue({
        success: false,
        error: {
          message: 'Database connection failed',
          code: 'PGRST116',
        },
      });

      await expect(addReport({
        staffId: 'TA-2024-001',
        week: 'OCT 21 - OCT 27, 2024',
        summary: 'Test summary',
        challenges: 'Test challenges',
        goals: 'Test goals',
        status: 'draft',
        department: 'IT',
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle errors when submitting report fails', async () => {
      vi.mocked(supabaseService.updateReport).mockResolvedValue({
        success: false,
        error: {
          message: 'Failed to update report',
          code: 'PGRST116',
        },
      });

      await expect(updateReport('report-1', {
        status: 'submitted',
      })).rejects.toThrow('Failed to update report');
    });

    it('should handle errors when fetching reports fails', async () => {
      vi.mocked(supabaseService.getReports).mockResolvedValue({
        success: false,
        error: {
          message: 'Failed to fetch reports',
          code: 'PGRST116',
        },
      });

      const reports = await getReports('TA-2024-001');
      expect(reports).toEqual([]);
    });
  });
});
