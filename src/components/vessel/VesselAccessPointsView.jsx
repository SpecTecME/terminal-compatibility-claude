/**
 * Vessel Access Points Management Component
 * 
 * PURPOSE:
 * Manages vessel's personnel access/egress points.
 * Critical for safe boarding operations and emergency egress planning.
 * 
 * DOMAIN CONTEXT - VESSEL ACCESS:
 * 
 * Access points = How people get on/off the vessel.
 * Different types serve different operational needs.
 * Height variations critical for terminal infrastructure matching.
 * 
 * ACCESS POINT TYPES:
 * 
 * 1. GANGWAY:
 *    - Telescoping bridge from shore to vessel
 *    - Primary access for crew, cargo workers, visitors
 *    - Adjustable length and angle
 *    - Most common for regular operations
 *    - Terminal must have compatible gangway system
 * 
 * 2. ACCOMMODATION LADDER (ACCOM_LADDER):
 *    - Ship's own ladder deployed over side
 *    - Metal or rope ladder from deck to water level
 *    - Used when terminal gangway unavailable
 *    - Also for boat transfers (pilot, port authority)
 *    - Self-contained (vessel brings its own)
 * 
 * 3. PILOT LADDER:
 *    - Rope ladder specifically for pilot boarding
 *    - SOLAS-regulated construction (specific rung spacing)
 *    - Used while vessel underway or at anchorage
 *    - Pilot climbs from small boat to vessel
 *    - Must meet SOLAS Chapter V requirements
 * 
 * 4. OTHER:
 *    - Helicopter landing pads
 *    - Crane personnel baskets
 *    - Special access for inspections
 * 
 * OPERATING HEIGHT RANGE:
 * 
 * operatingHeightMin_m / operatingHeightMax_m:
 * - Vertical distance from waterline to access point
 * - Varies with vessel's draft (loaded vs ballast)
 * - Critical for gangway angle calculations
 * 
 * HEIGHT MATCHING LOGIC:
 * - Terminal gangway has max/min height limits
 * - Vessel access point has operating range
 * - Must have overlap: MAX(terminalMin, vesselMin) <= MIN(terminalMax, vesselMax)
 * - No overlap = incompatible (vessel cannot berth)
 * 
 * PRACTICAL EXAMPLE:
 * Vessel access point: 5m - 12m above waterline
 * Terminal gangway: 3m - 10m reach
 * Overlap: 5m - 10m (COMPATIBLE)
 * Vessel must ballast to keep access point in 5-10m range
 * 
 * SIDE DESIGNATION:
 * - PORT/STARBOARD: Which side access located
 * - Important for berth planning (terminal must approach correct side)
 * - Some terminals only accommodate port-side berthing
 * - Vessel with only starboard access = incompatible with port-side terminal
 * 
 * VALIDATION RULE (lines 65-71):
 * Minimum height cannot exceed maximum height.
 * Prevents data entry errors.
 * Physical impossibility caught before database save.
 * 
 * ZONE LINKING:
 * Links to VesselZone for spatial context.
 * Example: "Access Point A-1 in Accommodation Block"
 * Used for security planning (who can access which zones)
 * 
 * OUT_OF_SERVICE STATUS:
 * Access point damaged, under repair, or blocked.
 * Affects operational planning (must use alternative access).
 * Example: "Starboard gangway out of service, use port side only"
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

export default function VesselAccessPointsView({ vessel }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    accessCode: '', name: '', accessType: 'GANGWAY', side: 'PORT', deck: '', operatingHeightMin_m: '', operatingHeightMax_m: '', status: 'ACTIVE', notes: '', zoneId: ''
  });

  const { data: items = [] } = useQuery({
    queryKey: ['accessPoints', vessel.id],
    queryFn: () => base44.entities.AccessPoint.filter({ vesselId: vessel.id })
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['vesselZones', vessel.id],
    queryFn: () => base44.entities.VesselZone.filter({ vesselId: vessel.id })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AccessPoint.create({
      ...data, vesselId: vessel.id, vesselPublicId: vessel.publicId,
      publicId: crypto.randomUUID(), tenantId: vessel.tenantId,
      zonePublicId: data.zoneId ? zones.find(z => z.id === data.zoneId)?.publicId : null,
      operatingHeightMin_m: data.operatingHeightMin_m ? parseFloat(data.operatingHeightMin_m) : null,
      operatingHeightMax_m: data.operatingHeightMax_m ? parseFloat(data.operatingHeightMax_m) : null
    }),
    onSuccess: () => { queryClient.invalidateQueries(['accessPoints']); setShowDialog(false); setEditing(null); toast.success('Access point saved'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AccessPoint.update(id, {
      ...data,
      operatingHeightMin_m: data.operatingHeightMin_m ? parseFloat(data.operatingHeightMin_m) : null,
      operatingHeightMax_m: data.operatingHeightMax_m ? parseFloat(data.operatingHeightMax_m) : null
    }),
    onSuccess: () => { queryClient.invalidateQueries(['accessPoints']); setShowDialog(false); setEditing(null); toast.success('Access point updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AccessPoint.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['accessPoints']); setDeleting(null); toast.success('Access point deleted'); }
  });

  const handleAdd = () => { setEditing(null); setFormData({ accessCode: '', name: '', accessType: 'GANGWAY', side: 'PORT', deck: '', operatingHeightMin_m: '', operatingHeightMax_m: '', status: 'ACTIVE', notes: '', zoneId: '' }); setShowDialog(true); };
  const handleEdit = (item) => { setEditing(item); setFormData({ accessCode: item.accessCode, name: item.name, accessType: item.accessType, side: item.side || 'PORT', deck: item.deck || '', operatingHeightMin_m: item.operatingHeightMin_m || '', operatingHeightMax_m: item.operatingHeightMax_m || '', status: item.status, notes: item.notes || '', zoneId: item.zoneId || '' }); setShowDialog(true); };
  const handleSubmit = (e) => {
    e.preventDefault();
    const min = formData.operatingHeightMin_m ? parseFloat(formData.operatingHeightMin_m) : null;
    const max = formData.operatingHeightMax_m ? parseFloat(formData.operatingHeightMax_m) : null;
    if (min && max && min > max) {
      toast.error('Minimum height cannot be greater than maximum height');
      return;
    }
    editing ? updateMutation.mutate({ id: editing.id, data: formData }) : createMutation.mutate(formData);
  };

  const filtered = items
    .filter(i => i.accessCode?.toLowerCase().includes(searchQuery.toLowerCase()) || i.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.accessCode || '').localeCompare(b.accessCode || ''));
  
  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? `${zone.code} - ${zone.name}` : '-';
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Access Points</CardTitle>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" /></div>
          <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600"><Plus className="w-4 h-4 mr-2" />Add Access Point</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p>No access points found</p></div>
        ) : (
          <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Zone</TableHead><TableHead>Type</TableHead><TableHead>Side</TableHead><TableHead>Deck</TableHead><TableHead>Height Range (m)</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(item => (
            <TableRow key={item.id}><TableCell className="font-medium">{item.accessCode}</TableCell><TableCell>{item.name}</TableCell><TableCell className="text-sm text-gray-600">{getZoneName(item.zoneId)}</TableCell><TableCell>{item.accessType}</TableCell><TableCell>{item.side}</TableCell><TableCell>{item.deck || '-'}</TableCell><TableCell>{item.operatingHeightMin_m && item.operatingHeightMax_m ? `${item.operatingHeightMin_m} - ${item.operatingHeightMax_m}` : '-'}</TableCell><TableCell><Badge className={item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}>{item.status}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell></TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Access Point' : 'Add Access Point'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Access Code *</Label><Input value={formData.accessCode} onChange={(e) => setFormData({...formData, accessCode: e.target.value})} required /></div>
              <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Type *</Label><Select value={formData.accessType} onValueChange={(v) => setFormData({...formData, accessType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GANGWAY">Gangway</SelectItem><SelectItem value="ACCOM_LADDER">Accommodation Ladder</SelectItem><SelectItem value="PILOT_LADDER">Pilot Ladder</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Side</Label><Select value={formData.side} onValueChange={(v) => setFormData({...formData, side: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PORT">Port</SelectItem><SelectItem value="STARBOARD">Starboard</SelectItem><SelectItem value="CENTER">Center</SelectItem><SelectItem value="NA">N/A</SelectItem></SelectContent></Select></div>
              <div><Label>Deck</Label><Input value={formData.deck} onChange={(e) => setFormData({...formData, deck: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min Height (m)</Label><Input type="number" step="0.1" value={formData.operatingHeightMin_m} onChange={(e) => setFormData({...formData, operatingHeightMin_m: e.target.value})} /></div>
              <div><Label>Max Height (m)</Label><Input type="number" step="0.1" value={formData.operatingHeightMax_m} onChange={(e) => setFormData({...formData, operatingHeightMax_m: e.target.value})} /></div>
            </div>
            <div><Label>Zone</Label><Select value={formData.zoneId} onValueChange={(v) => setFormData({...formData, zoneId: v})}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.code} - {z.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem></SelectContent></Select></div>
            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={2} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete Access Point</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleting.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}