/**
 * Vessel Life Rafts Management Component
 * 
 * PURPOSE:
 * Manages inflatable life raft groups (secondary survival craft).
 * Complements lifeboats for total evacuation capacity under SOLAS.
 * 
 * DOMAIN CONTEXT - LIFE RAFTS vs LIFEBOATS:
 * 
 * LIFEBOATS (Primary evacuation):
 * - Rigid boats with engines
 * - Require davits or freefall ramps (complex launching)
 * - High capacity per unit (50-150 persons)
 * - More expensive, require maintenance
 * - Managed in VesselLifeboatsView component
 * 
 * LIFE RAFTS (Supplementary capacity):
 * - Inflatable rafts in canisters
 * - Throw overboard or auto-release (simple launching)
 * - Lower capacity per unit (6-25 persons typically)
 * - Less expensive, easier maintenance
 * - THIS component manages life rafts
 * 
 * GROUP-BASED ARCHITECTURE:
 * 
 * Life rafts stored in GROUPS (LifeRaftGroup entity), not individually.
 * 
 * WHY GROUPS?
 * - Rafts identical within group (same model, capacity, location)
 * - Reduces data redundancy (don't need 20 separate records)
 * - Easier capacity planning (group math simpler)
 * - Matches physical reality (rafts stored in clusters)
 * 
 * GROUP STRUCTURE:
 * - groupCode: Identifier (e.g., "LRG-PORT-1", "LRG-STBD-2")
 * - raftCount: Number of rafts in this group
 * - capacityPerRaft: Persons per raft
 * - totalCapacity: raftCount × capacityPerRaft (AUTO-CALCULATED)
 * 
 * CAPACITY AUTO-CALCULATION (lines 45, 55):
 * totalCapacity computed automatically on create/update.
 * Prevents manual calculation errors.
 * UI shows preview in dialog (lines 112-116).
 * 
 * EXAMPLE:
 * Group Code: LRG-PORT-1
 * Raft Count: 4
 * Capacity per Raft: 25
 * Total Capacity: 100 persons (auto-calculated)
 * 
 * DEPLOYMENT SIDES:
 * - PORT: Left side rafts
 * - STARBOARD: Right side rafts
 * - CENTER: Aft centerline (less common)
 * 
 * SOLAS REQUIREMENT:
 * Equal capacity both sides (like lifeboats).
 * Vessel may list, making one side inaccessible.
 * Must evacuate from either side independently.
 * 
 * TYPICAL CONFIGURATION:
 * Large LNG carrier might have:
 * - 2 lifeboats × 150 persons = 300 total (primary)
 * - 8 life raft groups × 4 rafts × 25 persons = 800 total (backup)
 * - Total = 1100 persons (well over crew of ~40)
 * - Regulatory requirement: 100% capacity + margin
 * 
 * CAPACITY VALIDATION:
 * TODO: Implement system-wide validation:
 * Sum(lifeboat capacity) + Sum(life raft total capacity) >= max persons on board
 * Currently user responsible for ensuring SOLAS compliance.
 * 
 * ZONE INTEGRATION:
 * Rafts link to zones for spatial organization.
 * Example: "Boat Deck Port" zone contains port-side raft groups.
 * Supports emergency response planning.
 */
import React, { useState, useEffect } from 'react';
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

