import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Building2, 
  MapPin, 
  Anchor,
  Ship,
  FileText,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Mail,
  Phone,
  Info,
  ExternalLink,
  Star,
  ToggleLeft,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import TerminalNewsSection from '../components/terminal/TerminalNewsSection';
import TerminalContactsList from '../components/contacts/TerminalContactsList';
import TerminalLocalTime from '../components/terminal/TerminalLocalTime';
import TerminalMarineAccessView from '../components/terminal/TerminalMarineAccessView';
import AddTerminalAttachment from '../components/terminal/AddTerminalAttachment';
import EditTerminalAttachment from '../components/terminal/EditTerminalAttachment';
import RegistrationListEmbed from '../components/registration/RegistrationListEmbed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ChangeStatusDialog from '../components/berth/ChangeStatusDialog';
import ArchiveBerthDialog from '../components/berth/ArchiveBerthDialog';
import ArchiveTerminalDialog from '../components/terminal/ArchiveTerminalDialog';
import UnarchiveTerminalDialog from '../components/terminal/UnarchiveTerminalDialog';
import SetBerthStatusesDialog from '../components/terminal/SetBerthStatusesDialog';
import IconButton from '../components/ui/IconButton';
import { getCurrentUserCached } from '../components/utils/currentUser';

export default function TerminalDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const terminalId = urlParams.get('id');
  const returnTo = urlParams.get('returnTo');
  const defaultTab = urlParams.get('tab') || 'info';
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [berthToChangeStatus, setBerthToChangeStatus] = useState(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [berthToArchive, setBerthToArchive] = useState(null);
  const [showTerminalArchiveDialog, setShowTerminalArchiveDialog] = useState(false);
  const [showTerminalUnarchiveDialog, setShowTerminalUnarchiveDialog] = useState(false);
  const [showBerthStatusDialog, setShowBerthStatusDialog] = useState(false);
  const [berthStatusContext, setBerthStatusContext] = useState(null);
  const [berthToDelete, setBerthToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUserCached();
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: terminal, isLoading } = useQuery({
    queryKey: ['terminal', terminalId],
    queryFn: () => base44.entities.Terminal.filter({ publicId: terminalId }).then(r => r[0]),
    enabled: !!terminalId
  });

  const { data: country } = useQuery({
    queryKey: ['country', terminal?.countryPublicId],
    queryFn: () => base44.entities.Country.filter({ publicId: terminal.countryPublicId }).then(r => r[0]),
    enabled: !!terminal?.countryPublicId
  });

  const { data: productType } = useQuery({
    queryKey: ['productType', terminal?.productTypeRefPublicId],
    queryFn: () => base44.entities.ProductTypeRef.filter({ publicId: terminal.productTypeRefPublicId }).then(r => r[0]),
    enabled: !!terminal?.productTypeRefPublicId
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths', terminalId],
    queryFn: () => base44.entities.Berth.filter({ terminalPublicId: terminal?.publicId }),
    enabled: !!terminal?.publicId
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['compatibilities', terminalId],
    queryFn: () => base44.entities.VesselCompatibility.filter({ terminalPublicId: terminal?.publicId }),
    enabled: !!terminal?.publicId
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements', terminalId],
    queryFn: () => base44.entities.TerminalDocumentRequirement.filter({ terminalId }),
    enabled: !!terminalId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ['terminalAttachments', terminalId],
    queryFn: () => base44.entities.TerminalAttachment.filter({ terminalId }),
    enabled: !!terminalId
  });

  const [searchAttachment, setSearchAttachment] = useState('');
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [attachmentType, setAttachmentType] = useState('');
  const [editingAttachment, setEditingAttachment] = useState(null);
  const [deletingAttachment, setDeletingAttachment] = useState(null);



  const favoriteTerminalIds = user?.favoriteTerminalIds || [];
  const isFavorite = favoriteTerminalIds.includes(terminalId);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const newFavorites = isFavorite
        ? favoriteTerminalIds.filter(id => id !== terminalId)
        : [...favoriteTerminalIds, terminalId];
      
      await base44.auth.updateMe({ favoriteTerminalIds: newFavorites });
      return newFavorites;
    },
    onSuccess: (newFavorites) => {
      setUser({ ...user, favoriteTerminalIds: newFavorites });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  });

  const checkBerthDeletable = (berth) => {
    const hasCompatibilities = compatibilities.some(c => c.berthPublicId === berth.publicId);
    const hasRequirements = requirements.some(r => r.berthId === berth.id);
    const hasDocuments = documents.some(d => d.berthId === berth.id);
    return !hasCompatibilities && !hasRequirements && !hasDocuments;
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Berth.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths', terminalId]);
      toast.success('Berth permanently deleted');
      setDeleteDialogOpen(false);
      setBerthToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete berth: ' + error.message);
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Berth.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths', terminalId]);
      toast.success('Status updated successfully');
      setShowChangeStatus(false);
      setBerthToChangeStatus(null);
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.Berth.update(id, { 
      isArchived: true,
      isActive: false,
      status: 'Inactive',
      archivedAt: new Date().toISOString(),
      archivedReason: reason || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths', terminalId]);
      toast.success('Berth archived successfully');
      setShowArchiveDialog(false);
      setBerthToArchive(null);
      setDeleteDialogOpen(false);
      setBerthToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to archive berth: ' + error.message);
    }
  });

  const archiveTerminalMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const terminalBerths = berths;
      
      await base44.entities.Terminal.update(id, { 
        isArchived: true,
        isActive: false,
        status: 'Inactive',
        archivedAt: new Date().toISOString(),
        archivedReason: reason || null
      });
      
      if (terminalBerths.length > 0) {
        await Promise.all(terminalBerths.map(berth =>
          base44.entities.Berth.update(berth.id, {
            isArchived: true,
            isActive: false,
            status: 'Inactive',
            archivedAt: new Date().toISOString(),
            archivedReason: `Cascaded from terminal: ${reason || 'Terminal archived'}`
          })
        ));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['terminal', terminalId]);
      queryClient.invalidateQueries(['berths', terminalId]);
      toast.success('Terminal and associated berths archived successfully');
      setShowTerminalArchiveDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to archive terminal: ' + error.message);
    }
  });

  const unarchiveTerminalMutation = useMutation({
    mutationFn: async ({ id, berthStatuses }) => {
      await base44.entities.Terminal.update(id, { 
        isArchived: false,
        isActive: true,
        status: 'Operational',
        archivedAt: null,
        archivedReason: null
      });
      
      if (berths.length > 0 && berthStatuses) {
        await Promise.all(berths.map(berth =>
          base44.entities.Berth.update(berth.id, {
            isArchived: false,
            isActive: true,
            status: berthStatuses[berth.id] || 'Operational',
            archivedAt: null,
            archivedReason: null
          })
        ));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['terminal', terminalId]);
      queryClient.invalidateQueries(['berths', terminalId]);
      toast.success('Terminal and associated berths unarchived successfully');
      setShowTerminalUnarchiveDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to unarchive terminal: ' + error.message);
    }
  });

  const handleDeleteClick = (berth, e) => {
    e.preventDefault();
    e.stopPropagation();
    setBerthToDelete(berth);
    const canDelete = checkBerthDeletable(berth);
    if (!canDelete) {
      setBerthToArchive(berth);
      setShowArchiveDialog(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (berthToDelete) {
      deleteMutation.mutate(berthToDelete.id);
    }
  };

  const handleChangeStatus = (berth, e) => {
    e.preventDefault();
    e.stopPropagation();
    setBerthToChangeStatus(berth);
    setShowChangeStatus(true);
  };

  const handleStatusSave = (status) => {
    if (berthToChangeStatus) {
      changeStatusMutation.mutate({ id: berthToChangeStatus.id, status });
    }
  };

  const handleArchive = (reason) => {
    if (berthToArchive) {
      archiveMutation.mutate({ id: berthToArchive.id, reason });
    }
  };

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id) => base44.entities.TerminalAttachment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['terminalAttachments', terminalId]);
      toast.success('Attachment deleted successfully');
      setDeletingAttachment(null);
    },
    onError: (error) => {
      toast.error('Failed to delete attachment: ' + error.message);
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ field, value }) => base44.entities.Terminal.update(terminalId, { [field]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries(['terminal', terminalId]);
      toast.success('Notes updated');
    }
  });

  const changeAttachmentStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.TerminalAttachment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['terminalAttachments', terminalId]);
      toast.success('Status updated');
    }
  });

  const getFilteredAttachments = (type) => {
    return attachments
      .filter(a => a.attachmentType === type)
      .filter(a => !searchAttachment || a.name?.toLowerCase().includes(searchAttachment.toLowerCase()))
      .sort((a, b) => {
        const statusOrder = { Active: 0, Draft: 1, Superseded: 2, Archived: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        if (a.validFrom !== b.validFrom) {
          return (b.validFrom || '').localeCompare(a.validFrom || '');
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  };

  const getVesselById = (id) => vessels.find(v => v.id === id);

  const statusConfig = {
    Approved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    'Under Review': { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    'Not Applied': { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
    'Rejected': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    'Expired': { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' }
  };

  if (isLoading || !terminal) {
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{terminal.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5" />
              {terminal.port}{country?.nameEn ? `, ${country.nameEn}` : terminal.legacyCountryName ? `, ${terminal.legacyCountryName}` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {terminal.isArchived ? (
            <Button
              variant="outline"
              onClick={() => setShowTerminalUnarchiveDialog(true)}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <ArchiveRestore className="w-4 h-4 mr-2" />
              Unarchive Terminal
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => toggleFavoriteMutation.mutate()}
                className={isFavorite ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : 'border-gray-300 text-gray-700'}
              >
                <Star className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-amber-500' : ''}`} />
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </Button>
              <Link to={createPageUrl(`EditTerminal?id=${terminalId}`)}>
                <Button variant="outline" className="border-gray-300 text-gray-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setShowTerminalArchiveDialog(true)}
                className="border-gray-300 text-gray-700"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            </>
          )}
          <Badge className={`${terminal.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : terminal.isArchived ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'} border`}>
            {terminal.status}
          </Badge>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Anchor className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Berths</p>
                <p className="font-medium text-gray-900">{berths.length} berths configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Ship className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved Vessels</p>
                <p className="font-medium text-gray-900">{compatibilities.filter(c => c.status === 'Approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1">
          <TabsTrigger value="info" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Info className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="berths" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Anchor className="w-4 h-4 mr-2" />
            Berths ({berths.length})
          </TabsTrigger>
          <TabsTrigger value="vessels" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Ship className="w-4 h-4 mr-2" />
            Vessels ({compatibilities.length})
          </TabsTrigger>
          <TabsTrigger value="requirements" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <FileText className="w-4 h-4 mr-2" />
            Requirements ({requirements.length})
          </TabsTrigger>
          <TabsTrigger value="procedures" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <FileText className="w-4 h-4 mr-2" />
            Procedures
          </TabsTrigger>
          <TabsTrigger value="forms" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <FileText className="w-4 h-4 mr-2" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Mail className="w-4 h-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="registrations" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <FileText className="w-4 h-4 mr-2" />
            Registrations
          </TabsTrigger>
          </TabsList>

        {/* Berths Tab */}
        <TabsContent value="berths">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Berths</CardTitle>
              <Link to={createPageUrl(`AddBerth?terminal=${terminalId}`)}>
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Berth
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {berths.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Anchor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No berths configured</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Berth</TableHead>
                        <TableHead className="text-gray-600 text-right">Max LOA</TableHead>
                        <TableHead className="text-gray-600 text-right">Max Draft</TableHead>
                        <TableHead className="text-gray-600 text-right">Max Capacity</TableHead>
                        <TableHead className="text-gray-600">Status</TableHead>
                        <TableHead className="text-gray-600 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                     {berths.map((berth) => {
                       const berthReturnUrl = `TerminalDetail?id=${terminalId}${returnTo ? '&returnTo=' + encodeURIComponent(returnTo) : ''}`;
                       return (
                       <TableRow 
                         key={berth.id} 
                         className="border-gray-200 cursor-pointer hover:bg-gray-50" 
                         onClick={() => window.location.href = createPageUrl(`BerthDetail?id=${berth.publicId}&from=terminal`)}
                       >
                          <TableCell className="font-medium text-gray-900">{berth.berthName || berth.berth_name || berth.berthCode || berth.berth_number}</TableCell>
                          <TableCell className="text-gray-700 text-right">{berth.max_loa ? `${berth.max_loa}m` : '-'}</TableCell>
                          <TableCell className="text-gray-700 text-right">{berth.max_draft ? `${berth.max_draft}m` : '-'}</TableCell>
                          <TableCell className="text-gray-700 text-right">
                            {berth.max_cargo_capacity ? `${berth.max_cargo_capacity.toLocaleString()}m³` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${berth.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : berth.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : berth.status === 'Planned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'} border`}>
                              {berth.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-1">
                               <IconButton
                                 icon={ToggleLeft}
                                 tooltip="Change status"
                                 variant="ghost"
                                 onClick={(e) => handleChangeStatus(berth, e)}
                                 className="h-8 w-8 text-blue-500 hover:text-blue-700"
                               />
                               <Link to={createPageUrl(`EditBerth?id=${berth.id}`)}>
                                 <IconButton
                                   icon={Edit}
                                   tooltip="Edit"
                                   variant="ghost"
                                   onClick={(e) => e.stopPropagation()}
                                   className="h-8 w-8 text-gray-400 hover:text-gray-900"
                                 />
                               </Link>
                               <IconButton
                                 icon={Trash2}
                                 tooltip="Delete"
                                 variant="ghost"
                                 onClick={(e) => handleDeleteClick(berth, e)}
                                 className="h-8 w-8 text-red-500 hover:text-red-700"
                               />
                             </div>
                             </TableCell>
                             </TableRow>
                             );
                             })}
                             </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vessels Tab */}
        <TabsContent value="vessels">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Vessel Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              {compatibilities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Ship className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No vessel registrations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {compatibilities.map((comp) => {
                     const vessel = vessels.find(v => v.publicId === comp.vesselPublicId);
                     if (!vessel) return null;
                    const config = statusConfig[comp.status] || statusConfig['Not Applied'];
                    return (
                      <Link key={comp.id} to={createPageUrl(`VesselDetail?id=${vessel.id}`)}>
                        <div className={`p-4 rounded-lg ${config.bg} border ${config.border} hover:bg-opacity-30 transition-colors group`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                                <Ship className={`w-5 h-5 ${config.color}`} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{vessel.name}</p>
                                <p className="text-sm text-gray-600">IMO: {vessel.imo_number}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
                                {comp.status}
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Document Requirements</CardTitle>
              <Link to={createPageUrl(`TerminalRequirements?id=${terminalId}`)}>
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Edit className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {requirements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No document requirements configured</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requirements.filter(r => r.isActive && !r.validTo).slice(0, 5).map((req) => {
                    const docType = documentTypes.find(dt => dt.id === req.documentTypeId);
                    return (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{docType?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-600">{req.submissionStage}</p>
                          </div>
                        </div>
                        <Badge className={`${req.isMandatory ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'} border`}>
                          {req.isMandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procedures Tab */}
        <TabsContent value="procedures">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Terminal Procedures</CardTitle>
              <Button 
                size="sm" 
                onClick={() => { setAttachmentType('Procedure'); setShowAddAttachment(true); }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Attachment
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm">Notes</Label>
                <Textarea
                  value={terminal?.procedureNotes || ''}
                  onChange={(e) => updateNoteMutation.mutate({ field: 'procedureNotes', value: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 h-20 resize-none overflow-y-auto"
                  placeholder="Add notes about procedures..."
                />
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Search attachments..."
                  value={searchAttachment}
                  onChange={(e) => setSearchAttachment(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              {getFilteredAttachments('Procedure').length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No procedure attachments</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Name</TableHead>
                      <TableHead className="text-gray-600">Valid From</TableHead>
                      <TableHead className="text-gray-600">Valid To</TableHead>
                      <TableHead className="text-gray-600">Status</TableHead>
                      <TableHead className="text-gray-600">Updated</TableHead>
                      <TableHead className="text-gray-600 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAttachments('Procedure').map((att) => (
                      <TableRow key={att.id} className="border-gray-200">
                        <TableCell className="font-medium text-gray-900">{att.name}</TableCell>
                        <TableCell className="text-gray-700">{att.validFrom || '-'}</TableCell>
                        <TableCell className="text-gray-700">{att.validTo || '-'}</TableCell>
                        <TableCell>
                          <Select 
                            value={att.status}
                            onValueChange={(v) => changeAttachmentStatusMutation.mutate({ id: att.id, status: v })}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Superseded">Superseded</SelectItem>
                              <SelectItem value="Archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-gray-700 text-sm">{att.updated_date ? new Date(att.updated_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-gray-900"
                              onClick={() => setEditingAttachment(att)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => setDeletingAttachment(att)}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Terminal Forms</CardTitle>
              <Button 
                size="sm" 
                onClick={() => { setAttachmentType('Form'); setShowAddAttachment(true); }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Attachment
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm">Notes</Label>
                <Textarea
                  value={terminal?.formsNotes || ''}
                  onChange={(e) => updateNoteMutation.mutate({ field: 'formsNotes', value: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 h-20 resize-none overflow-y-auto"
                  placeholder="Add notes about forms..."
                />
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Search attachments..."
                  value={searchAttachment}
                  onChange={(e) => setSearchAttachment(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              {getFilteredAttachments('Form').length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No form attachments</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Name</TableHead>
                      <TableHead className="text-gray-600">Valid From</TableHead>
                      <TableHead className="text-gray-600">Valid To</TableHead>
                      <TableHead className="text-gray-600">Status</TableHead>
                      <TableHead className="text-gray-600">Updated</TableHead>
                      <TableHead className="text-gray-600 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAttachments('Form').map((att) => (
                      <TableRow key={att.id} className="border-gray-200">
                        <TableCell className="font-medium text-gray-900">{att.name}</TableCell>
                        <TableCell className="text-gray-700">{att.validFrom || '-'}</TableCell>
                        <TableCell className="text-gray-700">{att.validTo || '-'}</TableCell>
                        <TableCell>
                          <Select 
                            value={att.status}
                            onValueChange={(v) => changeAttachmentStatusMutation.mutate({ id: att.id, status: v })}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Superseded">Superseded</SelectItem>
                              <SelectItem value="Archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-gray-700 text-sm">{att.updated_date ? new Date(att.updated_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-gray-900"
                              onClick={() => setEditingAttachment(att)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => setDeletingAttachment(att)}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Terminal Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <TerminalContactsList terminalId={terminalId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Vessel Registrations</CardTitle>
              <Link to={createPageUrl(`RegistrationEntrypoint?terminalId=${terminalId}`)}>
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Registration
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <RegistrationListEmbed terminalId={terminalId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="info">
          <div className="space-y-4">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Terminal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {productType && (
                      <div>
                        <p className="text-sm text-gray-600">Products</p>
                        <p className="text-gray-900 font-medium">{productType.name} ({productType.code})</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Operator</p>
                      <p className="text-gray-900 font-medium">{terminal.operator || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Operation Type</p>
                      <p className="text-gray-900 font-medium">{terminal.operation_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacity</p>
                      <p className="text-gray-900 font-medium">{terminal.capacity_mtpa ? `${terminal.capacity_mtpa} MTPA` : 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coordinates</p>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 font-medium">{terminal.latitude}, {terminal.longitude}</p>
                        <a
                          href={`https://www.google.com/maps?q=${terminal.latitude},${terminal.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="View in Google Maps"
                        >
                          <MapPin className="w-4 h-4 text-cyan-600" />
                        </a>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Timezone</p>
                      <p className="text-gray-900 font-medium mb-2">{terminal.timezone || 'Not specified'}</p>
                      <TerminalLocalTime timezone={terminal.timezone} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {terminal.website && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Website</p>
                        <a 
                          href={terminal.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1"
                        >
                          {terminal.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {terminal.contact_email && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Contact Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <p className="text-gray-900">{terminal.contact_email}</p>
                        </div>
                      </div>
                    )}
                    {terminal.contact_phone && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Contact Phone</p>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <p className="text-gray-900">{terminal.contact_phone}</p>
                        </div>
                      </div>
                    )}
                    {terminal.description && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Description</p>
                        <p className="text-gray-700 text-sm">{terminal.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                {terminal.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <p className="text-gray-700">{terminal.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <TerminalMarineAccessView terminal={terminal} />

            <TerminalNewsSection terminalId={terminalId} />
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Permanently Delete Berth</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to permanently delete "{berthToDelete?.berthName || berthToDelete?.berth_name || berthToDelete?.berthCode || berthToDelete?.berth_number}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChangeStatusDialog
        open={showChangeStatus}
        onOpenChange={setShowChangeStatus}
        berth={berthToChangeStatus}
        onSave={handleStatusSave}
      />

      <ArchiveBerthDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        berth={berthToArchive}
        onArchive={handleArchive}
      />

      <ArchiveTerminalDialog
        open={showTerminalArchiveDialog}
        onOpenChange={setShowTerminalArchiveDialog}
        terminal={terminal}
        berthCount={berths.length}
        onArchive={(reason) => archiveTerminalMutation.mutate({ id: terminalId, reason })}
      />

      <UnarchiveTerminalDialog
        open={showTerminalUnarchiveDialog}
        onOpenChange={setShowTerminalUnarchiveDialog}
        terminal={terminal}
        berths={berths}
        onUnarchive={(berthStatuses) => unarchiveTerminalMutation.mutate({ id: terminalId, berthStatuses })}
      />

      <AddTerminalAttachment
        open={showAddAttachment}
        onOpenChange={setShowAddAttachment}
        terminal={terminal}
        attachmentType={attachmentType}
      />

      <EditTerminalAttachment
        open={!!editingAttachment}
        onOpenChange={(open) => !open && setEditingAttachment(null)}
        attachment={editingAttachment}
        terminal={terminal}
      />

      <AlertDialog open={!!deletingAttachment} onOpenChange={(open) => !open && setDeletingAttachment(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete "{deletingAttachment?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteAttachmentMutation.mutate(deletingAttachment.id)}
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