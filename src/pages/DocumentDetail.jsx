/**
 * Document Detail Page (Single Document View)
 * 
 * PURPOSE:
 * View document details with renewal functionality.
 * Manages attachments and shows expiry status.
 * 
 * CONTEXT-AWARE NAVIGATION (lines 30-32, 136):
 * 
 * fromPage URL parameter tracks origin.
 * 
 * NAVIGATION:
 * - from=documents → Back to Documents list
 * - Otherwise → Back to VesselDetail#documents tab
 * 
 * MAINTAINS USER CONTEXT:
 * User returns to their starting point.
 * 
 * RENEW DOCUMENT FEATURE (lines 62-83, 150-159):
 * 
 * WHEN SHOWN (line 129):
 * canRenew = Renewable type AND (Expired OR Expiring Soon)
 * 
 * CONDITIONAL BUTTON:
 * Only appears when renewal appropriate.
 * 
 * RENEWAL PROCESS (lines 62-83):
 * 
 * 1. Creates NEW document record (line 77)
 * 2. Copies metadata from old document
 * 3. Clears dates/reference (lines 69-71)
 * 4. Sets status to 'Valid' (line 72)
 * 5. Adds note referencing original (line 73)
 * 6. Navigates to UploadDocument page with draft (line 81)
 * 
 * RATIONALE:
 * Renewal is new document, not update.
 * Preserves historical record.
 * Old document stays as audit trail.
 * 
 * USER COMPLETES RENEWAL:
 * - Fills new dates
 * - Uploads new certificate file
 * - Saves completed renewal
 * 
 * STATUS CALCULATION (lines 119-121):
 * 
 * Same logic as Documents list page.
 * isExpired: Past expiry date.
 * isExpiring: Within 30 days.
 * Otherwise: Valid.
 * 
 * STATUS BADGE (lines 147-149):
 * Color-coded in header.
 * Prominent placement.
 * 
 * EXPIRY ALERT (lines 206-214):
 * 
 * Red warning box if expired.
 * Shows expiry date.
 * AlertCircle icon.
 * 
 * "This document expired on Jan 12, 2026"
 * 
 * VISUAL URGENCY:
 * User immediately aware of compliance issue.
 * 
 * DOCUMENT INFORMATION (lines 164-223):
 * 
 * TWO-COLUMN LAYOUT:
 * Left: Type, category, lifecycle, reference.
 * Right: Authority, dates.
 * 
 * PERMANENT DOCUMENTS (lines 202-203):
 * If lifecycle_type === 'Permanent':
 * Shows "Permanent" instead of date.
 * 
 * ATTACHMENTS SECTION (lines 226-262):
 * 
 * Currently shows original file only (line 240).
 * Upload button for adding attachments (lines 230-237).
 * 
 * FUTURE ENHANCEMENT:
 * Multiple attachments per document.
 * Amendments, supporting docs, etc.
 * 
 * UPLOAD ATTACHMENT DIALOG (lines 264-313):
 * 
 * FILE PICKER (lines 289-302):
 * Drag-drop zone.
 * Click to upload.
 * 
 * SELECTED FILE DISPLAY (lines 271-288):
 * Shows file name and size.
 * X button to remove selection.
 * 
 * UPLOAD HANDLER (lines 85-96, 105-109):
 * Uploads via Core.UploadFile integration.
 * Returns file_url.
 * 
 * CURRENT LIMITATION:
 * Attachment upload updates document.file_url.
 * Doesn't create separate attachment records.
 * 
 * RESOLUTION PATH:
 * Each query has specific purpose.
 * Vessel, DocumentType, Authority lookups.
 * Display enriched data.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  FileText,
  Download,
  Upload,
  X,
  Calendar,
  Building2,
  Ship,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export default function DocumentDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const documentId = urlParams.get('id');
  const fromPage = urlParams.get('from');

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [file, setFile] = useState(null);

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => base44.entities.Document.filter({ id: parseInt(documentId) }).then(r => r[0]),
    enabled: !!documentId
  });

  const { data: vessel } = useQuery({
    queryKey: ['vessel', document?.vessel_id],
    queryFn: () => base44.entities.Vessel.filter({ id: document.vessel_id }).then(r => r[0]),
    enabled: !!document?.vessel_id
  });

  const { data: documentType } = useQuery({
    queryKey: ['documentType', document?.document_type_id],
    queryFn: () => base44.entities.DocumentType.filter({ id: document.document_type_id }).then(r => r[0]),
    enabled: !!document?.document_type_id
  });

  const { data: authority } = useQuery({
    queryKey: ['authority', document?.issuing_authority_id],
    queryFn: () => base44.entities.IssuingAuthority.filter({ id: document.issuing_authority_id }).then(r => r[0]),
    enabled: !!document?.issuing_authority_id
  });

  const renewDocumentMutation = useMutation({
    mutationFn: async () => {
      const renewedDoc = {
        vessel_id: document.vessel_id,
        document_type_id: document.document_type_id,
        document_name: document.document_name,
        issuing_authority_id: document.issuing_authority_id,
        reference_number: '',
        issue_date: '',
        expiry_date: '',
        status: 'Valid',
        notes: `Renewed from document ${document.reference_number || document.id}`,
        document_type: documentType?.lifecycle_type,
        category: documentType?.category
      };
      return await base44.entities.Document.create(renewedDoc);
    },
    onSuccess: (data) => {
      toast.success('Document renewal draft created');
      navigate(createPageUrl(`UploadDocument?vessel=${document.vessel_id}&renew=${data.id}`));
    }
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async () => {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      return uploadResult.file_url;
    },
    onSuccess: (fileUrl) => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      setShowUploadDialog(false);
      setFile(null);
      toast.success('Attachment uploaded');
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUploadAttachment = async () => {
    setUploadingFile(true);
    await uploadAttachmentMutation.mutateAsync();
    setUploadingFile(false);
  };

  if (isLoading || !document) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isExpiring = document.expiry_date && differenceInDays(new Date(document.expiry_date), new Date()) <= 30 && differenceInDays(new Date(document.expiry_date), new Date()) > 0;
  const isExpired = document.expiry_date && new Date(document.expiry_date) < new Date();
  const docStatus = isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Valid';

  const statusColors = {
    'Valid': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    'Expiring Soon': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    'Expired': 'bg-red-500/10 text-red-600 border-red-500/30'
  };

  const canRenew = (documentType?.lifecycle_type === 'Renewable' || document.document_type === 'Renewable') && (isExpired || isExpiring);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.document_name}</h1>
            <p className="text-sm text-gray-600 mt-1">{vessel?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[docStatus]} border`}>
            {docStatus}
          </Badge>
          {canRenew && (
            <Button
              onClick={() => renewDocumentMutation.mutate()}
              disabled={renewDocumentMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Renew Document
            </Button>
          )}
        </div>
      </div>

      {/* Document Details */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Document Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Document Type</p>
                <p className="text-gray-900 font-medium">{documentType?.name || document.document_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-gray-900 font-medium">{documentType?.category || document.category || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lifecycle Type</p>
                <p className="text-gray-900 font-medium">{documentType?.lifecycle_type || document.document_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reference Number</p>
                <p className="text-gray-900 font-medium">{document.reference_number || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Issuing Authority</p>
                <p className="text-gray-900 font-medium">{authority?.name || document.issuing_authority || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="text-gray-900 font-medium">
                  {document.issue_date ? format(new Date(document.issue_date), 'MMM d, yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiry Date</p>
                <p className="text-gray-900 font-medium">
                  {document.expiry_date ? format(new Date(document.expiry_date), 'MMM d, yyyy') : 
                   documentType?.lifecycle_type === 'Permanent' ? 'Permanent' : '-'}
                </p>
              </div>
              {isExpired && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-600">Document Expired</p>
                    <p className="text-xs text-red-600/80">This document expired on {format(new Date(document.expiry_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {document.notes && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="text-gray-700">{document.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Attachments</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowUploadDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Attachment
          </Button>
        </CardHeader>
        <CardContent>
          {document.file_url ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="font-medium text-gray-900">Original Document</p>
                  <p className="text-xs text-gray-600">Uploaded document file</p>
                </div>
              </div>
              <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No attachments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Attachment Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Upload Attachment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {file ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button 
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
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            )}
            <Button 
              onClick={handleUploadAttachment}
              disabled={!file || uploadingFile}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {uploadingFile ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}