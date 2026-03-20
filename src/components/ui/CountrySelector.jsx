/**
 * Country Selector Component (Reusable Dropdown)
 * 
 * PURPOSE:
 * Standardized country selection dropdown used across forms.
 * Handles temporal validity filtering and consistent country display.
 * 
 * PROPS API:
 * - value: Selected country ISO2 code
 * - onChange(iso2, nameEn): Callback with both code and name
 * - label: Display label (default "Country")
 * - required: Shows asterisk (*) in label for visual indication
 * - showInactive: Include historical/inactive countries in list
 * 
 * TEMPORAL VALIDITY FILTERING (lines 19-34):
 * 
 * By default (showInactive=false):
 * Only shows currently active countries.
 * 
 * isCountryActive logic:
 * - Checks validFrom/validTo against today
 * - Historical countries excluded (e.g., USSR, Yugoslavia)
 * - Future countries excluded (not yet valid)
 * 
 * WHY FILTER:
 * Users typically don't want to select historical countries.
 * Reduces dropdown clutter (200+ active vs 300+ total).
 * 
 * showInactive PROP:
 * Optional override for special cases:
 * - Editing historical records (vessel built in USSR)
 * - Administrative tools (managing all country data)
 * - Migration scripts
 * 
 * ONCHANGE CALLBACK PATTERN (lines 46-48):
 * 
 * Returns TWO values: onChange(iso2, nameEn)
 * 
 * RATIONALE:
 * Parent forms often need both:
 * - iso2 → Store in database (foreign key)
 * - nameEn → Display in UI without additional lookup
 * 
 * Prevents parent from needing to query countries again.
 * Single callback, complete data.
 * 
 * ALPHABETICAL SORTING (line 36):
 * Countries sorted by English name.
 * Easier browsing than ISO code order.
 * 
 * ISO2 AS VALUE:
 * Uses ISO2 code as Select value (not internal ID).
 * 
 * BENEFITS:
 * - Human-readable in URL params (?country=US)
 * - Portable across database migrations
 * - Consistent with international standards
 * 
 * REF FORWARDING FOR MANUAL VALIDATION:
 * 
 * WHY EXPOSE FOCUS():
 * Parent forms use manual validation (not HTML5 native validation).
 * When validation fails, parent needs to programmatically focus the invalid field.
 * 
 * Since this wraps Radix Select (composite component), we expose focus() via useImperativeHandle.
 * triggerRef points to the actual SelectTrigger button (focusable DOM element).
 * 
 * VALIDATION FLOW:
 * 1. Parent validates country field (e.g., checks if countryId is empty)
 * 2. If invalid, parent calls refCountry.current.scrollIntoView() then .focus()
 * 3. This component focuses the SelectTrigger button
 * 4. User sees validation message and can immediately select a country
 * 
 * REUSABILITY:
 * Used in:
 * - AddTerminal (terminal location)
 * - AddCompany (company headquarters)
 * - EditVessel (flag state)
 * - AddContact (contact location)
 * - IssuingAuthority forms
 * 
 * Consistent UX across all country selections.
 */
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CountrySelector = forwardRef(function CountrySelector({ value, onChange, label = "Country", required = false, showInactive = false, className = '' }, ref) {
  // Ref to the actual focusable DOM element (SelectTrigger button)
  const triggerRef = useRef(null);

  /**
   * Expose imperative methods for parent form validation
   * 
   * focus(): Focuses the SelectTrigger button (makes it keyboard-accessible)
   * scrollIntoView(options): Scrolls the field into viewport before focusing
   * 
   * Called by parent when this field fails validation (e.g., required but empty).
   */
  useImperativeHandle(ref, () => ({
    focus: () => {
      triggerRef.current?.focus();
    },
    scrollIntoView: (options) => {
      triggerRef.current?.scrollIntoView(options);
    }
  }));
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const isCountryActive = (country) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = country.validFrom ? new Date(country.validFrom) : null;
    const validTo = country.validTo ? new Date(country.validTo) : null;
    
    if (validFrom && validFrom > today) return false;
    if (validTo && validTo < today) return false;
    
    return true;
  };

  const activeCountries = showInactive 
    ? countries 
    : countries.filter(c => isCountryActive(c));

  const sortedCountries = activeCountries.sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  return (
    <div className="space-y-2">
      <Label className="text-gray-700">
        {label}
        {required && ' *'}
      </Label>
      <Select
        value={value}
        onValueChange={(iso2) => {
          const country = countries.find(c => c.iso2 === iso2);
          onChange(iso2, country?.nameEn || '');
        }}
      >
        {/* 
          CRITICAL: triggerRef attached here - this is the actual focusable DOM element.
          When parent calls ref.current.focus(), this button receives focus.
        */}
        <SelectTrigger ref={triggerRef} className={className || "bg-white border-gray-300 text-gray-900"}>
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          {sortedCountries.map((country) => (
            <SelectItem key={country.id} value={country.iso2} className="text-gray-900">
              {country.nameEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

export default CountrySelector;