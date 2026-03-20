import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Upload, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '../ui/DatePicker';
import SearchableSelect from '../ui/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

export default function CompanyDocumentsTab({ companyId, companyPublicId }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['companyDocuments', companyId],
    queryFn: () => base44.entities.CompanyDocument.filter({ companyId }),
    enabled: !!companyId
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyDocument.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      companyId,
      companyPublicId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyDocuments']);
      setShowDialog(false);
      setFormData({});
      toast.success('Document added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyDocuments']);
      setShowDialog(false);
      setEditingDoc(null);
      setFormData({});
      toast.success('Document updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyDocuments']);
      setDeletingDoc(null);
      toast.success('Document deleted');
    }
  });

  const handleAdd = () => {
    setEditingDoc(null);
    setFormData({
      title: '',
      documentTypeId: '',
      file_url: '',
      issueDate: '',
      expiryDate: '',
      notes: '',
      status: 'Active'
    });
    setShowDialog(true);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData(doc);
    setShowDialog(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url: result.file_url });
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    const docType = documentTypes.find(dt => dt.id === formData.documentTypeId);
    const payload = {
      ...formData,
      documentTypePublicId: docType?.publicId || null
    };

    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const statusColors = {
    Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    Inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    Expired: 'bg-red-500/10 text-red-600 border-red-500/30'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents</h3>
            <p className="text-gray-600 mb-4">Upload company documents</p>
            <Button onClick={handleAdd} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const docType = documentTypes.find(dt => dt.id === doc.documentTypeId);
            return (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors group">
                <div className="flex items-center gap-4 flex-1">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    {docType && (
                      <p className="text-xs text-gray-600">{docType.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.expiryDate && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Expires</p>
                      <p className="text-sm text-gray-900">{format(new Date(doc.expiryDate), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  <Badge className={`${statusColors[doc.status]} border`}>
                    {doc.status}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="h-8 w-8"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(doc)}
                      className="h-8 w-8"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingDoc(doc)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingDoc ? 'Edit Document' : 'Add Document'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              <SearchableSelect
                value={formData.documentTypeId || ''}
                onValueChange={(v) => setFormData({ ...formData, documentTypeId: v })}
                options={documentTypes.filter(dt => dt.isActive).map(dt => ({ value: dt.id, label: dt.name }))}
                placeholder="Select document type (optional)"
                searchPlaceholder="Search document types..."
              />
            </div>

            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {formData.file_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(formData.file_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <DatePicker
                  value={formData.issueDate || ''}
                  onChange={(date) => setFormData({ ...formData, issueDate: date })}
                  placeholder="Select issue date"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <DatePicker
                  value={formData.expiryDate || ''}
                  onChange={(date) => setFormData({ ...formData, expiryDate: date })}
                  placeholder="Select expiry date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status || 'Active'}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingDoc ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDoc} onOpenChange={() => setDeletingDoc(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingDoc?.title}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingDoc.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}