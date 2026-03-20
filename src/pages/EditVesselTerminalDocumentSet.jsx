import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, XCircle, Upload, Link as LinkIcon, Loader2, Archive } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function EditVesselTerminalDocumentSet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const setId = urlParams.get('id');

  const [notes, setNotes] = useState('');
  const [showAddDocTypeDialog, setShowAddDocTypeDialog] = useState(false);
  const [selectedDocTypes, setSelectedDocTypes] = useState([]);
  const [showDocumentPicker, setShowDocumentPicker] = useState(null);
  const [searchDocType, setSearchDocType] = useState('');

  const { data: documentSet, isLoading: loadingSet } = useQuery({
    queryKey: ['vesselTerminalDocumentSet', setId],
    queryFn: async () => {
      const sets = await base44.entities.VesselTerminalDocumentSet.filter({ id: setId });
      if (sets.length === 0) throw new Error('Document set not found');
      setNotes(sets[0].notes || '');
      return sets[0];
    },
    enabled: !!setId
  });

  const { data: setItems = [] } = useQuery({
    queryKey: ['vesselTerminalDocumentSetItems', setId],
    queryFn: () => base44.entities.VesselTerminalDocumentSetItem.filter({ documentSetId: setId }),
    enabled: !!setId
  });

  const { data: vessel } = useQuery({
    queryKey: ['vessel', documentSet?.vesselId],
    queryFn: async () => {
      const vessels = await base44.entities.Vessel.filter({ id: documentSet.vesselId });
      return vessels[0];
    },
    enabled: !!documentSet?.vesselId
  });

  const { data: terminal } = useQuery({
    queryKey: ['terminal', documentSet?.terminalId],
    queryFn: async () => {
      const terminals = await base44.entities.Terminal.filter({ id: documentSet.terminalId });
      return terminals[0];
    },
    enabled: !!documentSet?.terminalId
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: vesselDocuments = [] } = useQuery({
    queryKey: ['vesselDocuments', documentSet?.vesselId],
    queryFn: () => base44.entities.Document.filter({ vessel_id: documentSet.vesselId }),
    enabled: !!documentSet?.vesselId
  });

  const updateSetMutation = useMutation({
    mutationFn: (data) => base44.entities.VesselTerminalDocumentSet.update(setId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselTerminalDocumentSet', setId]);
      toast({ title: 'Document set updated' });
    }
  });

  const addDocTypesMutation = useMutation({
    mutationFn: async (docTypeIds) => {
      const items = docTypeIds.map((dtId, idx) => {
        const docType = documentTypes.find(dt => dt.id === dtId);
        return {
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          documentSetId: setId,
          documentSetPublicId: documentSet.publicId,
          documentTypeId: dtId,
          documentTypePublicId: docType.publicId,
          isRequired: true,
          isProvided: false,
          sortOrder: setItems.length + idx + 1
        };
      });
      return base44.entities.VesselTerminalDocumentSetItem.bulkCreate(items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselTerminalDocumentSetItems', setId]);
      setShowAddDocTypeDialog(false);
      setSelectedDocTypes([]);
      toast({ title: 'Document types added' });
    }
  });

  const linkDocumentMutation = useMutation({
    mutationFn: ({ itemId, documentId }) => {
      const doc = vesselDocuments.find(d => d.id === documentId);
      return base44.entities.VesselTerminalDocumentSetItem.update(itemId, {
        documentId,
        documentPublicId: doc.publicId,
        isProvided: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselTerminalDocumentSetItems', setId]);
      setShowDocumentPicker(null);
      toast({ title: 'Document linked' });
    }
  });

  const unlinkDocumentMutation = useMutation({
    mutationFn: (itemId) => {
      return base44.entities.VesselTerminalDocumentSetItem.update(itemId, {
        documentId: null,
        documentPublicId: null,
        isProvided: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselTerminalDocumentSetItems', setId]);
      toast({ title: 'Document unlinked' });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => base44.entities.VesselTerminalDocumentSetItem.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselTerminalDocumentSetItems', setId]);
      toast({ title: 'Item removed' });
    }
  });

  const activateSetMutation = useMutation({
    mutationFn: async () => {
      // Archive any existing ACTIVE sets for same vessel-terminal-berth
      const existingSets = await base44.entities.VesselTerminalDocumentSet.filter({
        vesselId: documentSet.vesselId,
        terminalId: documentSet.terminalId,
        status: 'ACTIVE'
      });
      
      for (const set of existingSets) {
        if (set.id !== setId) {
          await base44.entities.VesselTerminalDocumentSet.update(set.id, { status: 'ARCHIVED' });
        }
      }

      return base44.entities.VesselTerminalDocumentSet.update(setId, { status: 'ACTIVE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselTerminalDocumentSet', setId]);
      toast({ title: 'Document set activated', description: 'This is now the active set for this vessel-terminal combination' });
    }
  });

  const enrichedItems = setItems.map(item => ({
    ...item,
    documentType: documentTypes.find(dt => dt.id === item.documentTypeId),
    document: vesselDocuments.find(d => d.id === item.documentId)
  }));

  const handleSaveNotes = () => {
    updateSetMutation.mutate({ notes });
  };

  if (loadingSet) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Document Set</h1>
            <p className="text-gray-600 mt-1">
              {vessel?.name} → {terminal?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={documentSet?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {documentSet?.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Set Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Vessel</Label>
                <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                  <Ship className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">{vessel?.name}</span>
                </div>
              </div>
              <div>
                <Label>Terminal</Label>
                <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                  <Building2 className="w-4 h-4 text-cyan-600" />
                  <span className="font-medium">{terminal?.name}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
              <Button type="button" size="sm" variant="outline" onClick={handleSaveNotes}>
                <Save className="w-3 h-3 mr-1" />
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>Add document types and link vessel documents</CardDescription>
              </div>
              <Button onClick={() => setShowAddDocTypeDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Document Types
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {enrichedItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="font-medium">No document types added yet</p>
                <p className="text-sm">Click "Add Document Types" to define requirements</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Document</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.documentType?.name || 'Unknown Type'}
                      </TableCell>
                      <TableCell>
                        {item.isProvided ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Provided
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.document ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.document.document_name}</span>
                            {item.document.expiry_date && (
                              <span className="text-xs text-gray-500">
                                (Exp: {new Date(item.document.expiry_date).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDocumentPicker(item)}
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            {item.documentId ? 'Change' : 'Select'}
                          </Button>
                          {item.documentId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unlinkDocumentMutation.mutate(item.id)}
                            >
                              Unlink
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {documentSet?.status === 'DRAFT' && (
              <Button
                onClick={() => activateSetMutation.mutate()}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Activate Set
              </Button>
            )}
            {documentSet?.status === 'ACTIVE' && (
              <Button
                variant="outline"
                onClick={() => updateSetMutation.mutate({ status: 'ARCHIVED' })}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Set
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {enrichedItems.filter(i => i.isProvided).length} of {enrichedItems.length} documents provided
          </div>
        </div>
      </div>

      {/* Add Document Types Dialog */}
      <Dialog open={showAddDocTypeDialog} onOpenChange={setShowAddDocTypeDialog}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Document Types</DialogTitle>
            <DialogDescription>Select document types to add to this set</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search document types..."
              value={searchDocType}
              onChange={(e) => setSearchDocType(e.target.value)}
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documentTypes
                .filter(dt => !setItems.some(item => item.documentTypeId === dt.id))
                .filter(dt => !searchDocType || dt.name.toLowerCase().includes(searchDocType.toLowerCase()))
                .map(dt => (
                  <label key={dt.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDocTypes.includes(dt.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocTypes([...selectedDocTypes, dt.id]);
                        } else {
                          setSelectedDocTypes(selectedDocTypes.filter(id => id !== dt.id));
                        }
                      }}
                      className="form-checkbox h-4 w-4"
                    />
                    <div>
                      <p className="font-medium">{dt.name}</p>
                      {dt.description && <p className="text-sm text-gray-600">{dt.description}</p>}
                    </div>
                  </label>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDocTypeDialog(false)}>Cancel</Button>
            <Button
              onClick={() => addDocTypesMutation.mutate(selectedDocTypes)}
              disabled={selectedDocTypes.length === 0}
            >
              Add {selectedDocTypes.length} Type{selectedDocTypes.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Picker Dialog */}
      <Dialog open={!!showDocumentPicker} onOpenChange={() => setShowDocumentPicker(null)}>
        <DialogContent className="max-w-3xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Vessel Document</DialogTitle>
            <DialogDescription>
              Choose an existing document from {vessel?.name} or upload a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {vesselDocuments
              .filter(doc => !showDocumentPicker?.documentTypeId || doc.documentTypeId === showDocumentPicker.documentTypeId)
              .map(doc => {
                const docType = documentTypes.find(dt => dt.id === doc.documentTypeId);
                return (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center p-4 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{doc.document_name}</p>
                      <p className="text-sm text-gray-600">{docType?.name}</p>
                      {doc.expiry_date && (
                        <p className="text-xs text-gray-500">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        linkDocumentMutation.mutate({
                          itemId: showDocumentPicker.id,
                          documentId: doc.id
                        });
                      }}
                    >
                      Select
                    </Button>
                  </div>
                );
              })}
            {vesselDocuments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No documents found for this vessel</p>
                <Link to={createPageUrl(`UploadDocument?vesselId=${vessel?.id}`)}>
                  <Button className="mt-4">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentPicker(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}