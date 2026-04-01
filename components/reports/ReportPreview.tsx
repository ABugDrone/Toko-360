'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Badge } from '@/components/ui/badge';
import type { ApprovedReportWithAuthor } from '@/lib/types';

interface ReportPreviewProps {
  report: ApprovedReportWithAuthor;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportPreview({ report, isOpen, onClose }: ReportPreviewProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: report.richContent || undefined,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report.week}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Author:</span> {report.authorName}
            </div>
            <div>
              <span className="font-medium">Department:</span> {report.department}
            </div>
            <div>
              <span className="font-medium">Submitted:</span> {formatDate(report.submittedAt)}
            </div>
            <div>
              <span className="font-medium">Approved:</span> {formatDate(report.reviewedAt)}
            </div>
            {report.approvedByName && (
              <div>
                <span className="font-medium">Approved By:</span> {report.approvedByName}
              </div>
            )}
            <div>
              <span className="font-medium">Format:</span>{' '}
              <Badge variant="outline">{report.formatType}</Badge>
            </div>
          </div>

          {/* Rich Content */}
          {report.richContent && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Report Content</h3>
              <EditorContent editor={editor} />
            </div>
          )}

          {/* Legacy Text Fields */}
          {!report.richContent && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm whitespace-pre-wrap">{report.summary}</p>
              </div>
            </>
          )}

          {/* Media Links */}
          {report.mediaLinks && report.mediaLinks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Media Links</h3>
              <ul className="list-disc list-inside space-y-1">
                {report.mediaLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={typeof link === 'string' ? link : link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {typeof link === 'string' ? link : link.title || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback */}
          {report.feedback && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Feedback</h3>
              <p className="text-sm whitespace-pre-wrap">{report.feedback}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
