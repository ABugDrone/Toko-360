'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, MoreVertical, Edit, Share2, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApprovedReports, checkEditPermission } from '@/lib/api/reports';
import { ReportPreview } from './ReportPreview';
import { ShareReportDialog } from './ShareReportDialog';
import type { ApprovedReportWithAuthor, User, Department } from '@/lib/types';

interface ApprovedReportsCardsProps {
  userRole: 'admin' | 'staff';
  userId: string;
  availableDepartments: Department[];
  availableUsers: User[];
}

export function ApprovedReportsCards({
  userRole,
  userId,
  availableDepartments,
  availableUsers,
}: ApprovedReportsCardsProps) {
  const { toast } = useToast();

  const [reports, setReports] = useState<ApprovedReportWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewReport, setPreviewReport] = useState<ApprovedReportWithAuthor | null>(null);
  const [shareReport, setShareReport] = useState<ApprovedReportWithAuthor | null>(null);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getApprovedReports(userRole, userId, {
        name: searchTerm || undefined,
        pageSize: 100,
      });
      // Sort by reviewed_at descending (most recent first)
      const sorted = result.reports.sort((a, b) => {
        const aTime = a.reviewedAt || 0;
        const bTime = b.reviewedAt || 0;
        return bTime - aTime;
      });
      setReports(sorted);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userRole, userId, searchTerm, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  const handlePreview = useCallback((report: ApprovedReportWithAuthor) => {
    setPreviewReport(report);
  }, []);

  const handleEdit = useCallback(
    async (report: ApprovedReportWithAuthor) => {
      try {
        const permission = await checkEditPermission(userId, report.id, userRole);
        if (permission.canEdit) {
          // Emit event to parent component to trigger edit mode
          window.dispatchEvent(new CustomEvent('editApprovedReport', { detail: report }));
        } else {
          toast({
            title: 'Permission Denied',
            description: permission.reason || 'You do not have permission to edit this report',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to check edit permission',
          variant: 'destructive',
        });
      }
    },
    [userId, userRole, toast]
  );

  const handleShare = useCallback((report: ApprovedReportWithAuthor) => {
    setShareReport(report);
  }, []);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Only show section if there are reports or loading */}
      {(isLoading || reports.length > 0) && (
        <>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Approved Reports</h2>
            <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
              View and manage approved reports from your organization.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-xl p-12 text-center backdrop-blur transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--theme-accent)' }} />
              <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Loading approved reports...</p>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="flex gap-4">
                <Input
                  placeholder="Search by report title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 transition-colors duration-300"
                  style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                />
              </div>

              {/* Reports Cards */}
              {reports.length === 0 ? (
                <div className="rounded-xl p-12 text-center backdrop-blur transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}>
                  <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--theme-text)', opacity: 0.3 }} />
                  <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>No approved reports found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-xl p-6 backdrop-blur transition-colors duration-300"
                      style={{ backgroundColor: 'var(--theme-surface)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1 cursor-pointer hover:opacity-80" onClick={() => handlePreview(report)}>
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                                {report.week}
                              </h3>
                              <span className="px-2 py-1 rounded text-xs font-bold border border-green-500/50 text-green-400 bg-green-500/10">
                                APPROVED
                              </span>
                            </div>
                            {userRole === 'admin' && (
                              <p className="text-sm mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                                By {report.authorName} • {report.department}
                              </p>
                            )}
                            <p className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                              Approved: {formatDate(report.reviewedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(report)}
                            className="h-8 px-3"
                            title="View report"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {userRole === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(report)}
                              className="h-8 px-3"
                              title="Edit report"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {userRole === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(report)}
                              className="h-8 px-3"
                              title="Send to contact"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          {userRole === 'staff' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(report)}
                                className="h-8 px-3"
                                title="Edit with approval"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShare(report)}
                                className="h-8 px-3"
                                title="Share report"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(report);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              {userRole === 'admin' && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(report);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {userRole === 'admin' && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(report);
                                }}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send to Contact
                                </DropdownMenuItem>
                              )}
                              {userRole === 'staff' && (
                                <>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(report);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit (with approval)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(report);
                                  }}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <ReportPreview
          report={previewReport}
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}

      {/* Share Dialog */}
      {shareReport && (
        <ShareReportDialog
          report={shareReport}
          isOpen={!!shareReport}
          onClose={() => setShareReport(null)}
          currentUserId={userId}
          availableUsers={availableUsers}
        />
      )}
    </div>
  );
}
