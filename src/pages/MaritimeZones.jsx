import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const ZONE_TYPE_LABELS = {
  ECA_SECA: 'ECA SECA',
  ECA_NECA: 'ECA NECA',
  MARPOL_SPECIAL_AREA: 'MARPOL Special Area',
  PSSA: 'PSSA',
  WAR_RISK: 'War Risk',
  PIRACY_HRA: 'Piracy HRA',
  COMPANY_TRADING_AREA: 'Company Trading Area',
};

const ZONE_TYPE_COLORS = {
  ECA_SECA: 'bg-red-100 text-red-700 border-red-200',
  ECA_NECA: 'bg-teal-100 text-teal-700 border-teal-200',
  MARPOL_SPECIAL_AREA: 'bg-green-100 text-green-700 border-green-200',
  PSSA: 'bg-purple-100 text-purple-700 border-purple-200',
  WAR_RISK: 'bg-orange-100 text-orange-700 border-orange-200',
  PIRACY_HRA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPANY_TRADING_AREA: 'bg-blue-100 text-blue-700 border-blue-200',
};

const EMPTY_FORM = {
  code: '',
  name: '',
  zoneType: '',
  authority: 'IMO',
  status: 'Active',
  isActive: true,
  displayOrder: 10,
  color: '#4ECDC4',
  fillOpacity: 0.12,
  strokeOpacity: 0.7,
  strokeWeight: 1,
  notes: '',
};

export default function MaritimeZones() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['maritimeZones'],
    queryFn: () => base44.entities.MaritimeZone.list('displayOrder'),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await base44.entities.MaritimeZone.update(editing.id, form);
      } else {
        await base44.entities.MaritimeZone.create({
          ...form,
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maritimeZones'] });
      setDialogOpen(false);
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.MaritimeZone.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maritimeZones'] }),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (zone) => {
    setEditing(zone);
    setForm({
      code: zone.code || '',
      name: zone.name || '',
      zoneType: zone.zoneType || '',
      authority: zone.authority || 'IMO',
      status: zone.status || 'Active',
      isActive: zone.isActive !== false,
      displayOrder: zone.displayOrder ?? 10,
      color: zone.color || '#4ECDC4',
      fillOpacity: zone.fillOpacity ?? 0.12,
      strokeOpacity: zone.strokeOpacity ?? 0.7,
      strokeWeight: zone.strokeWeight ?? 1,
      notes: zone.notes || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maritime Zones</h1>
          <p className="text-gray-600 mt-1">Manage maritime zone types and their display settings. GeoJSON geometry is managed via the Seed tool.</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Zone
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
        </div>
      ) : zones.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Map className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No maritime zones defined</p>
            <p className="text-sm text-gray-400 mt-1">Use the Seed Maritime Zones tool to populate initial data, or add zones manually.</p>
            <div className="flex gap-3 mt-4">
              <Button onClick={openNew} variant="outline">Add Zone Manually</Button>
              <Link to={createPageUrl('SeedMaritimeZones')}>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">Seed Initial Data</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Zone</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Authority</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Color</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Active</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm">{zone.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{zone.code}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ZONE_TYPE_COLORS[zone.zoneType] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {ZONE_TYPE_LABELS[zone.zoneType] || zone.zoneType}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{zone.authority}</span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`text-xs font-medium ${zone.status === 'Active' ? 'text-green-700' : zone.status === 'Planned' ? 'text-blue-700' : 'text-gray-500'}`}>
                        {zone.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: zone.color }} />
                        <span className="text-xs text-gray-400 font-mono">{zone.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Switch
                        checked={zone.isActive !== false}
                        onCheckedChange={(val) => toggleActive.mutate({ id: zone.id, isActive: val })}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(zone)} className="text-gray-400 hover:text-cyan-600">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Edit / Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Maritime Zone' : 'Add Maritime Zone'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. ECA SECA" />
            </div>
            <div className="space-y-1">
              <Label>Code</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. ECA_SECA" className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label>Zone Type</Label>
              <Select value={form.zoneType} onValueChange={v => setForm({ ...form, zoneType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ZONE_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Authority</Label>
              <Select value={form.authority} onValueChange={v => setForm({ ...form, authority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['IMO', 'EU', 'US_EPA', 'Company', 'Other'].map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Active', 'Planned', 'Retired'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Display Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Display Order</Label>
              <Input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch id="zoneActive" checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label htmlFor="zoneActive">Active (visible on map)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.code || !form.zoneType}
              className="bg-gradient-to-r from-cyan-500 to-blue-600">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}