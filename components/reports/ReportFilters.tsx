'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { DateRangePicker } from './date-range-picker';
import type { ReportFilterParams, Department } from '@/lib/types';

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilterParams) => void;
  availableDepartments: Department[];
  userRole: 'admin' | 'staff';
}

export function ReportFilters({
  onFilterChange,
  availableDepartments,
  userRole,
}: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilterParams>({});
  const [nameSearch, setNameSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [nameTimeout, setNameTimeout] = useState<NodeJS.Timeout | null>(null);
  const [authorTimeout, setAuthorTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced name search
  const handleNameChange = useCallback((value: string) => {
    setNameSearch(value);
    if (nameTimeout) clearTimeout(nameTimeout);
    
    const timeout = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        name: value || undefined,
      }));
    }, 300);
    setNameTimeout(timeout);
  }, [nameTimeout]);

  // Debounced author search
  const handleAuthorChange = useCallback((value: string) => {
    setAuthorSearch(value);
    if (authorTimeout) clearTimeout(authorTimeout);
    
    const timeout = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        authorName: value || undefined,
      }));
    }, 300);
    setAuthorTimeout(timeout);
  }, [authorTimeout]);

  // Handle date range change
  const handleDateRangeChange = useCallback((startDate: string | undefined, endDate: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));
  }, []);

  // Handle week/year change
  const handleWeekChange = useCallback((week: number | undefined, year: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      week,
      year,
    }));
  }, []);

  // Handle department change
  const handleDepartmentChange = useCallback((department: string) => {
    setFilters((prev) => ({
      ...prev,
      department: (department as Department) || undefined,
    }));
  }, []);

  // Emit filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setNameSearch('');
    setAuthorSearch('');
  }, []);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeFilterCount} active</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <DateRangePicker
            onDateRangeChange={handleDateRangeChange}
            startDate={filters.startDate}
            endDate={filters.endDate}
          />
        </div>

        {/* Week Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Week</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Week (1-53)"
              min="1"
              max="53"
              value={filters.week || ''}
              onChange={(e) => {
                const week = e.target.value ? parseInt(e.target.value) : undefined;
                handleWeekChange(week, filters.year);
              }}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Year"
              value={filters.year || ''}
              onChange={(e) => {
                const year = e.target.value ? parseInt(e.target.value) : undefined;
                handleWeekChange(filters.week, year);
              }}
              className="flex-1"
            />
          </div>
        </div>

        {/* Name Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Report Name</label>
          <Input
            placeholder="Search by name..."
            value={nameSearch}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Department</label>
          <Select
            value={filters.department || ''}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
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
          <label className="text-sm font-medium mb-2 block">Author</label>
          <Input
            placeholder="Search by author name..."
            value={authorSearch}
            onChange={(e) => handleAuthorChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
