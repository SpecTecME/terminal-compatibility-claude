/**
 * Documents Page (Central Document Registry)
 * 
 * PURPOSE:
 * Comprehensive view of all vessel documents across the fleet.
 * Multi-dimensional filtering and status tracking.
 * 
 * DOCUMENT STATUS LOGIC (lines 82-88):
 * 
 * Calculates document validity:
 * 
 * NO EXPIRY:
 * return 'Valid' (permanent documents)
 * 
 * EXPIRED:
 * daysUntilExpiry < 0 → 'Expired'
 * 
 * EXPIRING SOON:
 * daysUntilExpiry ≤ 30 → 'Expiring Soon'
 * 
 * VALID:
 * daysUntilExpiry > 30 → 'Valid'
 * 
 * 30-DAY THRESHOLD:
 * Industry standard reminder window.
 * Gives time for renewal process.
 * 
 * STATS DASHBOARD (lines 182-235):
 * 
 * Four metric cards:
 * 
 * 1. TOTAL DOCUMENTS (lines 183-194):
 *    All documents in system.
 *    Cyan icon/background.
 * 
 * 2. VALID (lines 196-207):
 *    Currently valid, not expiring soon.
 *    Green checkmark icon.
 * 
 * 3. EXPIRING SOON (lines 209-220):
 *    Within 30 days of expiry.
 *    Amber clock icon.
 *    ACTION NEEDED indicator.
 * 
 * 4. EXPIRED (lines 222-234):
 *    Past expiry date.
 *    Red alert triangle.
 *    CRITICAL ATTENTION needed.
 * 
 * CALCULATION (lines 150-156):
 * Uses getDocumentStatus for each document.
 * Real-time aggregation from full list.
 * 
 * COMPREHENSIVE FILTERING:
 * 
 * 1. TEXT SEARCH (lines 239-254):
 *    Searches:
 *    - Document name
 *    - Document type name
 *    - Document type search aliases
 *    
 *    ALIAS SEARCH (line 122):
 *    Finds documents by alternative names.
 *    Example: Search "COC" finds "Certificate of Class".
 * 
 * 2. VESSEL FILTER (lines 256-268):
 *    Filter by specific vessel.
 *    Dropdown populated from vessels list.
 * 
 * 3. CATEGORY FILTER (lines 269-282):
 *    Hardcoded categories:
 *    - Certificates
 *    - SIRE Reports
 *    - Insurance
 *    - Classification
 *    - Safety
 *    - Environmental
 * 
 * 4. TYPE FILTER (lines 283-293):
 *    Lifecycle type:
 *    - Permanent (never expires)
 *    - Renewable (expires, can renew)
 *    - Voyage-Specific (one-time use)
 * 
 * 5. STATUS FILTER (lines 294-304):
 *    Validity status (Valid/Expiring/Expired).
 * 
 * 6. ACTIVE FILTER (lines 305-314):
 *    Show active, inactive, or all documents.
 *    Soft delete visibility control.
 * 
 * COMPLEX FILTER LOGIC (lines 116-136):
 * 
 * Combines all filters with AND logic.
 * Each filter must pass for document to show.
 * 
 * ENABLES:
 * "Show expired certificates for Vessel X"
 * "Show expiring SIRE reports"
 * "Show all renewable documents"
 * 
 * LIST VIEW (lines 344-444):
 * 
 * ANIMATED ENTRIES (lines 371-377):
 * framer-motion fade-in.
 * Smooth appearance for each document.
 * 
 * DOCUMENT CARD (lines 377-437):
 * 
 * TYPE ICON (lines 378-380):
 * Color-coded box with FileText icon.
 * Background color from document type.
 * 
 * VESSEL BADGE (lines 384-391):
 * Clickable, navigates to vessel detail.
 * Ship icon for visual clarity.
 * Stops propagation (doesn't trigger row click).
 * 
 * TYPE/CATEGORY BADGES (lines 392-397):
 * Shows document classification.
 * 
 * EXPIRY DISPLAY (lines 402-413):
 * Right-aligned date info.
 * Shows:
 * - "Expired" or "Expires" label
 * - Expiry date
 * - Days remaining/overdue
 * 
 * COLOR-CODED:
 * Red for expired, amber for expiring.
 * 
 * STATUS BADGE (lines 415-417):
 * Valid/Expiring/Expired with color.
 * 
 * FILE LINK (lines 418-424):
 * ExternalLink icon opens file in new tab.
 * Stops propagation (doesn't navigate to detail).
 * 
 * DELETE BUTTON (lines 425-435):
 * Trash icon, red on hover.
 * Stops propagation.
 * 
 * GRID/COMPACT VIEWS:
 * Similar structure, adapted layout.
 * 
 * SOFT DELETE (lines 90-101):
 * Sets isActive=false.
 * Document hidden but preserved.
 * 
 * TOAST MESSAGE:
 * "Document deactivated" (not "deleted").
 * Accurate terminology.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  Ship,
  Trash2,
  List,
  Grid3x3,
  LayoutList,
  X,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function Documents() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVessel, setFilterVessel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeFilter, setActiveFilter] = useState('active');
  const [viewMode, setViewMode] = useState('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const getVesselById = (id) => vessels.find(v => v.id === id);
  
  const getDocumentTypeById = (id) => documentTypes.find(dt => dt.id === id);

  const getDocumentStatus = (doc) => {
    if (!doc.expiry_date) return 'Valid';
    const daysUntilExpiry = differenceInDays(new Date(doc.expiry_date), new Date());
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 30) return 'Expiring Soon';
    return 'Valid';
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Document deactivated');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate document: ' + error.message);
    }
  });

  const handleDeleteClick = (document, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete.id);
    }
  };

  const filteredDocuments = documents.filter(d => {
    const query = searchQuery.toLowerCase();
    const docType = getDocumentTypeById(d.documentTypeId);
    const matchesSearch = (
      d.document_name?.toLowerCase().includes(query) ||
      (docType?.name?.toLowerCase().includes(query)) ||
      (docType?.searchAliases && docType.searchAliases.some(alias => alias.toLowerCase().includes(query)))
    );
    const matchesVessel = filterVessel === 'all' || d.vessel_id === filterVessel;
    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    const matchesType = filterType === 'all' || d.document_type === filterType;
    const status = getDocumentStatus(d);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'expiring' && status === 'Expiring Soon') ||
      (filterStatus === 'expired' && status === 'Expired') ||
      (filterStatus === 'valid' && status === 'Valid');
    const matchesActive = activeFilter === 'all' || 
      (activeFilter === 'active' && d.isActive !== false) ||
      (activeFilter === 'inactive' && d.isActive === false);
    return matchesSearch && matchesVessel && matchesCategory && matchesType && matchesStatus && matchesActive;
  });

  const statusColors = {
    'Valid': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Expiring Soon': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Expired': 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  const typeColors = {
    'Permanent': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Renewable': 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    'Voyage-Specific': 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  };

  // Stats
  const stats = {
    total: documents.length,
    valid: documents.filter(d => getDocumentStatus(d) === 'Valid').length,
    expiring: documents.filter(d => getDocumentStatus(d) === 'Expiring Soon').length,
    expired: documents.filter(d => getDocumentStatus(d) === 'Expired').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Registry</h1>
            <p className="text-gray-600 mt-1">Manage vessel documents and certificates</p>
          </div>
          <Link to={createPageUrl('UploadDocument')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.valid}</p>
                <p className="text-xs text-gray-600">Valid</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
                <p className="text-xs text-gray-600">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
                <p className="text-xs text-gray-600">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
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
        <Select value={filterVessel} onValueChange={setFilterVessel}>
          <SelectTrigger className="w-full md:w-48 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Vessel" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Vessels</SelectItem>
            {vessels.map((vessel) => (
              <SelectItem key={vessel.id} value={vessel.id} className="text-gray-900">
                {vessel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-44 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Categories</SelectItem>
            <SelectItem value="Certificates" className="text-gray-900">Certificates</SelectItem>
            <SelectItem value="SIRE Reports" className="text-gray-900">SIRE Reports</SelectItem>
            <SelectItem value="Insurance" className="text-gray-900">Insurance</SelectItem>
            <SelectItem value="Classification" className="text-gray-900">Classification</SelectItem>
            <SelectItem value="Safety" className="text-gray-900">Safety</SelectItem>
            <SelectItem value="Environmental" className="text-gray-900">Environmental</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Types</SelectItem>
            <SelectItem value="Permanent" className="text-gray-900">Permanent</SelectItem>
            <SelectItem value="Renewable" className="text-gray-900">Renewable</SelectItem>
            <SelectItem value="Voyage-Specific" className="text-gray-900">Voyage-Specific</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Status</SelectItem>
            <SelectItem value="valid" className="text-gray-900">Valid</SelectItem>
            <SelectItem value="expiring" className="text-gray-900">Expiring Soon</SelectItem>
            <SelectItem value="expired" className="text-gray-900">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-36 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Documents List View */}
      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterCategory !== 'all' || filterType !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Upload your first document to get started'}
                </p>
                <Link to={createPageUrl('UploadDocument')}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => {
                  const vessel = getVesselById(doc.vessel_id);
                  const status = getDocumentStatus(doc);
                  const daysUntilExpiry = doc.expiry_date ? differenceInDays(new Date(doc.expiry_date), new Date()) : null;
                  
                  return (
                    <Link key={doc.id} to={createPageUrl(`DocumentDetail?id=${doc.id}&from=documents`)}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[doc.document_type]?.split(' ')[0] || 'bg-slate-500/10'}`}>
                          <FileText className={`w-5 h-5 ${typeColors[doc.document_type]?.split(' ')[1] || 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.document_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {vessel && (
                              <Link to={createPageUrl(`VesselDetail?id=${vessel.id}`)}>
                                <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs hover:text-gray-900 hover:border-gray-400">
                                  <Ship className="w-3 h-3 mr-1" />
                                  {vessel.name}
                                </Badge>
                              </Link>
                            )}
                            <Badge className={`${typeColors[doc.document_type]} border text-xs`}>
                              {doc.document_type}
                            </Badge>
                            <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                              {doc.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {doc.expiry_date && (
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-600">
                              {status === 'Expired' ? 'Expired' : 'Expires'}
                            </p>
                            <p className="text-sm text-gray-900">{format(new Date(doc.expiry_date), 'MMM d, yyyy')}</p>
                            {status !== 'Valid' && daysUntilExpiry !== null && (
                              <p className={`text-xs ${status === 'Expired' ? 'text-red-400' : 'text-amber-400'}`}>
                                {status === 'Expired' ? `${Math.abs(daysUntilExpiry)} days ago` : `${daysUntilExpiry} days left`}
                              </p>
                            )}
                          </div>
                        )}
                        <Badge className={`${statusColors[status]} border`}>
                          {status}
                        </Badge>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(doc, e);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const vessel = getVesselById(doc.vessel_id);
            const status = getDocumentStatus(doc);
            return (
              <Link key={doc.id} to={createPageUrl(`DocumentDetail?id=${doc.id}&from=documents`)}>
                <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[doc.document_type]?.split(' ')[0] || 'bg-slate-500/10'}`}>
                      <FileText className={`w-5 h-5 ${typeColors[doc.document_type]?.split(' ')[1] || 'text-slate-400'}`} />
                    </div>
                    <Badge className={`${statusColors[status]} border text-xs`}>
                      {status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{doc.document_name}</h3>
                  <div className="space-y-2 mb-3">
                    {vessel && (
                      <Link to={createPageUrl(`VesselDetail?id=${vessel.id}`)}>
                        <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs hover:text-gray-900 hover:border-gray-400">
                          <Ship className="w-3 h-3 mr-1" />
                          {vessel.name}
                        </Badge>
                      </Link>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`${typeColors[doc.document_type]} border text-xs`}>
                        {doc.document_type}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                        {doc.category}
                      </Badge>
                    </div>
                  </div>
                  {doc.expiry_date && (
                    <div className="text-sm text-gray-600 pt-3 border-t border-gray-200">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Expires {format(new Date(doc.expiry_date), 'MMM d, yyyy')}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full border-gray-300 text-gray-700">
                          <ExternalLink className="w-3.5 h-3.5 mr-2" />
                          View
                        </Button>
                      </a>
                    )}
                    <Button 
                      size="sm"
                      variant="outline" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDeleteClick(doc, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Compact View */}
      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const vessel = getVesselById(doc.vessel_id);
                const status = getDocumentStatus(doc);
                return (
                  <Link key={doc.id} to={createPageUrl(`DocumentDetail?id=${doc.id}&from=documents`)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[doc.document_type]?.split(' ')[0] || 'bg-slate-500/10'}`}>
                        <FileText className={`w-4 h-4 ${typeColors[doc.document_type]?.split(' ')[1] || 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{doc.document_name}</p>
                        <p className="text-xs text-gray-600">{vessel?.name || 'Unknown Vessel'} • {doc.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${statusColors[status]} border text-xs`}>
                        {status}
                      </Badge>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 h-8 w-8">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={(e) => handleDeleteClick(doc, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredDocuments.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterCategory !== 'all' || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload your first document to get started'}
          </p>
          <Link to={createPageUrl('UploadDocument')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </Link>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{documentToDelete?.document_name}"? The document will be hidden from lists but can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}