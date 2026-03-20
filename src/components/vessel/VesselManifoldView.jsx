/**
 * Vessel Manifold Specifications View Component
 * 
 * PURPOSE:
 * Displays cargo connection interface (manifold) specifications.
 * THE MOST CRITICAL compatibility factor for LNG loading operations.
 * 
 * DOMAIN CONTEXT - MANIFOLDS:
 * 
 * Manifold = Piping connection point on vessel hull where cargo arms connect.
 * Terminal's loading arms must physically align with vessel manifolds.
 * Misalignment = Cannot transfer cargo = Vessel cannot use berth.
 * 
 * ISO 28460 STANDARD (Alert line 10-14):
 * International standard for LNG carrier manifold arrangements.
 * Defines:
 * - Standard manifold spacing (pitch)
 * - Height ranges
 * - Flange sizes and ratings
 * - Berthing side requirements
 * 
 * Ensures global interoperability (any LNG carrier can use any compliant terminal).
 * 
 * KEY PARAMETERS:
 * 
 * 1. BERTHING SIDE SUPPORTED:
 *    - Port: Vessel can only berth port-side to terminal
 *    - Starboard: Vessel can only berth starboard-side to terminal
 *    - Both: Vessel can berth either side (rare, requires dual manifolds)
 *    
 *    CRITICAL CONSTRAINT:
 *    Terminal designed for specific side (usually port in LNG industry).
 *    Vessel with wrong side = INCOMPATIBLE (cannot berth).
 *    Most LNG carriers: Port side only (industry convention).
 * 
 * 2. MANIFOLD COUNT:
 *    - manifoldLngCount: Number of LNG liquid connections (typically 3-5)
 *    - manifoldVapourCount: Number of vapour return connections (typically 1-2)
 *    
 *    Terminal must have sufficient loading arms.
 *    Example: Vessel has 4 LNG manifolds, terminal has 3 arms = RESTRICTION
 *    Can still operate but at reduced loading rate (3 arms instead of 4).
 * 
 * 3. MANIFOLD HEIGHT RANGES (Critical for connection):
 *    
 *    LNG Manifold Height (lngManifoldHeightMin_m to lngManifoldHeightMax_m):
 *    - Vertical distance from waterline to manifold center
 *    - Varies with vessel's draft (cargo load affects height)
 *    - Typical range: 6m - 11m above waterline
 *    - Terminal loading arm must reach this range
 *    
 *    Vapour Manifold Height (vapourManifoldHeightMin_m to vapourManifoldHeightMax_m):
 *    - Usually different from LNG manifold height
 *    - Separate arm required if heights don't match
 *    
 *    HEIGHT MATCHING CRITICAL:
 *    Loading arm has vertical reach limit.
 *    If vessel manifold outside arm's reach = Cannot connect.
 *    Tide range further complicates (manifold height changes with tide).
 * 
 * 4. MANIFOLD SPACING/PITCH (manifoldSpacingPitch_mm):
 *    - Horizontal distance between adjacent manifolds
 *    - Typical: 900mm, 1000mm (ISO 28460 standard spacings)
 *    - Terminal loading arms must match this spacing
 *    - Non-standard spacing requires terminal modifications
 *    - Measured in millimeters (mm) for precision
 * 
 * 5. MANIFOLD LONGITUDINAL POSITION:
 *    - manifoldToBow_m: Distance from manifold to bow (forward end)
 *    - manifoldToStern_m: Distance from manifold to stern (aft end)
 *    
 *    Used for:
 *    - Vessel positioning calculations (where to place vessel at berth)
 *    - Fender positioning (fenders must avoid manifold area)
 *    - Mooring line planning (manifold area kept clear)
 * 
 * 6. FLANGE SPECIFICATIONS:
 *    
 *    flangeSizeLng_in:
 *    - Pipe connection diameter (e.g., "16\"" = 16 inches)
 *    - Standard sizes: 12", 16", 20"
 *    - Terminal loading arm flange must match exactly
 *    - Mismatched flanges = Cannot connect
 *    
 *    flangeRating:
 *    - Pressure rating (e.g., "ANSI 150", "ANSI 300")
 *    - ANSI = American National Standards Institute
 *    - 150/300 = pressure class (pounds per square inch)
 *    - Must match or exceed for safety
 *    - Mismatch = Safety violation
 * 
 * 7. ERC (Emergency Release Coupling):
 *    
 *    ercManufacturerModel:
 *    - Manufacturer and model of ERC system
 *    - Example: "MIB Italia ERC 16\""
 *    - ERC allows rapid disconnect in emergencies
 *    - Terminal's ESD must be compatible with vessel's ERC
 *    - Incompatibility = Cannot operate safely
 * 
 * LEGACY FIELD SUPPORT (lines 51-52):
 * Displays lngManifoldHeightMax_m OR manifold_height (legacy).
 * Gradual migration pattern.
 * 
 * COMPATIBILITY IMPLICATIONS:
 * Every manifold parameter is potential compatibility constraint.
 * Terminal-vessel matching algorithm checks:
 * - Berthing side compatibility
 * - Height range overlap
 * - Spacing match
 * - Flange size/rating match
 * - ERC compatibility
 * 
 * Single mismatch can prevent operations.
 * Manifold compatibility is highest priority check.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plug, Circle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function VesselManifoldView({ vessel }) {
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Manifold specifications follow ISO 28460 standards for LNG carriers
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plug className="w-5 h-5 text-cyan-400" />
              Manifold Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Berthing Side</span>
              <span className="text-gray-900 font-medium">{vessel.berthingSideSupported || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">LNG Manifolds</span>
              <span className="text-gray-900 font-medium">{vessel.manifoldLngCount || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vapour Manifolds</span>
              <span className="text-gray-900 font-medium">{vessel.manifoldVapourCount || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Manifold Heights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">LNG Manifold Height (m)</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-medium">{vessel.lngManifoldHeightMin_m || '-'}</span>
                <span className="text-gray-500">to</span>
                <span className="text-gray-900 font-medium">
                  {vessel.lngManifoldHeightMax_m || vessel.manifold_height || '-'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Vapour Manifold Height (m)</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-medium">{vessel.vapourManifoldHeightMin_m || '-'}</span>
                <span className="text-gray-500">to</span>
                <span className="text-gray-900 font-medium">{vessel.vapourManifoldHeightMax_m || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Manifold Geometry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Spacing/Pitch (mm)</span>
              <span className="text-gray-900 font-medium">{vessel.manifoldSpacingPitch_mm ? vessel.manifoldSpacingPitch_mm.toLocaleString() : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Distance to Bow (m)</span>
              <span className="text-gray-900 font-medium">{vessel.manifoldToBow_m || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Distance to Stern (m)</span>
              <span className="text-gray-900 font-medium">{vessel.manifoldToStern_m || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Circle className="w-5 h-5 text-cyan-400" />
              Flanges & ERC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">LNG Flange Size</span>
              <span className="text-gray-900 font-medium">{vessel.flangeSizeLng_in || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Flange Rating</span>
              <span className="text-gray-900 font-medium">{vessel.flangeRating || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ERC Manufacturer/Model</span>
              <span className="text-gray-900 font-medium">{vessel.ercManufacturerModel || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}