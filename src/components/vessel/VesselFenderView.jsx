/**
 * Vessel Fender & Hull Protection View Component
 * 
 * PURPOSE:
 * Displays vessel's hull specifications related to fender interface and protection.
 * Critical for preventing hull damage during berthing and moored operations.
 * 
 * DOMAIN CONTEXT:
 * Fenders = Large rubber cushions on berth that absorb berthing impact.
 * Vessel hull must be compatible with terminal's fender system.
 * 
 * KEY PARAMETERS:
 * 
 * 1. FENDER CONTACT ZONE:
 *    - Area of vessel hull where fenders make contact
 *    - Common zones: "Midship", "Parallel Body", "Cargo Area"
 *    - Determines fender placement along berth
 *    - Critical for berth design and vessel positioning
 * 
 * 2. SHELL PLATING RESTRICTIONS:
 *    - Areas where hull cannot tolerate fender pressure
 *    - Examples: "Tank edges", "Void spaces", "Structural frames"
 *    - Terminal must position fenders to avoid these zones
 *    - Violating restrictions can cause hull deformation
 * 
 * 3. FENDER POINT LOAD LIMIT:
 *    - Maximum force per fender (kN = kilonewtons)
 *    - Vessel hull strength limitation
 *    - Terminal fender reaction force must stay below this
 *    - Typical LNG carrier: 2000-3000 kN
 *    - Exceeded limits cause permanent hull damage
 * 
 * 4. PREFERRED FENDER TYPE:
 *    - Vessel recommendation based on hull design
 *    - Common types:
 *      * Cone: Point contact, high energy absorption
 *      * Cell: Larger contact area, lower pressure
 *      * Pneumatic: Soft contact, delicate hulls
 *    - Terminal may not have preferred type
 *    - Mismatch requires operational restrictions
 * 
 * COMPATIBILITY IMPLICATIONS:
 * - Terminal fenders must be within load limits
 * - Terminal must have preferred type (or acceptable alternative)
 * - Fender positioning must align with contact zone
 * - Must avoid restricted areas
 * 
 * SAFETY CRITICALITY:
 * Improper fender interface risks:
 * - Hull puncture (catastrophic for LNG)
 * - Tank damage (cargo containment failure)
 * - Structural failure
 * - Expensive repairs, operational delays
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';

export default function VesselFenderView({ vessel }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            Fender Contact & Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Contact Zone</span>
            <span className="text-gray-900 font-medium">{vessel.fenderContactZone || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Point Load Limit (kN)</span>
            <span className="text-gray-900 font-medium">{vessel.fenderPointLoadLimit_kN || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Preferred Fender Type</span>
            <span className="text-gray-900 font-medium">{vessel.preferredFenderType || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {vessel.shellPlatingRestrictions && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Shell Plating Restrictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{vessel.shellPlatingRestrictions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}