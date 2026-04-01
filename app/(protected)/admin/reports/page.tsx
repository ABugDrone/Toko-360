'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, Loader2, Eye, Share2, Filter, X } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import { getAllUsers } from '@/lib/storage';
import { getApprovedReports } from '@/lib/api/reports';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { ShareReportDialog } from '@/components/reports/ShareReportDialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { ApprovedReportWithAuthor, User, Department } from '@/lib/types';

export default function AdminAllReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [reports, setReports] = useState<ApprovedReportWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [previewReport, setPreviewReport] = useState<ApprovedReportWithAuthor | null>(null);
  const [shareReport, setShareReport] = useState<ApprovedReportWithAuthor | null>(null);

  // Available departments
  const availableDepartments: Department[] = [
    'IT',
    'Marketing',
    'Communications',
    'Student Support',
    'Business Intelligence',
    'Finance',
    'Logistics & Procurement',
    'Internship & SIWES',
  ];

  // Fetch available users for sharing
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        if (users && Array.isArray(users)) {
          const filteredUsers = users.filter((u: User) => u.staffId !== user?.staffId);
          setAvailableUsers(filteredUsers);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    if (user?.staffId) {
      fetchUsers();
    }
  }, [user?.staffId]);

  // Fetch reports with filters
  const fetchReports = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      const filters = {
        name: searchTerm || undefined,
        department: (selectedDepartment && selectedDepartment !== 'all') ? (selectedDepartment as Department) : undefined,
        authorName: (selectedAuthor && selectedAuthor !== 'all') ? selectedAuthor : undefined,
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        pageSize: 100,
      };

      console.log('Fetching reports with filters:', filters); // Debug log

      const result = await getApprovedReports('admin', user.staffId, filters);
      
      console.log('Fetched reports result:', result); // Debug log
      
      // Sort by reviewed_at descending (most recent first)
      const sorted = result.reports.sort((a, b) => {
        const aTime = a.reviewedAt || 0;
        const bTime = b.reviewedAt || 0;
        return bTime - aTime;
      });
      
      setReports(sorted);
    } catch (error) {
      console.error('Error fetching reports:', error); // Debug log
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reports on mount and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDepartment, selectedAuthor, startDate, endDate, user]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedAuthor('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopNav title="All Reports" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">All Reports</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all reports from across all departments and users.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search by report title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            {(selectedDepartment && selectedDepartment !== 'all' || selectedAuthor && selectedAuthor !== 'all' || startDate || endDate) && (
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg border bg-card">
              {/* Department Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Department
                </label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All departments
                    </SelectItem>
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Author
                </label>
                <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                  <SelectTrigger>
                    <SelectValue placeholder="All authors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All authors
                    </SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.staffId} value={user.name}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Start Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Select start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  End Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Select end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>



        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl p-12 text-center backdrop-blur border bg-card">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Loading reports...
              </p>
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-xl p-12 text-center backdrop-blur border bg-card">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">
                No Reports Found
              </h3>
              <p className="text-muted-foreground mb-4">
                {(searchTerm || (selectedDepartment && selectedDepartment !== 'all') || (selectedAuthor && selectedAuthor !== 'all') || startDate || endDate) 
                  ? 'No reports match your current filters. Try adjusting your search criteria.'
                  : 'There are no reports in the system yet. Reports will appear here once they are submitted by staff members.'
                }
              </p>
              {(searchTerm || (selectedDepartment && selectedDepartment !== 'all') || (selectedAuthor && selectedAuthor !== 'all') || startDate || endDate) && (
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl p-6 backdrop-blur border bg-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1 cursor-pointer hover:opacity-80" onClick={() => setPreviewReport(report)}>
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">
                            {report.week}
                          </h3>
                          {report.approvalStatus === 'approved' && (
                            <span className="px-2 py-1 rounded text-xs font-bold border border-green-500/50 text-green-400 bg-green-500/10">
                              APPROVED
                            </span>
                          )}
                          {report.approvalStatus === 'pending' && (
                            <span className="px-2 py-1 rounded text-xs font-bold border border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
                              PENDING
                            </span>
                          )}
                          {report.approvalStatus === 'rejected' && (
                            <span className="px-2 py-1 rounded text-xs font-bold border border-red-500/50 text-red-400 bg-red-500/10">
                              REJECTED
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-2 text-muted-foreground">
                          By {report.authorName} • {report.department}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {report.approvalStatus === 'approved' && report.reviewedAt 
                            ? `Approved: ${formatDate(report.reviewedAt)}`
                            : report.submittedAt 
                            ? `Submitted: ${formatDate(report.submittedAt)}`
                            : `Created: ${formatDate(report.createdAt)}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewReport(report)}
                        className="h-8 px-3 bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                        title="View report"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {report.approvalStatus === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShareReport(report)}
                          className="h-8 px-3 bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20"
                          title="Share report"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!isLoading && reports.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Showing {reports.length} report{reports.length !== 1 ? 's' : ''}
              {(searchTerm || (selectedDepartment && selectedDepartment !== 'all') || (selectedAuthor && selectedAuthor !== 'all') || startDate || endDate) && ' (filtered)'}
            </p>
          </div>
        )}
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
          currentUserId={user?.staffId || ''}
          availableUsers={availableUsers}
        />
      )}
    </>
  );
}