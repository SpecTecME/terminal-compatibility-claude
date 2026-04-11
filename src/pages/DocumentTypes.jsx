import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { 
  FileText, 
  Plus, 
  Search,
  Edit,
  Eye,
  Trash2,
  Building2,
  Clock,
  Calendar,
  Bell,
  List,
  Grid3x3,
  LayoutList,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Document Types List Page (Configuration Module)
 * 
 * PURPOSE:
 * Master registry for all document types used across the maritime compliance system.
 * Document types define templates for certificates, forms, and compliance documents.
 * 
 * DOMAIN CONTEXT:
 * Maritime operations require extensive documentation:
 * - Vessel certificates (Class certificates, safety certs, etc.)
 * - Terminal approvals and permits
 * - Inspection reports (SIRE, CDI, etc.)
 * - Operational forms (Pre-arrival questionnaires, berthing plans, etc.)
 * 
 * KEY ARCHITECTURAL DECISIONS:
 * 
 * 1. MULTI-AUTHORITY EXTERNAL CODE MAPPING:
 *    - Same document type can have different codes/names across authorities
 *    - Example: "Certificate of Class" might be:
 *      * "CC" in DNV system
 *      * "CLASS_CERT" in Lloyd's Register system
 *      * "CoC" in ABS system
 *    - DocumentTypeExternalCode entity maintains these mappings
 *    - Critical for data import/export and system integrations
 * 
 * 2. SEARCH ALIASES:
 *    - searchAliases array stores common abbreviations and alternative names
 *    - NOT displayed in UI (stored separately from "name" field)
 *    - Improves search UX without cluttering displays
 *    - Example: "Certificate of Class" has aliases ["CoC", "Class Cert", "Classification Certificate"]
 * 
 * 3. VALIDITY TYPE SYSTEM:
 *    Four distinct validity models reflecting document lifecycle:
 *    
 *    a) PermanentStatic:
 *       - Never expires (e.g., vessel construction certificate)
 *       - Historical reference documents
 *    
 *    b) TerminalEventDriven:
 *       - Valid until specific event (e.g., terminal registration approval)
 *       - No fixed expiry date
 *       - Superseded by newer submission
 *    
 *    c) RenewableCertified:
 *       - Fixed validity period, renewable (e.g., 5-year class certificate)
 *       - Has expiry date
 *       - Reminder system for renewal
 *    
 *    d) VettingTimeSensitive:
 *       - Short validity (e.g., 6-month SIRE inspection)
 *       - Requires frequent updates
 *       - Critical for operational approval
 * 
 * 4. APPLIES-TO SCOPING:
 *    - Documents apply to: Vessel, Terminal, or Berth
 *    - Determines where document upload UI appears
 *    - Affects validation and requirement checking
 * 
 * 5. DEFAULT VALIDITY DURATIONS:
 *    - Configurable per document type
 *    - Auto-calculates expiry dates on upload
 *    - Reminder lead times for proactive renewal
 * 
 * 6. ISSUING AUTHORITY CONSTRAINTS:
 *    - allowedIssuers defines which authority types can issue this document
 *    - Example: Class certificates only from Classification Societies
 *    - Validates document authenticity
 * 
 * 7. SOFT DELETE ONLY:
 *    - isActive flag (no permanent deletion)
 *    - Preserves historical document type definitions
 *    - Existing documents remain valid even if type deactivated
 * 
 * SEARCH FEATURES:
 * Multi-field search includes:
 * - Document type name
 * - Code
 * - Category name
 * - Search aliases (hidden from UI but searchable)
 * - External codes (from other systems/authorities)
 * - External names (alternative authority names)
 * - Authority company names
 * 
 * This extensive search scope helps users find documents despite terminology variations
 * across different maritime authorities and systems.
 */
