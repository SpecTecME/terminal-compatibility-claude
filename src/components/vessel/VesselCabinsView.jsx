/**
 * Vessel Cabins Management Component
 * 
 * PURPOSE:
 * Manages vessel's accommodation cabins for crew, officers, and guests.
 * Critical for crew welfare compliance and operational planning.
 * 
 * DOMAIN CONTEXT:
 * Maritime regulations (MLC 2006, STCW) require adequate accommodation.
 * Cabin configuration affects:
 * - Manning capacity (how many crew can be accommodated)
 * - Labor law compliance (single vs multi-berth requirements)
 * - Operational planning (officer/crew separation, guest capacity)
 * - Emergency planning (where people sleep affects muster assignments)
 * 
 * CABIN TYPES:
 * 
 * 1. SINGLE:
 *    - One person, private cabin
 *    - Required for senior officers (Master, Chief Engineer)
 *    - Labor law requirements vary by flag state
 * 
 * 2. DOUBLE:
 *    - Two persons, shared cabin
 *    - Common for junior officers, senior crew
 * 
 * 3. MULTI:
 *    - Three or more persons
 *    - Crew quarters on older vessels
 *    - Modern vessels trend toward single/double (crew welfare)
 * 
 * 4. OFFICER:
 *    - Officer-grade cabin (higher standard)
 *    - Larger, better amenities
 * 
 * 5. CREW:
 *    - General crew quarters
 * 
 * 6. GUEST:
 *    - For inspectors, surveyors, trainees
 *    - Not permanent crew
 *    - Required for training vessels, research vessels
 * 
 * KEY ATTRIBUTES:
 * 
 * cabinCode: Unique identifier (e.g., "A-301" = A-deck, cabin 301)
 * cabinName: Descriptive name (optional, e.g., "Captain's Cabin")
 * bedCount: Number of beds (determines capacity)
 * ensuite: Private bathroom (true) vs shared facilities (false)
 *   - Affects habitability rating
 *   - Modern vessels typically have ensuite for all
 * deck: Deck number/name (for spatial location)
 * side: PORT/STARBOARD/CENTER (for evacuation planning)
 * zoneId: Links to VesselZone hierarchy
 * status: ACTIVE / OUT_OF_SERVICE
 *   - Out of service cabins not counted in capacity calculations
 *   - Useful during refits or damage situations
 * 
 * ZONE INTEGRATION:
 * Cabins link to zones (optional but recommended).
 * Enables zone-based operations:
 * - "All cabins in Accommodation Block → Muster Station A"
 * - "Deck 3 evacuates via Starboard Lifeboat"
 * - Zone provides spatial context for emergency planning
 * 
 * CAPACITY CALCULATIONS (External usage):
 * Other parts of system calculate:
 * - Total berthing capacity = SUM(cabins.bedCount WHERE status='ACTIVE')
 * - Officer count = COUNT(WHERE cabinType='OFFICER' AND status='ACTIVE')
 * - Guest capacity = SUM(WHERE cabinType='GUEST')
 * 
 * This component manages the data; calculations happen in reporting/compliance modules.
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function VesselCabinsView({ vessel }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCabin, setEditingCabin] = useState(null);
  const [deletingCabin, setDeletingCabin] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    cabinCode: '', cabinName: '', deck: '', side: 'NA', cabinType: 'SINGLE', bedCount: 1, ensuite: false, status: 'ACTIVE', notes: '', zoneId: ''
  });

  const { data: cabins = [] } = useQuery({
    queryKey: ['cabins', vessel.id],
    queryFn: () => base44.entities.Cabin.filter({ vesselId: vessel.id })
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['vesselZones', vessel.id],
    queryFn: () => base44.entities.VesselZone.filter({ vesselId: vessel.id })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cabin.create({
      ...data, vesselId: vessel.id, vesselPublicId: vessel.publicId,
      publicId: crypto.randomUUID(), tenantId: vessel.tenantId,
      zonePublicId: data.zoneId ? zones.find(z => z.id === data.zoneId)?.publicId : null,
      bedCount: parseInt(data.bedCount)
    }),
    onSuccess: () => { queryClient.invalidateQueries(['cabins']); setShowDialog(false); setEditingCabin(null); toast.success('Cabin saved'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cabin.update(id, { ...data, bedCount: parseInt(data.bedCount) }),
    onSuccess: () => { queryClient.invalidateQueries(['cabins']); setShowDialog(false); setEditingCabin(null); toast.success('Cabin updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cabin.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['cabins']); setDeletingCabin(null); toast.success('Cabin deleted'); }
  });

  const handleAdd = () => { setEditingCabin(null); setFormData({ cabinCode: '', cabinName: '', deck: '', side: 'NA', cabinType: 'SINGLE', bedCount: 1, ensuite: false, status: 'ACTIVE', notes: '', zoneId: '' }); setShowDialog(true); };
  const handleEdit = (cabin) => { setEditingCabin(cabin); setFormData({ cabinCode: cabin.cabinCode, cabinName: cabin.cabinName || '', deck: cabin.deck || '', side: cabin.side || 'NA', cabinType: cabin.cabinType, bedCount: cabin.bedCount, ensuite: cabin.ensuite, status: cabin.status, notes: cabin.notes || '', zoneId: cabin.zoneId || '' }); setShowDialog(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingCabin ? updateMutation.mutate({ id: editingCabin.id, data: formData }) : createMutation.mutate(formData); };

  const filteredCabins = cabins
    .filter(c => c.cabinCode?.toLowerCase().includes(searchQuery.toLowerCase()) || c.cabinName?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.cabinCode || '').localeCompare(b.cabinCode || ''));
  
  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? `${zone.code} - ${zone.name}` : '-';
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cabins</CardTitle>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" /></div>
          <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600"><Plus className="w-4 h-4 mr-2" />Add Cabin</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCabins.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p>No cabins found</p></div>
        ) : (
          <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Zone</TableHead><TableHead>Type</TableHead><TableHead>Deck</TableHead><TableHead>Side</TableHead><TableHead>Beds</TableHead><TableHead>Ensuite</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filteredCabins.map(cabin => (
            <TableRow key={cabin.id}><TableCell className="font-medium">{cabin.cabinCode}</TableCell><TableCell>{cabin.cabinName || '-'}</TableCell><TableCell className="text-sm text-gray-600">{getZoneName(cabin.zoneId)}</TableCell><TableCell>{cabin.cabinType}</TableCell><TableCell>{cabin.deck || '-'}</TableCell><TableCell>{cabin.side}</TableCell><TableCell>{cabin.bedCount}</TableCell><TableCell>{cabin.ensuite ? 'Yes' : 'No'}</TableCell><TableCell><Badge className={cabin.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}>{cabin.status}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(cabin)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeletingCabin(cabin)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell></TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader><DialogTitle>{editingCabin ? 'Edit Cabin' : 'Add Cabin'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cabin Code *</Label><Input value={formData.cabinCode} onChange={(e) => setFormData({...formData, cabinCode: e.target.value})} required /></div>
              <div><Label>Cabin Name</Label><Input value={formData.cabinName} onChange={(e) => setFormData({...formData, cabinName: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Type *</Label><Select value={formData.cabinType} onValueChange={(v) => setFormData({...formData, cabinType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SINGLE">Single</SelectItem><SelectItem value="DOUBLE">Double</SelectItem><SelectItem value="MULTI">Multi</SelectItem><SelectItem value="OFFICER">Officer</SelectItem><SelectItem value="CREW">Crew</SelectItem><SelectItem value="GUEST">Guest</SelectItem></SelectContent></Select></div>
              <div><Label>Deck</Label><Input value={formData.deck} onChange={(e) => setFormData({...formData, deck: e.target.value})} /></div>
              <div><Label>Side</Label><Select value={formData.side} onValueChange={(v) => setFormData({...formData, side: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PORT">Port</SelectItem><SelectItem value="STARBOARD">Starboard</SelectItem><SelectItem value="CENTER">Center</SelectItem><SelectItem value="NA">N/A</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bed Count *</Label><Input type="number" min="1" value={formData.bedCount} onChange={(e) => setFormData({...formData, bedCount: e.target.value})} required /></div>
              <div><Label>Zone</Label><Select value={formData.zoneId} onValueChange={(v) => setFormData({...formData, zoneId: v})}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.code} - {z.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex items-center gap-2"><Checkbox id="ensuite" checked={formData.ensuite} onCheckedChange={(v) => setFormData({...formData, ensuite: v})} /><Label htmlFor="ensuite" className="cursor-pointer">Ensuite Bathroom</Label></div>
            <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem></SelectContent></Select></div>
            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCabin} onOpenChange={() => setDeletingCabin(null)}>
        <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete Cabin</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deletingCabin.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}