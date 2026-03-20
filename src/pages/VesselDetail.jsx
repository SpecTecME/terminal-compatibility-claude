import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Ship, 
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Anchor,
  Gauge,
  Boxes,
  Plug,
  Wind,
  ChevronRight,
  Flag,
  Plus,
  Trash2,
  Upload,
  X,
  Users,
  Home,
  MapPin,
  LifeBuoy,
  DoorOpen,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import SearchableSelect from '../components/ui/SearchableSelect';

import VesselIdentityView from '../components/vessel/VesselIdentityView';
import VesselDimensionsView from '../components/vessel/VesselDimensionsView';
import VesselCargoSystemView from '../components/vessel/VesselCargoSystemView';
import VesselManifoldView from '../components/vessel/VesselManifoldView';
import VesselMooringView from '../components/vessel/VesselMooringView';
import VesselFenderView from '../components/vessel/VesselFenderView';
import VesselEnvironmentalView from '../components/vessel/VesselEnvironmentalView';
import VesselZonesView from '../components/vessel/VesselZonesView';
import VesselCabinsView from '../components/vessel/VesselCabinsView';
import VesselMusterStationsView from '../components/vessel/VesselMusterStationsView';
import VesselLifeboatsView from '../components/vessel/VesselLifeboatsView';
import VesselLifeRaftsView from '../components/vessel/VesselLifeRaftsView';
import VesselAccessPointsView from '../components/vessel/VesselAccessPointsView';
import VesselAssignmentPlan from '../components/vessel/VesselAssignmentPlan';
import VesselCargoCapabilityView from '../components/vessel/VesselCargoCapabilityView';
import { VesselDimensionsAndTonnage, VesselShipyard } from '../components/vessel/VesselTechnicalFields';
import VesselCompanyRolesTab from '../components/vessel/VesselCompanyRolesTab';
import RegistrationListEmbed from '../components/registration/RegistrationListEmbed';

