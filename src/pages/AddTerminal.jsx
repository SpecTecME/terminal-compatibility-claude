import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import CountrySelector from '../components/ui/CountrySelector';
import SearchableSelect from '../components/ui/SearchableSelect';
import { 
  Building2, 
  MapPin, 
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Anchor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

/**
 * Add Terminal Page
 * 
 * PURPOSE:
 * Creates new terminal records with optional child berths in a single transaction.
 * Terminals are the primary operational entities in the facility hierarchy.
 * 
 * ARCHITECTURAL DECISIONS:
 * 
 * 1. BATCH CREATE PATTERN:
 *    - Terminal + Berths created in single workflow
 *    - Berths optional (can add 0, 1, or many)
 *    - Simplifies initial setup for new facilities
 *    - Alternative: Create terminal first, then add berths separately
 *    - This approach chosen for UX efficiency
 * 
 * 2. TERMINAL COMPLEX LINKAGE:
 *    - Optional parent relationship (terminalComplexId)
 *    - Can be pre-filled from TerminalComplexDetail page (?terminalComplexId=x)
 *    - Also supports legacy ?siteId parameter (backward compatibility)
 *    - Creates both new (terminalComplexId) and legacy (siteId) references
 * 
 * 3. PRODUCT TYPE AS OPTIONAL:
 *    - Not all terminals have a clear primary product at creation time
 *    - Can be set later during configuration
 *    - Affects berth defaults when creating child berths
 * 
 * 4. GEOGRAPHIC REQUIREMENTS:
 *    - Latitude/Longitude MANDATORY
 *    - Required for world map display and distance calculations
 *    - Country optional but recommended
 *    - Port city for display grouping
 * 
 * 5. DUAL COUNTRY FIELDS SUPPORT:
 *    - countryIso2/countryName (legacy string-based)
 *    - Will migrate to countryId relationship
 *    - Currently supports both for transition period
 * 
 * 6. INLINE BERTH CREATION:
 *    - Dynamic berth form array
 *    - Add/remove berths before submission
 *    - All berths created with Promise.all (parallel)
 *    - Links berths to newly-created terminal via ID
 * 
 * NAVIGATION CONTEXT:
 * - Can be accessed from Terminals list (standalone)
 * - Can be accessed from TerminalComplex detail (pre-filled parent)
 * - On success, redirects to TerminalDetail of newly created terminal
 */
export default function AddTerminal() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const urlParams = new URLSearchParams(window.location.search);

   // Check for pre-filled terminal complex (from parent detail page)
   // Supports both new parameter name and legacy siteId
   const prefilledComplexId = urlParams.get('terminalComplexId') || urlParams.get('siteId');

   // Refs for required fields to enable proper focus
   const refTerminalName = useRef(null);
   const refProducts = useRef(null);
   const refTerminalType = useRef(null);
   const refCountry = useRef(null);
   const refLatitude = useRef(null);
   const refLongitude = useRef(null);

   // Field-level error state for inline messages
   const [fieldErrors, setFieldErrors] = useState({});

   const [terminal, setTerminal] = useState({
    name: '',
    terminalComplexId: prefilledComplexId || '',
    productTypeRefId: '',
    countryId: '',
    countryIso2: '',
    countryName: '',
    port: '',
    latitude: '',
    longitude: '',
    capacity_mtpa: '',
    terminal_type: '',  // Start empty so validation catches it
    operator: '',
    status: 'Operational',
    contact_email: '',
    contact_phone: '',
    notes: ''
  });

  const { data: complexes = [] } = useQuery({
    queryKey: ['terminalComplexes'],
    queryFn: () => base44.entities.TerminalComplex.list()
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: selectedComplex } = useQuery({
    queryKey: ['terminalComplex', terminal.terminalComplexId],
    queryFn: () => base44.entities.TerminalComplex.filter({ id: terminal.terminalComplexId }).then(r => r[0]),
    enabled: !!terminal.terminalComplexId
  });

  const [berths, setBerths] = useState([]);

  /**
   * Create terminal with optional child berths in single transaction
   * 
   * DATA TRANSFORMATION:
   * 1. Generate UUIDs for publicId (cross-environment portability)
   * 2. Look up publicIds for referenced entities (complex, product type)
   * 3. Populate both new and legacy field names:
   *    - terminalComplexId AND siteId (both point to same entity)
   *    - terminalComplexPublicId AND sitePublicId
   * 4. Convert string inputs to proper types (parseFloat for coordinates/capacity)
   * 
   * TWO-PHASE CREATE:
   * Phase 1: Create terminal record
   * Phase 2: Create all berths in parallel (if any defined)
   * 
   * BERTH LINKAGE:
   * - Uses createdTerminal.id (just-assigned database ID)
   * - Also stores publicId for migration portability
   * - Berths inherit tenantId from parent terminal
   * 
   * LEGACY COMPATIBILITY:
   * - siteId/sitePublicId maintained for backward compatibility
   * - Older code may still reference "site" instead of "terminalComplex"
   * - Both fields point to TerminalComplex entity
   * 
   * ERROR HANDLING:
   * - If terminal creation fails, no berths created (transaction safety)
   * - If berth creation fails, terminal already exists (partial state)
   * - TODO: Consider implementing rollback for partial failures
   */
  const createTerminalMutation = useMutation({
    mutationFn: async () => {
      // Look up referenced entities for publicId population
      const complex = terminal.terminalComplexId ? complexes.find(c => c.id === terminal.terminalComplexId) : null;
      const productType = terminal.productTypeRefId ? productTypes.find(pt => pt.id === terminal.productTypeRefId) : null;
      const country = terminal.countryId ? countries.find(c => c.id === terminal.countryId) : null;
      
      // Prepare terminal data with proper types and references
      const terminalData = {
        ...terminal,
        publicId: generateUUID(),
        tenantId: getCurrentTenantId(),
        // New field names
        terminalComplexId: terminal.terminalComplexId || null,
        terminalComplexPublicId: complex?.publicId || null,
        // Legacy field names (same values)
        siteId: terminal.terminalComplexId || null,
        sitePublicId: complex?.publicId || null,
        // Country references
        countryId: terminal.countryId || null,
        countryPublicId: country?.publicId || null,
        // Product type references
        productTypeRefId: terminal.productTypeRefId || null,
        productTypeRefPublicId: productType?.publicId || null,
        // Map terminal_type to operation_type (required field)
        operation_type: terminal.terminal_type || null,
        // Type conversions
        latitude: parseFloat(terminal.latitude),
        longitude: parseFloat(terminal.longitude),
        capacity_mtpa: terminal.capacity_mtpa ? parseFloat(terminal.capacity_mtpa) : null
      };
      
      // Create terminal first
      const createdTerminal = await base44.entities.Terminal.create(terminalData);
      
      // Then create all berths in parallel
      if (berths.length > 0) {
        const berthPromises = berths.map(berth => 
          base44.entities.Berth.create({
            ...berth,
            publicId: generateUUID(),
            tenantId: getCurrentTenantId(),
            terminal_id: createdTerminal.id,
            terminalPublicId: createdTerminal.publicId,
            // Convert numeric strings to actual numbers
            max_loa: berth.max_loa ? parseFloat(berth.max_loa) : null,
            max_beam: berth.max_beam ? parseFloat(berth.max_beam) : null,
            max_draft: berth.max_draft ? parseFloat(berth.max_draft) : null,
            min_cargo_capacity: berth.min_cargo_capacity ? parseFloat(berth.min_cargo_capacity) : null,
            max_cargo_capacity: berth.max_cargo_capacity ? parseFloat(berth.max_cargo_capacity) : null
          })
        );
        await Promise.all(berthPromises);
      }
      
      return createdTerminal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
      queryClient.invalidateQueries({ queryKey: ['berths'] });
      toast.success('Terminal created successfully');
      navigate(createPageUrl(`TerminalDetail?id=${data.id}`));
    },
    onError: (error) => {
      toast.error('Failed to create terminal');
    }
  });

  /**
   * Add a new berth to the inline form array
   * 
   * MANDATORY FIELDS:
   * - berth_number (Berth Code) - unique identifier within terminal
   * - berth_name (Berth Name) - descriptive name for the berth
   * - berthType - physical berth structure type (Jetty, Quay, SPM, Dolphin, Other)
   * 
   * All three fields validated before terminal creation.
   * Prevents incomplete berth data in database.
   */
  const addBerth = () => {
    setBerths([...berths, {
      berth_number: '',  // User must provide (berthCode)
      berth_name: '',    // User must provide (berthName)
      berthType: '',     // User must provide (Jetty, Quay, SPM, Dolphin, Other)
      max_loa: '',
      max_beam: '',
      max_draft: '',
      min_cargo_capacity: '',
      max_cargo_capacity: '',
      status: 'Active'
    }]);
  };

  const updateBerth = (index, field, value) => {
    const updated = [...berths];
    updated[index][field] = value;
    setBerths(updated);
  };

  const removeBerth = (index) => {
    setBerths(berths.filter((_, i) => i !== index));
  };

  /**
   * Robust field validators for different data types
   * 
   * PURPOSE:
   * Centralized validation logic that handles edge cases per field type.
   * Prevents submission of invalid data like whitespace-only strings or unparseable numbers.
   * 
   * VALIDATOR FUNCTIONS:
   * 
   * isTextValid(val):
   * - Rejects null, undefined, empty string
   * - Rejects whitespace-only strings (e.g., "   ")
   * - Trims value before checking length
   * - Use for: Terminal Name, Port, Operator, etc.
   * 
   * isSelectValid(val):
   * - Rejects null, undefined, empty string
   * - Rejects whitespace-only ID strings
   * - Use for: Product Type, Terminal Type, Country (dropdown selections)
   * 
   * isNumericValid(val):
   * - Checks if value can be parsed as a valid number
   * - Rejects null, undefined, empty string, NaN
   * - Accepts both string numbers ("123.45") and actual numbers
   * - Use for: Latitude, Longitude, Capacity
   * 
   * WHY SEPARATE VALIDATORS:
   * Different field types have different "empty" states:
   * - Text: "   " is invalid (whitespace-only)
   * - Select: "" is invalid but "0" might be valid
   * - Numeric: "" and "abc" both invalid, but "0" is valid
   */
  const validators = {
    // Text fields: reject empty/whitespace-only strings
    isTextValid: (val) => {
      if (val === null || val === undefined) return false;
      if (typeof val !== 'string') return false;
      return val.trim().length > 0;
    },
    
    // Select/lookup fields: reject empty IDs
    isSelectValid: (val) => {
      if (val === null || val === undefined) return false;
      if (typeof val !== 'string') return false;
      return val.trim().length > 0;
    },
    
    // Numeric fields: must be parseable as number
    isNumericValid: (val) => {
      if (val === null || val === undefined || val === '') return false;
      const num = parseFloat(val);
      return !isNaN(num);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clear previous field errors
    setFieldErrors({});

    /**
     * REQUIRED FIELD VALIDATION WITH FOCUS CONTROL:
     * 
     * ORDERED VALIDATION:
     * Fields validated in UI display order (top to bottom).
     * Stops at first invalid field → scrolls into view → focuses it.
     * Intuitive UX: user sees validation errors from top down.
     * 
     * TYPE-SPECIFIC VALIDATORS:
     * - text: Terminal Name (rejects empty/whitespace-only strings)
     * - select: Product Type, Terminal Type, Country (rejects empty ID strings)
     * - numeric: Latitude, Longitude (rejects non-numeric values including NaN)
     * 
     * FOCUS STRATEGY:
     * Each required field has a ref (refTerminalName, refProducts, etc.).
     * Refs expose focus() and scrollIntoView() via useImperativeHandle (for lookup fields).
     * On validation failure, we programmatically:
     * 1. Scroll invalid field into viewport
     * 2. Focus the field (moves keyboard cursor, opens dropdown if applicable)
     * 3. Show toast + inline error message
     */
    const requiredFields = [
      { field: 'name', label: 'Terminal Name', ref: refTerminalName, validator: 'text' },
      { field: 'productTypeRefId', label: 'Products', ref: refProducts, validator: 'select' },
      { field: 'terminal_type', label: 'Terminal Type', ref: refTerminalType, validator: 'select' },
      { field: 'countryId', label: 'Country', ref: refCountry, validator: 'select' },
      { field: 'latitude', label: 'Latitude', ref: refLatitude, validator: 'numeric' },
      { field: 'longitude', label: 'Longitude', ref: refLongitude, validator: 'numeric' }
    ];

    // Find first invalid required field using type-specific validators
    const missingField = requiredFields.find(fieldDef => {
      const val = terminal[fieldDef.field];
      const validatorFn = validators[`is${fieldDef.validator.charAt(0).toUpperCase() + fieldDef.validator.slice(1)}Valid`];
      return !validatorFn(val);
    });

    if (missingField) {
      // Set inline error for the invalid field
      setFieldErrors({ [missingField.field]: 'Required' });

      // Show toast with field label
      toast.error(`Missing required field: ${missingField.label}`);

      // Focus and scroll to the first invalid required field
      setTimeout(() => {
        const refObj = missingField.ref.current;
        if (refObj) {
          // scrollIntoView first
          if (typeof refObj.scrollIntoView === 'function') {
            refObj.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          // then focus
          if (typeof refObj.focus === 'function') {
            refObj.focus();
          }
        }
      }, 100);
      return;
    }

    /**
     * Validate inline berth forms
     * 
     * MANDATORY BERTH FIELDS:
     * - Berth Code (berth_number): unique identifier, reject whitespace-only
     * - Berth Name (berth_name): descriptive name, reject whitespace-only
     * - Berth Type (berthType): structural type, reject empty selection
     * 
     * All validated with trim() to prevent whitespace-only submissions.
     */
    for (let i = 0; i < berths.length; i++) {
      const berth = berths[i];
      if (!berth.berth_number || berth.berth_number.trim() === '') {
        toast.error(`Berth ${i + 1}: Berth Code is required`);
        return;
      }
      if (!berth.berth_name || berth.berth_name.trim() === '') {
        toast.error(`Berth ${i + 1}: Berth Name is required`);
        return;
      }
      if (!berth.berthType || berth.berthType.trim() === '') {
        toast.error(`Berth ${i + 1}: Berth Type is required`);
        return;
      }
    }

    createTerminalMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Terminals')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Terminal</h1>
          <p className="text-gray-600 mt-1">
            {selectedComplex ? `Create a new terminal for ${selectedComplex.name}` : 'Create a new LNG terminal with berths'}
          </p>
        </div>
      </div>

      {/* 
        MANUAL VALIDATION STRATEGY:
        
        noValidate disables browser-native HTML5 validation.
        
        WHY:
        - We need ordered validation (top-to-bottom UI order)
        - We need programmatic focus control on first invalid field
        - We need consistent error messages and toasts
        - We need to handle lookup fields (SearchableSelect, CountrySelector) that don't support HTML5 required
        - Browser validation shows generic messages and focuses unpredictably
        
        Instead, handleSubmit validates all required fields manually using type-specific validators,
        then focuses the first invalid field using refs.
      */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Terminal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Terminal Complex</Label>
              <SearchableSelect
                options={complexes.filter(c => c.isActive).map(c => ({ value: c.id, label: c.name }))}
                value={terminal.terminalComplexId}
                onValueChange={(value) => setTerminal({...terminal, terminalComplexId: value})}
                placeholder="Select terminal complex (optional)"
              />
              {selectedComplex && (
                <p className="text-xs text-gray-600">Terminal will be created under: {selectedComplex.name}</p>
              )}
            </div>
            <div className="space-y-2">
               <Label className="text-gray-700">Terminal Name *</Label>
               <Input
                 ref={refTerminalName}
                 id="terminalName"
                 value={terminal.name}
                 onChange={(e) => {
                   setTerminal({...terminal, name: e.target.value});
                   if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                 }}
                 className={`bg-blue-50 text-gray-900 ${fieldErrors.name ? 'border-red-500' : 'border-blue-300'}`}
                 placeholder="e.g., Gate Terminal"
               />
               {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
             </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Products *</Label>
                <div className={`bg-blue-50 border rounded-md ${fieldErrors.productTypeRefId ? 'border-red-500' : 'border-blue-300'}`}>
                  <SearchableSelect
                    ref={refProducts}
                    options={productTypes.filter(pt => pt.isActive).map(pt => ({ value: pt.id, label: `${pt.code} - ${pt.name}` }))}
                    value={terminal.productTypeRefId}
                    onValueChange={(value) => {
                      setTerminal({...terminal, productTypeRefId: value});
                      if (fieldErrors.productTypeRefId) setFieldErrors(prev => ({ ...prev, productTypeRefId: undefined }));
                    }}
                    placeholder="Select products"
                  />
                </div>
                {fieldErrors.productTypeRefId && <p className="text-xs text-red-500 mt-1">{fieldErrors.productTypeRefId}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Operator</Label>
                <Input
                  value={terminal.operator}
                  onChange={(e) => setTerminal({...terminal, operator: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="Operating company"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Terminal Type *</Label>
                  <Select 
                    value={terminal.terminal_type}
                    onValueChange={(v) => {
                      setTerminal({...terminal, terminal_type: v});
                      if (fieldErrors.terminal_type) setFieldErrors(prev => ({ ...prev, terminal_type: undefined }));
                    }}
                  >
                    <SelectTrigger 
                      ref={refTerminalType}
                      className={`bg-blue-50 text-gray-900 ${fieldErrors.terminal_type ? 'border-red-500' : 'border-blue-300'}`}
                    >
                      <SelectValue placeholder="Select terminal type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="Import" className="text-gray-900">Import</SelectItem>
                      <SelectItem value="Export" className="text-gray-900">Export</SelectItem>
                      <SelectItem value="Import/Export" className="text-gray-900">Import/Export</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.terminal_type && <p className="text-xs text-red-500 mt-1">{fieldErrors.terminal_type}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Status</Label>
                <Select 
                  value={terminal.status}
                  onValueChange={(v) => setTerminal({...terminal, status: v})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Operational" className="text-gray-900">Operational</SelectItem>
                    <SelectItem value="Under Construction" className="text-gray-900">Under Construction</SelectItem>
                    <SelectItem value="Planned" className="text-gray-900">Planned</SelectItem>
                    <SelectItem value="Decommissioned" className="text-gray-900">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Capacity (MTPA)</Label>
              <Input
                type="number"
                step="0.1"
                value={terminal.capacity_mtpa}
                onChange={(e) => setTerminal({...terminal, capacity_mtpa: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="Annual capacity in MTPA"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label className="text-gray-700">Country *</Label>
                  <CountrySelector
                    ref={refCountry}
                    value={terminal.countryId ? countries.find(c => c.id === terminal.countryId)?.iso2 || '' : ''}
                    onChange={(iso2, name) => {
                      const country = countries.find(c => c.iso2 === iso2);
                      setTerminal({...terminal, countryId: country?.id || '', countryIso2: iso2, countryName: name});
                      if (fieldErrors.countryId) setFieldErrors(prev => ({ ...prev, countryId: undefined }));
                    }}
                    label=""
                    className={`bg-blue-50 ${fieldErrors.countryId ? 'border-red-500' : 'border-blue-300'}`}
                  />
                  {fieldErrors.countryId && <p className="text-xs text-red-500 mt-1">{fieldErrors.countryId}</p>}
                </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Port</Label>
                <Input
                  value={terminal.port}
                  onChange={(e) => setTerminal({...terminal, port: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="e.g., Rotterdam"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Latitude *</Label>
                <Input
                  ref={refLatitude}
                  id="latitude"
                  type="number"
                  step="any"
                  value={terminal.latitude}
                  onChange={(e) => {
                    setTerminal({...terminal, latitude: e.target.value});
                    if (fieldErrors.latitude) setFieldErrors(prev => ({ ...prev, latitude: undefined }));
                  }}
                  className={`bg-blue-50 text-gray-900 ${fieldErrors.latitude ? 'border-red-500' : 'border-blue-300'}`}
                  placeholder="e.g., 51.9225"
                />
                {fieldErrors.latitude && <p className="text-xs text-red-500 mt-1">{fieldErrors.latitude}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Longitude *</Label>
                <Input
                  ref={refLongitude}
                  id="longitude"
                  type="number"
                  step="any"
                  value={terminal.longitude}
                  onChange={(e) => {
                    setTerminal({...terminal, longitude: e.target.value});
                    if (fieldErrors.longitude) setFieldErrors(prev => ({ ...prev, longitude: undefined }));
                  }}
                  className={`bg-blue-50 text-gray-900 ${fieldErrors.longitude ? 'border-red-500' : 'border-blue-300'}`}
                  placeholder="e.g., 4.47917"
                />
                {fieldErrors.longitude && <p className="text-xs text-red-500 mt-1">{fieldErrors.longitude}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={terminal.contact_email}
                  onChange={(e) => setTerminal({...terminal, contact_email: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="contact@terminal.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Phone</Label>
                <Input
                  value={terminal.contact_phone}
                  onChange={(e) => setTerminal({...terminal, contact_phone: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="+31 10 123 4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={terminal.notes}
                onChange={(e) => setTerminal({...terminal, notes: e.target.value})}
                className="bg-white border-gray-300 text-gray-900 min-h-[100px]"
                placeholder="Additional information..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Berths */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-400" />
              Berths
            </CardTitle>
            <Button 
              type="button"
              variant="outline"
              size="sm"
              onClick={addBerth}
              className="border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Berth
            </Button>
          </CardHeader>
          <CardContent>
            {berths.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Anchor className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No berths added yet</p>
                <p className="text-sm">Click "Add Berth" to add berth specifications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {berths.map((berth, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Berth {index + 1}</h4>
                      <Button 
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBerth(index)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-xs">Berth Code *</Label>
                        <Input
                          value={berth.berth_number}
                          onChange={(e) => updateBerth(index, 'berth_number', e.target.value)}
                          className="bg-blue-50 border-blue-300 text-gray-900 text-sm"
                          placeholder="e.g., B1, LNG1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-xs">Berth Name *</Label>
                        <Input
                          value={berth.berth_name}
                          onChange={(e) => updateBerth(index, 'berth_name', e.target.value)}
                          className="bg-blue-50 border-blue-300 text-gray-900 text-sm"
                          placeholder="e.g., North Jetty"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 text-xs">Berth Type *</Label>
                        <Select 
                          value={berth.berthType}
                          onValueChange={(v) => updateBerth(index, 'berthType', v)}
                        >
                          <SelectTrigger className="bg-blue-50 border-blue-300 text-gray-900 text-sm h-9">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            <SelectItem value="Jetty" className="text-gray-900">Jetty</SelectItem>
                            <SelectItem value="Quay" className="text-gray-900">Quay</SelectItem>
                            <SelectItem value="SPM" className="text-gray-900">SPM</SelectItem>
                            <SelectItem value="Dolphin" className="text-gray-900">Dolphin</SelectItem>
                            <SelectItem value="Other" className="text-gray-900">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-600 text-xs">Max LOA (m)</Label>
                        <Input
                          type="number"
                          value={berth.max_loa}
                          onChange={(e) => updateBerth(index, 'max_loa', e.target.value)}
                          className="bg-white border-gray-300 text-gray-900 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-600 text-xs">Max Beam (m)</Label>
                        <Input
                          type="number"
                          value={berth.max_beam}
                          onChange={(e) => updateBerth(index, 'max_beam', e.target.value)}
                          className="bg-white border-gray-300 text-gray-900 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-600 text-xs">Max Draft (m)</Label>
                        <Input
                          type="number"
                          value={berth.max_draft}
                          onChange={(e) => updateBerth(index, 'max_draft', e.target.value)}
                          className="bg-white border-gray-300 text-gray-900 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-600 text-xs">Min Capacity (m³)</Label>
                        <Input
                          type="number"
                          value={berth.min_cargo_capacity}
                          onChange={(e) => updateBerth(index, 'min_cargo_capacity', e.target.value)}
                          className="bg-white border-gray-300 text-gray-900 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-600 text-xs">Max Capacity (m³)</Label>
                        <Input
                          type="number"
                          value={berth.max_cargo_capacity}
                          onChange={(e) => updateBerth(index, 'max_cargo_capacity', e.target.value)}
                          className="bg-white border-gray-300 text-gray-900 text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('Terminals')}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit"
            disabled={createTerminalMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {createTerminalMutation.isPending ? 'Creating...' : 'Create Terminal'}
          </Button>
        </div>
      </form>
    </div>
  );
}