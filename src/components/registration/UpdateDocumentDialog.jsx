import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Info } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import DatePicker from '../ui/DatePicker';
import { toast } from 'sonner';
import { addMonths, addYears } from 'date-fns';

export default function UpdateDocumentDialog({ 
  open, 
  onOpenChange, 
  vesselId, 
  vesselPublicId,
  documentTypeId,
  onSuccess 
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    document_name: '',
    documentTypeId: documentTypeId || '',
    issue_date: '',
    expiry_date: '',
    reference_number: '',
    file_url: '',
    notes: '',
    status: 'Valid'
  });
  const [expiryAutoCalculated, setExpiryAutoCalculated] = useState(false);
  const [expiryManuallyEdited, setExpiryManuallyEdited] = useState(false);

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const selectedDocType = documentTypes.find(dt => dt.id === formData.documentTypeId);

  const { data: existingDocs = [] } = useQuery({
    queryKey: ['documents', vesselId, documentTypeId],
    queryFn: () => base44.entities.Document.filter({ 
      vessel_id: vesselId, 
      documentTypeId: documentTypeId 
    }),
    enabled: !!vesselId && !!documentTypeId
  });

  // Pre-populate if editing existing document
  useEffect(() => {
    if (existingDocs.length > 0 && open) {
      const latestDoc = existingDocs.sort((a, b) => 
        new Date(b.issue_date || 0) - new Date(a.issue_date || 0)
      )[0];
      
      setFormData({
        document_name: latestDoc.document_name || '',
        documentTypeId: latestDoc.documentTypeId || documentTypeId,
        issue_date: latestDoc.issue_date || '',
        expiry_date: latestDoc.expiry_date || '',
        reference_number: latestDoc.reference_number || '',
        file_url: latestDoc.file_url || '',
        notes: latestDoc.notes || '',
        status: latestDoc.status || 'Valid'
      });
      setExpiryAutoCalculated(false);
      setExpiryManuallyEdited(false);
    } else if (open && documentTypeId) {
      const docType = documentTypes.find(dt => dt.id === documentTypeId);
      setFormData(prev => ({
        ...prev,
        documentTypeId,
        document_name: docType?.name || ''
      }));
      setExpiryAutoCalculated(false);
      setExpiryManuallyEdited(false);
    }
  }, [existingDocs, open, documentTypeId, documentTypes]);

  // Auto-calculate expiry date when issue date changes
  useEffect(() => {
    if (!formData.issue_date || !selectedDocType || expiryManuallyEdited) return;

    const validityType = selectedDocType.documentValidityType;
    
    if (validityType === 'PermanentStatic') {
      setFormData(prev => ({ ...prev, expiry_date: '' }));
      setExpiryAutoCalculated(false);
      return;
    }

    if (validityType === 'RenewableCertified' || validityType === 'VettingTimeSensitive') {
      const duration = selectedDocType.defaultValidityDuration;
      const unit = selectedDocType.validityUnit;
      
      if (duration && unit) {
        const issueDate = new Date(formData.issue_date);
        let expiryDate;
        
        if (unit === 'Years') {
          expiryDate = addYears(issueDate, duration);
        } else if (unit === 'Months') {
          expiryDate = addMonths(issueDate, duration);
        } else {
          // Days
          expiryDate = new Date(issueDate);
          expiryDate.setDate(expiryDate.getDate() + duration);
        }
        
        setFormData(prev => ({ 
          ...prev, 
          expiry_date: format(expiryDate, 'yyyy-MM-dd') 
        }));
        setExpiryAutoCalculated(true);
        
        if (expiryAutoCalculated) {
          toast.success('Expiry date updated based on new issue date');
        }
      }
    }
  }, [formData.issue_date, selectedDocType, expiryManuallyEdited]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const docType = documentTypes.find(dt => dt.id === data.documentTypeId);
      
      // Check if we're updating or creating
      if (existingDocs.length > 0) {
        const latestDoc = existingDocs[0];
        return base44.entities.Document.update(latestDoc.id, data);
      } else {
        return base44.entities.Document.create({
          ...data,
          vessel_id: vesselId,
          vesselPublicId: vesselPublicId,
          documentTypePublicId: docType?.publicId,
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Document saved successfully');
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to save document: ' + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url: result.file_url });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file: ' + error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.document_name || !formData.documentTypeId) {
      toast.error('Please fill in all required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {existingDocs.length > 0 ? 'Update Document' : 'Upload Document'}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Upload a new version without leaving the registration process
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Document Name *</Label>
            <Input
              value={formData.document_name}
              onChange={(e) => setFormData({...formData, document_name: e.target.value})}
              className="bg-white border-gray-300"
              placeholder="Enter document name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Document Type *</Label>
            <SearchableSelect
              value={formData.documentTypeId}
              onValueChange={(value) => setFormData({...formData, documentTypeId: value})}
              options={documentTypes.filter(dt => dt.isActive).map(dt => ({ value: dt.id, label: dt.name }))}
              placeholder="Select document type"
              searchPlaceholder="Search document types..."
              disabled={!!documentTypeId}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Issue Date</Label>
              <DatePicker
                value={formData.issue_date}
                onChange={(date) => {
                  setFormData({...formData, issue_date: date});
                  setExpiryManuallyEdited(false);
                }}
                placeholder="Select issue date"
              />
              <p className="text-xs text-gray-600">Date the document was issued by the authority</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Expiry Date</Label>
              {selectedDocType?.documentValidityType === 'Permanent' ? (
                <>
                  <div className="h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center text-gray-500 text-sm">
                    No expiry date
                  </div>
                  <p className="text-xs text-gray-600">This document does not have an expiry date</p>
                </>
              ) : (
                <>
                  <DatePicker
                    value={formData.expiry_date}
                    onChange={(date) => {
                      setFormData({...formData, expiry_date: date});
                      setExpiryAutoCalculated(false);
                      setExpiryManuallyEdited(true);
                    }}
                    placeholder="Select expiry date"
                  />
                  {expiryAutoCalculated && !expiryManuallyEdited && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Automatically calculated based on document validity. You may adjust if required.
                    </p>
                  )}
                  {!expiryAutoCalculated && (
                    <p className="text-xs text-gray-600">Document expiry date</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Reference Number</Label>
            <Input
              value={formData.reference_number}
              onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
              className="bg-white border-gray-300"
              placeholder="Enter reference number"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Upload File</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="bg-white border-gray-300"
              />
              {formData.file_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.file_url, '_blank')}
                  className="flex-shrink-0"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-white border-gray-300"
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {saveMutation.isPending ? 'Saving...' : existingDocs.length > 0 ? 'Update Document' : 'Add Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}