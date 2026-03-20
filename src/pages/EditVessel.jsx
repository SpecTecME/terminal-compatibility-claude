/**
 * Edit Vessel Page (Comprehensive Specification Management)
 * 
 * PURPOSE:
 * Multi-tab comprehensive form for updating all vessel specifications.
 * Critical for maintaining accurate vessel data used in terminal compatibility calculations.
 * 
 * ARCHITECTURAL PATTERN - TABBED ORGANIZATION:
 * 
 * 7 TABS organizing 60+ vessel fields:
 * 
 * 1. IDENTITY TAB:
 *    - Core identification (name, IMO, MMSI, call sign)
 *    - Vessel type classification
 *    - Registry and classification society
 *    - Ownership relationships (owner/operator/class)
 *    - User-defined fields
 * 
 * 2. DIMENSIONS TAB:
 *    - Principal dimensions (LOA, beam, depth, LBP)
 *    - Draft variations (design, summer, max, air)
 *    - Tonnage measurements (GT, NT, DWT)
 *    - Displacement calculations
 * 
 * 3. CARGO TAB:
 *    - Containment system type (Membrane/Moss/IHI)
 *    - Cargo capacity (m³)
 *    - Loading/discharge rates
 *    - Vapour return capability
 *    - ESD/ERC emergency systems
 * 
 * 4. MANIFOLD TAB:
 *    - Berthing side supported
 *    - Manifold counts (LNG + vapour)
 *    - Height ranges (critical for terminal matching)
 *    - Spacing/pitch (ISO 28460 compliance)
 *    - Flange specifications
 *    - ERC manufacturer/model
 * 
 * 5. MOORING TAB:
 *    - Equipment (winches, total lines)
 *    - Line plan (head, breast, spring, stern counts)
 *    - Line characteristics (type, MBL, brake capacity)
 *    - Chock/fairlead details
 * 
 * 6. FENDER TAB:
 *    - Contact zone preferences
 *    - Point load limits
 *    - Preferred fender types
 *    - Shell plating restrictions
 * 
 * 7. ENVIRONMENTAL TAB:
 *    - Wind limits (berthing vs alongside)
 *    - Current limits
 *    - Wave height restrictions
 *    - Tide range requirements
 *    - Tug requirements
 * 
 * RATIONALE:
 * - Prevents overwhelming single-form UX
 * - Groups related specifications logically
 * - Mirrors industry documentation structure (vessel particulars)
 * - Enables focused data entry by domain area
 * 
 * COMPANY FILTERING (lines 46-74):
 * Same tag-based filtering as AddVessel.
 * Shows only appropriate companies for each role.
 * 
 * STATE MANAGEMENT PATTERN (lines 95-123):
 * 
 * updateField helper function (lines 121-123):
 * Simplifies field updates across all tabs.
 * Avoids repetitive setFormData({...prev, field: value}) calls.
 * Clean API: updateField('loa_m', 295.5)
 * 
 * INITIAL STATE POPULATION (lines 97-101):
 * Loads existing vessel data into form state.
 * useEffect watches vessel query result.
 * Form pre-populated when vessel loads.
 * 
 * TYPE CONVERSIONS (lines 104):
 * Database stores numbers as floats/ints.
 * Form shows as strings (Input value).
 * updateField converts back on change.
 * Examples:
 * - parseFloat for dimensions
 * - parseInt for counts/years
 * 
 * UDF DROPDOWN SUPPORT (lines 76-93, 200-228):
 * 
 * UDF01 can be configured as dropdown OR text field:
 * - If createList = true → Show Select dropdown
 * - If createList = false → Show Input text field
 * 
 * UdfListValue records provide dropdown options:
 * - Filtered by module='Vessel' AND udfCode='UDF01'
 * - Sorted by sortOrder
 * - Only active values shown
 * 
 * Dynamic UI based on configuration.
 * Same component handles both modes.
 * 
 * VALIDATION SCOPE:
 * 
 * REQUIRED FIELDS:
 * - Vessel name (line 175, required attribute)
 * - Most other fields optional (incremental data entry)
 * 
 * NUMERIC CONSTRAINTS:
 * - step="0.01" for precise dimensions
 * - min/max on yearBuilt (1960 to current+1)
 * - Prevents obviously invalid inputs
 * 
 * NO COMPLEX VALIDATION:
 * No cross-field validation (e.g., beam < LOA).
 * Trust user expertise for maritime specs.
 * System validates during compatibility checks, not data entry.
 * 
 * LEGACY FIELD SUPPORT:
 * Multiple dimension fields for backward compatibility:
 * - loa_m (new) and length_overall (legacy)
 * - beam_m (new) and width_m (also used)
 * - Displays new fields, stores both
 * 
 * SAVE BEHAVIOR (lines 103-114):
 * Updates vessel record.
 * Invalidates both single-vessel and fleet queries.
 * Navigates back to VesselDetail (not list).
 * User immediately sees updated vessel.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Ship, Save, Flag, Ruler, Boxes, Plug, Anchor, Gauge, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '../components/ui/SearchableSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useUdfConfigurations, getVisibleUdfConfigs } from '../components/vessel/VesselUdfFields';
import VesselTypeSelector from '../components/vessel/VesselTypeSelector';

export default function EditVessel() {
  const urlParams = new URLSearchParams(window.location.search);
  const vesselId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: vessel, isLoading } = useQuery({
    queryKey: ['vessel', vesselId],
    queryFn: () => base44.entities.Vessel.filter({ id: vesselId }).then(r => r[0]),
    enabled: !!vesselId
  });

  const { data: vesselTypeRefs = [] } = useQuery({
    queryKey: ['vesselTypeRefs'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: systemTags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const { data: companyTagAssignments = [] } = useQuery({
    queryKey: ['companySystemTagAssignments'],
    queryFn: () => base44.entities.CompanySystemTagAssignment.list()
  });

  // Find system tags
  const classificationSocietyTag = systemTags.find(t => t.code === 'CLASS_SOCIETY');
  const shipOwnerOperatorTag = systemTags.find(t => t.code === 'SHIP_OWNER_OPERATOR_MANAGER');
  
  // Filter companies that have Classification Society tag
  const classificationSocieties = companies.filter(company => {
    if (!classificationSocietyTag) return false;
    return companyTagAssignments.some(
      assignment => assignment.companyId === company.id && assignment.systemTagId === classificationSocietyTag.id
    );
  });

  // Filter companies that have Ship Owner/Operator/Manager tag
  const shipOwnerOperatorCompanies = companies.filter(company => {
    if (!shipOwnerOperatorTag) return false;
    return companyTagAssignments.some(
      assignment => assignment.companyId === company.id && assignment.systemTagId === shipOwnerOperatorTag.id
    );
  });

  const { data: udfConfigs = [] } = useUdfConfigurations('Vessel');
  const visibleUdfConfigs = getVisibleUdfConfigs(udfConfigs);
  
  const udf01Config = visibleUdfConfigs.find(c => c.udfCode === 'UDF01');
  const udf02Config = visibleUdfConfigs.find(c => c.udfCode === 'UDF02');

  const { data: udf01ListValues = [] } = useQuery({
    queryKey: ['udfListValues', 'Vessel', 'UDF01'],
    queryFn: async () => {
      const values = await base44.entities.UdfListValue.filter({
        module: 'Vessel',
        udfCode: 'UDF01',
        isActive: true
      });
      return values.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    },
    enabled: udf01Config?.createList
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (vessel) {
      setFormData(vessel);
    }
  }, [vessel]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Vessel.update(vesselId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vessel', vesselId]);
      queryClient.invalidateQueries(['vessels']);
      toast.success('Vessel updated successfully');
      window.location.href = createPageUrl(`VesselDetail?id=${vesselId}`);
    },
    onError: (error) => {
      toast.error('Failed to update vessel: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading || !vessel) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl(`VesselDetail?id=${vesselId}`)}>
            <Button type="button" variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vessel</h1>
            <p className="text-gray-600 mt-1">{vessel.name}</p>
          </div>
        </div>
        <Button type="submit" disabled={updateMutation.isPending} className="bg-gradient-to-r from-cyan-500 to-blue-600">
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="identity" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="identity"><Flag className="w-4 h-4 mr-2" />Identity</TabsTrigger>
          <TabsTrigger value="dimensions"><Ruler className="w-4 h-4 mr-2" />Dimensions</TabsTrigger>
          <TabsTrigger value="cargo"><Boxes className="w-4 h-4 mr-2" />Cargo</TabsTrigger>
          <TabsTrigger value="manifold"><Plug className="w-4 h-4 mr-2" />Manifold</TabsTrigger>
          <TabsTrigger value="mooring"><Anchor className="w-4 h-4 mr-2" />Mooring</TabsTrigger>
          <TabsTrigger value="fender"><Gauge className="w-4 h-4 mr-2" />Fender</TabsTrigger>
          <TabsTrigger value="environmental"><Wind className="w-4 h-4 mr-2" />Environmental</TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Vessel Identification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Vessel Name *</Label>
                  <Input value={formData.name || ''} onChange={(e) => updateField('name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Internal ID</Label>
                  <Input value={formData.vesselInternalId || ''} onChange={(e) => updateField('vesselInternalId', e.target.value)} />
                </div>
                <div className="space-y-2">
                   <Label>IMO Number</Label>
                   <Input value={formData.imoNumber || ''} onChange={(e) => updateField('imoNumber', e.target.value)} maxLength={7} className="text-left" />
                 </div>
                <div className="space-y-2">
                  <Label>MMSI</Label>
                  <Input value={formData.mmsi || ''} onChange={(e) => updateField('mmsi', e.target.value)} maxLength={9} className="text-left" />
                </div>
                <div>
                  <VesselTypeSelector
                    vesselTypeRefs={vesselTypeRefs}
                    selectedTypeId={formData.vesselTypeRefId || ''}
                    onTypeChange={(v) => updateField('vesselTypeRefId', v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Call Sign</Label>
                  <Input value={formData.callSign || ''} onChange={(e) => updateField('callSign', e.target.value)} placeholder="Radio call sign" />
                </div>
                {udf01Config && (
                  <div className="space-y-2">
                    <Label>{udf01Config.label}</Label>
                    {udf01Config.createList ? (
                      <Select
                        value={formData.udf01 || ''}
                        onValueChange={(value) => updateField('udf01', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${udf01Config.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>-- None --</SelectItem>
                          {udf01ListValues.map((v) => (
                            <SelectItem key={v.id} value={v.value}>
                              {v.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.udf01 || ''}
                        onChange={(e) => updateField('udf01', e.target.value)}
                        maxLength={udf01Config.maxLength}
                        placeholder={`Enter ${udf01Config.label}`}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Registry & Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Flag Country</Label>
                  <SearchableSelect
                    value={formData.flagCountryId || ''}
                    onValueChange={(v) => updateField('flagCountryId', v)}
                    options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                    placeholder="Select country"
                    searchPlaceholder="Search countries..."
                  />
                </div>
                <div className="space-y-2">
                   <Label>Year Built</Label>
                   <Input type="number" value={formData.yearBuilt || ''} onChange={(e) => updateField('yearBuilt', parseInt(e.target.value))} min={1960} max={new Date().getFullYear() + 1} className="text-right" />
                 </div>
                <div className="space-y-2">
                  <Label>Owner Company</Label>
                  <SearchableSelect
                    value={formData.ownerCompanyId || ''}
                    onValueChange={(v) => updateField('ownerCompanyId', v)}
                    options={shipOwnerOperatorCompanies.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Select owner company"
                    searchPlaceholder="Search companies..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operator Company</Label>
                  <SearchableSelect
                    value={formData.operatorCompanyId || ''}
                    onValueChange={(v) => updateField('operatorCompanyId', v)}
                    options={shipOwnerOperatorCompanies.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Select operator company"
                    searchPlaceholder="Search companies..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Class Society Company</Label>
                  <SearchableSelect
                    value={formData.classSocietyCompanyId || ''}
                    onValueChange={(v) => updateField('classSocietyCompanyId', v)}
                    options={classificationSocieties.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Select class society"
                    searchPlaceholder="Search class societies..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Class Notation</Label>
                  <Input value={formData.classNotation || ''} onChange={(e) => updateField('classNotation', e.target.value)} placeholder="e.g., +1A LNGC" />
                </div>
                <div className="space-y-2">
                  <Label>Shipyard</Label>
                  <Input value={formData.shipyard || ''} onChange={(e) => updateField('shipyard', e.target.value)} placeholder="Name of shipyard" />
                </div>
                {udf02Config && (
                  <div className="space-y-2">
                    <Label>{udf02Config.label}</Label>
                    <Input
                      value={formData.udf02 || ''}
                      onChange={(e) => updateField('udf02', e.target.value)}
                      maxLength={udf02Config.maxLength}
                      placeholder={`Enter ${udf02Config.label}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dimensions Tab */}
        <TabsContent value="dimensions">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Principal Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                   <Label>LOA (m)</Label>
                   <Input type="number" step="0.01" value={formData.loa_m || ''} onChange={(e) => updateField('loa_m', parseFloat(e.target.value))} className="text-right" />
                 </div>
                <div className="space-y-2">
                  <Label>Width (m)</Label>
                  <Input type="number" step="0.01" value={formData.width_m || ''} onChange={(e) => updateField('width_m', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                   <Label>Beam (m)</Label>
                   <Input type="number" step="0.01" value={formData.beam_m || ''} onChange={(e) => updateField('beam_m', parseFloat(e.target.value))} className="text-right" />
                 </div>
                <div className="space-y-2">
                  <Label>LBP (m) <span className="text-xs text-gray-500">(Length Between Perpendiculars)</span></Label>
                  <Input type="number" step="0.01" value={formData.lbpM || ''} onChange={(e) => updateField('lbpM', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Breadth Moulded (m)</Label>
                  <Input type="number" step="0.01" value={formData.breadthMouldedM || ''} onChange={(e) => updateField('breadthMouldedM', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Moulded Depth (m)</Label>
                  <Input type="number" step="0.01" value={formData.mouldedDepthM || ''} onChange={(e) => updateField('mouldedDepthM', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Depth (m)</Label>
                  <Input type="number" step="0.01" value={formData.depth_m || ''} onChange={(e) => updateField('depth_m', parseFloat(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Draft & Displacement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Design Draft (m)</Label>
                  <Input type="number" step="0.01" value={formData.designDraft_m || ''} onChange={(e) => updateField('designDraft_m', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Summer Draft (m)</Label>
                  <Input type="number" step="0.01" value={formData.summerDraftM || ''} onChange={(e) => updateField('summerDraftM', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                   <Label>Max Draft (m)</Label>
                   <Input type="number" step="0.01" value={formData.maxDraft_m || ''} onChange={(e) => updateField('maxDraft_m', parseFloat(e.target.value))} className="text-right" />
                 </div>
                <div className="space-y-2">
                  <Label>Air Draft (m)</Label>
                  <Input type="number" step="0.01" value={formData.airDraft_m || ''} onChange={(e) => updateField('airDraft_m', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Displacement at Summer Draft (t)</Label>
                  <Input type="number" step="0.1" value={formData.displacementSummer_t || ''} onChange={(e) => updateField('displacementSummer_t', parseFloat(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Tonnage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Gross Tonnage (GT)</Label>
                  <Input type="number" step="0.01" value={formData.gt || ''} onChange={(e) => updateField('gt', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Net Tonnage ITC 69 (NT)</Label>
                  <Input type="number" step="0.01" value={formData.ntItc69 || ''} onChange={(e) => updateField('ntItc69', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Deadweight (DWT, t)</Label>
                  <Input type="number" step="0.1" value={formData.dwt || ''} onChange={(e) => updateField('dwt', parseFloat(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cargo System Tab */}
        <TabsContent value="cargo">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Cargo Containment & Capacity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Containment Type</Label>
                  <Input value={formData.cargoContainmentType || ''} onChange={(e) => updateField('cargoContainmentType', e.target.value)} placeholder="e.g., Membrane GTT Mark III" />
                </div>
                <div className="space-y-2">
                   <Label>Cargo Capacity (m³)</Label>
                   <Input type="number" step="0.01" value={formData.cargoCapacity_m3 || ''} onChange={(e) => updateField('cargoCapacity_m3', parseFloat(e.target.value))} className="text-right" />
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Loading & Discharge Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Loading Rate (m³/h)</Label>
                  <Input type="number" step="0.01" value={formData.maxLoadingRate_m3ph || ''} onChange={(e) => updateField('maxLoadingRate_m3ph', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Max Discharge Rate (m³/h)</Label>
                  <Input type="number" step="0.01" value={formData.maxDischargeRate_m3ph || ''} onChange={(e) => updateField('maxDischargeRate_m3ph', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox id="vapour" checked={formData.vapourReturnSupported || false} onCheckedChange={(c) => updateField('vapourReturnSupported', c)} />
                  <Label htmlFor="vapour" className="cursor-pointer">Vapour Return Supported</Label>
                </div>
                <div className="space-y-2">
                  <Label>ESD/ERC Type</Label>
                  <Input value={formData.esdErcType || ''} onChange={(e) => updateField('esdErcType', e.target.value)} placeholder="e.g., SIGTTO-compatible ERC" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manifold Tab */}
        <TabsContent value="manifold">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Manifold Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Berthing Side Supported</Label>
                  <Select value={formData.berthingSideSupported || ''} onValueChange={(v) => updateField('berthingSideSupported', v)}>
                    <SelectTrigger><SelectValue placeholder="Select side" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Port">Port</SelectItem>
                      <SelectItem value="Starboard">Starboard</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>LNG Manifolds (count)</Label>
                  <Input type="number" value={formData.manifoldLngCount || ''} onChange={(e) => updateField('manifoldLngCount', parseInt(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Vapour Manifolds (count)</Label>
                  <Input type="number" value={formData.manifoldVapourCount || ''} onChange={(e) => updateField('manifoldVapourCount', parseInt(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Manifold Heights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LNG Min (m)</Label>
                    <Input type="number" step="0.01" value={formData.lngManifoldHeightMin_m || ''} onChange={(e) => updateField('lngManifoldHeightMin_m', parseFloat(e.target.value))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                     <Label>LNG Max (m)</Label>
                     <Input type="number" step="0.01" value={formData.lngManifoldHeightMax_m || ''} onChange={(e) => updateField('lngManifoldHeightMax_m', parseFloat(e.target.value))} className="text-right" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vapour Min (m)</Label>
                    <Input type="number" step="0.01" value={formData.vapourManifoldHeightMin_m || ''} onChange={(e) => updateField('vapourManifoldHeightMin_m', parseFloat(e.target.value))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vapour Max (m)</Label>
                    <Input type="number" step="0.01" value={formData.vapourManifoldHeightMax_m || ''} onChange={(e) => updateField('vapourManifoldHeightMax_m', parseFloat(e.target.value))} className="text-right" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Manifold Geometry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Spacing/Pitch (mm)</Label>
                  <Input type="number" value={formData.manifoldSpacingPitch_mm || ''} onChange={(e) => updateField('manifoldSpacingPitch_mm', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Distance to Bow (m)</Label>
                  <Input type="number" step="0.01" value={formData.manifoldToBow_m || ''} onChange={(e) => updateField('manifoldToBow_m', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Distance to Stern (m)</Label>
                  <Input type="number" step="0.01" value={formData.manifoldToStern_m || ''} onChange={(e) => updateField('manifoldToStern_m', parseFloat(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Flanges & ERC</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>LNG Flange Size</Label>
                  <Input value={formData.flangeSizeLng_in || ''} onChange={(e) => updateField('flangeSizeLng_in', e.target.value)} placeholder='e.g., 16"' />
                </div>
                <div className="space-y-2">
                  <Label>Flange Rating</Label>
                  <Input value={formData.flangeRating || ''} onChange={(e) => updateField('flangeRating', e.target.value)} placeholder="e.g., ANSI 150" />
                </div>
                <div className="space-y-2">
                  <Label>ERC Manufacturer/Model</Label>
                  <Input value={formData.ercManufacturerModel || ''} onChange={(e) => updateField('ercManufacturerModel', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mooring Tab */}
        <TabsContent value="mooring">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Mooring Equipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mooring Winches</Label>
                  <Input type="number" value={formData.mooringWinches || ''} onChange={(e) => updateField('mooringWinches', parseInt(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Total Mooring Lines</Label>
                  <Input type="number" value={formData.mooringLinesTotal || ''} onChange={(e) => updateField('mooringLinesTotal', parseInt(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Line Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Head Lines</Label>
                    <Input type="number" value={formData.headLines || ''} onChange={(e) => updateField('headLines', parseInt(e.target.value))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <Label>Breast (Fwd)</Label>
                    <Input type="number" value={formData.breastLinesForward || ''} onChange={(e) => updateField('breastLinesForward', parseInt(e.target.value))} className="text-right" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Springs (Fwd)</Label>
                    <Input type="number" value={formData.springsForward || ''} onChange={(e) => updateField('springsForward', parseInt(e.target.value))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stern Lines</Label>
                    <Input type="number" value={formData.sternLines || ''} onChange={(e) => updateField('sternLines', parseInt(e.target.value))} className="text-right" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Breast (Aft)</Label>
                    <Input type="number" value={formData.breastLinesAft || ''} onChange={(e) => updateField('breastLinesAft', parseInt(e.target.value))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <Label>Springs (Aft)</Label>
                    <Input type="number" value={formData.springsAft || ''} onChange={(e) => updateField('springsAft', parseInt(e.target.value))} className="text-right" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Line Characteristics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Line Type</Label>
                  <Input value={formData.lineType || ''} onChange={(e) => updateField('lineType', e.target.value)} placeholder="e.g., HMPE" />
                </div>
                <div className="space-y-2">
                  <Label>MBL (kN)</Label>
                  <Input type="number" step="0.01" value={formData.lineMBL_kN || ''} onChange={(e) => updateField('lineMBL_kN', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Brake Holding Capacity (kN)</Label>
                  <Input type="number" step="0.01" value={formData.brakeHoldingCapacity_kN || ''} onChange={(e) => updateField('brakeHoldingCapacity_kN', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Chock Type</Label>
                  <Input value={formData.chockType || ''} onChange={(e) => updateField('chockType', e.target.value)} placeholder="e.g., Panama" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Fairlead & Chock Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Position Notes</Label>
                  <Textarea value={formData.fairleadChockPositionsNotes || ''} onChange={(e) => updateField('fairleadChockPositionsNotes', e.target.value)} rows={6} placeholder="Station numbers, coordinates, or other position details" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fender Tab */}
        <TabsContent value="fender">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Fender Contact & Interface</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contact Zone</Label>
                  <Input value={formData.fenderContactZone || ''} onChange={(e) => updateField('fenderContactZone', e.target.value)} placeholder="e.g., Midship" />
                </div>
                <div className="space-y-2">
                  <Label>Point Load Limit (kN)</Label>
                  <Input type="number" step="0.01" value={formData.fenderPointLoadLimit_kN || ''} onChange={(e) => updateField('fenderPointLoadLimit_kN', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Fender Type</Label>
                  <Input value={formData.preferredFenderType || ''} onChange={(e) => updateField('preferredFenderType', e.target.value)} placeholder="e.g., Cone, Cell" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Shell Plating Restrictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Restrictions</Label>
                  <Textarea value={formData.shellPlatingRestrictions || ''} onChange={(e) => updateField('shellPlatingRestrictions', e.target.value)} rows={6} placeholder="Describe any shell plating restrictions" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Environmental Tab */}
        <TabsContent value="environmental">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Wind Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Wind During Berthing (kn)</Label>
                  <Input type="number" step="0.1" value={formData.maxWindBerthing_kn || ''} onChange={(e) => updateField('maxWindBerthing_kn', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Max Wind Alongside (kn)</Label>
                  <Input type="number" step="0.1" value={formData.maxWindAlongside_kn || ''} onChange={(e) => updateField('maxWindAlongside_kn', parseFloat(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Current & Wave Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Current Alongside (kn)</Label>
                  <Input type="number" step="0.1" value={formData.maxCurrentAlongside_kn || ''} onChange={(e) => updateField('maxCurrentAlongside_kn', parseFloat(e.target.value))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>Max Wave Height (m)</Label>
                  <Input type="number" step="0.1" value={formData.maxWaveHeight_m || ''} onChange={(e) => updateField('maxWaveHeight_m', parseFloat(e.target.value))} className="text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Tide Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min (m)</Label>
                    <Input type="number" step="0.1" value={formData.tideRangeMin_m || ''} onChange={(e) => updateField('tideRangeMin_m', parseFloat(e.target.value))} className="text-right" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max (m)</Label>
                    <Input type="number" step="0.1" value={formData.tideRangeMax_m || ''} onChange={(e) => updateField('tideRangeMax_m', parseFloat(e.target.value))} className="text-right" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Tug Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Requirements Notes</Label>
                  <Textarea value={formData.tugRequirementsNotes || ''} onChange={(e) => updateField('tugRequirementsNotes', e.target.value)} rows={4} placeholder="e.g., As per terminal" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}