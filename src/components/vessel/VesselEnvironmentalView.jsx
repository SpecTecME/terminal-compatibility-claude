import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wind, Waves, Anchor } from 'lucide-react';

/**
 * Vessel Environmental Limits View Component
 * 
 * PURPOSE:
 * Displays vessel's environmental operational limits for terminal compatibility assessment.
 * These constraints define safe operating conditions for berthing and cargo operations.
 * 
 * DOMAIN CONTEXT:
 * Environmental limits are critical safety parameters defined by:
 * - Vessel design specifications
 * - Class society requirements
 * - Flag state regulations
 * - Insurance conditions
 * - Terminal operating procedures
 * 
 * PARAMETERS DISPLAYED:
 * 
 * 1. WIND LIMITS:
 *    - maxWindBerthing_kn: Maximum wind during approach and mooring operations
 *      * Most critical phase (vessel maneuvering, lines being connected)
 *      * Typically 15-25 knots for LNG carriers
 *    
 *    - maxWindAlongside_kn: Maximum wind while moored at berth
 *      * Less restrictive than berthing (vessel secured with mooring lines)
 *      * Typically 30-40 knots for LNG carriers
 * 
 * 2. CURRENT LIMITS:
 *    - maxCurrentAlongside_kn: Maximum water current while moored
 *      * Affects mooring line tension
 *      * Critical for terminals in tidal or river locations
 * 
 * 3. WAVE HEIGHT:
 *    - maxWaveHeight_m: Maximum significant wave height
 *      * Affects vessel motion and cargo arm safety
 *      * Typically 1-2m for LNG operations
 * 
 * 4. TIDE RANGE:
 *    - tideRangeMin_m to tideRangeMax_m: Acceptable tidal variation
 *      * Affects manifold connection geometry
 *      * Large tides change manifold height differential
 *      * Critical for rigid cargo arm systems
 * 
 * 5. TUG REQUIREMENTS:
 *    - tugRequirementsNotes: Free-text specifications
 *      * Number of tugs required
 *      * Bollard pull capacity
 *      * Positioning requirements (bow/stern)
 * 
 * COMPATIBILITY USAGE:
 * These limits matched against terminal's metocean conditions.
 * Terminal must operate within vessel's limits for safe operations.
 * Mismatches flagged in compatibility reports.
 * 
 * UNITS CONVENTION:
 * - Wind/Current: knots (kn) - maritime standard
 * - Wave height: meters (m)
 * - Tide range: meters (m)
 * 
 * All fields optional but recommended for complete compatibility assessment.
 */
export default function VesselEnvironmentalView({ vessel }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wind className="w-5 h-5 text-cyan-400" />
            Wind Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Max Wind During Berthing (kn)</span>
            <span className="text-gray-900 font-medium">{vessel.maxWindBerthing_kn || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Wind Alongside (kn)</span>
            <span className="text-gray-900 font-medium">{vessel.maxWindAlongside_kn || '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400" />
            Current & Wave Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Max Current Alongside (kn)</span>
            <span className="text-gray-900 font-medium">{vessel.maxCurrentAlongside_kn || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Wave Height (m)</span>
            <span className="text-gray-900 font-medium">{vessel.maxWaveHeight_m || '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Anchor className="w-5 h-5 text-cyan-400" />
            Tide Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Acceptable Tide Range (m)</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-medium">{vessel.tideRangeMin_m || '-'}</span>
              <span className="text-gray-500">to</span>
              <span className="text-gray-900 font-medium">{vessel.tideRangeMax_m || '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {vessel.tugRequirementsNotes && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Tug Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{vessel.tugRequirementsNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}