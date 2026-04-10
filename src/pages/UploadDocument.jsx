/**
 * Upload Document Page (Document Creation Form)
 * 
 * PURPOSE:
 * Multi-step form for uploading vessel documents.
 * Auto-calculates expiry dates based on document type.
 * 
 * PRESELECTION SUPPORT (line 38):
 * 
 * URL parameter: ?vessel=xxx
 * Pre-selects vessel in form.
 * 
 * USE CASE:
 * User on VesselDetail page clicks "Upload Document".
 * Navigates here with vessel pre-selected.
 * Saves time, reduces errors.
 * 
 * FOUR-SECTION FORM:
 * 
 * ========================================
 * 1. VESSEL SELECTION (lines 220-245)
 * ========================================
 * 
 * Vessel picker with IMO number.
 * Format: "Vessel Name (IMO: 1234567)".
 * 
 * IMO DISPLAY:
 * Helps distinguish vessels with similar names.
 * 
 * ========================================
 * 2. DOCUMENT TYPE (lines 247-354)
 * ========================================
 * 
 * DOCUMENT TYPE SELECTOR (lines 263-280):
 * Shows all active document types.
 * Display format: "Name (Lifecycle)".
 * 
 * EXAMPLE:
 * "Certificate of Class (Renewable)"
 * "Vessel Design Drawings (Permanent)"
 * 
 * TYPE CHANGE HANDLER (lines 135-147):
 * 
 * When user selects type:
 * 1. Loads DocumentType details
 * 2. Auto-fills document_name (line 142)
 * 3. Pre-selects issuing authority (line 143)
 * 4. Sets permanent flag (line 144)
 * 5. Clears expiry if permanent (line 145)
 * 
 * REDUCES DATA ENTRY:
 * Document type defines defaults.
 * User overrides if needed.
 * 
 * TYPE METADATA DISPLAY (lines 282-311):
 * 
 * Shows selected type's attributes:
 * - Category
 * - Lifecycle type
 * - Default issuing authority
 * - Validity duration (if renewable)
 * - Reminder window (if configured)
 * 
 * TRANSPARENCY:
 * User sees type's configuration.
 * Understands auto-calculated values.
 * 
 * ISSUING AUTHORITY (lines 313-343):
 * 
 * SEARCHABLE DROPDOWN:
 * Not standard Select (too many authorities).
 * 
 * SEARCH INPUT (lines 316-321):
 * Filters authority list.
 * 
 * FILTERED LIST (lines 322-341):
 * Scrollable box (max-h-32).
 * Click to select.
 * Selected item highlighted (cyan background).
 * 
 * SEARCH FIELD DUAL PURPOSE:
 * - Type to filter
 * - Shows selected authority name
 * 
 * REFERENCE NUMBER (lines 345-353):
 * Optional certificate identifier.
 * Examples: "DNV-2026-001", "Class-Cert-12345".
 * 
 * ========================================
 * 3. VALIDITY DATES (lines 357-412)
 * ========================================
 * 
 * PERMANENT CHECKBOX (lines 366-379):
 * 
 * Checked → No expiry date needed.
 * Unchecked → Expiry date enabled.
 * 
 * AUTO-CHECKED:
 * If document type is Permanent (line 138).
 * 
 * ISSUE DATE (lines 381-389):
 * When document issued.
 * Triggers expiry calculation (if renewable).
 * 
 * EXPIRY DATE (lines 390-399):
 * When document expires.
 * 
 * DISABLED IF:
 * - Permanent checkbox checked (line 397)
 * - Document type is Permanent (line 397)
 * 
 * AUTO-CALCULATION (lines 99-133):
 * 
 * TRIGGER CONDITIONS:
 * - Issue date set
 * - Document type is Renewable
 * - validity_duration configured
 * 
 * CALCULATION LOGIC (lines 109-124):
 * Adds duration to issue date:
 * - Days: addDays()
 * - Weeks: addWeeks()
 * - Months: addMonths()
 * - Years: addYears()
 * 
 * SETS EXPIRY (lines 126-130):
 * Auto-populates expiry_date field.
 * ISO format (yyyy-mm-dd).
 * 
 * CONFIRMATION MESSAGES (lines 401-410):
 * 
 * RENEWABLE AUTO-CALC (lines 401-404):
 * Green checkmark message.
 * "✓ Expiry date auto-calculated..."
 * 
 * PERMANENT NOTICE (lines 406-409):
 * Gray info message.
 * "This is a permanent document..."
 * 
 * USER AWARENESS:
 * Explains why fields disabled/auto-filled.
 * 
 * ========================================
 * 4. FILE UPLOAD (lines 414-460)
 * ========================================
 * 
 * FILE SELECTED (lines 423-441):
 * Shows file info:
 * - Name
 * - Size in MB
 * - X button to remove
 * 
 * FILE PICKER (lines 443-457):
 * Drag-drop zone.
 * Accepts: PDF, PNG, JPG, JPEG.
 * Size limit: 10MB (stated in help text).
 * 
 * UPLOAD FLOW (lines 160-192):
 * 
 * 1. User submits form
 * 2. If file selected: Upload file first (lines 166-175)
 * 3. Get file_url from upload
 * 4. Create document record with file_url (line 190)
 * 5. Navigate back to source (lines 88-92)
 * 
 * DATA TRANSFORMATION (lines 177-191):
 * 
 * BACKWARD COMPATIBILITY (lines 184-187):
 * Fills deprecated fields:
 * - document_type: From DocumentType.lifecycle_type
 * - category: From DocumentType.category
 * - issuing_authority: From IssuingAuthority.name
 * 
 * WHY KEEP:
 * Old code may read these fields.
 * Gradual migration strategy.
 * 
 * EXPIRY HANDLING (line 183):
 * Permanent docs: Set expiry to null (not empty string).
 * Database null means "no expiry" distinctly.
 * 
 * SUBMIT VALIDATION (line 484):
 * Disabled if:
 * - Uploading
 * - Mutation pending
 * - No vessel selected
 * - No document type selected
 * 
 * Prevents incomplete submissions.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  FileText,
  Upload,
  Ship,
  Calendar,
  Save,
  File,
  X
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
import { addMonths, addYears, addWeeks, addDays } from 'date-fns';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';

export default function UploadDocument() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedVessel = urlParams.get('vessel');

  const [document, setDocument] = useState({
    vessel_id: preselectedVessel || '',
    documentTypeId: '',
    document_name: '',
    issue_date: '',
    expiry_date: '',
    issuingAuthorityId: '',
    reference_number: '',
    notes: '',
    is_permanent: false
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [authoritySearch, setAuthoritySearch] = useState('');

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list(),
    select: (data) => data.filter(dt => dt.isActive)
  });

  const { data: authorities = [] } = useQuery({
    queryKey: ['authorities'],
    queryFn: () => base44.entities.IssuingAuthority.list()
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data) => {
      const vessel = vessels.find(v => v.id === data.vessel_id);
      const docType = documentTypes.find(dt => dt.id === data.documentTypeId);
      const authority = authorities.find(a => a.id === data.issuingAuthorityId);
      
      return await base44.entities.Document.create({
        ...data,
        vesselPublicId: vessel?.publicId,
        documentTypePublicId: docType?.publicId,
        issuingAuthorityPublicId: authority?.publicId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
      if (preselectedVessel) {
        navigate(createPageUrl(`VesselDetail?id=${preselectedVessel}`));
      } else {
        navigate(createPageUrl('Documents'));
      }
    },
    onError: (error) => {
      toast.error('Failed to upload document');
    }
  });

  // Auto-calculate expiry date when issue date and document type change
  useEffect(() => {
    if (document.is_permanent) {
      setDocument(prev => ({ ...prev, expiry_date: '' }));
      return;
    }
    if (document.issue_date && selectedDocType?.lifecycle_type === 'Renewable' && selectedDocType.validity_duration) {
      const issueDate = new Date(document.issue_date);
      let expiryDate;
      
      switch (selectedDocType.validity_unit) {
        case 'Days':
          expiryDate = addDays(issueDate, selectedDocType.validity_duration);
          break;
        case 'Weeks':
          expiryDate = addWeeks(issueDate, selectedDocType.validity_duration);
          break;
        case 'Months':
          expiryDate = addMonths(issueDate, selectedDocType.validity_duration);
          break;
        case 'Years':
          expiryDate = addYears(issueDate, selectedDocType.validity_duration);
          break;
        default:
          expiryDate = null;
      }
      
      if (expiryDate) {
        setDocument(prev => ({
          ...prev,
          expiry_date: expiryDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [document.issue_date, selectedDocType]);

  const handleDocTypeChange = (docTypeId) => {
    const docType = documentTypes.find(dt => dt.id === docTypeId);
    setSelectedDocType(docType);
    const isPermanent = docType?.lifecycle_type === 'Permanent';
    setDocument({
      ...document,
      documentTypeId: docTypeId,
      document_name: docType?.name || '',
      issuingAuthorityId: docType?.issuingAuthorityId || '',
      is_permanent: isPermanent,
      expiry_date: isPermanent ? '' : document.expiry_date
    });
  };

  const filteredAuthorities = authorities.filter(auth => 
    auth.name?.toLowerCase().includes(authoritySearch.toLowerCase())
  );

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let fileUrl = null;
    
    if (file) {
      try {
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        fileUrl = uploadResult.file_url;
      } catch (error) {
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      }
    }

    const docData = {
      ...document,
      publicId: generateUUID(),
      tenantId: getCurrentTenantId(),
      file_url: fileUrl,
      status: 'Valid',
      expiry_date: document.is_permanent ? null : document.expiry_date,
      // Keep backward compatibility with deprecated fields (read-only)
      document_type: selectedDocType?.lifecycle_type,
      category: selectedDocType?.category,
      issuing_authority: authorities.find(a => a.id === document.issuingAuthorityId)?.name
    };

    createDocumentMutation.mutate(docData);
    setUploading(false);
  };

  const getAuthorityName = (id) => {
    const auth = authorities.find(a => a.id === id);
    return auth?.name || 'Not specified';
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
          <p className="text-gray-600 mt-1">Add a new document to the registry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vessel Selection */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-400" />
              Select Vessel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={document.vessel_id}
              onValueChange={(v) => setDocument({...document, vessel_id: v})}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder="Select a vessel" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {vessels.map((vessel) => (
                  <SelectItem key={vessel.id} value={vessel.id} className="text-gray-900">
                    {vessel.name} (IMO: {vessel.imo_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Document Type Selection */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Document Type
              </CardTitle>
              <Link to={createPageUrl('DocumentTypes')}>
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 text-xs">
                  Manage Types
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Select Document Type *</Label>
              <Select 
                value={document.documentTypeId}
                onValueChange={handleDocTypeChange}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Choose a document type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {documentTypes.filter(dt => dt.isActive).map((docType) => (
                    <SelectItem key={docType.id} value={docType.id} className="text-gray-900">
                      {docType.name} ({docType.lifecycle_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDocType && (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-gray-900">{selectedDocType.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lifecycle:</span>
                  <span className="text-gray-900">{selectedDocType.lifecycle_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Issuing Authority:</span>
                  <span className="text-gray-900">{getAuthorityName(selectedDocType.issuingAuthorityId)}</span>
                </div>
                {selectedDocType.lifecycle_type === 'Renewable' && selectedDocType.validity_duration && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valid For:</span>
                      <span className="text-gray-900">{selectedDocType.validity_duration} {selectedDocType.validity_unit}</span>
                    </div>
                    {selectedDocType.reminder_window && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Reminder:</span>
                        <span className="text-gray-900">{selectedDocType.reminder_window} {selectedDocType.reminder_unit} before expiry</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-700">Issuing Authority *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search authority..."
                  value={authoritySearch}
                  onChange={(e) => setAuthoritySearch(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                  {filteredAuthorities.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No authorities found</p>
                  ) : (
                    filteredAuthorities.map((auth) => (
                      <div
                        key={auth.id}
                        onClick={() => {
                          setDocument({...document, issuingAuthorityId: auth.id});
                          setAuthoritySearch(auth.name);
                        }}
                        className={`p-2 cursor-pointer hover:bg-gray-50 text-sm ${
                          document.issuingAuthorityId === auth.id ? 'bg-cyan-50' : ''
                        }`}
                      >
                        {auth.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Reference Number</Label>
              <Input
                value={document.reference_number}
                onChange={(e) => setDocument({...document, reference_number: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="Document reference"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Validity Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is_permanent"
                checked={document.is_permanent}
                onChange={(e) => setDocument({
                  ...document, 
                  is_permanent: e.target.checked,
                  expiry_date: e.target.checked ? '' : document.expiry_date
                })}
                className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
              />
              <Label htmlFor="is_permanent" className="text-gray-700">Permanent Document (No expiry)</Label>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Issue Date</Label>
                <Input
                  type="date"
                  value={document.issue_date}
                  onChange={(e) => setDocument({...document, issue_date: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Expiry Date</Label>
                <Input
                  type="date"
                  value={document.expiry_date}
                  onChange={(e) => setDocument({...document, expiry_date: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  disabled={document.is_permanent || selectedDocType?.lifecycle_type === 'Permanent'}
                />
              </div>
            </div>
            {selectedDocType?.lifecycle_type === 'Renewable' && document.issue_date && !document.is_permanent && (
              <p className="text-xs text-cyan-600">
                ✓ Expiry date auto-calculated based on document type validity period
              </p>
            )}
            {(selectedDocType?.lifecycle_type === 'Permanent' || document.is_permanent) && (
              <p className="text-xs text-gray-600">
                This is a permanent document - no expiry date required
              </p>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent>
            {file ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <File className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-cyan-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <Label className="text-gray-700">Notes</Label>
            <Textarea
              value={document.notes}
              onChange={(e) => setDocument({...document, notes: e.target.value})}
              className="bg-white border-gray-300 text-gray-900 mt-2 min-h-[100px]"
              placeholder="Additional information about this document..."
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={preselectedVessel ? createPageUrl(`VesselDetail?id=${preselectedVessel}`) : createPageUrl('Documents')}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit"
            disabled={uploading || createDocumentMutation.isPending || !document.vessel_id || !document.documentTypeId}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {uploading || createDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </div>
  );
}