export default function VesselLifeRaftsView({ vessel }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    groupCode: '', side: 'PORT', deck: '', raftCount: '', capacityPerRaft: '', status: 'ACTIVE', notes: '', zoneId: ''
  });

  const { data: items = [] } = useQuery({
    queryKey: ['lifeRaftGroups', vessel.id],
    queryFn: () => base44.entities.LifeRaftGroup.filter({ vesselId: vessel.id })
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['vesselZones', vessel.id],
    queryFn: () => base44.entities.VesselZone.filter({ vesselId: vessel.id })
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const raftCount = data.raftCount ? parseInt(data.raftCount) : 0;
      const capacityPerRaft = data.capacityPerRaft ? parseInt(data.capacityPerRaft) : 0;
      return base44.entities.LifeRaftGroup.create({
        ...data, vesselId: vessel.id, vesselPublicId: vessel.publicId,
        publicId: crypto.randomUUID(), tenantId: vessel.tenantId,
        zonePublicId: data.zoneId ? zones.find(z => z.id === data.zoneId)?.publicId : null,
        raftCount, capacityPerRaft, totalCapacity: raftCount * capacityPerRaft
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(['lifeRaftGroups']); setShowDialog(false); setEditing(null); toast.success('Life raft group saved'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const raftCount = data.raftCount ? parseInt(data.raftCount) : 0;
      const capacityPerRaft = data.capacityPerRaft ? parseInt(data.capacityPerRaft) : 0;
      return base44.entities.LifeRaftGroup.update(id, { ...data, raftCount, capacityPerRaft, totalCapacity: raftCount * capacityPerRaft });
    },
    onSuccess: () => { queryClient.invalidateQueries(['lifeRaftGroups']); setShowDialog(false); setEditing(null); toast.success('Life raft group updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LifeRaftGroup.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['lifeRaftGroups']); setDeleting(null); toast.success('Life raft group deleted'); }
  });

  const handleAdd = () => { setEditing(null); setFormData({ groupCode: '', side: 'PORT', deck: '', raftCount: '', capacityPerRaft: '', status: 'ACTIVE', notes: '', zoneId: '' }); setShowDialog(true); };
  const handleEdit = (item) => { setEditing(item); setFormData({ groupCode: item.groupCode, side: item.side || 'PORT', deck: item.deck || '', raftCount: item.raftCount || '', capacityPerRaft: item.capacityPerRaft || '', status: item.status, notes: item.notes || '', zoneId: item.zoneId || '' }); setShowDialog(true); };
  const handleSubmit = (e) => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing.id, data: formData }) : createMutation.mutate(formData); };

  const filtered = items
    .filter(i => i.groupCode?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.groupCode || '').localeCompare(b.groupCode || ''));
  
  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? `${zone.code} - ${zone.name}` : '-';
  };
  const totalCapacity = (formData.raftCount && formData.capacityPerRaft) ? parseInt(formData.raftCount) * parseInt(formData.capacityPerRaft) : 0;

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Life Raft Groups</CardTitle>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" /></div>
          <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600"><Plus className="w-4 h-4 mr-2" />Add Group</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p>No life raft groups found</p></div>
        ) : (
          <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Zone</TableHead><TableHead>Side</TableHead><TableHead>Deck</TableHead><TableHead>Raft Count</TableHead><TableHead>Capacity/Raft</TableHead><TableHead>Total Capacity</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(item => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.groupCode}</TableCell><TableCell className="text-sm text-gray-600">{getZoneName(item.zoneId)}</TableCell><TableCell>{item.side}</TableCell><TableCell>{item.deck || '-'}</TableCell><TableCell>{item.raftCount || '-'}</TableCell><TableCell>{item.capacityPerRaft || '-'}</TableCell><TableCell className="font-semibold">{item.totalCapacity || '-'}</TableCell><TableCell><Badge className={item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}>{item.status}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell></TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Life Raft Group' : 'Add Life Raft Group'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Group Code *</Label><Input value={formData.groupCode} onChange={(e) => setFormData({...formData, groupCode: e.target.value})} required /></div>
              <div><Label>Side</Label><Select value={formData.side} onValueChange={(v) => setFormData({...formData, side: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PORT">Port</SelectItem><SelectItem value="STARBOARD">Starboard</SelectItem><SelectItem value="CENTER">Center</SelectItem><SelectItem value="NA">N/A</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Deck</Label><Input value={formData.deck} onChange={(e) => setFormData({...formData, deck: e.target.value})} /></div>
              <div><Label>Raft Count</Label><Input type="number" min="0" value={formData.raftCount} onChange={(e) => setFormData({...formData, raftCount: e.target.value})} /></div>
              <div><Label>Capacity per Raft</Label><Input type="number" min="0" value={formData.capacityPerRaft} onChange={(e) => setFormData({...formData, capacityPerRaft: e.target.value})} /></div>
            </div>
            {totalCapacity > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Total Capacity: {totalCapacity} persons</p>
              </div>
            )}
            <div><Label>Zone</Label><Select value={formData.zoneId} onValueChange={(v) => setFormData({...formData, zoneId: v})}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.code} - {z.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem></SelectContent></Select></div>
            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete Life Raft Group</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleting.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}