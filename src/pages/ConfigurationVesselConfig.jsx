/**
 * Configuration Vessel Config Hub Page
 * 
 * PURPOSE:
 * Navigation hub for vessel type-level policies and constraints.
 * Defines what fuel and cargo types are allowed/restricted per vessel type.
 * 
 * DOMAIN CONTEXT - VESSEL TYPE POLICIES:
 * 
 * Different vessel types have different capabilities:
 * - LNG carrier: Can only carry LNG (not crude oil)
 * - Oil tanker: Can carry crude OR products (not LNG)
 * - Container ship: No liquid bulk cargo
 * 
 * FOUR POLICY AREAS:
 * 
 * 1. FUEL TANK POLICY:
 *    - How many fuel tanks does this vessel type typically have?
 *    - Capacity ranges per tank
 *    - Configuration standards
 *    Example: "LNG Carrier Q-Max: 2 main fuel tanks, 200-300 m³ each"
 * 
 * 2. ALLOWED FUEL TYPES:
 *    - Which fuel types can this vessel type use?
 *    - HFO (Heavy Fuel Oil), MGO (Marine Gas Oil), LNG fuel, etc.
 *    - Environmental compliance constraints
 *    Example: "LNG Carrier: LNG fuel (dual-fuel), MGO backup"
 * 
 * 3. ALLOWED CARGO TYPES:
 *    - Which cargo types can this vessel type carry?
 *    - Safety and design constraints
 *    - Regulatory limitations
 *    Example: "LNG Carrier: Only LNG cargo, no crude oil or chemicals"
 * 
 * 4. CARGO POLICY:
 *    - How many cargo tanks/holds?
 *    - Cargo capacity rules
 *    - Loading/discharge constraints
 *    Example: "LNG Carrier Q-Max: 4 membrane tanks, 266,000 m³ total"
 * 
 * WHY VESSEL TYPE LEVEL:
 * Policies apply to ALL vessels of a given type.
 * Individual vessel instances inherit these constraints.
 * Overrides possible at vessel level if needed.
 * 
 * RELATIONSHIP TO OTHER MASTER DATA:
 * - Links Vessel Types → Fuel Types (many-to-many)
 * - Links Vessel Types → Cargo Types (many-to-many)
 * - Enforced during vessel creation/compatibility checking
 * 
 * USE CASE EXAMPLE:
 * User tries to add "Crude Oil" capability to LNG carrier.
 * System checks VesselTypeAllowedCargoTypes.
 * Finds LNG carrier NOT allowed to carry crude.
 * Blocks operation, shows validation error.
 * 
 * RELATED HUBS:
 * - ConfigurationMasterData: Vessel Types, Fuel Types, Cargo Types
 * - This page links them together with policies
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Fuel, 
  Package,
  ChevronRight
} from 'lucide-react';

export default function ConfigurationVesselConfig() {
  const items = [
    { name: 'Vessel Type Fuel Tank Policy', href: 'VesselTypeFuelTankPolicy', icon: Fuel, description: 'Configure fuel tank policies per vessel type' },
    { name: 'Vessel Type Allowed Fuel Types', href: 'VesselTypeAllowedFuelTypes', icon: Fuel, description: 'Define allowed fuel types per vessel type' },
    { name: 'Vessel Type Allowed Cargo Types', href: 'VesselTypeAllowedCargoTypes', icon: Package, description: 'Define allowed cargo types per vessel type' },
    { name: 'Vessel Type Cargo Policy', href: 'VesselTypeCargoPolicy', icon: Package, description: 'Configure cargo policies per vessel type' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vessel Configuration</h1>
        <p className="text-gray-600 mt-1">Configure vessel type policies and capabilities</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((item) => (
              <Link key={item.href} to={createPageUrl(item.href)}>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-cyan-500/50 hover:bg-gray-50 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                      <item.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}