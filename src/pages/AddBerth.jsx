import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Search, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';

/**
 * AddBerth Page
 * 
 * PURPOSE:
 * Handles creation of new berth records within the maritime terminal management system.
 * Berths are individual docking positions within terminals where vessels moor for cargo operations.
 * 
 * DOMAIN ARCHITECTURE:
 * - Berths belong to exactly ONE terminal (parent-child relationship, mandatory)
 * - Berths can handle multiple product types (many-to-many via productTypeRefIds array)
 * - Berths inherit default product types from parent terminal but can override
 * - Berths have extensive physical specifications critical for vessel compatibility checks
 * 
 * KEY BUSINESS RULES:
 * 1. Terminal selection is MANDATORY - a berth cannot exist without a parent terminal
 * 2. Berth Code is REQUIRED and should be unique within the terminal (e.g., "LNG1", "LNG2")
 * 3. Product types auto-populate from terminal defaults but can be manually adjusted
 * 4. When navigated from terminal detail (preselectedTerminalId), terminal is locked
 * 5. All numeric fields (dimensions, capacities) are optional but critical for compatibility
 * 
 * NAVIGATION PATTERNS:
 * - Can be accessed standalone (select any terminal) via Berths list
 * - Can be accessed from TerminalDetail with ?terminal=<id> (terminal pre-selected and locked)
 * - On success, redirects back to source (TerminalDetail if preselected, else Berths list)
 * 
 * DATA STRUCTURE DECISIONS:
 * - Uses both legacy fields (berth_number, berth_name) and new fields (berthCode, berthName)
 * - Duplicate fields exist to support gradual migration from legacy schema
 * - productTypeRefIds stored as JSON array, not junction table (simplified querying)
 * - Q-Max and Q-Flex capabilities stored as booleans (specific to LNG vessel classes)
 * 
 * FIELD ORGANIZATION:
 * Fields are grouped into sections for UX clarity:
 * 1. Identity and Service - basic identification and product handling
 * 2. Compatibility and Limits - physical constraints for vessel matching
 * 3. Loading Interface - cargo transfer equipment specifications
 * 4. Metadata - operational tracking and data governance
 */
