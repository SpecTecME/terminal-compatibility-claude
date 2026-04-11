/**
 * Terminal Complex Detail Page
 * 
 * PURPOSE:
 * Displays aggregated information about a terminal complex (site/port grouping).
 * Shows all terminals within the complex and provides management actions.
 * 
 * ENTITY HIERARCHY POSITION:
 * TerminalComplex (THIS entity) → Terminal → Berth
 * 
 * DOMAIN CONTEXT - TERMINAL COMPLEXES:
 * 
 * WHAT IS A TERMINAL COMPLEX?
 * A physical site/port area containing multiple related terminals.
 * Also called "Site" in legacy terminology.
 * 
 * REAL-WORLD EXAMPLES:
 * 
 * 1. Ras Laffan Industrial City (Qatar):
 *    - Terminal Complex: "Ras Laffan"
 *    - Contains: Ras Laffan LNG Terminal, Qatargas Terminal, RasGas Terminal
 *    - Each terminal has own berths, but share port infrastructure
 * 
 * 2. Rotterdam Port (Netherlands):
 *    - Terminal Complex: "Port of Rotterdam"
 *    - Contains: Multiple oil, LNG, container terminals
 *    - Different operators, but common port authority
 * 
 * WHY GROUP INTO COMPLEXES?
 * - Shared port authority/regulations
 * - Common geographic location
 * - Similar marine access conditions (tides, channels)
 * - Logical grouping for planning (all in same port call)
 * 
 * KEY ATTRIBUTES:
 * 
 * name: Complex name (e.g., "Ras Laffan Industrial City")
 * code: Short identifier (e.g., "RAS_LAFFAN")
 * 
 * countryId: Country where complex located
 * region: State/province within country
 * city: City name
 * address: Physical address
 * 
 * operatorAuthority: Port authority or managing organization
 *   - Example: "Qatar Ports Management Company (Mwani Qatar)"
 *   - Regulatory jurisdiction indicator
 * 
 * latitude/longitude: Complex center point
 *   - Used for map display
 *   - Individual terminals have own coords (more precise)
 * 
 * OPTIONAL HIERARCHY:
 * Terminal.terminalComplexId is OPTIONAL.
 * Some terminals standalone (not part of complex).
 * 
 * When to use:
 * - Large ports with multiple terminals → Use complex
 * - Single isolated terminal → Skip complex
 * - Helps organize vs adds unnecessary structure
 * 
 * MIGRATION FROM "SITE":
 * 
 * Legacy field: Terminal.siteId
 * New field: Terminal.terminalComplexId
 * 
 * Both supported during migration (lines 28-32).
 * Query uses terminalComplexId (new standard).
 * 
 * QUICK ACTIONS (lines 62-66):
 * 
 * "Create Terminal" button pre-fills terminalComplexId.
 * UX optimization: User adding terminal to complex.
 * Passes complexId as URL param to AddTerminal page.
 * 
 * STATISTICS DISPLAY (lines 80-93):
 * 
 * Shows count of child terminals.
 * Quick overview of complex size.
 * 
 * FUTURE ENHANCEMENT IDEAS (not implemented):
 * - Aggregate berth count across all terminals
 * - Complex-wide capacity statistics
 * - Shared infrastructure status
 * 
 * Currently kept simple - just terminal listing.
 * 
 * TERMINALS LIST (lines 164-190):
 * 
 * Shows all terminals where Terminal.terminalComplexId = this complex.
 * Displays name, port, status for each.
 * Clickable links to individual terminal details.
 * 
 * Enables complex-level overview before drilling into specific terminals.
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Building2, Edit, MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TerminalComplexDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const complexId = urlParams.get('id');

  const { data: complex, isLoading } = useQuery({
    queryKey: ['terminalComplex', complexId],
    queryFn: () => base44.entities.TerminalComplex.filter({ id: parseInt(complexId) }).then(r => r[0]),
    enabled: !!complexId
  });

  const { data: country } = useQuery({
    queryKey: ['country', complex?.countryId],
    queryFn: () => base44.entities.Country.filter({ publicId: complex.countryPublicId }).then(r => r[0]),
    enabled: !!complex?.countryId
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals', complexId],
    queryFn: () => base44.entities.Terminal.filter({ terminalComplexPublicId: complex?.publicId }),
    enabled: !!complexId
  });

  if (isLoading || !complex) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{complex.name}</h1>
            {complex.code && (
              <p className="text-gray-600 mt-1">Code: {complex.code}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`AddTerminal?terminalComplexId=${complexId}`)}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Terminal
            </Button>
          </Link>
          <Link to={createPageUrl(`EditTerminalComplex?id=${complexId}`)}>
            <Button variant="outline" className="border-gray-300 text-gray-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Badge className={`${complex.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border`}>
            {complex.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Terminals</p>
                <p className="font-medium text-gray-900">{terminals.length} terminals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Terminal Complex Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="text-gray-900 font-medium">{country?.nameEn || 'Not specified'}</p>
              </div>
              {complex.region && (
                <div>
                  <p className="text-sm text-gray-600">Region/State</p>
                  <p className="text-gray-900 font-medium">{complex.region}</p>
                </div>
              )}
              {complex.city && (
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="text-gray-900 font-medium">{complex.city}</p>
                </div>
              )}
              {complex.address && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-gray-900 font-medium">{complex.address}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {complex.operatorAuthority && (
                <div>
                  <p className="text-sm text-gray-600">Port Authority / Operator</p>
                  <p className="text-gray-900 font-medium">{complex.operatorAuthority}</p>
                </div>
              )}
              {(complex.latitude || complex.longitude) && (
                <div>
                  <p className="text-sm text-gray-600">Coordinates</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-medium">
                      {complex.latitude}, {complex.longitude}
                    </p>
                    {complex.latitude && complex.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${complex.latitude},${complex.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-cyan-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {complex.notes && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="text-gray-700">{complex.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {terminals.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Terminals in this Terminal Complex</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {terminals.map((terminal) => (
                <Link key={terminal.id} to={createPageUrl(`TerminalDetail?id=${terminal.id}`)}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <div>
                        <p className="font-medium text-gray-900">{terminal.name}</p>
                        <p className="text-sm text-gray-600">{terminal.port}</p>
                      </div>
                    </div>
                    <Badge className={`${terminal.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'} border`}>
                      {terminal.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}