/**
 * Upload Document Page (Document Creation / Edit Form)
 *
 * PURPOSE:
 * Multi-step form for uploading vessel documents.
 * Auto-calculates expiry dates based on document type.
 * Supports both create (default) and edit (?edit=<id>) modes.
 *
 * PRESELECTION SUPPORT:
 * URL parameter: ?vessel=xxx  — Pre-selects vessel in form.
 * URL parameter: ?edit=xxx   — Loads existing document for editing.
 *
 * MANAGE TYPES RETURN FLOW:
 * When user clicks "Manage Types", the current draft is saved to
 * sessionStorage under 'uploadDocumentDraft'. On remount, the draft
 * is restored automatically and sessionStorage is cleared.
 *
 * FOUR-SECTION FORM:
 * 1. VESSEL SELECTION
 * 2. DOCUMENT TYPE (includes Document Name, metadata preview, Issuing Authority, Reference)
 * 3. VALIDITY DATES (Permanent checkbox, Issue Date, Expiry Date with auto-calc)
 * 4. FILE UPLOAD
 * + NOTES
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
  X,
  ChevronRight
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
import { formatDocValidityType } from '../components/utils/docValidityType';

export default function UploadDocument() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedVessel = urlParams.get('vessel');
  const editId = urlParams.get('edit');

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
  const [showAuthorityList, setShowAuthorityList] = useState(false);

  // After returning from EditDocumentType via Manage Types flow, auto-select the saved type.
  // Read from sessionStorage immediately on mount and clear the key.
  const [returnDocTypePending] = useState(() => {
    const raw = sessionStorage.getItem('uploadDocumentReturnType');
    if (raw) {
      sessionStorage.removeItem('uploadDocumentReturnType');
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  });

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

  // Load existing document for edit mode
  const { data: editDocument } = useQuery({
    queryKey: ['document', editId],
    queryFn: () => base44.entities.Document.filter({ id: parseInt(editId) }).then(r => r[0]),
    enabled: !!editId
  });

  // Restore sessionStorage draft (after returning from Manage Types)
  useEffect(() => {
    const draft = sessionStorage.getItem('uploadDocumentDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setDocument(parsed.document);
        if (parsed.authoritySearch) setAuthoritySearch(parsed.authoritySearch);
        if (parsed.selectedDocType) setSelectedDocType(parsed.selectedDocType);
      } catch (e) {}
      sessionStorage.removeItem('uploadDocumentDraft');
    }
  }, []);

  // Pre-fill form fields when edit document loads (depends on documentTypes for is_permanent)
  useEffect(() => {
    if (editDocument && documentTypes.length > 0) {
      const docType = documentTypes.find(dt => dt.id === parseInt(editDocument.documentTypeId));
      const isPermanent = docType?.documentValidityType === 'PermanentStatic' || (!editDocument.expiry_date && !editDocument.documentTypeId);
      setSelectedDocType(docType || null);
      setDocument({
        vessel_id: String(editDocument.vessel_id || ''),
        documentTypeId: String(editDocument.documentTypeId || ''),
        document_name: editDocument.document_name || '',
        issue_date: editDocument.issue_date || '',
        expiry_date: editDocument.expiry_date || '',
        issuingAuthorityId: editDocument.issuingAuthorityId || '',
        reference_number: editDocument.reference_number || '',
        notes: editDocument.notes || '',
        is_permanent: isPermanent
      });
    }
  }, [editDocument, documentTypes]);

  // Set authority search label when both editDocument and authorities are loaded
  useEffect(() => {
    if (editDocument?.issuingAuthorityId && authorities.length > 0) {
      const auth = authorities.find(a => a.id === editDocument.issuingAuthorityId);
      if (auth) setAuthoritySearch(auth.name);
    }
  }, [editDocument, authorities]);

  // Auto-select type returned from EditDocumentType (Manage Types flow)
  useEffect(() => {
    if (!returnDocTypePending || documentTypes.length === 0) return;
    let dt;
    if (returnDocTypePending.publicId) {
      dt = documentTypes.find(t => t.publicId === returnDocTypePending.publicId);
    } else if (returnDocTypePending.name) {
      dt = documentTypes.find(t => t.name === returnDocTypePending.name);
    }
    if (!dt) return;
    const isPermanent = dt.documentValidityType === 'PermanentStatic';
    setSelectedDocType(dt);
    setDocument(prev => ({
      ...prev,
      documentTypeId: String(dt.id),
      document_name: dt.name || prev.document_name,
      is_permanent: isPermanent,
      expiry_date: isPermanent ? '' : prev.expiry_date,
    }));
  }, [returnDocTypePending, documentTypes]);

  const createDocumentMutation = useMutation({
    mutationFn: async (data) => {
      const vesselIdInt    = parseInt(data.vessel_id) || null;
      const docTypeIdInt   = data.documentTypeId    ? parseInt(data.documentTypeId)    : null;
      const authorityIdInt = data.issuingAuthorityId ? parseInt(data.issuingAuthorityId) : null;

      const vessel    = vessels.find(v => v.id === vesselIdInt);
      const docType   = documentTypes.find(dt => dt.id === docTypeIdInt);
      const authority = authorities.find(a => a.id === authorityIdInt);

      return await base44.entities.Document.create({
        ...data,
        vessel_id:                vesselIdInt,
        documentTypeId:           docTypeIdInt,
        issuingAuthorityId:       authorityIdInt,
        vesselPublicId:           vessel?.publicId,
        documentTypePublicId:     docType?.publicId,
        issuingAuthorityPublicId: authority?.publicId,
        issue_date:  data.issue_date || null,
        expiry_date: data.is_permanent ? null : (data.expiry_date || null),
      });
    },
    onSuccess: () => {
      // Remove cache so the list fetches fresh data on next mount
      queryClient.removeQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
      if (preselectedVessel) {
        navigate(createPageUrl(`VesselDetail?id=${preselectedVessel}&tab=documents`));
      } else {
        navigate(createPageUrl('Documents'));
      }
    },
    onError: () => {
      toast.error('Failed to upload document');
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data) => {
      const vesselIdInt    = parseInt(data.vessel_id) || null;
      const docTypeIdInt   = data.documentTypeId    ? parseInt(data.documentTypeId)    : null;
      const authorityIdInt = data.issuingAuthorityId ? parseInt(data.issuingAuthorityId) : null;

      const vessel    = vessels.find(v => v.id === vesselIdInt);
      const docType   = documentTypes.find(dt => dt.id === docTypeIdInt);
      const authority = authorities.find(a => a.id === authorityIdInt);

      return await base44.entities.Document.update(parseInt(editId), {
        ...editDocument,
        ...data,
        vessel_id:                vesselIdInt,
        documentTypeId:           docTypeIdInt,
        issuingAuthorityId:       authorityIdInt,
        vesselPublicId:           vessel?.publicId,
        documentTypePublicId:     docType?.publicId,
        issuingAuthorityPublicId: authority?.publicId,
        issue_date:  data.issue_date || null,
        expiry_date: data.is_permanent ? null : (data.expiry_date || null),
      });
    },
    onSuccess: () => {
      // Remove cache so list and detail fetch fresh data on next mount
      queryClient.removeQueries({ queryKey: ['documents'] });
      queryClient.removeQueries({ queryKey: ['document', editId] });
      toast.success('Document updated successfully');
      if (preselectedVessel) {
        navigate(createPageUrl(`VesselDetail?id=${preselectedVessel}&tab=documents`));
      } else {
        navigate(createPageUrl('Documents'));
      }
    },
    onError: () => {
      toast.error('Failed to update document');
    }
  });

  // Auto-calculate expiry date when issue date and document type change
  useEffect(() => {
    if (document.is_permanent) {
      setDocument(prev => ({ ...prev, expiry_date: '' }));
      return;
    }
    if (document.issue_date && (selectedDocType?.documentValidityType === 'RenewableCertified' || selectedDocType?.documentValidityType === 'VettingTimeSensitive') && selectedDocType.defaultValidityDuration) {
      const issueDate = new Date(document.issue_date);
      let expiryDate;

      switch (selectedDocType.validityUnit) {
        case 'Days':
          expiryDate = addDays(issueDate, selectedDocType.defaultValidityDuration);
          break;
        case 'Weeks':
          expiryDate = addWeeks(issueDate, selectedDocType.defaultValidityDuration);
          break;
        case 'Months':
          expiryDate = addMonths(issueDate, selectedDocType.defaultValidityDuration);
          break;
        case 'Years':
          expiryDate = addYears(issueDate, selectedDocType.defaultValidityDuration);
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
  }, [document.issue_date, document.is_permanent, selectedDocType]);

  const handleDocTypeChange = (docTypeId) => {
    const docType = documentTypes.find(dt => dt.id === parseInt(docTypeId));
    setSelectedDocType(docType);
    const isPermanent = docType?.documentValidityType === 'PermanentStatic';
    setDocument(prev => ({
      ...prev,
      documentTypeId: docTypeId,
      document_name: docType?.name || prev.document_name,
      is_permanent: isPermanent,
      expiry_date: isPermanent ? '' : prev.expiry_date,
    }));
    setShowAuthorityList(false);
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

    let fileUrl = editDocument?.file_url || null;

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

    const { is_permanent, ...docFields } = document;
    const docData = {
      ...docFields,
      publicId: editDocument?.publicId || generateUUID(),
      tenantId: editDocument?.tenantId || getCurrentTenantId(),
      file_url: fileUrl,
      status: editDocument?.status || 'Valid',
      expiry_date: is_permanent ? null : document.expiry_date,
    };

    if (editId) {
      updateDocumentMutation.mutate(docData);
    } else {
      createDocumentMutation.mutate(docData);
    }
    setUploading(false);
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const backUrl = preselectedVessel
    ? createPageUrl(`VesselDetail?id=${preselectedVessel}&tab=documents`)
    : createPageUrl('Documents');

  const isPending = uploading || createDocumentMutation.isPending || updateDocumentMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link to={backUrl} className="hover:text-gray-900 transition-colors">
          {preselectedVessel ? 'Vessel' : 'Documents'}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900">{editId ? 'Edit Document' : 'Upload Document'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Document' : 'Upload Document'}</h1>
          <p className="text-gray-600 mt-1">{editId ? 'Update document details' : 'Add a new document to the registry'}</p>
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
              disabled={!!preselectedVessel}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select a vessel" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {vessels.map((vessel) => (
                  <SelectItem key={vessel.id} value={String(vessel.id)} className="text-gray-900">
                    {vessel.name} (IMO: {vessel.imoNumber})
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.setItem('uploadDocumentDraft', JSON.stringify({ document, authoritySearch, selectedDocType }));
                  sessionStorage.setItem('uploadDocumentContext', JSON.stringify({
                    returnTo: 'UploadDocument',
                    editId: editId || null,
                    vesselId: preselectedVessel || null,
                  }));
                  navigate(createPageUrl('DocumentTypes'));
                }}
                className="border-gray-300 text-gray-700 text-xs"
              >
                Manage Types
              </Button>
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
                    <SelectItem key={docType.id} value={String(docType.id)} className="text-gray-900">
                      {docType.name}{docType.documentValidityType ? ` (${docType.documentValidityType})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Document Name *</Label>
              <Input
                value={document.document_name}
                onChange={(e) => setDocument({...document, document_name: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="Document name"
              />
            </div>

            {selectedDocType && (selectedDocType.documentValidityType || selectedDocType.defaultValidityDuration) && (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                {selectedDocType.documentValidityType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Validity Type:</span>
                    <span className="text-gray-900">{formatDocValidityType(selectedDocType.documentValidityType)}</span>
                  </div>
                )}
                {selectedDocType.issuingAuthorityDefault && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Default Authority:</span>
                    <span className="text-gray-900">{selectedDocType.issuingAuthorityDefault}</span>
                  </div>
                )}
                {selectedDocType.defaultValidityDuration && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valid For:</span>
                      <span className="text-gray-900">{selectedDocType.defaultValidityDuration} {selectedDocType.validityUnit}</span>
                    </div>
                    {selectedDocType.reminderLeadTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Reminder:</span>
                        <span className="text-gray-900">{selectedDocType.reminderLeadTime} {selectedDocType.reminderUnit} before expiry</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-700">Issuing Authority</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search authority..."
                  value={authoritySearch}
                  onChange={(e) => { setAuthoritySearch(e.target.value); setShowAuthorityList(true); }}
                  onFocus={() => setShowAuthorityList(true)}
                  className="bg-white border-gray-300 text-gray-900"
                />
                {showAuthorityList && (
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
                            setShowAuthorityList(false);
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
                )}
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
                  disabled={document.is_permanent || selectedDocType?.documentValidityType === 'PermanentStatic'}
                />
              </div>
            </div>
            {(selectedDocType?.documentValidityType === 'RenewableCertified' || selectedDocType?.documentValidityType === 'VettingTimeSensitive') && document.issue_date && !document.is_permanent && (
              <p className="text-xs text-cyan-600">
                ✓ Expiry date auto-calculated based on document type validity period
              </p>
            )}
            {(selectedDocType?.documentValidityType === 'PermanentStatic' || document.is_permanent) && (
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
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
              File storage is not yet configured. Selecting a file here will not persist it.
            </p>
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
          <Link to={backUrl}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending || !document.vessel_id || !document.documentTypeId}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Saving...' : editId ? 'Update Document' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </div>
  );
}
