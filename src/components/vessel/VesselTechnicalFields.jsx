/**
 * Vessel Technical Fields Components (Display-Only Utilities)
 * 
 * PURPOSE:
 * Reusable card components for displaying vessel technical specifications.
 * Conditionally render only when data exists (hide empty sections).
 * 
 * DESIGN PATTERN - CONDITIONAL RENDERING:
 * 
 * Each component checks if ANY field has data before rendering.
 * If all fields empty/null, component returns null → UI doesn't show empty cards.
 * 
 * RATIONALE:
 * Not all vessels have all data fields populated.
 * Empty cards look unprofessional.
 * Better to show only populated sections.
 * 
 * TONNAGE COMPONENT (lines 5-37):
 * 
 * Displays regulatory tonnage measurements:
 * - GT (Gross Tonnage): Overall internal volume (100 cubic feet = 1 GT)
 * - NT (Net Tonnage): Earning space volume (cargo/passenger capacity basis)
 * - DWT (Deadweight Tonnage): Total carrying capacity at summer draft
 * - Summer Draft: Draft at summer load line (seasonal variation)
 * 
 * BUSINESS CONTEXT:
 * - GT used for port fees, regulations (e.g., SOLAS applies to vessels >500 GT)
 * - DWT used for commercial purposes (how much cargo can carry)
 * - NT used for port/canal dues calculation
 * 
 * FORMATTING:
 * toLocaleString() adds thousands separators (150000 → 150,000).
 * Improves readability for large numbers.
 * 
 * SHIPYARD COMPONENT (lines 39-58):
 * 
 * Simple single-field display.
 * Only shows if vessel.shipyard populated.
 * 
 * SHIPYARD SIGNIFICANCE:
 * - Quality indicator (Samsung Heavy, Daewoo, Hyundai known for LNG carriers)
 * - Warranty/technical support tracking
 * - Sister ship identification (vessels from same yard/year)
 * 
 * WHY SEPARATE COMPONENTS:
 * 
 * Could be one large component.
 * Separation provides:
 * - Granular conditional rendering
 * - Reusability (can use tonnage card elsewhere)
 * - Easier maintenance (focused scope)
 * 
 * USAGE:
 * Imported and used in VesselDetail or EditVessel pages.
 * Placed alongside other specification cards.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ruler, Ship, Anchor } from 'lucide-react';

export function VesselDimensionsAndTonnage({ vessel }) {
  const tonnageFields = [
    { label: 'Gross Tonnage (GT)', value: vessel?.gt },
    { label: 'Net Tonnage ITC 69 (NT)', value: vessel?.ntItc69 },
    { label: 'Deadweight (DWT, t)', value: vessel?.dwt },
    { label: 'Summer Draft (m)', value: vessel?.summerDraftM },
  ];

  const hasTonnageData = tonnageFields.some(f => f.value !== null && f.value !== undefined);

  if (!hasTonnageData) return null;

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Ship className="w-5 h-5 text-cyan-400" />
          Tonnage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tonnageFields.map((field) => (
          (field.value !== null && field.value !== undefined) && (
            <div key={field.label} className="flex justify-between">
              <span className="text-gray-600">{field.label}</span>
              <span className="text-gray-900 font-medium">{typeof field.value === 'number' ? field.value.toLocaleString() : field.value}</span>
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );
}

export function VesselShipyard({ vessel }) {
  if (!vessel?.shipyard) return null;

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Ship className="w-5 h-5 text-cyan-400" />
          Shipyard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Shipyard</span>
          <span className="text-gray-900 font-medium">{vessel.shipyard}</span>
        </div>
      </CardContent>
    </Card>
  );
}