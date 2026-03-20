/**
 * Vessel Muster Stations Management Component
 * 
 * PURPOSE:
 * Manages emergency assembly points (muster stations) for vessel evacuation.
 * Critical for SOLAS (Safety of Life at Sea) compliance and emergency response.
 * 
 * DOMAIN CONTEXT - EMERGENCY EVACUATION:
 * 
 * When emergency alarm sounds (fire, collision, flooding, abandon ship):
 * 1. All personnel proceed to assigned muster station
 * 2. Headcount taken to verify all accounted for
 * 3. Further instructions issued (lifeboat assignment, damage control, etc.)
 * 
 * Muster stations are MANDATORY under SOLAS Chapter III.
 * Every vessel must have clearly marked assembly points.
 * 
 * MUSTER STATION TYPES:
 * 
 * 1. PRIMARY:
 *    - Main assembly point for normal evacuations
 *    - Typically on boat deck (where lifeboats located)
 *    - Protected from weather
 *    - Easy access from accommodation
 * 
 * 2. SECONDARY:
 *    - Backup for when primary unavailable
 *    - Example: Fire in accommodation → use cargo deck muster
 *    - Different location from primary
 *    - May have different lifeboat assignments
 * 
 * Critical safety principle: Each person assigned to exactly one muster station.
 * 
 * KEY ATTRIBUTES:
 * 
 * musterCode: Unique identifier (e.g., "MS-A", "MS-B")
 * name: Descriptive name (e.g., "Boat Deck Starboard", "Port Lifeboat Station")
 * capacityPersons: Maximum people that can safely assemble
 *   - Based on physical space (m² per person regulations)
 *   - Must accommodate all assigned personnel
 *   - Verified during safety inspections
 * deck: Deck location (typically "Boat Deck", "Main Deck")
 * side: PORT/STARBOARD/CENTER/NA
 *   - Important for lifeboat proximity
 *   - Port muster → Port lifeboat (shorter distance in emergency)
 * locationDescription: Free-text (e.g., "Adjacent to lifeboat #1 and #2")
 * zoneId: Links to VesselZone for hierarchy
 * status: ACTIVE / DISABLED
 *   - Disabled stations not used in assignments
 *   - Example: Station under repair, blocked by cargo operations
 * 
 * INTEGRATION WITH ASSIGNMENTS:
 * 
 * Assignment entity links personnel to muster stations:
 * - Each crew member → assigned muster station
 * - Each cabin → default muster station
 * - Assignments change based on operational state
 * 
 * This component manages muster STATIONS (the physical locations).
 * VesselAssignmentPlan component manages ASSIGNMENTS (who goes where).
 * 
 * CAPACITY VALIDATION (Recommended):
 * TODO: Implement validation that assigned personnel <= capacityPersons
 * Currently no automatic check; user responsible for ensuring capacity sufficient.
 * 
 * SOLAS COMPLIANCE:
 * Vessel must have sufficient muster station capacity for:
 * - Maximum crew complement
 * - Maximum passenger count (if applicable)
 * - Margin for guests, inspectors, pilots
 * 
 * Insufficient capacity = Safety violation = Port state control detention.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function VesselMusterStationsView({ vessel }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    musterCode: '', name: '', musterType: 'PRIMARY', deck: '', side: 'NA', locationDescription: '', capacityPersons: '', status: 'ACTIVE', notes: '', zoneId: ''
  });

  const { data: items = [] } = useQuery({
    queryKey: ['musterStations', vessel.id],
    queryFn: () => base44.entities.MusterStation.filter({ vesselId: vessel.id })
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['vesselZones', vessel.id],
    queryFn: () => base44.entities.VesselZone.filter({ vesselId: vessel.id })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MusterStation.create({
      ...data, vesselId: vessel.id, vesselPublicId: vessel.publicId,
      publicId: crypto.randomUUID(), tenantId: vessel.tenantId,
      zonePublicId: data.zoneId ? zones.find(z => z.id === data.zoneId)?.publicId : null,
      capacityPersons: data.capacityPersons ? parseInt(data.capacityPersons) : null
    }),
    onSuccess: () => { queryClient.invalidateQueries(['musterStations']); setShowDialog(false); setEditing(null); toast.success('Muster station saved'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MusterStation.update(id, { ...data, capacityPersons: data.capacityPersons ? parseInt(data.capacityPersons) : null }),
    onSuccess: () => { queryClient.invalidateQueries(['musterStations']); setShowDialog(false); setEditing(null); toast.success('Muster station updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MusterStation.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['musterStations']); setDeleting(null); toast.success('Muster station deleted'); }
  });

  const handleAdd = () => { setEditing(null); setFormData({ musterCode: '', name: '', musterType: 'PRIMARY', deck: '', side: 'NA', locationDescription: '', capacityPersons: '', status: 'ACTIVE', notes: '', zoneId: '' }); setShowDialog(true); };
  const handleEdit = (item) => { setEditing(item); setFormData({ musterCode: item.musterCode, name: item.name, musterType: item.musterType, deck: item.deck || '', side: item.side || 'NA', locationDescription: item.locationDescription || '', capacityPersons: item.capacityPersons || '', status: item.status, notes: item.notes || '', zoneId: item.zoneId || '' }); setShowDialog(true); };
  const handleSubmit = (e) => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing.id, data: formData }) : createMutation.mutate(formData); };

  const filtered = items
    .filter(i => i.musterCode?.toLowerCase().includes(searchQuery.toLowerCase()) || i.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.musterCode || '').localeCompare(b.musterCode || ''));
  
  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? `${zone.code} - ${zone.name}` : '-';
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Muster Stations</CardTitle>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" /></div>
          <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600"><Plus className="w-4 h-4 mr-2" />Add Station</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p>No muster stations found</p></div>
        ) : (
          <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Zone</TableHead><TableHead>Type</TableHead><TableHead>Deck</TableHead><TableHead>Side</TableHead><TableHead>Capacity</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(item => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.musterCode}</TableCell><TableCell>{item.name}</TableCell><TableCell className="text-sm text-gray-600">{getZoneName(item.zoneId)}</TableCell><TableCell>{item.musterType}</TableCell><TableCell>{item.deck || '-'}</TableCell><TableCell>{item.side}</TableCell><TableCell>{item.capacityPersons || '-'}</TableCell><TableCell><Badge className={item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}>{item.status}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell></TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Muster Station' : 'Add Muster Station'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Code *</Label><Input value={formData.musterCode} onChange={(e) => setFormData({...formData, musterCode: e.target.value})} required /></div>
              <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Type</Label><Select value={formData.musterType} onValueChange={(v) => setFormData({...formData, musterType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PRIMARY">Primary</SelectItem><SelectItem value="SECONDARY">Secondary</SelectItem></SelectContent></Select></div>
              <div><Label>Deck</Label><Input value={formData.deck} onChange={(e) => setFormData({...formData, deck: e.target.value})} /></div>
              <div><Label>Side</Label><Select value={formData.side} onValueChange={(v) => setFormData({...formData, side: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PORT">Port</SelectItem><SelectItem value="STARBOARD">Starboard</SelectItem><SelectItem value="CENTER">Center</SelectItem><SelectItem value="NA">N/A</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Capacity (persons)</Label><Input type="number" min="0" value={formData.capacityPersons} onChange={(e) => setFormData({...formData, capacityPersons: e.target.value})} /></div>
              <div><Label>Zone</Label><Select value={formData.zoneId} onValueChange={(v) => setFormData({...formData, zoneId: v})}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.code} - {z.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Location Description</Label><Textarea value={formData.locationDescription} onChange={(e) => setFormData({...formData, locationDescription: e.target.value})} rows={2} /></div>
            <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="DISABLED">Disabled</SelectItem></SelectContent></Select></div>
            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete Muster Station</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleting.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}