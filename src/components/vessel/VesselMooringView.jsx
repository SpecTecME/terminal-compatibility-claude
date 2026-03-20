import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Anchor, Circle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

/**
 * Vessel Mooring System View Component
 * 
 * PURPOSE:
 * Displays vessel's mooring equipment and line arrangement specifications.
 * Critical for terminal compatibility and safe berthing operations.
 * 
 * DOMAIN CONTEXT:
 * Mooring = System of ropes/lines securing vessel to berth.
 * Proper mooring prevents vessel drift, collision, and cargo arm damage.
 * Terminal must have compatible bollards, fairleads, and procedures.
 * 
 * MOORING SYSTEM COMPONENTS:
 * 
 * 1. MOORING WINCHES:
 *    - Powered machinery that controls line tension
 *    - Number indicates capacity and redundancy
 *    - Typical LNG carrier: 8-10 winches
 * 
 * 2. MOORING LINES (ROPES):
 *    - Total count shows vessel's mooring capacity
 *    - Distribution across bow/stern/midship critical
 *    - LNG carriers typically have 12-16 lines
 * 
 * 3. LINE ARRANGEMENT PATTERN:
 *    Standard maritime arrangement from bow to stern:
 *    - Head Lines: Forward-most, angled toward bow
 *    - Breast Lines (Forward): Perpendicular to vessel, forward section
 *    - Spring Lines (Forward): Angled aft, forward section (prevent surge)
 *    - Stern Lines: Aft-most, angled toward stern
 *    - Breast Lines (Aft): Perpendicular to vessel, aft section
 *    - Spring Lines (Aft): Angled forward, aft section (prevent surge)
 * 
 *    Each line type serves specific purpose in preventing vessel movement:
 *    - Breast lines: Prevent lateral movement (off/onto berth)
 *    - Spring lines: Prevent longitudinal movement (forward/aft)
 *    - Head/Stern: Angled lines for combined lateral/longitudinal control
 * 
 * 4. LINE SPECIFICATIONS:
 *    - lineType: Material (HMPE = High Modulus Polyethylene, common for LNG)
 *    - lineMBL_kN: Minimum Breaking Load (strength in kilonewtons)
 *    - Critical for load calculations and safety factors
 * 
 * 5. WINCH CAPACITY:
 *    - brakeHoldingCapacity_kN: Maximum tension winch can maintain
 *    - Must exceed expected environmental loads
 *    - Factor of safety typically 2-3x normal operating loads
 * 
 * 6. HARDWARE:
 *    - chockType: Guides where lines pass through ship's rail
 *      * "Panama" chocks common (closed circular design)
 *      * Affects line angle and wear
 *    - fairleadChockPositionsNotes: Station numbers and coordinates
 *      * Terminal needs these for berth planning
 *      * Affects where bollards must be positioned
 * 
 * COMPATIBILITY IMPACT:
 * - Terminal must have sufficient bollards matching line pattern
 * - Bollard capacity must exceed line MBL
 * - Fairlead positions must align with terminal bollard positions
 * - Line type affects terminal procedures (HMPE vs steel wire)
 * 
 * Mismatches can prevent safe berthing or require special procedures.
 */
export default function VesselMooringView({ vessel }) {
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Mooring arrangement details for terminal compatibility assessment
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-400" />
              Mooring Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Mooring Winches</span>
              <span className="text-gray-900 font-medium">{vessel.mooringWinches || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Mooring Lines</span>
              <span className="text-gray-900 font-medium">{vessel.mooringLinesTotal || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Line Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Head Lines</span>
              <span className="text-gray-900 font-medium">{vessel.headLines || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Breast Lines (Fwd)</span>
              <span className="text-gray-900 font-medium">{vessel.breastLinesForward || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Springs (Fwd)</span>
              <span className="text-gray-900 font-medium">{vessel.springsForward || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stern Lines</span>
              <span className="text-gray-900 font-medium">{vessel.sternLines || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Breast Lines (Aft)</span>
              <span className="text-gray-900 font-medium">{vessel.breastLinesAft || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Springs (Aft)</span>
              <span className="text-gray-900 font-medium">{vessel.springsAft || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Line Characteristics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Line Type</span>
              <span className="text-gray-900 font-medium">{vessel.lineType || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MBL (kN)</span>
              <span className="text-gray-900 font-medium">{vessel.lineMBL_kN || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Brake Holding Capacity (kN)</span>
              <span className="text-gray-900 font-medium">{vessel.brakeHoldingCapacity_kN || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Circle className="w-5 h-5 text-cyan-400" />
              Hardware
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Chock Type</span>
              <span className="text-gray-900 font-medium">{vessel.chockType || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {vessel.fairleadChockPositionsNotes && (
          <Card className="bg-white border-gray-200 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Fairlead & Chock Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{vessel.fairleadChockPositionsNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}