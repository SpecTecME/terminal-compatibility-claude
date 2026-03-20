/**
 * Terminal Map Page (Geographic Terminal Visualization)
 * 
 * PURPOSE:
 * Interactive world map showing all terminals geographically.
 * Enables spatial analysis, route planning, and maritime zone visualization.
 * 
 * DOMAIN CONTEXT - MARITIME GEOGRAPHY:
 * 
 * WHY MAP VIEW:
 * - Operational planning: Route visualization
 * - Strategic analysis: Terminal clusters
 * - Regulatory: ECA/SECA zone overlay
 * - Commercial: Market presence mapping
 * 
 * MULTI-DIMENSIONAL SEARCH:
 * 
 * TERMINAL SEARCH (lines 119-138):
 * Matches terminal name, port, country.
 * Single match: Zoom to terminal (zoom=8).
 * Multiple matches: Center on cluster (zoom=5).
 * 
 * VESSEL SEARCH (lines 94-116):
 * 
 * Special behavior when searching vessel name/IMO:
 * 1. Find vessel by name or IMO number
 * 2. Find compatibilities where vessel approved
 * 3. Filter map to show ONLY approved terminals
 * 4. Center map on terminal cluster
 * 
 * USE CASE:
 * "Where can vessel X-123 call?"
 * Search "X-123" → Map shows approved terminals.
 * 
 * LOCATION FALLBACK (lines 142-145):
 * If no terminal/vessel match:
 * Search built-in country/city coordinates.
 * Enables general navigation.
 * 
 * MARITIME ZONES OVERLAY (lines 276-299):
 * 
 * ZONE TYPES:
 * - ECA_SECA: Sulfur Emission Control Areas
 * - ECA_NECA: NOx Emission Control Areas
 * - MARPOL_SPECIAL_AREA: MARPOL restricted zones
 * - PSSA: Particularly Sensitive Sea Areas
 * - WAR_RISK: War risk zones
 * - PIRACY_HRA: High Risk Areas (piracy)
 * - COMPANY_TRADING_AREA: Company-defined regions
 * 
 * LEGEND CONTROL (lines 276-299):
 * Checkbox for each zone type.
 * Toggle visibility on/off.
 * Color-coded (hsl color generation).
 * 
 * AUTO-ENABLE ALL (lines 39-44):
 * On first load, all zone types visible.
 * User can then selectively hide.
 * 
 * FILTER CONTROLS (lines 187-236):
 * 
 * TERMINAL TYPE FILTER (lines 213-224):
 * By terminal infrastructure type.
 * Loaded from TerminalType entity.
 * 
 * OPERATION FILTER (lines 225-236):
 * - Import: Receiving terminals
 * - Export: Loading terminals
 * - Both: Bidirectional
 * 
 * COORDINATE VALIDATION (lines 153-156):
 * Excludes terminals with invalid coordinates:
 * - latitude/longitude is 0
 * - Null coordinates
 * 
 * PREVENTS:
 * Terminals without GPS data breaking map.
 * 
 * TERMINAL COUNT BADGE (lines 270-274):
 * Top-left overlay.
 * Shows filtered count.
 * "Showing N terminals".
 * 
 * USER AWARENESS:
 * Know how many terminals match filters.
 * 
 * SELECTED TERMINAL PANEL (lines 264-267):
 * 
 * TerminalPanel component (separate file).
 * Slides in from side when terminal clicked.
 * Shows terminal details, berths, etc.
 * 
 * CLOSE BEHAVIOR:
 * Click elsewhere on map → Closes panel.
 * 
 * MAP CONTAINER (lines 246-263):
 * Full-height flex layout.
 * Fills available space.
 * Rounded corners with border.
 * 
 * DEBOUNCED SEARCH (line 148):
 * 500ms delay after typing.
 * Prevents excessive re-renders.
 * Smooth user experience.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import WorldMap from '../components/map/WorldMap';
import TerminalPanel from '../components/map/TerminalPanel';
import { searchLocation } from '../components/map/countryCoordinates';
import { Loader2, Search, Filter, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IconButton from '../components/ui/IconButton';

export default function TerminalMap() {
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTerminalType, setFilterTerminalType] = useState('all');
  const [searchCenter, setSearchCenter] = useState(null);
  const [visibleZoneTypes, setVisibleZoneTypes] = useState(new Set());
  const [allZonesChecked, setAllZonesChecked] = useState(false);

  const { data: terminals = [], isLoading } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: mapConfig = [] } = useQuery({
    queryKey: ['mapConfiguration'],
    queryFn: () => base44.entities.MapConfiguration.list(),
  });

  const maritimeZonesEnabled = mapConfig.length === 0 || 
    (mapConfig.find(c => c.isActive !== false) ?? mapConfig[0])?.useMaritimeZones !== false;

  const { data: allMaritimeZones = [] } = useQuery({
    queryKey: ['maritimeZones'],
    queryFn: () => base44.entities.MaritimeZone.list(),
  });

  const maritimeZones = maritimeZonesEnabled ? allMaritimeZones : [];

  useEffect(() => {
    if (maritimeZones.length > 0 && !allZonesChecked) {
      const initialVisible = new Set(maritimeZones.map(zone => zone.zoneType));
      setVisibleZoneTypes(initialVisible);
      setAllZonesChecked(true);
    }
  }, [maritimeZones]);

  const toggleZoneVisibility = (zoneType) => {
    setVisibleZoneTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneType)) {
        newSet.delete(zoneType);
      } else {
        newSet.add(zoneType);
      }

      const allPossibleZoneTypes = [...new Set(maritimeZones.map(z => z.zoneType))];
      setAllZonesChecked(newSet.size === allPossibleZoneTypes.length);

      return newSet;
    });
  };

  const toggleAllZones = () => {
    const allPossibleZoneTypes = [...new Set(maritimeZones.map(z => z.zoneType))];
    if (allZonesChecked) {
      setVisibleZoneTypes(new Set());
      setAllZonesChecked(false);
    } else {
      setVisibleZoneTypes(new Set(allPossibleZoneTypes));
      setAllZonesChecked(true);
    }
  };

  const { data: berths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['compatibilities'],
    queryFn: () => base44.entities.VesselCompatibility.list()
  });

  const { data: terminalTypes = [] } = useQuery({
    queryKey: ['terminalTypes'],
    queryFn: () => base44.entities.TerminalType.list()
  });

  // Enrich terminals with berth info for popup
  const enrichedTerminals = terminals.map(t => ({
    ...t,
    berths: berths
      .filter(b => b.terminal_id === t.id)
      .map(b => b.berth_name || b.berth_number)
  }));

  // Internal search navigation (no external geocoding)
  useEffect(() => {
    const performInternalSearch = () => {
      if (!searchQuery || searchQuery.length < 3) {
        setSearchCenter(null);
        return;
      }

      // Check if searching for vessel
      const vesselMatch = vessels.find(v => 
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.imo_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (vesselMatch) {
        // Find approved terminals for this vessel
        const approvedTerminalIds = compatibilities
          .filter(c => c.vessel_id === vesselMatch.id && c.status === 'Approved')
          .map(c => c.terminal_id);
        
        if (approvedTerminalIds.length > 0) {
          const approvedTerminals = terminals.filter(t => approvedTerminalIds.includes(t.id));
          if (approvedTerminals.length > 0) {
            // Calculate center of approved terminals
            const avgLat = approvedTerminals.reduce((sum, t) => sum + t.latitude, 0) / approvedTerminals.length;
            const avgLon = approvedTerminals.reduce((sum, t) => sum + t.longitude, 0) / approvedTerminals.length;
            setSearchCenter({ position: [avgLat, avgLon], zoom: 4 });
          }
        }
        return;
      }

      // Search within our terminal dataset
      const matchingTerminals = terminals.filter(t => 
        (t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.port?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.legacyCountryName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        t.latitude && t.longitude && t.latitude !== 0 && t.longitude !== 0
      );

      if (matchingTerminals.length > 0) {
        if (matchingTerminals.length === 1) {
          // Single match - zoom to terminal
          const terminal = matchingTerminals[0];
          setSearchCenter({ position: [terminal.latitude, terminal.longitude], zoom: 8 });
        } else {
          // Multiple matches - calculate center and zoom to show all
          const avgLat = matchingTerminals.reduce((sum, t) => sum + t.latitude, 0) / matchingTerminals.length;
          const avgLon = matchingTerminals.reduce((sum, t) => sum + t.longitude, 0) / matchingTerminals.length;
          setSearchCenter({ position: [avgLat, avgLon], zoom: 5 });
        }
        return;
      }

      // Fallback: search built-in country/city coordinates
      const locationResult = searchLocation(searchQuery);
      if (locationResult) {
        setSearchCenter(locationResult);
      }
    };

    const debounceTimer = setTimeout(performInternalSearch, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, vessels, compatibilities, terminals]);

  const filteredTerminals = enrichedTerminals.filter(t => {
    // Exclude terminals with invalid coordinates
    if (!t.latitude || !t.longitude || t.latitude === 0 || t.longitude === 0) {
      return false;
    }

    // Check if searching for vessel (only if search query exists)
    if (searchQuery) {
      const vesselMatch = vessels.find(v => 
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.imo_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (vesselMatch) {
        // Show only terminals where this vessel is approved
        const approvedTerminalIds = compatibilities
          .filter(c => c.vessel_id === vesselMatch.id && c.status === 'Approved')
          .map(c => c.terminal_id);
        return approvedTerminalIds.includes(t.id);
      }
    }

    // Normal search - match terminals or country names
    const matchesSearch = !searchQuery || 
                          t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.legacyCountryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.port?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.operation_type === filterType;
    const matchesTerminalType = filterTerminalType === 'all' || t.terminal_type_id === filterTerminalType;
    return matchesSearch && matchesType && matchesTerminalType;
  });

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search terminals, ports, countries (internal data only)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-24 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
          {searchQuery && (
            <>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                ({filteredTerminals.length})
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchCenter(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <Select value={filterTerminalType} onValueChange={setFilterTerminalType}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Terminal Type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Types</SelectItem>
            {terminalTypes.map(tt => (
              <SelectItem key={tt.id} value={tt.id} className="text-gray-900">{tt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-48 bg-white border-gray-300 text-gray-900">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Operation" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Operations</SelectItem>
            <SelectItem value="Import" className="text-gray-900">Import</SelectItem>
            <SelectItem value="Export" className="text-gray-900">Export</SelectItem>
            <SelectItem value="Both" className="text-gray-900">Import & Export</SelectItem>
          </SelectContent>
        </Select>
        <Link to={createPageUrl('AddTerminal')}>
          <Button className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Terminal
          </Button>
        </Link>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative rounded-xl border border-gray-300 bg-white overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 rounded-xl overflow-hidden bg-slate-100">
              <WorldMap 
                terminals={filteredTerminals}
                onTerminalClick={setSelectedTerminal}
                onMapClick={() => setSelectedTerminal(null)}
                selectedTerminal={selectedTerminal}
                searchCenter={searchCenter}
                maritimeZones={maritimeZones}
                visibleZoneTypes={visibleZoneTypes}
              />
            </div>
            <TerminalPanel 
              terminal={selectedTerminal}
              onClose={() => setSelectedTerminal(null)}
            />
            
            {/* Terminal Count Badge */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-300 shadow-lg">
              <span className="text-sm text-gray-600">Showing </span>
              <span className="text-sm font-semibold text-gray-900">{filteredTerminals.length}</span>
              <span className="text-sm text-gray-600"> terminals</span>
            </div>

            {/* Maritime Zones Legend - one checkbox per zone type */}
            {maritimeZones.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 shadow-lg z-[1000] max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={allZonesChecked}
                    onChange={toggleAllZones}
                    className="form-checkbox h-3.5 w-3.5 rounded cursor-pointer"
                  />
                  <h3 className="text-sm font-semibold text-gray-800">Maritime Zones</h3>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {maritimeZones
                    .filter(zone => zone.isActive !== false)
                    .reduce((acc, zone) => {
                      if (!acc.find(z => z.zoneType === zone.zoneType)) {
                        acc.push(zone);
                      }
                      return acc;
                    }, [])
                    .sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999))
                    .map((zone) => {
                      const defaultColors = {
                        'ECA_SECA': '#FF6B6B',
                        'ECA_NECA': '#4ECDC4',
                        'PIRACY_HRA': '#FFD93D',
                        'MARPOL_SPECIAL_AREA': '#95E1D3',
                        'WAR_RISK': '#FA7070',
                        'PSSA': '#A8DADC',
                        'COMPANY_TRADING_AREA': '#A8DADC'
                      };
                      const color = zone.color || defaultColors[zone.zoneType] || '#999999';
                      
                      return (
                        <label key={zone.zoneType} className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={visibleZoneTypes.has(zone.zoneType)}
                            onChange={() => toggleZoneVisibility(zone.zoneType)}
                            className="form-checkbox h-3 w-3 rounded"
                            style={{ accentColor: color }}
                          />
                          <span
                            className="w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0"
                            style={{ 
                              backgroundColor: color,
                              opacity: zone.fillOpacity ?? 0.12
                            }}
                          ></span>
                          <span className="flex-1">{zone.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}