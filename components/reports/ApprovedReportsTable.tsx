'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, MoreVertical, Edit, Share2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApprovedReports, checkEditPermission } from '@/lib/api/reports';
import { ReportPreview } from './ReportPreview';
import { ShareReportDialog } from './ShareReportDialog';
import type { ApprovedReportWithAuthor, User, Department } from '@/lib/types';

interface ApprovedReportsTableProps {
  userRole: 'admin' | 'staff';
  userId: string;
  availableDepartments: Department[];
  availableUsers: User[];
}

export function ApprovedReportsTable({
  userRole,
  userId,
  availableDepartments,
  availableUsers,
}: ApprovedReportsTableProps) {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by report title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              {userRole === 'admin' && <TableHead>User</TableHead>}
              {userRole === 'admin' && <TableHead>Department</TableHead>}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={userRole === 'admin' ? 5 : 3}
                  className="text-center py-8 text-muted-foreground"
                >
                  No approved reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handlePreview(report)}
                >
                  <TableCell className="text-sm">{formatDate(report.reviewedAt)}</TableCell>
                  <TableCell className="font-medium">{report.week}</TableCell>
                  {userRole === 'admin' && (
                    <TableCell className="text-sm">{report.authorName}</TableCell>
                  )}
                  {userRole === 'admin' && (
                    <TableCell className="text-sm">{report.department}</TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(report)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {userRole === 'admin' && (
                          <DropdownMenuItem onClick={() => handleEdit(report)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {userRole === 'admin' && (
                          <DropdownMenuItem onClick={() => handleShare(report)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send to Contact
                          </DropdownMenuItem>
                        )}
                        {userRole === 'staff' && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(report)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit (with approval)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(report)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
