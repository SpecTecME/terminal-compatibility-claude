/**
 * Vessel Lifeboats Management Component
 * 
 * PURPOSE:
 * Manages vessel's primary survival craft (lifeboats and rescue boats).
 * Critical for SOLAS LSA (Life-Saving Appliances) compliance.
 * 
 * DOMAIN CONTEXT - MARITIME SAFETY:
 * 
 * Lifeboats = Primary evacuation craft in abandon ship situations.
 * SOLAS requires sufficient capacity for 100% of persons on board.
 * Plus additional rescue boat(s) for emergency response.
 * 
 * LIFEBOAT vs RESCUE BOAT:
 * 
 * 1. LIFEBOAT (boatType = LIFEBOAT):
 *    - Large survival craft for mass evacuation
 *    - Typical capacity: 50-150 persons
 *    - Fully enclosed (protection from elements)
 *    - Self-propelled (engine for moving away from vessel)
 *    - Provisions for extended survival (water, food, signaling)
 *    - Used in abandon ship situations
 * 
 * 2. RESCUE BOAT (boatType = RESCUE_BOAT):
 *    - Smaller, fast response craft
 *    - Typical capacity: 5-6 persons
 *    - For man overboard, assisting persons in water
 *    - MANDATORY separate from lifeboats (SOLAS requirement)
 *    - Cannot count toward total capacity
 *    - Must be readily launchable (5 minutes or less)
 * 
 * LAUNCH TYPES:
 * 
 * 1. DAVIT:
 *    - Mechanical arm swings boat outboard then lowers
 *    - Most common on cargo vessels
 *    - Requires crew operation
 *    - Can launch in rough seas (if designed for)
 * 
 * 2. FREEFALL:
 *    - Lifeboat slides down ramp, enters water at high speed
 *    - Aft-mounted (stern of vessel)
 *    - Instant launch (critical in rapid sinking)
 *    - Common on tankers (stern clear of cargo operations)
 *    - Violent but effective in emergencies
 * 
 * 3. OTHER:
 *    - Freestanding (inflatable rafts - managed separately in LifeRaftsView)
 *    - Special designs
 * 
 * SIDE DESIGNATION:
 * - PORT: Left side when facing forward
 * - STARBOARD: Right side when facing forward
 * - CENTER: Aft centerline (common for freefall)
 * 
 * SOLAS REQUIREMENT:
 * Equal capacity on each side (port + starboard).
 * Rationale: Vessel may list to one side, making opposite boats unusable.
 * Must be able to evacuate 100% from either side alone.
 * 
 * CAPACITY VALIDATION (Recommended):
 * Total lifeboat capacity should be >= maximum persons on board.
 * TODO: Implement validation warning if capacity insufficient.
 * Currently user responsible for ensuring compliance.
 * 
 * ZONE LINKING:
 * - Lifeboat location linked to VesselZone
 * - Used for muster station assignments
 * - Example: "Deck 3 Port Cabins → Port Muster Station → Port Lifeboat #1"
 * - Spatial relationship critical for emergency response planning
 * 
 * STATUS MANAGEMENT:
 * - OUT_OF_SERVICE: Boat unavailable (maintenance, damage, inspection)
 * - Affects total available capacity
 * - Vessel may be restricted from sailing if capacity falls below minimum
 * - Port state control checks this during inspections
 * 
 * HARD DELETE ALLOWED:
 * No complex dependencies (assignment links handled separately).
 * Lifeboats can be deleted when vessel refit changes LSA configuration.
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

export default function VesselLifeboatsView({ vessel }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    boatCode: '', boatType: 'LIFEBOAT', side: 'PORT', deck: '', launchType: 'DAVIT', capacityPersons: '', status: 'ACTIVE', notes: '', zoneId: ''
  });

  const { data: items = [] } = useQuery({
    queryKey: ['lifeboats', vessel.id],
    queryFn: () => base44.entities.Lifeboat.filter({ vesselId: vessel.id })
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['vesselZones', vessel.id],
    queryFn: () => base44.entities.VesselZone.filter({ vesselId: vessel.id })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lifeboat.create({
      ...data, vesselId: vessel.id, vesselPublicId: vessel.publicId,
      publicId: crypto.randomUUID(), tenantId: vessel.tenantId,
      zonePublicId: data.zoneId ? zones.find(z => z.id === data.zoneId)?.publicId : null,
      capacityPersons: data.capacityPersons ? parseInt(data.capacityPersons) : null
    }),
    onSuccess: () => { queryClient.invalidateQueries(['lifeboats']); setShowDialog(false); setEditing(null); toast.success('Lifeboat saved'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lifeboat.update(id, { ...data, capacityPersons: data.capacityPersons ? parseInt(data.capacityPersons) : null }),
    onSuccess: () => { queryClient.invalidateQueries(['lifeboats']); setShowDialog(false); setEditing(null); toast.success('Lifeboat updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lifeboat.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['lifeboats']); setDeleting(null); toast.success('Lifeboat deleted'); }
  });

  const handleAdd = () => { setEditing(null); setFormData({ boatCode: '', boatType: 'LIFEBOAT', side: 'PORT', deck: '', launchType: 'DAVIT', capacityPersons: '', status: 'ACTIVE', notes: '', zoneId: '' }); setShowDialog(true); };
  const handleEdit = (item) => { setEditing(item); setFormData({ boatCode: item.boatCode, boatType: item.boatType, side: item.side || 'PORT', deck: item.deck || '', launchType: item.launchType, capacityPersons: item.capacityPersons || '', status: item.status, notes: item.notes || '', zoneId: item.zoneId || '' }); setShowDialog(true); };
  const handleSubmit = (e) => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing.id, data: formData }) : createMutation.mutate(formData); };

  const filtered = items
    .filter(i => i.boatCode?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.boatCode || '').localeCompare(b.boatCode || ''));
  
  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? `${zone.code} - ${zone.name}` : '-';
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lifeboats & Rescue Boats</CardTitle>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" /></div>
          <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600"><Plus className="w-4 h-4 mr-2" />Add Boat</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p>No lifeboats found</p></div>
        ) : (
          <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Zone</TableHead><TableHead>Side</TableHead><TableHead>Deck</TableHead><TableHead>Launch Type</TableHead><TableHead>Capacity</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(item => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.boatCode}</TableCell><TableCell>{item.boatType}</TableCell><TableCell className="text-sm text-gray-600">{getZoneName(item.zoneId)}</TableCell><TableCell>{item.side}</TableCell><TableCell>{item.deck || '-'}</TableCell><TableCell>{item.launchType}</TableCell><TableCell>{item.capacityPersons || '-'}</TableCell><TableCell><Badge className={item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}>{item.status}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell></TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Lifeboat' : 'Add Lifeboat'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Boat Code *</Label><Input value={formData.boatCode} onChange={(e) => setFormData({...formData, boatCode: e.target.value})} required /></div>
              <div><Label>Type *</Label><Select value={formData.boatType} onValueChange={(v) => setFormData({...formData, boatType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LIFEBOAT">Lifeboat</SelectItem><SelectItem value="RESCUE_BOAT">Rescue Boat</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Side</Label><Select value={formData.side} onValueChange={(v) => setFormData({...formData, side: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PORT">Port</SelectItem><SelectItem value="STARBOARD">Starboard</SelectItem><SelectItem value="CENTER">Center</SelectItem><SelectItem value="NA">N/A</SelectItem></SelectContent></Select></div>
              <div><Label>Deck</Label><Input value={formData.deck} onChange={(e) => setFormData({...formData, deck: e.target.value})} /></div>
              <div><Label>Launch Type</Label><Select value={formData.launchType} onValueChange={(v) => setFormData({...formData, launchType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DAVIT">Davit</SelectItem><SelectItem value="FREEFALL">Freefall</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Capacity (persons)</Label><Input type="number" min="0" value={formData.capacityPersons} onChange={(e) => setFormData({...formData, capacityPersons: e.target.value})} /></div>
              <div><Label>Zone</Label><Select value={formData.zoneId} onValueChange={(v) => setFormData({...formData, zoneId: v})}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.code} - {z.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem></SelectContent></Select></div>
            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete Lifeboat</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleting.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}