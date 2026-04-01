'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { shareReportViaMessaging } from '@/lib/api/reports';
import type { ApprovedReportWithAuthor, User } from '@/lib/types';

interface ShareReportDialogProps {
  report: ApprovedReportWithAuthor;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  availableUsers: User[];
}

export function ShareReportDialog({
  report,
  isOpen,
  onClose,
  currentUserId,
  availableUsers,
}: ShareReportDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a recipient',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await shareReportViaMessaging(
        currentUserId,
        selectedUserId,
        report.id,
        report.week,
        customMessage || undefined
      );

      toast({
        title: 'Success',
        description: 'Report shared successfully',
      });

      // Reset form
      setSelectedUserId('');
      setCustomMessage('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to share report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Report
            </label>
            <div className="p-2 rounded text-sm bg-muted">
              {report.week}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Share with
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers
                  .filter((user) => user.staffId !== currentUserId)
                  .map((user) => (
                    <SelectItem key={user.staffId} value={user.staffId}>
                      {user.name} ({user.department})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Message (optional)
            </label>
            <Textarea
              placeholder="Add a message with your report..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            A link to the report will be included in the message.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isLoading || !selectedUserId}>
            {isLoading ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
