/**
 * DatePicker Component (Enhanced Calendar Input)
 * 
 * PURPOSE:
 * Combines calendar widget with year/month dropdowns for efficient date selection.
 * Used for document expiry dates, vessel build years, verification dates, etc.
 * 
 * ARCHITECTURE - THREE SELECTION METHODS:
 * 
 * 1. MONTH DROPDOWN (lines 63-74):
 *    - Quick navigation to any month
 *    - 12 options (January - December)
 *    - Uses date-fns format() for month names
 *    - Changes calendar view instantly
 * 
 * 2. YEAR DROPDOWN (lines 75-86):
 *    - 50-year range (25 years before/after current year)
 *    - Example: In 2026, shows 2001-2051
 *    - Scrollable list for compact display
 *    - max-h-60 prevents excessive dropdown height
 * 
 * 3. CALENDAR GRID (lines 88-95):
 *    - Visual date picker for day selection
 *    - Shows current month/year (controlled by state)
 *    - Click any date to select
 *    - initialFocus for keyboard navigation
 * 
 * WHY THREE METHODS:
 * - Dropdowns fast for distant dates (e.g., vessel built 1995)
 * - Calendar intuitive for near dates (e.g., next week's expiry)
 * - Flexibility accommodates different date entry patterns
 * 
 * STATE MANAGEMENT (lines 21-22):
 * 
 * month: Controls which month/year calendar displays.
 * - Independent from selected date
 * - Allows browsing different months before selecting
 * - Syncs when date selected
 * 
 * INITIALIZATION:
 * If value provided → month = value's month
 * If no value → month = current month
 * 
 * DATE FORMAT (lines 40-44):
 * 
 * OUTPUT: 'yyyy-MM-dd' (ISO 8601 date-only format)
 * - Example: "2026-01-12"
 * - Database-friendly (sortable as string)
 * - Unambiguous (no locale issues)
 * 
 * DISPLAY: 'PPP' format via date-fns (line 58)
 * - Example: "January 12, 2026"
 * - Human-readable
 * - Locale-aware formatting
 * 
 * BUTTON TRIGGER (lines 48-60):
 * 
 * Shows selected date or placeholder:
 * - If value exists → format as readable date
 * - If empty → show placeholder text
 * 
 * MUTED TEXT:
 * !value && "text-muted-foreground"
 * Placeholder styled lighter to indicate empty state.
 * 
 * CALENDAR ICON:
 * Always shown (consistent with date input UX pattern).
 * 
 * POPOVER POSITIONING (line 61):
 * align="start" → opens aligned to left edge of trigger.
 * Prevents calendar extending off right side of screen.
 * 
 * YEAR RANGE CALCULATION (line 26):
 * Array.from({ length: 50 }, (_, i) => currentYear - 25 + i)
 * 
 * Generates: [currentYear-25, currentYear-24, ..., currentYear+24]
 * Covers historical dates (vessel construction) and future dates (planned events).
 * 
 * MONTH HEADER CONTROLS (lines 62-86):
 * Separate from calendar body.
 * Horizontal layout with border separator.
 * Quick navigation without scrolling through calendar months.
 * 
 * INTEGRATION WITH FORMS:
 * Controlled component pattern:
 * - value prop (date string)
 * - onChange callback (receives date string)
 * 
 * Parent manages state, DatePicker manages UI.
 */
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DatePicker({ value, onChange, placeholder = "Pick a date", className }) {
  const [month, setMonth] = useState(value ? new Date(value) : new Date());
  
  const selectedDate = value ? new Date(value) : undefined;
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

  const handleYearChange = (year) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(year));
    setMonth(newDate);
  };

  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(month);
    newDate.setMonth(parseInt(monthIndex));
    setMonth(newDate);
  };

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white border-gray-300",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(new Date(value), 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <Select value={month.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-32 h-8 bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {format(new Date(2000, i, 1), 'MMMM')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-24 h-8 bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 max-h-60">
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}