/**
 * Add Vessel Page (Fleet Management)
 * 
 * PURPOSE:
 * Simplified vessel registration form capturing essential identity and specifications.
 * Vessels can be enhanced with detailed specifications via EditVessel after creation.
 * 
 * DESIGN PHILOSOPHY - MINIMAL INITIAL DATA:
 * 
 * Create flow captures ONLY critical fields:
 * - Vessel name (identity)
 * - IMO number (global unique identifier)
 * - Vessel type (classification)
 * - Basic dimensions (LOA, beam, draft, cargo capacity)
 * - Ownership/operator/class society
 * - User-defined fields (if configured)
 * 
 * RATIONALE:
 * - Get vessel into system quickly
 * - Reduce friction for initial registration
 * - Detailed specs can be added via comprehensive EditVessel form
 * - 80/20 rule: 20% of fields provide 80% of value initially
 * 
 * CONTRAST WITH EDITVESSEL:
 * AddVessel: ~10 fields, single card, fast
 * EditVessel: ~60 fields, multi-tab, comprehensive
 * 
 * SYSTEM TAG FILTERING (lines 44-76):
 * 
 * COMPANY ROLE-BASED FILTERING:
 * 
 * Classification Society Dropdown (lines 59-66):
 * - Shows only companies tagged with "CLASS_SOCIETY"
 * - Examples: DNV, Lloyd's Register, ABS, Bureau Veritas
 * - SystemTag.code = 'CLASS_SOCIETY' identifies these companies
 * - Prevents selecting ship owners in class society field (data quality)
 * 
 * Owner/Operator Dropdown (lines 68-76):
 * - Shows only companies tagged with "SHIP_OWNER_OPERATOR_MANAGER"
 * - Shipping companies, vessel operators, technical managers
 * - Prevents selecting port authorities in owner field
 * 
 * TAG-DRIVEN UI PATTERN:
 * UI dropdowns filter based on SystemTag assignments.
 * No hardcoded company lists.
 * Adding new class society = assign tag to company → appears in dropdown.
 * 
 * ALTERNATIVE REJECTED:
 * Using Company.type field alone.
 * Problem: Company might be BOTH owner AND authority.
 * Tags support multi-role better than single enum.
 * 
 * UDF SYSTEM INTEGRATION (lines 27, 76-80, 96-113, 339-351):
 * 
 * User-Defined Fields (UDF01, UDF02):
 * - Configurable custom fields per tenant
 * - UdfConfiguration defines if visible, label, behavior
 * - UdfListValue provides dropdown options (if createList enabled)
 * 
 * UDF01 TYPICAL USE:
 * - Configured as dropdown in many deployments
 * - Example labels: "Project", "Fleet Group", "Charter Status"
 * - Values managed in UdfListValue entity
 * 
 * UDF02 TYPICAL USE:
 * - Often free-text field
 * - Example labels: "Internal Code", "Reference Number"
 * - No dropdown (createList = false)
 * 
 * VISIBILITY LOGIC:
 * Only shown if UdfConfiguration has label set (not null/empty).
 * Empty label = hidden field (UDF not in use for this tenant).
 * 
 * IMO NUMBER VALIDATION:
 * 
 * Field marked required (line 181).
 * IMO = International Maritime Organization number.
 * 7-digit globally unique identifier for vessels.
 * 
 * FORMAT: 9876543 (7 digits, often starts with 9)
 * 
 * TODO - ENHANCED VALIDATION:
 * - Check 7-digit length
 * - Validate checksum (IMO has built-in validation digit)
 * - Check uniqueness in database
 * Currently: Basic required field only
 * 
 * POST-SUCCESS NAVIGATION (lines 128-131):
 * Redirects to VesselDetail of newly created vessel.
 * User can immediately enhance with full specifications.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Ship, 
  Save,
  ArrowLeft,
  Anchor,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from '../components/ui/SearchableSelect';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useUdfConfigurations, getVisibleUdfConfigs } from '../components/vessel/VesselUdfFields';
import VesselTypeSelector from '../components/vessel/VesselTypeSelector';

export default function AddVessel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: vesselTypeRefs = [] } = useQuery({
    queryKey: ['vesselTypeRefs'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: systemTags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['companySystemTagAssignments'],
    queryFn: () => base44.entities.CompanySystemTagAssignment.list()
  });

  // Find system tags
  const classificationSocietyTag = systemTags.find(t => t.code === 'CLASS_SOCIETY');
  const shipOwnerOperatorTag = systemTags.find(t => t.code === 'SHIP_OWNER_OPERATOR_MANAGER');

  // Filter class societies
  const classSocietyCompanies = classificationSocietyTag
    ? companies.filter(c => {
        const hasTag = tagAssignments.some(a => 
          a.companyId === c.id && a.systemTagId === classificationSocietyTag.id
        );
        return hasTag && c.isActive;
      })
    : [];

  // Filter ship owners/operators/managers
  const shipOwnerOperatorCompanies = shipOwnerOperatorTag
    ? companies.filter(c => {
        const hasTag = tagAssignments.some(a => 
          a.companyId === c.id && a.systemTagId === shipOwnerOperatorTag.id
        );
        return hasTag && c.isActive;
      })
    : [];
  
  const [vessel, setVessel] = useState({
    name: '',
    imoNumber: '',
    vesselTypeRefId: '',
    cargoCapacity_m3: '',
    loa_m: '',
    width_m: '',
    beam_m: '',
    maxDraft_m: '',
    yearBuilt: '',
    ownerCompanyId: '',
    operatorCompanyId: '',
    classSocietyCompanyId: '',
    status: 'Active',
    udf01: '',
    udf02: ''
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

  const createVesselMutation = useMutation({
    mutationFn: async () => {
      const vesselData = {
        ...vessel,
        cargoCapacity_m3: vessel.cargoCapacity_m3 ? parseFloat(vessel.cargoCapacity_m3) : null,
        loa_m: vessel.loa_m ? parseFloat(vessel.loa_m) : null,
        width_m: vessel.width_m ? parseFloat(vessel.width_m) : null,
        beam_m: vessel.beam_m ? parseFloat(vessel.beam_m) : null,
        maxDraft_m: vessel.maxDraft_m ? parseFloat(vessel.maxDraft_m) : null,
        yearBuilt: vessel.yearBuilt ? parseInt(vessel.yearBuilt) : null
      };
      return await base44.entities.Vessel.create(vesselData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      toast.success('Vessel registered successfully');
      navigate(createPageUrl(`VesselDetail?id=${data.id}`));
    },
    onError: (error) => {
      toast.error('Failed to register vessel');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createVesselMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Vessels')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Vessel</h1>
          <p className="text-gray-600 mt-1">Add a new LNG vessel to your fleet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-400" />
              Vessel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Vessel Name *</Label>
                <Input
                  required
                  value={vessel.name}
                  onChange={(e) => setVessel({...vessel, name: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="e.g., LNG Pioneer"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">IMO Number *</Label>
                <Input
                  required
                  value={vessel.imoNumber}
                  onChange={(e) => setVessel({...vessel, imoNumber: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900 text-left"
                  placeholder="e.g., 9876543"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <VesselTypeSelector
                  vesselTypeRefs={vesselTypeRefs}
                  selectedTypeId={vessel.vesselTypeRefId}
                  onTypeChange={(v) => setVessel({...vessel, vesselTypeRefId: v})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Status</Label>
                <Select 
                  value={vessel.status}
                  onValueChange={(v) => setVessel({...vessel, status: v})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Active" className="text-gray-900">Active</SelectItem>
                    <SelectItem value="Laid Up" className="text-gray-900">Laid Up</SelectItem>
                    <SelectItem value="Under Repair" className="text-gray-900">Under Repair</SelectItem>
                    <SelectItem value="Scrapped" className="text-gray-900">Scrapped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-400" />
              Dimensions & Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
               <Label className="text-gray-700">Cargo Capacity (m³)</Label>
               <Input
                 type="number"
                 value={vessel.cargoCapacity_m3}
                 onChange={(e) => setVessel({...vessel, cargoCapacity_m3: e.target.value})}
                 className="bg-white border-gray-300 text-gray-900 text-right"
                 placeholder="e.g., 170000"
               />
              </div>
              <div className="space-y-2">
               <Label className="text-gray-700">LOA (m)</Label>
               <Input
                 type="number"
                 step="0.1"
                 value={vessel.loa_m}
                 onChange={(e) => setVessel({...vessel, loa_m: e.target.value})}
                 className="bg-white border-gray-300 text-gray-900 text-right"
                 placeholder="e.g., 295.5"
               />
              </div>
              <div className="space-y-2">
               <Label className="text-gray-700">Width (m)</Label>
               <Input
                 type="number"
                 step="0.1"
                 value={vessel.width_m}
                 onChange={(e) => setVessel({...vessel, width_m: e.target.value})}
                 className="bg-white border-gray-300 text-gray-900 text-right"
                 placeholder="e.g., 45.0"
               />
              </div>
              <div className="space-y-2">
               <Label className="text-gray-700">Beam (m)</Label>
               <Input
                 type="number"
                 step="0.1"
                 value={vessel.beam_m}
                 onChange={(e) => setVessel({...vessel, beam_m: e.target.value})}
                 className="bg-white border-gray-300 text-gray-900 text-right"
                 placeholder="e.g., 45.0"
               />
              </div>
              <div className="space-y-2">
               <Label className="text-gray-700">Max Draft (m)</Label>
               <Input
                 type="number"
                 step="0.1"
                 value={vessel.maxDraft_m}
                 onChange={(e) => setVessel({...vessel, maxDraft_m: e.target.value})}
                 className="bg-white border-gray-300 text-gray-900 text-right"
                 placeholder="e.g., 12.5"
               />
              </div>
              </div>
              <div className="grid md:grid-cols-1 gap-4">
              <div className="space-y-2">
               <Label className="text-gray-700">Year Built</Label>
               <Input
                 type="number"
                 value={vessel.yearBuilt}
                 onChange={(e) => setVessel({...vessel, yearBuilt: e.target.value})}
                 className="bg-white border-gray-300 text-gray-900 text-right"
                 placeholder="e.g., 2020"
               />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ownership */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Ownership & Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Owner Company</Label>
                <SearchableSelect
                  value={vessel.ownerCompanyId}
                  onValueChange={(value) => setVessel({...vessel, ownerCompanyId: value})}
                  options={shipOwnerOperatorCompanies.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Select owner company"
                  searchPlaceholder="Search companies..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Operator Company</Label>
                <SearchableSelect
                  value={vessel.operatorCompanyId}
                  onValueChange={(value) => setVessel({...vessel, operatorCompanyId: value})}
                  options={shipOwnerOperatorCompanies.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Select operator company"
                  searchPlaceholder="Search companies..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Class Society Company</Label>
                <SearchableSelect
                  value={vessel.classSocietyCompanyId}
                  onValueChange={(value) => setVessel({...vessel, classSocietyCompanyId: value})}
                  options={classSocietyCompanies.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Select class society"
                  searchPlaceholder="Search companies..."
                />
              </div>
              {udf02Config && (
                <div className="space-y-2">
                  <Label className="text-gray-700">{udf02Config.label}</Label>
                  <Input
                    value={vessel.udf02 || ''}
                    onChange={(e) => setVessel({...vessel, udf02: e.target.value})}
                    maxLength={udf02Config.maxLength}
                    placeholder={`Enter ${udf02Config.label}`}
                    className="bg-white border-gray-300"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('Vessels')}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit"
            disabled={createVesselMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {createVesselMutation.isPending ? 'Registering...' : 'Register Vessel'}
          </Button>
        </div>
      </form>
    </div>
  );
}