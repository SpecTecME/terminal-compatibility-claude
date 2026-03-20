import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * SearchableSelect Component
 * 
 * PURPOSE:
 * Reusable dropdown with search/filter functionality for large option lists.
 * Built on shadcn/ui Command + Popover primitives.
 * 
 * REF FORWARDING FOR MANUAL VALIDATION:
 * 
 * WHY REF FORWARDING:
 * Parent forms (e.g., AddTerminal) perform manual validation and need to programmatically
 * focus invalid fields. Since this is a composite component (Button + Popover, not a simple input),
 * we must expose focus() via useImperativeHandle.
 * 
 * Without this, parent's ref.current would be the React component instance (not focusable).
 * With this, parent can call refProducts.current.focus() and it works like a native input.
 * 
 * EXPOSED METHODS:
 * - focus(): Focuses the trigger button AND opens the dropdown (better UX than focus alone)
 * - scrollIntoView(options): Scrolls the component into viewport before focusing
 * 
 * VALIDATION FLOW:
 * 1. Parent validates required fields in order
 * 2. First invalid field: parent calls ref.current.scrollIntoView()
 * 3. Then parent calls ref.current.focus()
 * 4. This component focuses the button and opens dropdown
 * 5. User sees validation toast and can immediately select an option
 */
const SearchableSelect = forwardRef(function SearchableSelect({ 
  value, 
  onValueChange = () => {}, 
  options = [], 
  placeholder = "Select...",
  emptyText = "No results found.",
  searchPlaceholder = "Search...",
  disabled = false,
  className = ""
}, ref) {
  const [open, setOpen] = useState(false);
  
  // Ref to the actual focusable DOM element (the trigger button)
  // CRITICAL: Must be attached to real button, not wrapper div
  const buttonRef = useRef(null);

  /**
   * Expose imperative methods to parent component via ref
   * 
   * focus():
   * - Focuses the trigger button (makes it keyboard-accessible)
   * - Opens the dropdown (setOpen(true)) for immediate interaction
   * - Called by parent form validation when this field is invalid
   * 
   * scrollIntoView(options):
   * - Scrolls the button into visible viewport
   * - Accepts standard ScrollIntoViewOptions (e.g., { behavior: 'smooth', block: 'center' })
   * - Called before focus() to ensure field is visible before focusing
   * 
   * Without these methods, parent forms cannot programmatically interact with this component.
   */
  useImperativeHandle(ref, () => ({
    focus: () => {
      buttonRef.current?.focus();
      setOpen(true);  // Auto-open dropdown for better UX
    },
    scrollIntoView: (options) => {
      buttonRef.current?.scrollIntoView(options);
    }
  }));

  // Sort options alphabetically by label
  const sortedOptions = [...options].sort((a, b) => 
    (a.label || '').localeCompare(b.label || '')
  );

  const selectedOption = sortedOptions.find(opt => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* 
          CRITICAL: buttonRef attached here - this is the actual focusable DOM element
          
          When parent calls ref.current.focus():
          1. buttonRef.current.focus() → Browser focuses this button
          2. setOpen(true) → Dropdown opens automatically
          3. User sees search input and can start typing immediately
          
          Without buttonRef on this Button, focus() would fail silently.
        */}
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-white border-gray-300 text-gray-900",
            !value && "text-gray-500",
            className
          )}
        >
          {selectedOption?.label || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {sortedOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onValueChange(option.value === value ? "" : option.value);
                  setOpen(false);
                }}
              >
                {option.label}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export default SearchableSelect;