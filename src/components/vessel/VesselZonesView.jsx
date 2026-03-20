/**
 * Vessel Zones View Component (Hierarchical Tree Management)
 * 
 * PURPOSE:
 * Manages vessel's physical zone hierarchy for accommodation, safety, and operational planning.
 * Zones provide spatial organization of vessel layout.
 * 
 * DOMAIN CONTEXT:
 * Vessels are complex 3D structures with multiple decks, sections, and functional areas.
 * Zone hierarchy enables:
 * - Emergency muster assignments (which zone evacuates to which muster station)
 * - Cabin organization (accommodation planning)
 * - Safety equipment positioning (where lifeboats/rafts located)
 * - Access control planning (restricted areas)
 * 
 * HIERARCHICAL TREE STRUCTURE:
 * 
 * Example hierarchy:
 * VESSEL (Root)
 *   ├── AREA: Accommodation Block
 *   │     ├── DECK: Deck 3
 *   │     │     ├── SECTION: Port Cabins
 *   │     │     └── SECTION: Starboard Cabins
 *   │     └── DECK: Deck 4
 *   │           └── ROOM_GROUP: Officer Quarters
 *   └── AREA: Engine Room
 *         ├── DECK: Lower Platform
 *         └── DECK: Upper Platform
 * 
 * ZONE TYPES:
 * - VESSEL: Root level (whole ship)
 * - AREA: Major functional area (accommodation, engine room, cargo area)
 * - DECK: Individual deck level
 * - SECTION: Subdivision of deck (port/starboard, forward/aft)
 * - ROOM_GROUP: Cluster of related rooms
 * 
 * Unlimited nesting depth supported via parentZoneId relationship.
 * 
 * SIDE ATTRIBUTE:
 * - PORT: Left side when facing forward
 * - STARBOARD: Right side when facing forward
 * - CENTER: Centerline areas
 * - NA: Not applicable (whole vessel or symmetric areas)
 * 
 * Maritime convention: Always reference sides from perspective of facing bow (forward).
 * 
 * TREE UI PATTERN:
 * - Collapsible hierarchical display
 * - expandedZones Set tracks open/closed nodes
 * - Indentation shows nesting level (ml-4, ml-8, ml-12, etc.)
 * - "Add sub-level" button creates child zone
 * - Parent zone selection dropdown (circular reference prevented)
 * 
 * BUSINESS RULES:
 * - Cannot set parentZoneId to self (circular reference check in form)
 * - Root zones have parentZoneId = null or empty
 * - Deleting parent zone does NOT cascade to children (orphans them to root level)
 *   TODO: Consider implementing cascade delete or preventing deletion of zones with children
 * 
 * USAGE DOWNSTREAM:
 * - Cabins link to zones (cabin.zoneId)
 * - Muster stations link to zones (musterStation.zoneId)
 * - Lifeboats link to zones (lifeboat.zoneId)
 * - Life rafts link to zones (lifeRaft.zoneId)
 * - Access points link to zones (accessPoint.zoneId)
 * - Assignments link to zones (assignment.assignedZoneId)
 * 
 * Zones provide spatial context for all accommodation and safety entities.
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
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function VesselZonesView({ vessel }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [deletingZone, setDeletingZone] = useState(null);
  const [expandedZones, setExpandedZones] = useState(new Set());
  const [formData, setFormData] = useState({
    code: '', name: '', zoneType: 'AREA', deck: '', side: 'NA', description: '', status: 'ACTIVE', parentZoneId: ''
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['vesselZones', vessel.id],
    queryFn: () => base44.entities.VesselZone.filter({ vesselId: vessel.id })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VesselZone.create({
      ...data, vesselId: vessel.id, vesselPublicId: vessel.publicId,
      publicId: crypto.randomUUID(), tenantId: vessel.tenantId,
      parentZonePublicId: data.parentZoneId ? zones.find(z => z.id === data.parentZoneId)?.publicId : null
    }),
    onSuccess: () => { queryClient.invalidateQueries(['vesselZones']); setShowDialog(false); setEditingZone(null); toast.success('Zone saved'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VesselZone.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['vesselZones']); setShowDialog(false); setEditingZone(null); toast.success('Zone updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VesselZone.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['vesselZones']); setDeletingZone(null); toast.success('Zone deleted'); }
  });

  const handleAdd = () => { setEditingZone(null); setFormData({ code: '', name: '', zoneType: 'AREA', deck: '', side: 'NA', description: '', status: 'ACTIVE', parentZoneId: '' }); setShowDialog(true); };
  const handleAddSubLevel = (parentZone) => { setEditingZone(null); setFormData({ code: '', name: '', zoneType: 'AREA', deck: '', side: 'NA', description: '', status: 'ACTIVE', parentZoneId: parentZone.id }); setShowDialog(true); };
  const handleEdit = (zone) => { setEditingZone(zone); setFormData({ code: zone.code, name: zone.name, zoneType: zone.zoneType, deck: zone.deck || '', side: zone.side || 'NA', description: zone.description || '', status: zone.status, parentZoneId: zone.parentZoneId || '' }); setShowDialog(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingZone ? updateMutation.mutate({ id: editingZone.id, data: formData }) : createMutation.mutate(formData); };

  const buildTree = () => {
    const rootZones = zones.filter(z => !z.parentZoneId);
    const childMap = {};
    zones.forEach(z => { if (z.parentZoneId) { if (!childMap[z.parentZoneId]) childMap[z.parentZoneId] = []; childMap[z.parentZoneId].push(z); } });
    return { roots: rootZones, childMap };
  };

  const { roots, childMap } = buildTree();

  const toggleExpand = (zoneId) => {
    const newSet = new Set(expandedZones);
    newSet.has(zoneId) ? newSet.delete(zoneId) : newSet.add(zoneId);
    setExpandedZones(newSet);
  };

  const renderZone = (zone, level = 0) => {
    const children = childMap[zone.id] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedZones.has(zone.id);

    return (
      <div key={zone.id}>
        <div className={`flex items-center justify-between p-3 hover:bg-gray-50 ${level > 0 ? 'ml-' + (level * 4) : ''}`}>
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <button onClick={() => toggleExpand(zone.id)} className="p-1">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : <div className="w-6" />}
            <div>
              <p className="font-medium text-gray-900">{zone.code} - {zone.name}</p>
              <p className="text-xs text-gray-600">{zone.zoneType}{zone.deck ? ` • ${zone.deck}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={zone.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}>{zone.status}</Badge>
            <Button variant="ghost" size="icon" onClick={() => handleAddSubLevel(zone)} title="Add sub-level"><Plus className="w-4 h-4 text-green-600" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)}><Edit className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeletingZone(zone)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
          </div>
        </div>
        {isExpanded && hasChildren && children.map(child => renderZone(child, level + 1))}
      </div>
    );
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vessel Zones</CardTitle>
        <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600"><Plus className="w-4 h-4 mr-2" />Add Zone</Button>
      </CardHeader>
      <CardContent>
        {zones.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No zones configured</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y">{roots.map(zone => renderZone(zone))}</div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader><DialogTitle>{editingZone ? 'Edit Zone' : 'Add Zone'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Code *</Label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required /></div>
              <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type *</Label><Select value={formData.zoneType} onValueChange={(v) => setFormData({...formData, zoneType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VESSEL">Vessel</SelectItem><SelectItem value="AREA">Area</SelectItem><SelectItem value="DECK">Deck</SelectItem><SelectItem value="SECTION">Section</SelectItem><SelectItem value="ROOM_GROUP">Room Group</SelectItem></SelectContent></Select></div>
              <div><Label>Parent Zone</Label><Select value={formData.parentZoneId} onValueChange={(v) => setFormData({...formData, parentZoneId: v})}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{zones.filter(z => !editingZone || z.id !== editingZone.id).map(z => <SelectItem key={z.id} value={z.id}>{z.code} - {z.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Deck</Label><Input value={formData.deck} onChange={(e) => setFormData({...formData, deck: e.target.value})} /></div>
              <div><Label>Side</Label><Select value={formData.side} onValueChange={(v) => setFormData({...formData, side: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PORT">Port</SelectItem><SelectItem value="STARBOARD">Starboard</SelectItem><SelectItem value="CENTER">Center</SelectItem><SelectItem value="NA">N/A</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} /></div>
            <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingZone} onOpenChange={() => setDeletingZone(null)}>
        <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete Zone</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deletingZone.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}