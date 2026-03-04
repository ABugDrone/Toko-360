'use client';

import { useState } from 'react';
import { format, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  value: { start: Date; end: Date } | null;
  onChange: (range: { start: Date; end: Date }) => void;
  disabled?: boolean;
  error?: string;
}

export function DateRangePicker({ value, onChange, disabled, error }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    // Calculate week range (Monday to Sunday)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday

    // Validate that the range is exactly 7 days
    const daysDiff = differenceInDays(weekEnd, weekStart);
    if (daysDiff !== 6) {
      // This should never happen with startOfWeek/endOfWeek, but validate anyway
      console.error('Invalid date range: not exactly 7 days');
      return;
    }

    onChange({ start: weekStart, end: weekEnd });
    setIsOpen(false);
  };

  const formatDateRange = (range: { start: Date; end: Date } | null) => {
    if (!range) return 'Select week';

    const startStr = format(range.start, 'MMM dd');
    const endStr = format(range.end, 'MMM dd, yyyy');

    return `${startStr} - ${endStr}`.toUpperCase();
  };

  return (
    <div className="w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-start text-left font-normal transition-all duration-300"
            style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: error ? '#ef4444' : 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
            {formatDateRange(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 transition-all duration-300"
          style={{
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <Calendar
            mode="single"
            selected={value?.start}
            onSelect={handleSelect}
            className="transition-all duration-300"
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  );
}