export default function VesselDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const vesselId = urlParams.get('id');
  const returnTo = urlParams.get('returnTo');
  const queryClient = useQueryClient();

  const [showAddDocument, setShowAddDocument] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [deletingDocument, setDeletingDocument] = useState(null);
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

  const { data: vessel, isLoading } = useQuery({
    queryKey: ['vessel', vesselId],
    queryFn: () => base44.entities.Vessel.filter({ id: vesselId }).then(r => r[0]),
    enabled: !!vesselId
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['compatibilities', vesselId],
    queryFn: () => base44.entities.VesselCompatibility.filter({ vessel_id: vesselId }),
    enabled: !!vesselId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', vesselId],
    queryFn: () => base44.entities.Document.filter({ vessel_id: vesselId }),
    enabled: !!vesselId
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const { data: vesselTypeRefs = [] } = useQuery({
    queryKey: ['vesselTypeRefs'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const getTerminalById = (id) => terminals.find(t => t.id === id);
  const getBerthById = (id) => berths.find(b => b.id === id);

  const createDocumentMutation = useMutation({
    mutationFn: (data) => {
      const docType = documentTypes.find(dt => dt.id === data.documentTypeId);
      return base44.entities.Document.create({
        ...data,
        vessel_id: vesselId,
        vesselPublicId: vessel.publicId,
        documentTypePublicId: docType?.publicId,
        publicId: crypto.randomUUID(),
        tenantId: vessel.tenantId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', vesselId]);
      setShowAddDocument(false);
      setEditingDocument(null);
      resetDocumentForm();
      toast.success('Document added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add document: ' + error.message);
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', vesselId]);
      setShowAddDocument(false);
      setEditingDocument(null);
      resetDocumentForm();
      toast.success('Document updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update document: ' + error.message);
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', vesselId]);
      setDeletingDocument(null);
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete document: ' + error.message);
    }
  });

  const resetDocumentForm = () => {
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

  const handleAddDocument = () => {
    setEditingDocument(null);
    resetDocumentForm();
    setShowAddDocument(true);
  };

  const handleEditDocument = (doc) => {
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
    setShowAddDocument(true);
  };

  const handleSubmitDocument = (e) => {
    e.preventDefault();
    if (!documentForm.document_name || !documentForm.documentTypeId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingDocument) {
      updateDocumentMutation.mutate({
        id: editingDocument.id,
        data: documentForm
      });
    } else {
      createDocumentMutation.mutate(documentForm);
    }
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

  const statusConfig = {
    Approved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    'Under Review': { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    'Not Applied': { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
    'Rejected': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    'Expired': { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' }
  };

  const docStatusColors = {
    'Valid': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Expiring Soon': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Expired': 'bg-red-500/10 text-red-400 border-red-500/30',
    'Superseded': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  const terminalGroups = compatibilities.reduce((acc, comp) => {
    const terminalId = comp.terminal_id;
    if (!acc[terminalId]) acc[terminalId] = [];
    acc[terminalId].push(comp);
    return acc;
  }, {});

  const expiringDocs = documents.filter(d => {
    if (!d.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(new Date(d.expiry_date), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const expiredDocs = documents.filter(d => {
    if (!d.expiry_date) return false;
    return new Date(d.expiry_date) < new Date();
  });

  if (isLoading || !vessel) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Vessels')}>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vessel.name}</h1>
            <p className="text-sm text-gray-600">
              IMO: {vessel.imoNumber}
              {vessel.flagCountryId && ` | Flag: ${countries.find(c => c.id === vessel.flagCountryId)?.nameEn || '-'}`}
              {vessel.classSocietyCompanyId && ` | Class: ${companies.find(c => c.id === vessel.classSocietyCompanyId)?.name || '-'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${vessel.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'} border`}>
            {vessel.status}
          </Badge>
          {vessel.vesselTypeRefId && vesselTypeRefs.length > 0 && (() => {
            const typeRef = vesselTypeRefs.find(vt => vt.id === vessel.vesselTypeRefId);
            return typeRef ? (
              <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/30">
                {typeRef.primaryType} - {typeRef.subType}
              </Badge>
            ) : null;
          })()}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{compatibilities.filter(c => c.status === 'Approved').length}</p>
                <p className="text-xs text-gray-600">Approved Terminals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{compatibilities.filter(c => c.status === 'Under Review').length}</p>
                <p className="text-xs text-gray-600">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                <p className="text-xs text-gray-600">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${expiringDocs.length + expiredDocs.length > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'} flex items-center justify-center`}>
                <AlertCircle className={`w-5 h-5 ${expiringDocs.length + expiredDocs.length > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{expiringDocs.length + expiredDocs.length}</p>
                <p className="text-xs text-gray-600">Expiring/Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="terminals" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1">
          <TabsTrigger value="terminals" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Building2 className="w-4 h-4 mr-2" />
            Terminal Status
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <FileText className="w-4 h-4 mr-2" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="specifications" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Ship className="w-4 h-4 mr-2" />
            Vessel Specifications
          </TabsTrigger>
          <TabsTrigger value="accommodation" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Users className="w-4 h-4 mr-2" />
            Accommodation & Safety
          </TabsTrigger>
          <TabsTrigger value="assignment" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Users className="w-4 h-4 mr-2" />
            Assignment Plan
          </TabsTrigger>
          <TabsTrigger value="cargo-capability" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Package className="w-4 h-4 mr-2" />
            Cargo Capability
          </TabsTrigger>
          <TabsTrigger value="company-roles" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Users className="w-4 h-4 mr-2" />
            Company Roles
          </TabsTrigger>
          <TabsTrigger value="registrations" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Building2 className="w-4 h-4 mr-2" />
            Registrations
          </TabsTrigger>
        </TabsList>

        {/* Terminal Status Tab */}
        <TabsContent value="terminals">
          <div className="grid lg:grid-cols-2 gap-4">
            {Object.entries(terminalGroups).length === 0 ? (
              <Card className="bg-white border-gray-200 lg:col-span-2">
                <CardContent className="p-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Terminal Registrations</h3>
                  <p className="text-gray-600">This vessel hasn't been registered with any terminals yet</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(terminalGroups).map(([terminalId, comps]) => {
                const terminal = getTerminalById(terminalId);
                if (!terminal) return null;
                
                return (
                  <Card key={terminalId} className="bg-white border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold text-gray-900">{terminal.name}</CardTitle>
                            <p className="text-xs text-gray-600">{terminal.port}</p>
                          </div>
                        </div>
                        <Link to={createPageUrl(`TerminalDetail?id=${terminalId}`)}>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-900">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {comps.map((comp) => {
                          const berth = comp.berth_id ? getBerthById(comp.berth_id) : null;
                          const config = statusConfig[comp.status] || statusConfig['Not Applied'];
                          const StatusIcon = config.icon;
                          
                          return (
                            <div key={comp.id} className={`flex items-center justify-between p-3 rounded-lg ${config.bg} border ${config.border}`}>
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`w-4 h-4 ${config.color}`} />
                                <span className="text-sm text-gray-900">
                                  {berth ? berth.berth_number : 'All Berths'}
                                </span>
                              </div>
                              <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
                                {comp.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Vessel Documents</CardTitle>
              <Button onClick={handleAddDocument} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const isExpiring = doc.expiry_date && differenceInDays(new Date(doc.expiry_date), new Date()) <= 30 && differenceInDays(new Date(doc.expiry_date), new Date()) > 0;
                    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                    const status = isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Valid';

                    return (
                      <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors group">
                        <div className="flex items-center gap-4 flex-1">
                          <FileText className="w-5 h-5 text-cyan-400" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{doc.document_name}</p>
                            {doc.reference_number && (
                              <p className="text-xs text-gray-600">Ref: {doc.reference_number}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {doc.expiry_date && (
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Expires</p>
                              <p className="text-sm text-gray-900">{format(new Date(doc.expiry_date), 'MMM d, yyyy')}</p>
                            </div>
                          )}
                          <Badge className={`${docStatusColors[status]} border`}>
                            {status}
                          </Badge>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditDocument(doc)}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingDocument(doc)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vessel Specifications Tab with nested tabs */}
        <TabsContent value="specifications">
          <div className="flex justify-end mb-4">
            <Link to={createPageUrl(`EditVessel?id=${vesselId}`)}>
              <Button variant="outline" className="border-gray-300 text-gray-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Vessel Specifications
              </Button>
            </Link>
          </div>
          <Tabs defaultValue="identity" className="space-y-4">
            <TabsList className="bg-gray-50 border border-gray-200 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="identity" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Flag className="w-4 h-4 mr-2" />
                Identity
              </TabsTrigger>
              <TabsTrigger value="dimensions" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Ship className="w-4 h-4 mr-2" />
                Dimensions
              </TabsTrigger>
              <TabsTrigger value="cargo" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Boxes className="w-4 h-4 mr-2" />
                Cargo System
              </TabsTrigger>
              <TabsTrigger value="manifold" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Plug className="w-4 h-4 mr-2" />
                Manifold
              </TabsTrigger>
              <TabsTrigger value="mooring" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Anchor className="w-4 h-4 mr-2" />
                Mooring
              </TabsTrigger>
              <TabsTrigger value="fender" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Gauge className="w-4 h-4 mr-2" />
                Fender/Hull
              </TabsTrigger>
              <TabsTrigger value="environmental" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Wind className="w-4 h-4 mr-2" />
                Environmental
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identity">
              <div className="space-y-4">
                <VesselIdentityView vessel={vessel} countries={countries} companies={companies} />
                <VesselShipyard vessel={vessel} />
              </div>
            </TabsContent>

            <TabsContent value="dimensions">
              <div className="space-y-4">
                <VesselDimensionsAndTonnage vessel={vessel} />
                <VesselDimensionsView vessel={vessel} />
              </div>
            </TabsContent>

            <TabsContent value="cargo">
              <VesselCargoSystemView vessel={vessel} />
            </TabsContent>

            <TabsContent value="manifold">
              <VesselManifoldView vessel={vessel} />
            </TabsContent>

            <TabsContent value="mooring">
              <VesselMooringView vessel={vessel} />
            </TabsContent>

            <TabsContent value="fender">
              <VesselFenderView vessel={vessel} />
            </TabsContent>

            <TabsContent value="environmental">
              <VesselEnvironmentalView vessel={vessel} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Accommodation & Safety Tab with nested tabs */}
        <TabsContent value="accommodation">
          <Tabs defaultValue="zones" className="space-y-4">
            <TabsList className="bg-gray-50 border border-gray-200 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="zones" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <MapPin className="w-4 h-4 mr-2" />
                Zones
              </TabsTrigger>
              <TabsTrigger value="cabins" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Home className="w-4 h-4 mr-2" />
                Cabins
              </TabsTrigger>
              <TabsTrigger value="muster" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Users className="w-4 h-4 mr-2" />
                Muster Stations
              </TabsTrigger>
              <TabsTrigger value="lifeboats" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Ship className="w-4 h-4 mr-2" />
                Lifeboats
              </TabsTrigger>
              <TabsTrigger value="liferafts" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <LifeBuoy className="w-4 h-4 mr-2" />
                Life Rafts
              </TabsTrigger>
              <TabsTrigger value="access" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <DoorOpen className="w-4 h-4 mr-2" />
                Access Points
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zones">
              <VesselZonesView vessel={vessel} />
            </TabsContent>

            <TabsContent value="cabins">
              <VesselCabinsView vessel={vessel} />
            </TabsContent>

            <TabsContent value="muster">
              <VesselMusterStationsView vessel={vessel} />
            </TabsContent>

            <TabsContent value="lifeboats">
              <VesselLifeboatsView vessel={vessel} />
            </TabsContent>

            <TabsContent value="liferafts">
              <VesselLifeRaftsView vessel={vessel} />
            </TabsContent>

            <TabsContent value="access">
              <VesselAccessPointsView vessel={vessel} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Assignment Plan Tab */}
        <TabsContent value="assignment">
          <VesselAssignmentPlan vessel={vessel} />
        </TabsContent>

        {/* Cargo Capability Tab */}
        <TabsContent value="cargo-capability">
          <VesselCargoCapabilityView vesselId={vessel.id} vesselPublicId={vessel.publicId} />
        </TabsContent>

        {/* Company Roles Tab */}
        <TabsContent value="company-roles">
          <VesselCompanyRolesTab vesselId={vessel.id} tenantId={vessel.tenantId} />
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Terminal Registrations</CardTitle>
              <Link to={createPageUrl(`RegistrationEntrypoint?vesselId=${vesselId}`)}>
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Register at Terminal
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <RegistrationListEmbed vesselId={vesselId} />
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

      {/* Add/Edit Document Dialog */}
      <Dialog open={showAddDocument} onOpenChange={setShowAddDocument}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingDocument ? 'Edit Document' : 'Add Document'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitDocument} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Document Name *</Label>
              <Input
                value={documentForm.document_name}
                onChange={(e) => setDocumentForm({...documentForm, document_name: e.target.value})}
                className="bg-white border-gray-300"
                placeholder="Enter document name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Document Type *</Label>
              <SearchableSelect
                value={documentForm.documentTypeId}
                onValueChange={(value) => setDocumentForm({...documentForm, documentTypeId: value})}
                options={documentTypes.filter(dt => dt.isActive).map(dt => ({ value: dt.id, label: dt.name }))}
                placeholder="Select document type"
                searchPlaceholder="Search document types..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Issue Date</Label>
                <Input
                  type="date"
                  value={documentForm.issue_date}
                  onChange={(e) => setDocumentForm({...documentForm, issue_date: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Expiry Date</Label>
                <Input
                  type="date"
                  value={documentForm.expiry_date}
                  onChange={(e) => setDocumentForm({...documentForm, expiry_date: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Reference Number</Label>
              <Input
                value={documentForm.reference_number}
                onChange={(e) => setDocumentForm({...documentForm, reference_number: e.target.value})}
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
                {documentForm.file_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(documentForm.file_url, '_blank')}
                    className="flex-shrink-0"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Status</Label>
              <Select
                value={documentForm.status}
                onValueChange={(value) => setDocumentForm({...documentForm, status: value})}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Valid">Valid</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Superseded">Superseded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={documentForm.notes}
                onChange={(e) => setDocumentForm({...documentForm, notes: e.target.value})}
                className="bg-white border-gray-300"
                placeholder="Additional notes"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDocument(false);
                  setEditingDocument(null);
                  resetDocumentForm();
                }}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {createDocumentMutation.isPending || updateDocumentMutation.isPending
                  ? 'Saving...'
                  : editingDocument
                  ? 'Update Document'
                  : 'Add Document'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation */}
      <AlertDialog open={!!deletingDocument} onOpenChange={() => setDeletingDocument(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete "{deletingDocument?.document_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocumentMutation.mutate(deletingDocument.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}