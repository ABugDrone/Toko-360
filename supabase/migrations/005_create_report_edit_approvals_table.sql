-- Migration: Create report_edit_approvals table
-- Purpose: Track admin approvals for staff members to edit specific reports
-- Feature: approved-reports-viewer
-- Requirements: 6.1, 6.2

-- Create report_edit_approvals table
CREATE TABLE IF NOT EXISTS report_edit_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  staff_id VARCHAR(50) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  approved_by VARCHAR(50) NOT NULL REFERENCES users(staff_id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique approval per report-staff combination
  UNIQUE(report_id, staff_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_report_edit_approvals_report ON report_edit_approvals(report_id);
CREATE INDEX idx_report_edit_approvals_staff ON report_edit_approvals(staff_id);
CREATE INDEX idx_report_edit_approvals_expires ON report_edit_approvals(expires_at);

-- Add comment for documentation
COMMENT ON TABLE report_edit_approvals IS 'Tracks admin approvals for staff members to edit specific approved reports';
COMMENT ON COLUMN report_edit_approvals.report_id IS 'Reference to the weekly report that can be edited';
COMMENT ON COLUMN report_edit_approvals.staff_id IS 'Staff member who is granted edit permission';
COMMENT ON COLUMN report_edit_approvals.approved_by IS 'Admin who granted the edit permission';
COMMENT ON COLUMN report_edit_approvals.approved_at IS 'Timestamp when the approval was granted';
COMMENT ON COLUMN report_edit_approvals.expires_at IS 'Optional expiration timestamp for the approval';
COMMENT ON COLUMN report_edit_approvals.created_at IS 'Timestamp when the record was created';
