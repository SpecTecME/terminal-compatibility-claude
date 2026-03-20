/**
 * Vessel User-Defined Fields (UDF) System - Utilities & Components
 * 
 * PURPOSE:
 * Comprehensive toolkit for managing configurable custom fields per tenant.
 * Enables multi-tenant customization without schema changes.
 * 
 * ARCHITECTURE - THREE-ENTITY SYSTEM:
 * 
 * 1. UdfConfiguration (lines 11-20):
 *    - Defines available UDF slots (UDF01, UDF02, etc.)
 *    - Per tenant configuration
 *    - Controls: label, visibility, list behavior, validation rules
 *    - Example: tenant configures UDF01 as "Fleet Group" with dropdown
 * 
 * 2. UdfListValue (lines 25-44):
 *    - Provides dropdown options when createList=true
 *    - Multiple values per UDF slot
 *    - Sorted by sortOrder then value
 *    - Example: Fleet Group values = ["Atlantic Fleet", "Pacific Fleet", "Reserve"]
 * 
 * 3. Vessel.udf01 / Vessel.udf02:
 *    - Actual stored values on vessel records
 *    - Text fields, max length defined in UdfConfiguration
 *    - Either free-text OR selected from UdfListValue
 * 
 * WHY UDF SYSTEM EXISTS:
 * 
 * PROBLEM:
 * Different maritime operators need different custom fields:
 * - Shipping company: "Charter Status", "Trade Route"
 * - Energy company: "Project Code", "Asset Group"
 * - Ship manager: "Management Contract #", "Performance Rating"
 * 
 * REJECTED ALTERNATIVES:
 * - Hard-coding all possible fields → too many unused fields
 * - JSON blob → no validation, poor querying, no UI generation
 * - Tenant-specific schemas → deployment nightmare
 * 
 * UDF APPROACH:
 * - Preconfigured slots (udf01, udf02) in schema
 * - Per-tenant configuration controls behavior
 * - Dynamic UI generation based on configuration
 * - Balance of flexibility and structure
 * 
 * VISIBILITY LOGIC (lines 49-58):
 * 
 * getVisibleUdfConfigs:
 * - Filters configs where label is non-empty
 * - Empty label = field not in use for this tenant
 * - UI components check visibility before rendering
 * 
 * getListViewUdfConfigs:
 * - Additional filter: includeInSearch=true
 * - Controls which UDFs appear in fleet list filters
 * - Some UDFs too specialized for list filtering
 * 
 * COMPONENT TYPES:
 * 
 * 1. VesselUdfFormFields (lines 63-83):
 *    - For create/edit forms
 *    - Renders input OR dropdown based on createList setting
 *    - Handles onChange callbacks to parent form
 * 
 * 2. UdfFormField (lines 88-127):
 *    - Single field renderer (dropdown or text input)
 *    - Loads UdfListValue if dropdown needed
 *    - Respects maxLength from configuration
 * 
 * 3. VesselUdfViewFields (lines 132-153):
 *    - Read-only display for detail pages
 *    - Simple label: value pairs
 * 
 * 4. VesselUdfFilters (lines 158-178):
 *    - Dropdown filters for list pages
 *    - Only shows UDFs configured for list view
 *    - Only shows dropdowns (free-text doesn't filter well)
 * 
 * DROPDOWN VS TEXT BEHAVIOR:
 * 
 * createList=true:
 * - Renders Select dropdown
 * - Options from UdfListValue entity
 * - Enforces data consistency (can only pick defined values)
 * - Good for: Status fields, categories, classifications
 * 
 * createList=false:
 * - Renders Input text field
 * - Free-text entry
 * - Validates maxLength only
 * - Good for: Reference numbers, notes, codes
 * 
 * REAL-WORLD EXAMPLES:
 * 
 * Nakilat (Qatar shipping company):
 * - UDF01 = "Project" (dropdown: Qatargas 1, 2, 3, 4, RasGas, etc.)
 * - UDF02 = "Internal Code" (text: NK-001, NK-002, etc.)
 * 
 * Teekay (ship manager):
 * - UDF01 = "Management Type" (dropdown: Bareboat, Time Charter, Full Service)
 * - UDF02 = "Contract Reference" (text: free-form)
 * 
 * STALE TIME CACHING (line 18, 42):
 * 5 minutes cache for UDF configurations and list values.
 * These change rarely (admin configuration activity).
 * Reduces database load, improves form rendering performance.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Hook to fetch UDF configurations for a module
 */
