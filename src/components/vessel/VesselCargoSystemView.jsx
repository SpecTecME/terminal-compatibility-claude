/**
 * Vessel Cargo System View Component
 * 
 * PURPOSE:
 * Displays vessel's cargo containment system and transfer capabilities.
 * Critical for cargo operations planning and terminal compatibility.
 * 
 * DOMAIN CONTEXT - LNG CARGO SYSTEMS:
 * 
 * LNG CARGO CONTAINMENT:
 * LNG is liquid natural gas at -162°C.
 * Requires specialized cryogenic containment systems.
 * 
 * CONTAINMENT TYPES (cargoContainmentType):
 * 
 * 1. MEMBRANE SYSTEMS (Most common):
 *    - "Membrane GTT Mark III Flex"
 *    - "Membrane GTT NO96"
 *    - Thin stainless steel membrane inside insulated hull
 *    - Tank shaped to hull (efficient space usage)
 *    - GTT = Gaztransport & Technigaz (French company, dominant supplier)
 *    - Mark III = Current generation technology
 * 
 * 2. MOSS SYSTEMS (Older, less common):
 *    - "Moss Rosenberg Spherical"
 *    - Self-supporting aluminum spherical tanks
 *    - Protrude above deck (distinctive appearance)
 *    - Robust but less space-efficient
 * 
 * 3. IHI SPB (Intermediate):
 *    - "IHI SPB Self-Supporting Prismatic"
 *    - Square-shaped self-supporting tanks
 *    - Japanese technology
 * 
 * Containment type affects:
 * - Cargo capacity calculations
 * - Structural considerations
 * - Maintenance procedures
 * - Compatibility with terminal loading systems
 * 
 * CARGO CAPACITY (m³):
 * Total volume vessel can carry.
 * Critical for cargo planning and commercial operations.
 * 
 * DUAL FIELD SUPPORT (lines 22-28):
 * - New field: cargoCapacity_m3
 * - Legacy field: cargo_capacity
 * - Display whichever exists (migration period)
 * - Format with thousand separators for readability
 * 
 * LOADING/DISCHARGE RATES:
 * 
 * maxLoadingRate_m3ph:
 * - Maximum cubic meters per hour vessel can accept
 * - Limited by vessel's pumps and piping
 * - Typical LNG carrier: 10,000-12,000 m³/h
 * - Terminal must not exceed this rate (cargo arm limitations)
 * 
 * maxDischargeRate_m3ph:
 * - Maximum rate vessel can pump out cargo
 * - Usually higher than loading rate (gravity assist)
 * - Typical: 12,000-14,000 m³/h
 * - Critical for terminal throughput planning
 * 
 * VAPOUR RETURN SYSTEM:
 * 
 * vapourReturnSupported (boolean):
 * - During loading, cargo vapour displaced from tanks
 * - With vapour return: Vapour sent back to terminal (closed system)
 * - Without vapour return: Vapour burned/vented (open system)
 * - Environmental and safety implications
 * - Most modern LNG carriers support vapour return
 * - Some terminals REQUIRE vapour return capability
 * - Mismatch can block vessel from terminal
 * 
 * ESD/ERC SYSTEM:
 * 
 * esdErcType:
 * - ESD = Emergency Shutdown System
 * - ERC = Emergency Release Coupling
 * - Example value: "SIGTTO-compatible ERC"
 * - SIGTTO = Society of International Gas Tanker & Terminal Operators
 * - Industry standards for emergency disconnection
 * - Terminal ESD must be compatible with vessel ERC
 * - Critical safety system (disconnect during emergencies)
 * - Prevents cargo spills and arm damage
 * 
 * COMPATIBILITY USAGE:
 * These fields matched against terminal specifications.
 * Mismatches flagged in compatibility reports.
 * Example issues:
 * - Vessel discharge rate > terminal pumping capacity
 * - Vessel has no vapour return, terminal requires it
 * - Incompatible ESD/ERC systems
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Boxes, Gauge } from 'lucide-react';

export default function VesselCargoSystemView({ vessel }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            Cargo Containment & Capacity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Containment Type</span>
            <span className="text-gray-900 font-medium">{vessel.cargoContainmentType || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cargo Capacity (m³)</span>
            <span className="text-gray-900 font-medium">
              {vessel.cargoCapacity_m3 
                ? vessel.cargoCapacity_m3.toLocaleString() 
                : vessel.cargo_capacity 
                ? vessel.cargo_capacity.toLocaleString() 
                : '-'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            Loading & Discharge Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Max Loading Rate (m³/h)</span>
            <span className="text-gray-900 font-medium">
              {vessel.maxLoadingRate_m3ph ? vessel.maxLoadingRate_m3ph.toLocaleString() : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Discharge Rate (m³/h)</span>
            <span className="text-gray-900 font-medium">
              {vessel.maxDischargeRate_m3ph ? vessel.maxDischargeRate_m3ph.toLocaleString() : '-'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            Cargo System Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Vapour Return Supported</span>
            <Badge className={vessel.vapourReturnSupported 
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border'
              : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'
            }>
              {vessel.vapourReturnSupported ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ESD/ERC Type</span>
            <span className="text-gray-900 font-medium">{vessel.esdErcType || '-'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}