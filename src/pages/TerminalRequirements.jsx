/**
 * Terminal Requirements Page (Document Requirements Management)
 * 
 * PURPOSE:
 * Configure which documents terminals require from vessels.
 * Supports versioning and bulk configuration workflows.
 * 
 * DOMAIN CONTEXT:
 * 
 * TERMINAL REQUIREMENTS:
 * Before vessel can call at terminal, must submit documents:
 * - Certificates of Class
 * - P&I Insurance
 * - SIRE Inspection reports
 * - Cargo certificates
 * - etc.
 * 
 * REQUIREMENTS VARY:
 * - By terminal (safety policies differ)
 * - By submission stage (Registration vs Renewal vs Pre-Visit)
 * - Over time (policies change)
 * 
 * VERSIONING CONCEPT (lines 378-385):
 * 
 * IMPORTANT INFO BANNER:
 * "Editing creates a new version with a new Valid From date.
 * Previous versions remain for historical tracking."
 * 
 * RATIONALE:
 * Requirements change over time.
 * Need to know what was required when.
 * 
 * EXAMPLE:
 * - 2024-01-01: SIRE report required (version 1)
 * - 2025-06-01: SIRE + CDI report required (version 2)
 * - 2026-01-01: CDI only required (version 3)
 * 
 * QUERIES:
 * "What was required in March 2025?" → Version 2
 * "What's required now?" → Version 3
 * 
 * PREVENTS DATA LOSS:
 * Historical applications reference old requirements.
 * Audit trail of policy changes.
 * 
 * EDIT BEHAVIOR (lines 224-237, 513-520):
 * 
 * "Edit" button → "Create New Version" dialog.
 * 
 * DISABLED FIELDS (line 529, 550):
 * - submissionStage: Cannot change (defines requirement identity)
 * - documentTypeId: Cannot change (same reason)
 * 
 * NEW VERSION PROCESS:
 * 1. Copies metadata from existing
 * 2. User sets new validFrom date (required)
 * 3. Optionally updates priority, mandatory, notes
 * 4. Creates NEW record (not update)
 * 5. Old record remains in database
 * 
 * SUBMISSION STAGES (lines 525-539):
 * 
 * Three workflow stages:
 * 
 * REGISTRATION:
 * Initial vessel registration at terminal.
 * Most comprehensive document list.
 * First-time submission.
 * 
 * RENEWAL:
 * Annual/periodic re-approval.
 * May require updated certificates.
 * Less extensive than registration.
 * 
 * PRE-VISIT:
 * Before each visit/cargo operation.
 * Current certificates, notices.
 * Lightest requirement set.
 * 
 * STAGE COLOR CODING (lines 349-353):
 * - Registration: Blue (primary process)
 * - Renewal: Amber (periodic)
 * - PreVisit: Purple (frequent)
 * 
 * BULK CONFIGURE FEATURE (lines 406-409, 650-806):
 * 
 * TWO-STEP WIZARD:
 * 
 * STEP 1: EFFECTIVE DATE (lines 674-690):
 * Set when these requirements take effect.
 * Applies to all selected documents.
 * 
 * STEP 2: DOCUMENT SELECTION (lines 692-770):
 * 
 * SEARCH & FILTER (lines 707-728):
 * - Text search by name
 * - Category filter
 * 
 * TABLE WITH CHECKBOXES (lines 730-768):
 * Multi-select document types.
 * 
 * BULK ACTIONS (lines 697-704):
 * - "Select All" (filtered results)
 * - "Clear All"
 * 
 * HEADER CHECKBOX (lines 735-744):
 * Select/deselect all filtered.
 * 
 * BULK SAVE LOGIC (lines 151-209):
 * 
 * For each selected document type:
 * 
 * CHECK EXISTING (lines 160-165):
 * Same terminalId, no berthId, same docTypeId, same effectiveFrom.
 * 
 * IF EXISTS:
 * Update to make active/mandatory (lines 169-173).
 * 
 * IF NOT:
 * Create new requirement (lines 176-194).
 * 
 * PREVENTS DUPLICATES:
 * Won't create multiple requirements for same combo.
 * 
 * RESULTS TRACKING (lines 154, 174, 194):
 * Counts created vs updated.
 * Shows in success toast (line 204).
 * 
 * VALIDITY DATES (lines 556-577):
 * 
 * VALID FROM (required):
 * When this requirement version starts.
 * 
 * VALID TO (optional):
 * When this version ends.
 * Null = "Current" (still active).
 * 
 * USE CASE:
 * Terminal changes policy Jan 1, 2026.
 * - Old version: validTo = 2025-12-31
 * - New version: validFrom = 2026-01-01
 * 
 * PRIORITY (lines 578-587):
 * Display/processing order.
 * Lower numbers first.
 * Optional field.
 * 
 * FLAGS (lines 590-612):
 * 
 * MANDATORY (line 591-599):
 * Required for application.
 * vs Optional (nice-to-have).
 * 
 * ACTIVE (line 602-610):
 * Currently enforced.
 * vs Inactive (deprecated, not enforced).
 * 
 * SORT LOGIC (lines 323-345):
 * 
 * MULTI-LEVEL SORT:
 * 1. Active first (line 333)
 * 2. By submission stage (line 334-337)
 * 3. By priority (line 338-340)
 * 4. By document type name (line 341-343)
 * 5. By validFrom date descending (line 344)
 * 
 * RESULT:
 * Active Registration requirements first.
 * Then by priority within each stage.
 * Newest versions on top.
 * 
 * LOGICAL PRESENTATION:
 * Most relevant requirements easily found.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit,
  ArrowLeft,
  AlertCircle,
  Info,
  X,
  List,
  CheckSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from '../components/ui/SearchableSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';

export default function TerminalRequirements() {
  const urlParams = new URLSearchParams(window.location.search);
  const terminalId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [formData, setFormData] = useState({
    documentTypeId: '',
    submissionStage: 'Registration',
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validTo: '',
    isMandatory: true,
    isActive: true,
    priority: '',
    notes: ''
  });

  // Bulk configure state
  const [bulkStep, setBulkStep] = useState(1);
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [bulkCategoryFilter, setBulkCategoryFilter] = useState('all');
  const [selectedDocTypes, setSelectedDocTypes] = useState([]);

  const { data: terminal } = useQuery({
    queryKey: ['terminal', terminalId],
    queryFn: () => base44.entities.Terminal.filter({ publicId: terminalId }).then(r => r[0]),
    enabled: !!terminalId
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths', terminalId],
    queryFn: () => base44.entities.Berth.filter({ terminal_id: terminalId }),
    enabled: !!terminalId
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['terminalRequirements', terminalId],
    queryFn: () => base44.entities.TerminalDocumentRequirement.filter({ terminalId }),
    enabled: !!terminalId
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const tenantId = getCurrentTenantId();
      const publicId = generateUUID();

      // data.documentTypeId is the publicId string (Select uses dt.publicId as value)
      return base44.entities.TerminalDocumentRequirement.create({
        publicId,
        tenantId,
        terminalId: terminal.publicId,
        terminalPublicId: terminal.publicId,
        berthId: null,
        berthPublicId: null,
        documentTypeId: data.documentTypeId,
        documentTypePublicId: data.documentTypeId,
        appliesLevel: 'Terminal',
        submissionStage: data.submissionStage,
        effectiveFrom: data.validFrom,
        validTo: data.validTo || null,
        isActive: data.isActive,
        isMandatory: data.isMandatory,
        isRequired: data.isMandatory,
        priority: data.priority ? parseInt(data.priority) : null,
        notes: data.notes
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['terminalRequirements'] });
      setDialogOpen(false);
      setEditingRequirement(null);
      resetForm();
      toast.success(editingRequirement ? 'New version created' : 'Requirement added');
    },
    onError: (error) => {
      toast.error('Failed to save requirement: ' + error.message);
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      const tenantId = getCurrentTenantId();
      const results = { created: 0, updated: 0 };
      
      for (const docTypeId of selectedDocTypes) {
        const docType = documentTypes.find(dt => dt.id === docTypeId);
        
        // Check if requirement already exists
        const existing = requirements.find(r => 
          r.terminalId === terminalId &&
          !r.berthId &&
          r.documentTypeId === docTypeId &&
          r.effectiveFrom === bulkEffectiveFrom
        );
        
        if (existing) {
          // Update existing
          await base44.entities.TerminalDocumentRequirement.update(existing.id, {
            isRequired: true,
            isActive: true,
            isMandatory: true
          });
          results.updated++;
        } else {
          // Create new
          await base44.entities.TerminalDocumentRequirement.create({
            publicId: generateUUID(),
            tenantId,
            terminalId,
            terminalPublicId: terminal.publicId,
            berthId: null,
            berthPublicId: null,
            documentTypeId: docTypeId,
            documentTypePublicId: docType?.publicId,
            appliesLevel: 'Terminal',
            submissionStage: 'Registration',
            effectiveFrom: bulkEffectiveFrom,
            validFrom: bulkEffectiveFrom,
            isRequired: true,
            isActive: true,
            isMandatory: true
          });
          results.created++;
        }
      }
      
      return results;
    },
    onSuccess: async (results) => {
      await queryClient.invalidateQueries({ queryKey: ['terminalRequirements'] });
      setBulkDialogOpen(false);
      resetBulkForm();
      toast.success(`${results.created} requirements created, ${results.updated} updated`);
    },
    onError: (error) => {
      toast.error('Bulk operation failed: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      documentTypeId: '',
      submissionStage: 'Registration',
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validTo: '',
      isMandatory: true,
      isActive: true,
      priority: '',
      notes: ''
    });
  };

  const handleEdit = (req) => {
    setEditingRequirement(req);
    setFormData({
      documentTypeId: req.documentTypePublicId || req.documentTypeId,
      submissionStage: req.submissionStage,
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validTo: '',
      isMandatory: req.isMandatory,
      isActive: req.isActive,
      priority: req.priority?.toString() || '',
      notes: req.notes || ''
    });
    setDialogOpen(true);
  };

  const handleAddTerminalWide = () => {
    setEditingRequirement(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (createMutation.isPending) return;
    if (!formData.documentTypeId || !formData.validFrom) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const resetBulkForm = () => {
    setBulkStep(1);
    setBulkEffectiveFrom(format(new Date(), 'yyyy-MM-dd'));
    setBulkSearchQuery('');
    setBulkCategoryFilter('all');
    setSelectedDocTypes([]);
  };

  const handleBulkNext = () => {
    if (bulkStep === 1) {
      if (!bulkEffectiveFrom) {
        toast.error('Please select effective from date');
        return;
      }
      setBulkStep(2);
    }
  };

  const handleBulkSave = () => {
    if (selectedDocTypes.length === 0) {
      toast.error('Please select at least one document type');
      return;
    }
    bulkCreateMutation.mutate();
  };

  const toggleDocType = (id) => {
    setSelectedDocTypes(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filtered = getFilteredDocTypes();
    setSelectedDocTypes(prev => {
      const newIds = filtered.filter(dt => !prev.includes(dt.id)).map(dt => dt.id);
      return [...prev, ...newIds];
    });
  };

  const clearAll = () => {
    setSelectedDocTypes([]);
  };

  const getFilteredDocTypes = () => {
    return documentTypes
      .filter(dt => dt.isActive)
      .filter(dt => {
        const matchesSearch = !bulkSearchQuery || 
          dt.name?.toLowerCase().includes(bulkSearchQuery.toLowerCase());
        const matchesCategory = bulkCategoryFilter === 'all' || 
          dt.categoryId === bulkCategoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  };

  const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || '-';
  };

  const getDocumentTypeName = (id) => {
    return documentTypes.find(dt => dt.publicId === id)?.name || 'Unknown';
  };

  const getBerthName = (id) => {
    return berths.find(b => b.id === id)?.berth_name || berths.find(b => b.id === id)?.berth_number || 'Unknown';
  };

  const terminalWideReqs = requirements
    .filter(r => !r.berthId)
    .filter(r => {
      const docName = getDocumentTypeName(r.documentTypePublicId || r.documentTypeId);
      const search = searchQuery.toLowerCase();
      return docName.toLowerCase().includes(search) ||
             r.submissionStage?.toLowerCase().includes(search) ||
             r.notes?.toLowerCase().includes(search);
    })
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return b.isActive ? 1 : -1;
      const stageOrder = { Registration: 0, Renewal: 1, PreVisit: 2 };
      if (a.submissionStage !== b.submissionStage) {
        return (stageOrder[a.submissionStage] || 999) - (stageOrder[b.submissionStage] || 999);
      }
      if ((a.priority || 999) !== (b.priority || 999)) {
        return (a.priority || 999) - (b.priority || 999);
      }
      const aName = getDocumentTypeName(a.documentTypePublicId || a.documentTypeId);
      const bName = getDocumentTypeName(b.documentTypePublicId || b.documentTypeId);
      if (aName !== bName) return aName.localeCompare(bName);
      return new Date(b.effectiveFrom || b.validFrom) - new Date(a.effectiveFrom || a.validFrom);
    });



  const submissionStageColors = {
    Registration: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    Renewal: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    PreVisit: 'bg-purple-500/10 text-purple-600 border-purple-500/30'
  };

  if (!terminal) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(`TerminalDetail?id=${terminalId}`)}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Requirements</h1>
          <p className="text-gray-600 mt-1">{terminal.name}</p>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Versioning:</strong> Editing creates a new version with a new Valid From date. Previous versions remain for historical tracking.
          <br />
          <strong>Terminal Requirements:</strong> All requirements are terminal-wide. Berth compatibility is calculated automatically.
        </AlertDescription>
      </Alert>

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by document type, stage, or notes..."
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
        <Button onClick={() => setBulkDialogOpen(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600">
          <CheckSquare className="w-4 h-4 mr-2" />
          Bulk Configure
        </Button>
      </div>

      {/* Terminal-wide Requirements */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Terminal-wide Requirements
            <span className="text-sm font-normal text-gray-600 ml-2">
              (Apply to all berths)
            </span>
          </CardTitle>
          <Button onClick={handleAddTerminalWide} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Terminal-wide
          </Button>
        </CardHeader>
        <CardContent>
          {terminalWideReqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No terminal-wide requirements configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Submission Stage</TableHead>
                  <TableHead className="text-gray-600">Document Type</TableHead>
                  <TableHead className="text-gray-600">Valid From</TableHead>
                  <TableHead className="text-gray-600">Valid To</TableHead>
                  <TableHead className="text-gray-600">Mandatory</TableHead>
                  <TableHead className="text-gray-600">Active</TableHead>
                  <TableHead className="text-gray-600">Priority</TableHead>
                  <TableHead className="text-gray-600">Notes</TableHead>
                  <TableHead className="text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminalWideReqs.map((req) => (
                  <TableRow key={req.id} className="border-gray-200">
                    <TableCell>
                      <Badge className={`${submissionStageColors[req.submissionStage]} border`}>
                        {req.submissionStage}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {getDocumentTypeName(req.documentTypePublicId || req.documentTypeId)}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {(req.effectiveFrom || req.validFrom) ? format(new Date(req.effectiveFrom || req.validFrom), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {req.validTo ? format(new Date(req.validTo), 'MMM d, yyyy') : 'Current'}
                    </TableCell>
                    <TableCell>
                      <Badge className={req.isMandatory 
                        ? 'bg-red-500/10 text-red-600 border-red-500/30 border'
                        : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'
                      }>
                        {req.isMandatory ? 'Yes' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={req.isActive 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border'
                        : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'
                      }>
                        {req.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{req.priority || '-'}</TableCell>
                    <TableCell className="text-gray-700 max-w-xs truncate">
                      {req.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(req)}
                        className="h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>



      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingRequirement ? 'Create New Version' : 'Add Requirement'}
            </DialogTitle>
          </DialogHeader>
          
          {editingRequirement && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                Editing creates a new version. The previous version remains for historical tracking.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Submission Stage *</Label>
                <Select
                  value={formData.submissionStage}
                  onValueChange={(value) => setFormData({...formData, submissionStage: value})}
                  disabled={!!editingRequirement}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Registration">Registration</SelectItem>
                    <SelectItem value="Renewal">Renewal</SelectItem>
                    <SelectItem value="PreVisit">Pre-Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Document Type *</Label>
                <SearchableSelect
                  value={formData.documentTypeId}
                  onValueChange={(value) => setFormData({...formData, documentTypeId: value})}
                  options={documentTypes.filter(dt => dt.isActive).map(dt => ({ value: dt.publicId, label: dt.name }))}
                  placeholder="Select document type"
                  searchPlaceholder="Search document types..."
                  disabled={!!editingRequirement}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Valid From *</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                  className="bg-white border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Valid To</Label>
                <Input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Priority</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="bg-white border-gray-300 text-right"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mandatory"
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) => setFormData({...formData, isMandatory: checked})}
                />
                <Label htmlFor="mandatory" className="text-gray-700 cursor-pointer">
                  Mandatory
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="active" className="text-gray-700 cursor-pointer">
                  Active
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-gray-300"
                placeholder="Admin notes and instructions"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingRequirement(null);
                  resetForm();
                }}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {createMutation.isPending ? 'Saving...' : editingRequirement ? 'Create Version' : 'Add Requirement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Configure Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Bulk Configure Requirements</DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 ${bulkStep >= 1 ? 'text-cyan-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bulkStep >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-sm font-medium">Date</span>
            </div>
            <div className="flex-1 h-px bg-gray-300" />
            <div className={`flex items-center gap-2 ${bulkStep >= 2 ? 'text-cyan-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bulkStep >= 2 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-sm font-medium">Documents</span>
            </div>
          </div>

          {/* Step 1: Effective Date */}
          {bulkStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Effective From Date *</Label>
                <Input
                  type="date"
                  value={bulkEffectiveFrom}
                  onChange={(e) => setBulkEffectiveFrom(e.target.value)}
                  className="bg-white border-gray-300 mt-2"
                />
                <p className="text-sm text-gray-600 mt-2">
                  This date determines when these documents become required by the terminal
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Document Types */}
          {bulkStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700">Select Document Types ({selectedDocTypes.length} selected)</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearAll}>
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search document types..."
                    value={bulkSearchQuery}
                    onChange={(e) => setBulkSearchQuery(e.target.value)}
                    className="pl-9 bg-white border-gray-300"
                  />
                </div>
                <Select value={bulkCategoryFilter} onValueChange={setBulkCategoryFilter}>
                  <SelectTrigger className="w-48 bg-white border-gray-300">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="border-gray-200">
                      <TableHead className="w-12 text-gray-600">
                        <Checkbox
                          checked={selectedDocTypes.length === getFilteredDocTypes().length && getFilteredDocTypes().length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllFiltered();
                            } else {
                              clearAll();
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-gray-600">Name</TableHead>
                      <TableHead className="text-gray-600">Category</TableHead>
                      <TableHead className="text-gray-600">Applies To</TableHead>
                      <TableHead className="text-gray-600">Validity Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredDocTypes().map(dt => (
                      <TableRow key={dt.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedDocTypes.includes(dt.id)}
                            onCheckedChange={() => toggleDocType(dt.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{dt.name}</TableCell>
                        <TableCell className="text-gray-700">{getCategoryName(dt.categoryId)}</TableCell>
                        <TableCell className="text-gray-700">{dt.appliesTo}</TableCell>
                        <TableCell className="text-gray-700 text-sm">{dt.documentValidityType}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            {bulkStep > 1 ? (
              <Button type="button" variant="outline" onClick={() => setBulkStep(bulkStep - 1)}>
                Back
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setBulkDialogOpen(false);
                  resetBulkForm();
                }}
              >
                Cancel
              </Button>
            )}
            {bulkStep < 2 ? (
              <Button onClick={handleBulkNext} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleBulkSave} 
                disabled={bulkCreateMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {bulkCreateMutation.isPending ? 'Saving...' : 'Save Requirements'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}