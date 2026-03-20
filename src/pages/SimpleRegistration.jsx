import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect from '../components/ui/SearchableSelect';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
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
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SimpleRegistration() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedTerminalId = urlParams.get('terminalId');
  const preselectedVesselId = urlParams.get('vesselId');
  const existingApplicationId = urlParams.get('applicationId');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [terminalId, setTerminalId] = useState(preselectedTerminalId || '');
  const [vesselId, setVesselId] = useState(preselectedVesselId || '');
  const [applicationId, setApplicationId] = useState(existingApplicationId || null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    document_name: '',
    documentTypeId: '',
    issue_date: '',
    expiry_date: '',
    reference_number: '',
    file_url: '',
    notes: '',
    status: 'Valid'
  });
  const [editingDocument, setEditingDocument] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: vesselDocuments = [] } = useQuery({
    queryKey: ['vesselDocuments', vesselId],
    queryFn: () => base44.entities.Document.filter({ vessel_id: vesselId }),
    enabled: !!vesselId
  });

  const { data: terminalForms = [] } = useQuery({
    queryKey: ['terminalForms', terminalId],
    queryFn: () => base44.entities.TerminalForm.filter({ terminal_id: terminalId }),
    enabled: !!terminalId
  });

  const { data: application } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => base44.entities.TerminalRegistrationApplication.filter({ id: applicationId }).then(r => r[0]),
    enabled: !!applicationId,
    onSuccess: (app) => {
      if (app && app.documentApprovalMode === 'COMPLEX') {
        navigate(createPageUrl(`ComplexRegistration?applicationId=${app.id}`));
      }
      if (app) {
        setTerminalId(app.terminalId);
        setVesselId(app.vesselId);
        if (app.status === 'DRAFT' || app.status === 'IN_PROGRESS') {
          setCurrentStep(2);
        } else if (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'APPROVED' || app.status === 'READY_TO_SUBMIT') {
          setCurrentStep(3);
        }
      }
    }
  });

  const { data: companySecurityPolicy } = useQuery({
    queryKey: ['companySecurityPolicy'],
    queryFn: () => base44.entities.CompanySecurityPolicy.list().then(r => r[0] || {}),
    staleTime: Infinity,
  });

  useEffect(() => {
    if ((preselectedTerminalId || preselectedVesselId) && !applicationId) {
      const findExistingApplication = async () => {
        const existingApp = await base44.entities.TerminalRegistrationApplication.filter({
          terminalId: preselectedTerminalId,
          vesselId: preselectedVesselId,
        });
        if (existingApp.length > 0) {
          setApplicationId(existingApp[0].id);
          setTerminalId(existingApp[0].terminalId);
          setVesselId(existingApp[0].vesselId);
          if (existingApp[0].documentApprovalMode === 'COMPLEX') {
            navigate(createPageUrl(`ComplexRegistration?applicationId=${existingApp[0].id}`));
          }
          if (existingApp[0].status === 'DRAFT' || existingApp[0].status === 'IN_PROGRESS') {
            setCurrentStep(2);
          } else if (existingApp[0].status === 'SUBMITTED' || existingApp[0].status === 'UNDER_REVIEW' || existingApp[0].status === 'APPROVED' || existingApp[0].status === 'READY_TO_SUBMIT') {
            setCurrentStep(3);
          }
        }
      };
      findExistingApplication();
    }
  }, [preselectedTerminalId, preselectedVesselId, applicationId, navigate]);

  const [applicationDocuments, setApplicationDocuments] = useState([]);

  useEffect(() => {
    if (application?.document_ids && vesselDocuments.length > 0) {
      const docs = application.document_ids.map(docId => vesselDocuments.find(d => d.id === docId)).filter(Boolean);
      setApplicationDocuments(docs);
    }
  }, [application, vesselDocuments]);

  const currentTerminal = terminals.find(t => t.id === terminalId);
  const currentVessel = vessels.find(v => v.id === vesselId);

  const createAppMutation = useMutation({
    mutationFn: async (data) => {
      const terminal = terminals.find(t => t.id === data.terminalId);
      const vessel = vessels.find(v => v.id === data.vesselId);

      const existingApps = await base44.entities.TerminalRegistrationApplication.list();
      const maxNum = existingApps.reduce((max, app) => {
        const match = app.applicationNumber?.match(/REG-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const appNumber = `REG-${String(maxNum + 1).padStart(6, '0')}`;

      const newApp = await base44.entities.TerminalRegistrationApplication.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        applicationNumber: appNumber,
        terminalId: data.terminalId,
        terminalPublicId: terminal.publicId,
        vesselId: data.vesselId,
        vesselPublicId: vessel.publicId,
        status: 'DRAFT',
        documentApprovalMode: 'SIMPLE',
        document_ids: []
      });
      return newApp;
    },
    onSuccess: (newApp) => {
      setApplicationId(newApp.id);
      setCurrentStep(2);
      toast.success('Application created as draft');
      queryClient.invalidateQueries(['registrationApplications']);
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: (data) => base44.entities.TerminalRegistrationApplication.update(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['application', applicationId]);
      queryClient.invalidateQueries(['registrationApplications']);
      toast.success('Application updated');
    },
    onError: (error) => {
      toast.error('Failed to update application: ' + error.message);
    }
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data) => {
      const docType = documentTypes.find(dt => dt.id === data.documentTypeId);
      return base44.entities.Document.create({
        ...data,
        vessel_id: vesselId,
        vesselPublicId: currentVessel.publicId,
        documentTypePublicId: docType?.publicId,
        publicId: crypto.randomUUID(),
        tenantId: currentVessel.tenantId
      });
    },
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries(['vesselDocuments', vesselId]);
      const updatedDocumentIds = [...(application?.document_ids || []), newDoc.id];
      updateApplicationMutation.mutate({ document_ids: updatedDocumentIds });
      setApplicationDocuments(prev => [...prev, newDoc]);
      setShowAddDocumentDialog(false);
      resetDocumentForm();
      toast.success('Document uploaded and linked to application');
    },
    onError: (error) => {
      toast.error('Failed to upload document: ' + error.message);
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries(['vesselDocuments', vesselId]);
      setApplicationDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
      setShowAddDocumentDialog(false);
      resetDocumentForm();
      setEditingDocument(null);
      toast.success('Document updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update document: ' + error.message);
    }
  });

  const linkDocumentToApplicationMutation = useMutation({
    mutationFn: async (documentId) => {
      const updatedDocumentIds = [...(application?.document_ids || []), documentId];
      await base44.entities.TerminalRegistrationApplication.update(applicationId, {
        document_ids: updatedDocumentIds,
      });
    },
    onSuccess: (data, documentId) => {
      const doc = vesselDocuments.find(d => d.id === documentId);
      if (doc) {
        setApplicationDocuments(prev => [...prev, doc]);
      }
      queryClient.invalidateQueries(['application', applicationId]);
      toast.success('Document linked to application');
    },
    onError: (error) => {
      toast.error('Failed to link document: ' + error.message);
    }
  });

  const unlinkDocumentFromApplicationMutation = useMutation({
    mutationFn: async (documentIdToRemove) => {
      const updatedDocumentIds = (application?.document_ids || []).filter(id => id !== documentIdToRemove);
      await base44.entities.TerminalRegistrationApplication.update(applicationId, {
        document_ids: updatedDocumentIds,
      });
    },
    onSuccess: (data, documentIdToRemove) => {
      setApplicationDocuments(prev => prev.filter(doc => doc.id !== documentIdToRemove));
      queryClient.invalidateQueries(['application', applicationId]);
      toast.success('Document unlinked from application');
    },
    onError: (error) => {
      toast.error('Failed to unlink document: ' + error.message);
    }
  });

  const handleSaveDraft = () => {
    if (!application) return;
    updateApplicationMutation.mutate({ status: 'DRAFT' });
  };

  const handleSubmitForApproval = () => {
    if (!application) return;
    if (applicationDocuments.length === 0) {
      toast.error('Please add at least one document before submitting for approval.');
      return;
    }
    updateApplicationMutation.mutate({ 
      status: 'SUBMITTED', 
      submittedAt: new Date().toISOString() 
    });
    setCurrentStep(3);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!terminalId || !vesselId) {
        toast.error('Please select terminal and vessel');
        return;
      }
      createAppMutation.mutate({ terminalId, vesselId });
    } 
  };

  const resetDocumentForm = () => {
    setEditingDocument(null);
    setDocumentForm({
      document_name: '',
      documentTypeId: '',
      issue_date: '',
      expiry_date: '',
      reference_number: '',
      file_url: '',
      notes: '',
      status: 'Valid'
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setDocumentForm({ ...documentForm, file_url: result.file_url });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file: ' + error.message);
    }
  };

  const handleSubmitDocumentDialog = (e) => {
    e.preventDefault();
    if (!documentForm.document_name || !documentForm.documentTypeId) {
      toast.error('Please fill in all required document fields');
      return;
    }

    if (editingDocument) {
      updateDocumentMutation.mutate({ id: editingDocument.id, data: documentForm });
    } else {
      createDocumentMutation.mutate(documentForm);
    }
  };

  const docStatusColors = {
    'Valid': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Expiring Soon': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Expired': 'bg-red-500/10 text-red-400 border-red-500/30',
    'Superseded': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  const isApplicationEditable = application?.status === 'DRAFT' || application?.status === 'IN_PROGRESS';

  const availableVesselDocuments = vesselDocuments.filter(doc => !applicationDocuments.some(appDoc => appDoc.id === doc.id));
  const availableTerminalForms = terminalForms.filter(form => !applicationDocuments.some(appDoc => appDoc.terminalFormId === form.id));

  if (!companySecurityPolicy) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(preselectedTerminalId ? `TerminalDetail?id=${preselectedTerminalId}` : preselectedVesselId ? `VesselDetail?id=${preselectedVesselId}` : 'Terminals')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminal Registration (Simple)</h1>
          <p className="text-gray-600">
            {application ? `Application ${application.applicationNumber} - Status: ${application.status.replace(/_/g, ' ')}` : 'New Application'}
          </p>
        </div>
      </div>

      {currentStep === 1 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Select Terminal & Vessel</CardTitle>
            <p className="text-sm text-gray-600 mt-2">Select the terminal and vessel for this registration.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Terminal *</Label>
              <SearchableSelect
                value={terminalId}
                onValueChange={setTerminalId}
                options={terminals.map(t => ({ value: t.id, label: t.name }))}
                placeholder="Select terminal"
                searchPlaceholder="Search terminals..."
                disabled={!!preselectedTerminalId}
              />
            </div>

            <div className="space-y-2">
              <Label>Vessel *</Label>
              <SearchableSelect
                value={vesselId}
                onValueChange={setVesselId}
                options={vessels.filter(v => v.isActive !== false).map(v => ({ 
                  value: v.id, 
                  label: `${v.name} (IMO: ${v.imoNumber || v.imo_number})` 
                }))}
                placeholder="Select vessel"
                searchPlaceholder="Search vessels..."
                disabled={!!preselectedVesselId}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={createAppMutation.isPending || !terminalId || !vesselId}>
                {createAppMutation.isPending ? 'Creating...' : 'Start Registration'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep >= 2 && application && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Documents for Registration: {application.applicationNumber}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {currentTerminal?.name} • {currentVessel?.name}
            </p>
            {isApplicationEditable && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDocumentDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload New Document
                </Button>
                <Select
                  onValueChange={(docId) => linkDocumentToApplicationMutation.mutate(docId)}
                  value=""
                  disabled={availableVesselDocuments.length === 0}
                >
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Link Vessel Document" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVesselDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.document_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(formId) => {
                    const form = terminalForms.find(f => f.id === formId);
                    if (form) {
                      const tempDoc = {
                        publicId: crypto.randomUUID(),
                        tenantId: application.tenantId,
                        vessel_id: application.vesselId,
                        vesselPublicId: application.vesselPublicId,
                        document_name: form.form_name,
                        documentTypeId: form.documentTypeId,
                        documentTypePublicId: form.documentTypePublicId,
                        file_url: form.file_url,
                        issue_date: form.effectiveFrom,
                        expiry_date: form.effectiveTo,
                        notes: `Linked from Terminal Form: ${form.form_name}`,
                        status: 'Valid',
                        terminalFormId: form.id
                      };
                      createDocumentMutation.mutate(tempDoc);
                    }
                  }}
                  value=""
                  disabled={availableTerminalForms.length === 0}
                >
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Link Terminal Form" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerminalForms.map(form => (
                      <SelectItem key={form.id} value={form.id}>{form.form_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {applicationDocuments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents linked to this registration yet.</p>
                {isApplicationEditable && <p className="text-sm mt-1">Upload new documents or link existing ones.</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationDocuments.map(doc => {
                      const docType = documentTypes.find(dt => dt.id === doc.documentTypeId);
                      const isExpiring = doc.expiry_date && differenceInDays(new Date(doc.expiry_date), new Date()) <= 30 && differenceInDays(new Date(doc.expiry_date), new Date()) > 0;
                      const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                      const status = isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Valid';

                      return (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.document_name}</TableCell>
                          <TableCell>{docType?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={`${docStatusColors[status]} border`}>
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>{doc.expiry_date ? format(new Date(doc.expiry_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {doc.file_url && (
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </a>
                              )}
                              {isApplicationEditable && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                  setEditingDocument(doc);
                                  setDocumentForm({
                                    document_name: doc.document_name || '',
                                    documentTypeId: doc.documentTypeId || '',
                                    issue_date: doc.issue_date || '',
                                    expiry_date: doc.expiry_date || '',
                                    reference_number: doc.reference_number || '',
                                    file_url: doc.file_url || '',
                                    notes: doc.notes || '',
                                    status: doc.status || 'Valid'
                                  });
                                  setShowAddDocumentDialog(true);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {isApplicationEditable && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setDeletingDocumentId(doc.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {isApplicationEditable && currentStep < 3 && (
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => navigate(createPageUrl('RegistrationApplications'))}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Applications
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={updateApplicationMutation.isPending}>
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmitForApproval} disabled={updateApplicationMutation.isPending || applicationDocuments.length === 0}>
                    Submit for Approval
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-4 mt-6">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Application Submitted</p>
                      <p className="text-sm text-blue-800">Your registration application has been submitted for review.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => navigate(createPageUrl('RegistrationApplications'))}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Applications
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDocument ? 'Edit Document' : 'Upload New Document'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitDocumentDialog} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name *</Label>
              <Input
                id="doc-name"
                value={documentForm.document_name}
                onChange={(e) => setDocumentForm({ ...documentForm, document_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type *</Label>
              <SearchableSelect
                value={documentForm.documentTypeId}
                onValueChange={(value) => setDocumentForm({ ...documentForm, documentTypeId: value })}
                options={documentTypes.filter(dt => dt.appliesTo === 'Vessel' || dt.appliesTo === 'Terminal').map(dt => ({ value: dt.id, label: dt.name }))}
                placeholder="Select document type"
                searchPlaceholder="Search document types..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue-date">Issue Date</Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={documentForm.issue_date}
                  onChange={(e) => setDocumentForm({ ...documentForm, issue_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={documentForm.expiry_date}
                  onChange={(e) => setDocumentForm({ ...documentForm, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference-number">Reference Number</Label>
              <Input
                id="reference-number"
                value={documentForm.reference_number}
                onChange={(e) => setDocumentForm({ ...documentForm, reference_number: e.target.value })}
                placeholder="Enter reference number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload">File Upload</Label>
              <div className="flex items-center gap-2">
                <Input id="file-upload" type="file" onChange={handleFileUpload} />
                {documentForm.file_url && (
                  <a href={documentForm.file_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <Button type="button" variant="outline" size="icon">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-notes">Notes</Label>
              <Textarea
                id="doc-notes"
                value={documentForm.notes}
                onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowAddDocumentDialog(false);
                resetDocumentForm();
              }}>Cancel</Button>
              <Button type="submit" disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}>
                {editingDocument ? 'Update Document' : 'Upload & Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDocumentId} onOpenChange={() => setDeletingDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Document</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the document from this application. The document will remain in the vessel's document library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                unlinkDocumentFromApplicationMutation.mutate(deletingDocumentId);
                setDeletingDocumentId(null);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Unlink Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}