export default function AddBerth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Extract preselected terminal from URL - used when navigating from TerminalDetail
  const preselectedTerminalId = urlParams.get('terminal');
  
  // Popover state for terminal searchable dropdown
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Comprehensive berth form state
  // Note: Contains both legacy and new field names for backward compatibility
  const [formData, setFormData] = useState({
    terminal_id: preselectedTerminalId || '',
    berth_number: '',
    berth_name: '',
    berthCode: '',
    berthName: '',
    berthType: '',
    productTypeRefIds: [],
    status: 'Operational',
    qmaxCapable: false,
    qflexCapable: false,
    maxCargoCapacityM3: '',
    maxLOAM: '',
    maxBeamM: '',
    maxArrivalDraftM: '',
    maxArrivalDisplacementT: '',
    manifoldLimitsNotes: '',
    loadingArmsLngCount: '',
    vapourReturnAvailable: false,
    typicalLoadingRateNotes: '',
    operator: '',
    dataSource: '',
    lastVerifiedDate: '',
    notes: ''
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  /**
   * Auto-populate product types when terminal changes
   * 
   * BUSINESS LOGIC:
   * When a user selects a terminal, automatically inherit the terminal's primary product type
   * as the default for the new berth. This provides a sensible default but allows override.
   * 
   * ONLY applies when:
   * - Terminal is selected
   * - Product types haven't been manually set yet (length === 0)
   * - Terminal has a primary product type defined
   * 
   * This is a UX enhancement - terminals typically have a primary product (e.g., LNG)
   * and most berths within that terminal handle the same product.
   */
  useEffect(() => {
    if (formData.terminal_id && terminals.length > 0 && productTypes.length > 0) {
      const terminal = terminals.find(t => t.id === formData.terminal_id);
      if (terminal?.productTypeRefId && formData.productTypeRefIds.length === 0) {
        setFormData(prev => ({ ...prev, productTypeRefIds: [terminal.productTypeRefId] }));
      }
    }
  }, [formData.terminal_id, terminals, productTypes]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Berth.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths']);
      toast.success('Berth created successfully');
      if (preselectedTerminalId) {
        navigate(createPageUrl(`TerminalDetail?id=${preselectedTerminalId}`));
      } else {
        navigate(createPageUrl('Berths'));
      }
    },
    onError: (error) => {
      toast.error('Failed to create berth: ' + error.message);
    }
  });

  /**
   * Handle berth creation form submission
   * 
   * VALIDATION RULES:
   * 1. Terminal is MANDATORY - berths cannot exist without a parent terminal
   * 2. Berth Code is MANDATORY - used as primary human-readable identifier
   * 
   * DATA TRANSFORMATION:
   * - Generates UUID for publicId (used for migration portability across environments)
   * - Looks up terminal's publicId from terminals array (for referential integrity)
   * - Converts numeric strings to actual numbers (parseFloat/parseInt)
   * - Sets empty strings to null for cleaner database storage
   * - Populates both legacy and new field names for compatibility
   * 
   * POST-SUCCESS BEHAVIOR:
   * - If preselectedTerminalId exists → return to that terminal's detail page
   * - Otherwise → return to main Berths list page
   * This preserves user's navigation context.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.terminal_id) {
      toast.error('Please select a terminal');
      return;
    }
    if (!formData.berthCode) {
      toast.error('Please provide a Berth Code');
      return;
    }

    // Prepare data for submission with proper types and references
    const dataToSubmit = {
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      terminal_id: formData.terminal_id,
      terminalPublicId: terminals.find(t => t.id === formData.terminal_id)?.publicId || crypto.randomUUID(),
      berth_number: formData.berth_number || formData.berthCode || null,
      berth_name: formData.berth_name || null,
      berthCode: formData.berthCode || null,
      berthName: formData.berthName || null,
      berthType: formData.berthType || null,
      productTypeRefIds: formData.productTypeRefIds || [],
      status: formData.status,
      qmaxCapable: formData.qmaxCapable,
      qflexCapable: formData.qflexCapable,
      maxCargoCapacityM3: formData.maxCargoCapacityM3 ? parseFloat(formData.maxCargoCapacityM3) : null,
      maxLOAM: formData.maxLOAM ? parseFloat(formData.maxLOAM) : null,
      maxBeamM: formData.maxBeamM ? parseFloat(formData.maxBeamM) : null,
      maxArrivalDraftM: formData.maxArrivalDraftM ? parseFloat(formData.maxArrivalDraftM) : null,
      maxArrivalDisplacementT: formData.maxArrivalDisplacementT ? parseFloat(formData.maxArrivalDisplacementT) : null,
      manifoldLimitsNotes: formData.manifoldLimitsNotes || null,
      loadingArmsLngCount: formData.loadingArmsLngCount ? parseInt(formData.loadingArmsLngCount) : null,
      vapourReturnAvailable: formData.vapourReturnAvailable,
      typicalLoadingRateNotes: formData.typicalLoadingRateNotes || null,
      operator: formData.operator || null,
      dataSource: formData.dataSource || null,
      lastVerifiedDate: formData.lastVerifiedDate || null,
      notes: formData.notes || null,
      isActive: true
    };

    createMutation.mutate(dataToSubmit);
  };

  // Get currently selected terminal for display in dropdown
  const selectedTerminal = terminals.find(t => t.id === formData.terminal_id);

  /**
   * Format terminal for user-friendly display
   * 
   * DISPLAY PATTERN: "Terminal Name - Country, Port"
   * Example: "Ras Laffan Terminal - Qatar, Ras Laffan"
   * 
   * LEGACY COMPATIBILITY:
   * Handles both new countryId relationship and legacy legacyCountryName field
   * This dual approach supports gradual migration from legacy data structure
   */
  const getTerminalDisplay = (terminal) => {
    const country = terminal.country || terminal.legacyCountryName || '';
    const port = terminal.port || '';
    return { country, port, fullDisplay: `${terminal.name} - ${country}${port ? `, ${port}` : ''}` };
  };

  /**
   * Filter terminals for searchable dropdown
   * 
   * SEARCH SCOPE:
   * - Terminal name (most common search)
   * - Country name (useful when many terminals exist)
   * - Port name (useful for large port cities)
   * 
   * Case-insensitive matching for better UX
   */
  const filteredTerminals = terminals.filter(terminal => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const display = getTerminalDisplay(terminal);
    return (
      terminal.name.toLowerCase().includes(query) ||
      display.country.toLowerCase().includes(query) ||
      display.port.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Berth</h1>
          <p className="text-gray-600 mt-1">Create a new berth configuration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Berth Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
               <Label className="text-gray-700">Terminal *</Label>
               <Popover open={open} onOpenChange={setOpen}>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     role="combobox"
                     aria-expanded={open}
                     disabled={!!preselectedTerminalId}
                     className="w-full justify-between bg-blue-50 border-blue-300 text-gray-900"
                  >
                    {selectedTerminal
                      ? getTerminalDisplay(selectedTerminal).fullDisplay
                      : "Select terminal..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search terminals..." 
                      className="h-9"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandEmpty>No terminal found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredTerminals.map((terminal) => {
                        const display = getTerminalDisplay(terminal);
                        return (
                          <CommandItem
                            key={terminal.id}
                            value={`${terminal.name} ${display.country} ${display.port}`}
                            onSelect={() => {
                              setFormData({ ...formData, terminal_id: terminal.id });
                              setOpen(false);
                            }}
                          >
                            <div>
                              <p className="font-medium">{terminal.name}</p>
                              <p className="text-xs text-gray-600">
                                {display.country}{display.port ? `, ${display.port}` : ''}
                              </p>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity and Service</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="berthCode" className="text-gray-700">Berth Code *</Label>
                  <Input
                    id="berthCode"
                    value={formData.berthCode}
                    onChange={(e) => setFormData({ ...formData, berthCode: e.target.value })}
                    className="bg-blue-50 border-blue-300 text-gray-900"
                    placeholder="e.g., LNG1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="berthName" className="text-gray-700">Berth Name</Label>
                  <Input
                    id="berthName"
                    value={formData.berthName}
                    onChange={(e) => setFormData({ ...formData, berthName: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., Ras Laffan LNG Berth 1"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="berthType" className="text-gray-700">Berth Type</Label>
                  <Select value={formData.berthType} onValueChange={(value) => setFormData({ ...formData, berthType: value })}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jetty">Jetty</SelectItem>
                      <SelectItem value="Quay">Quay</SelectItem>
                      <SelectItem value="SPM">SPM</SelectItem>
                      <SelectItem value="Dolphin">Dolphin</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Products</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-white border-gray-300 text-gray-900"
                      >
                        <span className="truncate">
                          {formData.productTypeRefIds.length > 0
                            ? formData.productTypeRefIds.map(id => productTypes.find(pt => pt.id === id)?.code).filter(Boolean).join(', ')
                            : 'Select products...'}
                        </span>
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2" align="start">
                      <div className="space-y-1">
                        {productTypes.filter(pt => pt.isActive).map(pt => (
                          <div
                            key={pt.id}
                            onClick={() => {
                              const isSelected = formData.productTypeRefIds.includes(pt.id);
                              setFormData({
                                ...formData,
                                productTypeRefIds: isSelected
                                  ? formData.productTypeRefIds.filter(id => id !== pt.id)
                                  : [...formData.productTypeRefIds, pt.id]
                              });
                            }}
                            className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                              formData.productTypeRefIds.includes(pt.id)
                                ? 'bg-cyan-600 text-white'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox checked={formData.productTypeRefIds.includes(pt.id)} />
                              <span>{pt.code} - {pt.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedTerminal?.productTypeRefId && (
                    <p className="text-xs text-gray-600">
                      Terminal default: {productTypes.find(pt => pt.id === selectedTerminal.productTypeRefId)?.code || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="status" className="text-gray-700">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Under Construction">Under Construction</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compatibility and Limits</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLOAM" className="text-gray-700">Max LOA (m)</Label>
                  <Input
                    id="maxLOAM"
                    type="number"
                    step="0.01"
                    value={formData.maxLOAM}
                    onChange={(e) => setFormData({ ...formData, maxLOAM: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., 333"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBeamM" className="text-gray-700">Max Beam (m)</Label>
                  <Input
                    id="maxBeamM"
                    type="number"
                    step="0.01"
                    value={formData.maxBeamM}
                    onChange={(e) => setFormData({ ...formData, maxBeamM: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., 53"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="maxArrivalDraftM" className="text-gray-700">Max Arrival Draft (m)</Label>
                  <Input
                    id="maxArrivalDraftM"
                    type="number"
                    step="0.01"
                    value={formData.maxArrivalDraftM}
                    onChange={(e) => setFormData({ ...formData, maxArrivalDraftM: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., 12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxArrivalDisplacementT" className="text-gray-700">Max Arrival Displacement (t)</Label>
                  <Input
                    id="maxArrivalDisplacementT"
                    type="number"
                    step="0.01"
                    value={formData.maxArrivalDisplacementT}
                    onChange={(e) => setFormData({ ...formData, maxArrivalDisplacementT: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., 105000"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="qmaxCapable" checked={formData.qmaxCapable} onCheckedChange={(c) => setFormData({ ...formData, qmaxCapable: c })} />
                  <Label htmlFor="qmaxCapable" className="cursor-pointer">Q-Max Capable</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="qflexCapable" checked={formData.qflexCapable} onCheckedChange={(c) => setFormData({ ...formData, qflexCapable: c })} />
                  <Label htmlFor="qflexCapable" className="cursor-pointer">Q-Flex Capable</Label>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="maxCargoCapacityM3" className="text-gray-700">Max Cargo Capacity (m³)</Label>
                <Input
                  id="maxCargoCapacityM3"
                  type="number"
                  step="0.01"
                  value={formData.maxCargoCapacityM3}
                  onChange={(e) => setFormData({ ...formData, maxCargoCapacityM3: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="e.g., 266000"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="manifoldLimitsNotes" className="text-gray-700">Manifold Limits Notes</Label>
                <Textarea
                  id="manifoldLimitsNotes"
                  value={formData.manifoldLimitsNotes}
                  onChange={(e) => setFormData({ ...formData, manifoldLimitsNotes: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                  rows={2}
                  placeholder="Notes on manifold limits..."
                />
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Loading Interface</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loadingArmsLngCount" className="text-gray-700">LNG Loading Arms Count</Label>
                  <Input
                    id="loadingArmsLngCount"
                    type="number"
                    step="1"
                    value={formData.loadingArmsLngCount}
                    onChange={(e) => setFormData({ ...formData, loadingArmsLngCount: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="vapourReturnAvailable" checked={formData.vapourReturnAvailable} onCheckedChange={(c) => setFormData({ ...formData, vapourReturnAvailable: c })} />
                  <Label htmlFor="vapourReturnAvailable" className="cursor-pointer">Vapour Return Available</Label>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="typicalLoadingRateNotes" className="text-gray-700">Typical Loading Rate Notes</Label>
                <Textarea
                  id="typicalLoadingRateNotes"
                  value={formData.typicalLoadingRateNotes}
                  onChange={(e) => setFormData({ ...formData, typicalLoadingRateNotes: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                  rows={2}
                  placeholder="Notes on typical loading rates..."
                />
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operator" className="text-gray-700">Operator</Label>
                  <Input
                    id="operator"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., QatarEnergy LNG"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataSource" className="text-gray-700">Data Source</Label>
                  <Input
                    id="dataSource"
                    value={formData.dataSource}
                    onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., Terminal website"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="lastVerifiedDate" className="text-gray-700">Last Verified Date</Label>
                <Input
                  id="lastVerifiedDate"
                  type="date"
                  value={formData.lastVerifiedDate}
                  onChange={(e) => setFormData({ ...formData, lastVerifiedDate: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700">General Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('Berths'))}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Berth'}
          </Button>
        </div>
      </form>
    </div>
  );
}