export default function DocumentTypes() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Read returnTo from sessionStorage (set by UploadDocument when clicking Manage Types).
  // Using sessionStorage survives navigation to AddDocumentType and back without URL stripping.
  const [returnTo] = useState(() => {
    const raw = sessionStorage.getItem('uploadDocumentContext');
    if (raw) { try { return JSON.parse(raw).returnTo || null; } catch { return null; } }
    return null;
  });

  const urlParams = new URLSearchParams(window.location.search);
  // Filter and display state
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(urlParams.get('status') || 'active');
  const [viewMode, setViewMode] = useState(urlParams.get('view') || 'list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'active') params.set('status', statusFilter);
    if (viewMode !== 'list') params.set('view', viewMode);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, statusFilter, viewMode]);

  const { data: documentTypes = [], isLoading } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  const { data: externalCodes = [] } = useQuery({
    queryKey: ['documentTypeExternalCodes'],
    queryFn: () => base44.entities.DocumentTypeExternalCode.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (docType) => base44.entities.DocumentType.update(docType.publicId, { ...docType, isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast.success('Document type deactivated');
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate document type: ' + error.message);
    }
  });

  const handleDeleteClick = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (typeToDelete) {
      deleteMutation.mutate(typeToDelete);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  /**
   * Filter and sort document types
   * 
   * SEARCH COMPREHENSIVENESS:
   * Document types can be found by searching:
   * 1. Primary name (e.g., "Certificate of Class")
   * 2. Code (e.g., "CoC")
   * 3. Category name (e.g., "Class & Statutory")
   * 4. Search aliases (e.g., "Class Cert", "Classification Certificate")
   * 5. External codes from other systems (e.g., DNV's "CC", LR's "CLASS_CERT")
   * 6. External names from other systems
   * 7. Authority company names that use this document type
   * 
   * RATIONALE FOR EXTENSIVE SEARCH:
   * Maritime industry uses inconsistent terminology across authorities.
   * Users might search using terminology from their previous system or authority.
   * Comprehensive search prevents "not found" frustration.
   * 
   * SORTING LOGIC:
   * 1. Primary sort by sortOrder field (admin-configurable importance)
   * 2. Secondary sort alphabetically by name
   * 
   * This allows admins to prioritize commonly-used documents at top of list
   */
  const filteredTypes = documentTypes
    .filter(dt => {
      const query = searchQuery.toLowerCase();
      
      // Find all external code mappings for this document type
      const dtExternalCodes = externalCodes.filter(code => 
        code.documentTypeId === dt.id && code.isActive !== false
      );
      
      // Check if search matches any authority company that uses this document type
      const authorityMatches = dtExternalCodes.some(code => {
        const company = companies.find(c => c.id === code.authorityCompanyId);
        return company?.name?.toLowerCase().includes(query) ||
               company?.legalName?.toLowerCase().includes(query);
      });
      
      // Multi-field search matching
      const matchesSearch = (
        dt.name?.toLowerCase().includes(query) ||
        dt.code?.toLowerCase().includes(query) ||
        getCategoryName(dt.categoryId)?.toLowerCase().includes(query) ||
        (dt.searchAliases && dt.searchAliases.some(alias => alias.toLowerCase().includes(query))) ||
        dtExternalCodes.some(code => 
          code.externalCode?.toLowerCase().includes(query) ||
          code.externalName?.toLowerCase().includes(query)
        ) ||
        authorityMatches
      );
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && dt.isActive !== false) ||
        (statusFilter === 'inactive' && dt.isActive === false);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Primary sort: Admin-defined priority
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 999) - (b.sortOrder || 999);
      }
      // Secondary sort: Alphabetical
      return (a.name || '').localeCompare(b.name || '');
    });

  const validityTypeColors = {
    'PermanentStatic': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'TerminalEventDriven': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'RenewableCertified': 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    'VettingTimeSensitive': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
  };

  const validityTypeLabels = {
    'PermanentStatic': 'Permanent',
    'TerminalEventDriven': 'Event Driven',
    'RenewableCertified': 'Renewable',
    'VettingTimeSensitive': 'Time Sensitive'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Types</h1>
            <p className="text-gray-600 mt-1">Master registry of document types</p>
          </div>
          <div className="flex gap-3">
            {returnTo === 'UploadDocument' && (
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700"
                onClick={() => {
                  const raw = sessionStorage.getItem('uploadDocumentContext');
                  let ctx = {};
                  try { ctx = JSON.parse(raw || '{}'); } catch {}
                  sessionStorage.removeItem('uploadDocumentContext');
                  let url = 'UploadDocument';
                  if (ctx.editId) url += `?edit=${ctx.editId}`;
                  else if (ctx.vesselId) url += `?vessel=${ctx.vesselId}`;
                  navigate(createPageUrl(url));
                }}
              >
                ← Back to Add Document
              </Button>
            )}
            <Link to={createPageUrl('DocumentCategories')}>
              <Button variant="outline" className="border-gray-300 text-gray-700">
                <FileText className="w-4 h-4 mr-2" />
                Categories
              </Button>
            </Link>
            <Link to={createPageUrl('AddDocumentType')}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Document Type
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search document types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-white border-gray-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No document types found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Create your first document type to get started'}
          </p>
          <Link to={createPageUrl('AddDocumentType')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Document Type
            </Button>
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Name</TableHead>
                  <TableHead className="text-gray-600">Code</TableHead>
                  <TableHead className="text-gray-600">Category</TableHead>
                  <TableHead className="text-gray-600">Applies To</TableHead>
                  <TableHead className="text-gray-600">Validity Type</TableHead>
                  <TableHead className="text-gray-600">Validity Duration</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((docType) => (
                  <TableRow key={docType.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{docType.name}</TableCell>
                    <TableCell className="text-gray-700">{docType.code || '-'}</TableCell>
                    <TableCell className="text-gray-700">{getCategoryName(docType.categoryId)}</TableCell>
                    <TableCell className="text-gray-700">{docType.appliesTo || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`${validityTypeColors[docType.documentValidityType] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                        {validityTypeLabels[docType.documentValidityType] || docType.documentValidityType || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {docType.defaultValidityDuration ? `${docType.defaultValidityDuration} ${docType.validityUnit}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${docType.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                        {docType.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={createPageUrl(`DocumentTypeDetail?id=${docType.publicId}`)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link to={createPageUrl(`EditDocumentType?id=${docType.publicId}`)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => handleDeleteClick(docType, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTypes.map((docType) => (
            <Card key={docType.id} className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <Badge className={`${docType.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                    {docType.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{docType.name}</h3>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Category:</span>
                    <span className="text-gray-900">{getCategoryName(docType.categoryId)}</span>
                  </div>
                  {docType.appliesTo && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Applies To:</span>
                      <span className="text-gray-900">{docType.appliesTo}</span>
                    </div>
                  )}
                  <Badge className={`${validityTypeColors[docType.documentValidityType] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                    {validityTypeLabels[docType.documentValidityType] || docType.documentValidityType || 'Unknown'}
                  </Badge>
                  {docType.defaultValidityDuration && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      Valid for {docType.defaultValidityDuration} {docType.validityUnit}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link to={createPageUrl(`DocumentTypeDetail?id=${docType.publicId}`)} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full border-gray-300 text-gray-700">
                      <Eye className="w-3.5 h-3.5 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link to={createPageUrl(`EditDocumentType?id=${docType.publicId}`)} className="flex-1">
                    <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => handleDeleteClick(docType, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredTypes.map((docType) => (
                <div key={docType.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{docType.name}</p>
                      <p className="text-xs text-gray-600">{getCategoryName(docType.categoryId)} • {docType.appliesTo || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${docType.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                      {docType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Link to={createPageUrl(`DocumentTypeDetail?id=${docType.publicId}`)}>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 h-8 w-8">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl(`EditDocumentType?id=${docType.publicId}`)}>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 h-8 w-8">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={(e) => handleDeleteClick(docType, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Document Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{typeToDelete?.name}"? The document type will be hidden from lists but can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}