export function useUdfConfigurations(module = 'Vessel') {
  return useQuery({
    queryKey: ['udfConfigurations', module],
    queryFn: async () => {
      const configs = await base44.entities.UdfConfiguration.filter({ module });
      return configs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    },
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Hook to fetch UDF list values for a specific UDF
 */
export function useUdfListValues(module, udfCode, enabled = true) {
  return useQuery({
    queryKey: ['udfListValues', module, udfCode],
    queryFn: async () => {
      const values = await base44.entities.UdfListValue.filter({
        module,
        udfCode,
        isActive: true
      });
      return values.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        }
        return (a.value || '').localeCompare(b.value || '');
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Get visible UDF configs (those with a label set)
 */
export function getVisibleUdfConfigs(configs = []) {
  return configs.filter(c => c.label && c.label.trim() !== '');
}

/**
 * Get UDF configs that should appear in list views (label set + includeInSearch)
 */
export function getListViewUdfConfigs(configs = []) {
  return configs.filter(c => c.label && c.label.trim() !== '' && c.includeInSearch);
}

/**
 * Component for rendering UDF fields in forms (create/edit)
 */
export function VesselUdfFormFields({ vessel, onChange, mode = 'edit' }) {
  const { data: configs = [] } = useUdfConfigurations('Vessel');
  const visibleConfigs = getVisibleUdfConfigs(configs);

  if (visibleConfigs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleConfigs.map((config) => (
        <UdfFormField
          key={config.udfCode}
          config={config}
          value={vessel?.[config.udfCode.toLowerCase()] || ''}
          onChange={(value) => onChange(config.udfCode.toLowerCase(), value)}
        />
      ))}
    </div>
  );
}

/**
 * Single UDF form field
 */
function UdfFormField({ config, value, onChange }) {
  const { data: listValues = [] } = useUdfListValues(
    config.module,
    config.udfCode,
    config.createList
  );

  if (config.createList) {
    return (
      <div>
        <Label>{config.label}</Label>
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${config.label}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>-- None --</SelectItem>
            {listValues.map((v) => (
              <SelectItem key={v.id} value={v.value}>
                {v.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label>{config.label}</Label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={config.maxLength}
        placeholder={`Enter ${config.label} (max ${config.maxLength} chars)`}
      />
    </div>
  );
}

/**
 * Component for displaying UDF fields in view mode (detail pages)
 */
export function VesselUdfViewFields({ vessel }) {
  const { data: configs = [] } = useUdfConfigurations('Vessel');
  const visibleConfigs = getVisibleUdfConfigs(configs);

  if (visibleConfigs.length === 0) {
    return null;
  }

  return (
    <>
      {visibleConfigs.map((config) => {
        const value = vessel?.[config.udfCode.toLowerCase()];
        return (
          <div key={config.udfCode}>
            <p className="text-sm text-gray-500">{config.label}</p>
            <p className="text-gray-900">{value || '-'}</p>
          </div>
        );
      })}
    </>
  );
}

/**
 * Component for UDF filters in list views
 */
export function VesselUdfFilters({ filters, onFilterChange }) {
  const { data: configs = [] } = useUdfConfigurations('Vessel');
  const listViewConfigs = getListViewUdfConfigs(configs).filter(c => c.createList);

  if (listViewConfigs.length === 0) {
    return null;
  }

  return (
    <>
      {listViewConfigs.map((config) => (
        <UdfFilterDropdown
          key={config.udfCode}
          config={config}
          value={filters?.[config.udfCode.toLowerCase()] || ''}
          onChange={(value) => onFilterChange(config.udfCode.toLowerCase(), value)}
        />
      ))}
    </>
  );
}

/**
 * Single UDF filter dropdown
 */
function UdfFilterDropdown({ config, value, onChange }) {
  const { data: listValues = [] } = useUdfListValues(config.module, config.udfCode, true);

  return (
    <Select value={value || 'all'} onValueChange={(v) => onChange(v === 'all' ? '' : v)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={config.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {config.label}</SelectItem>
        {listValues.map((v) => (
          <SelectItem key={v.id} value={v.value}>
            {v.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default VesselUdfFormFields;