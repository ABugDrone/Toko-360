'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, Edit, Share2 } from 'lucide-react';
import type { ApprovedReportWithAuthor } from '@/lib/types';

interface ReportCardProps {
  report: ApprovedReportWithAuthor;
  userRole: 'admin' | 'staff';
  userId: string;
  onPreview: (report: ApprovedReportWithAuthor) => void;
  onDownload: (report: ApprovedReportWithAuthor) => void;
  onEdit: (report: ApprovedReportWithAuthor) => void;
  onShare: (report: ApprovedReportWithAuthor) => void;
}

export function ReportCard({
  report,
  userRole,
  userId,
  onPreview,
  onDownload,
  onEdit,
  onShare,
}: ReportCardProps) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{report.week}</CardTitle>
        <CardDescription>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Department:</span> {report.department}
            </div>
            <div>
              <span className="font-medium">Author:</span> {report.authorName}
            </div>
            <div>
              <span className="font-medium">Approved:</span> {formatDate(report.reviewedAt)}
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(report)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(report)}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(report)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShare(report)}
            className="flex items-center gap-1"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
