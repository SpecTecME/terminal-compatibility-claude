/**
 * Vessel Type Selector Component (Two-Level Cascading Dropdown)
 * 
 * PURPOSE:
 * Provides hierarchical vessel type selection UI with primary type → sub-type flow.
 * Simplifies vessel classification by breaking it into two focused steps.
 * 
 * DOMAIN CONTEXT - VESSEL CLASSIFICATION:
 * 
 * Maritime industry uses two-level classification:
 * 
 * LEVEL 1 - PRIMARY TYPE (Functional Category):
 * - LNG Carrier
 * - Oil Tanker (Crude)
 * - Oil Tanker (Product)
 * - Container Ship
 * - Bulk Carrier
 * - Chemical Tanker
 * - LPG Carrier
 * - FSRU/FSU
 * 
 * LEVEL 2 - SUB-TYPE (Size/Design Class):
 * For "LNG Carrier":
 * - Q-Max (266,000-270,000 m³)
 * - Q-Flex (210,000-217,000 m³)
 * - Conventional Large (145,000-180,000 m³)
 * - Conventional Standard (125,000-145,000 m³)
 * - Small Scale (<50,000 m³)
 * 
 * For "Oil Tanker (Crude)":
 * - VLCC (Very Large Crude Carrier)
 * - Suezmax
 * - Aframax
 * - Panamax
 * 
 * TWO-STEP UX RATIONALE:
 * 
 * ALTERNATIVE: Single dropdown with all vessel types.
 * PROBLEM: 100+ vessel type combinations → overwhelming dropdown.
 * 
 * TWO-STEP SOLUTION:
 * 1. User selects primary type (8-10 options)
 * 2. Sub-type dropdown appears with relevant options only (5-15 options)
 * 
 * BENEFITS:
 * - Cognitive load reduced
 * - Faster selection (fewer options per step)
 * - Guides user through logical classification hierarchy
 * 
 * CASCADING BEHAVIOR (lines 29-35):
 * 
 * When primary type changes:
 * 1. handlePrimaryTypeChange triggered
 * 2. Finds first VesselTypeRef with matching primaryType
 * 3. Calls onTypeChange with that ref's ID
 * 4. availableSubtypes recomputed (lines 21-27)
 * 5. Sub-type dropdown refreshes with new options
 * 
 * AUTO-SELECT FIRST SUB-TYPE:
 * When primary type selected, automatically selects first sub-type.
 * User can change if needed, but provides sensible default.
 * Prevents "primary selected but no sub-type" invalid state.
 * 
 * DATA STRUCTURE:
 * 
 * VesselTypeRef entity stores all combinations:
 * - Record 1: primaryType="LNG Carrier", subType="Q-Max"
 * - Record 2: primaryType="LNG Carrier", subType="Q-Flex"
 * - Record 3: primaryType="Oil Tanker (Crude)", subType="VLCC"
 * etc.
 * 
 * Component derives:
 * - Unique primary types (lines 11-14)
 * - Sub-types for selected primary (lines 21-27)
 * 
 * USEMEMO OPTIMIZATION (lines 11, 21):
 * 
 * Expensive operations cached:
 * - Primary type extraction (Set operations)
 * - Sub-type filtering and sorting
 * 
 * Only recompute when vesselTypeRefs or selectedPrimaryType changes.
 * Prevents unnecessary recalculations on every render.
 * 
 * SEARCHABLE SELECTS:
 * Both dropdowns use SearchableSelect (not basic Select).
 * Handles large option lists better (type to filter).
 * Consistent with other company/country selectors in the app.
 */
import React, { useMemo } from 'react';
import SearchableSelect from '../ui/SearchableSelect';
import { Label } from '../ui/label';

export default function VesselTypeSelector({ 
  vesselTypeRefs = [], 
  selectedTypeId, 
  onTypeChange 
}) {
  // Get unique primary types
  const primaryTypes = useMemo(() => {
    const types = new Set(vesselTypeRefs.map(v => v.primaryType));
    return Array.from(types).sort();
  }, [vesselTypeRefs]);

  // Get currently selected primary type
  const selectedVesselTypeRef = vesselTypeRefs.find(v => v.id === selectedTypeId);
  const selectedPrimaryType = selectedVesselTypeRef?.primaryType || '';

  // Get subtypes for the selected primary type
  const availableSubtypes = useMemo(() => {
    if (!selectedPrimaryType) return [];
    return vesselTypeRefs
      .filter(v => v.primaryType === selectedPrimaryType)
      .map(v => ({ value: v.id, label: v.subType }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedPrimaryType, vesselTypeRefs]);

  const handlePrimaryTypeChange = (newPrimaryType) => {
    // Find the first vessel type with this primary type
    const firstMatch = vesselTypeRefs.find(v => v.primaryType === newPrimaryType);
    if (firstMatch) {
      onTypeChange(firstMatch.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-700">Primary Type *</Label>
        <SearchableSelect
          value={selectedPrimaryType}
          onValueChange={handlePrimaryTypeChange}
          options={primaryTypes.map(pt => ({ value: pt, label: pt }))}
          placeholder="Select primary type"
          searchPlaceholder="Search primary types..."
        />
      </div>

      {selectedPrimaryType && (
        <div className="space-y-2">
          <Label className="text-gray-700">Sub-type / Size Class *</Label>
          <SearchableSelect
            value={selectedTypeId}
            onValueChange={onTypeChange}
            options={availableSubtypes}
            placeholder="Select sub-type"
            searchPlaceholder="Search sub-types..."
          />
        </div>
      )}
    </div>
  );
}