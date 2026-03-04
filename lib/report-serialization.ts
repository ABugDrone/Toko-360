import type { WeeklyReport, DbWeeklyReport, JSONContent, Department, ReportStatus } from './types';

/**
 * Convert WeeklyReport to database format
 */
export function reportToDbReport(report: Omit<WeeklyReport, 'id' | 'createdAt'>): Omit<DbWeeklyReport, 'id' | 'created_at' | 'updated_at'> {
  return {
    staff_id: report.staffId,
    week: report.week,
    start_date: report.startDate || null,
    end_date: report.endDate || null,
    rich_content: report.richContent || null,
    format_type: report.formatType || 'word',
    // Also save as plain text for backward compatibility
    summary: report.richContent ? extractPlainText(report.richContent, 'summary') : report.summary,
    challenges: report.richContent ? extractPlainText(report.richContent, 'challenges') : report.challenges,
    goals: report.richContent ? extractPlainText(report.richContent, 'goals') : report.goals,
    status: report.status,
    approval_status: report.approvalStatus || null,
    department: report.department,
    media_links: report.mediaLinks || [],
    submitted_at: report.submittedAt ? new Date(report.submittedAt).toISOString() : null,
    reviewed_by: report.reviewedBy || null,
    reviewed_at: report.reviewedAt ? new Date(report.reviewedAt).toISOString() : null,
    feedback: report.feedback || null,
  };
}

/**
 * Convert database format to WeeklyReport
 */
export function dbReportToReport(dbReport: DbWeeklyReport): WeeklyReport {
  return {
    id: dbReport.id,
    staffId: dbReport.staff_id,
    week: dbReport.week,
    summary: dbReport.summary,
    challenges: dbReport.challenges,
    goals: dbReport.goals,
    richContent: dbReport.rich_content || undefined,
    formatType: (dbReport.format_type as 'word' | 'spreadsheet' | 'presentation') || 'word',
    startDate: dbReport.start_date || undefined,
    endDate: dbReport.end_date || undefined,
    status: dbReport.status as ReportStatus,
    approvalStatus: dbReport.approval_status as 'pending' | 'approved' | 'rejected' | undefined,
    department: dbReport.department as Department,
    mediaLinks: dbReport.media_links || [],
    createdAt: new Date(dbReport.created_at).getTime(),
    submittedAt: dbReport.submitted_at ? new Date(dbReport.submitted_at).getTime() : undefined,
    reviewedBy: dbReport.reviewed_by || undefined,
    reviewedAt: dbReport.reviewed_at ? new Date(dbReport.reviewed_at).getTime() : undefined,
    feedback: dbReport.feedback || undefined,
  };
}

/**
 * Extract plain text from rich content for legacy fields
 * This ensures old clients/reports can still read the data
 */
export function extractPlainText(content: JSONContent | undefined, section: string): string {
  if (!content || !content.content) return '';
  
  let text = '';
  let inSection = false;
  let sectionFound = false;
  
  for (const node of content.content) {
    // Check if this is a heading that matches our section
    if (node.type === 'heading' && node.content) {
      const headingText = node.content.map(n => n.text || '').join('').toLowerCase();
      
      if (headingText.includes(section.toLowerCase())) {
        inSection = true;
        sectionFound = true;
        continue;
      } else if (inSection && sectionFound) {
        // Hit next section, stop
        break;
      }
    }
    
    // If we're in the target section, collect paragraph text
    if (inSection && node.type === 'paragraph' && node.content) {
      text += extractTextFromNode(node) + '\n';
    }
  }
  
  // If no section found, try to extract all text (for simple documents)
  if (!sectionFound && section === 'summary') {
    return extractAllText(content);
  }
  
  return text.trim();
}

/**
 * Extract text from a single node
 */
function extractTextFromNode(node: JSONContent): string {
  if (node.text) {
    return node.text;
  }
  
  if (node.content) {
    return node.content.map(extractTextFromNode).join('');
  }
  
  return '';
}

/**
 * Extract all text from content (fallback for simple documents)
 */
function extractAllText(content: JSONContent): string {
  if (!content.content) return '';
  
  return content.content
    .filter(node => node.type === 'paragraph')
    .map(extractTextFromNode)
    .join('\n')
    .trim();
}

/**
 * Convert legacy plain text report to rich content format
 */
export function convertLegacyToRichContent(legacy: {
  summary: string;
  challenges: string;
  goals: string;
}): JSONContent {
  const content: JSONContent[] = [];
  
  // Add Weekly Summary section
  if (legacy.summary) {
    content.push({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Weekly Summary' }],
    });
    
    // Split by newlines and create paragraphs
    const summaryParagraphs = legacy.summary.split('\n').filter(p => p.trim());
    summaryParagraphs.forEach(para => {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: para }],
      });
    });
  }
  
  // Add Challenges section
  if (legacy.challenges) {
    content.push({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Challenges' }],
    });
    
    const challengesParagraphs = legacy.challenges.split('\n').filter(p => p.trim());
    challengesParagraphs.forEach(para => {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: para }],
      });
    });
  }
  
  // Add Future Goals section
  if (legacy.goals) {
    content.push({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Future Goals' }],
    });
    
    const goalsParagraphs = legacy.goals.split('\n').filter(p => p.trim());
    goalsParagraphs.forEach(para => {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: para }],
      });
    });
  }
  
  return {
    type: 'doc',
    content,
  };
}

/**
 * Get report content (prefer rich content, fallback to legacy)
 */
export function getReportContent(report: WeeklyReport): JSONContent {
  // Prefer rich_content if available
  if (report.richContent) {
    return report.richContent;
  }
  
  // Fallback: Convert legacy plain text to TipTap format
  return convertLegacyToRichContent({
    summary: report.summary,
    challenges: report.challenges,
    goals: report.goals,
  });
}

/**
 * Validate content size
 */
export function validateContentSize(content: JSONContent | null): { valid: boolean; error?: string; size?: number } {
  if (!content) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  const serialized = JSON.stringify(content);
  const sizeInBytes = new Blob([serialized]).size;
  const maxSize = 1024 * 1024; // 1MB limit for JSONB
  
  if (sizeInBytes > maxSize) {
    return {
      valid: false,
      error: `Content exceeds maximum size (${Math.round(sizeInBytes / 1024)}KB / ${maxSize / 1024}KB)`,
      size: sizeInBytes,
    };
  }
  
  return { valid: true, size: sizeInBytes };
}
