import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Anchor, Ship } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '../utils/uuid';
import { getCurrentTenantId } from '../utils/tenant';

export default function TerminalMarineAccessView({ terminal }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    timezone: '',
    approachChannelDepthMCD: '',
    basinOrBerthDepthMCD: '',
    pilotageRequired: false,
    pilotageNotes: '',
    tugsRequired: false,
    tugsNotes: '',
    navigationNotes: '',
    dataSource: '',
    lastVerifiedDate: ''
  });

  const { data: marineAccess } = useQuery({
    queryKey: ['marineAccess', terminal.id],
    queryFn: () => base44.entities.TerminalMarineAccess.filter({ terminalId: terminal.id }).then(r => r[0]),
    enabled: !!terminal
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TerminalMarineAccess.create({
      publicId: generateUUID(),
      tenantId: getCurrentTenantId(),
      terminalId: terminal.id,
      terminalPublicId: terminal.publicId,
      ...data,
      approachChannelDepthMCD: data.approachChannelDepthMCD ? parseFloat(data.approachChannelDepthMCD) : null,
      basinOrBerthDepthMCD: data.basinOrBerthDepthMCD ? parseFloat(data.basinOrBerthDepthMCD) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['marineAccess']);
      setDialogOpen(false);
      toast.success('Marine access data saved');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TerminalMarineAccess.update(id, {
      ...data,
      approachChannelDepthMCD: data.approachChannelDepthMCD ? parseFloat(data.approachChannelDepthMCD) : null,
      basinOrBerthDepthMCD: data.basinOrBerthDepthMCD ? parseFloat(data.basinOrBerthDepthMCD) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['marineAccess']);
      setDialogOpen(false);
      toast.success('Marine access data updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TerminalMarineAccess.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['marineAccess']);
      setDeleteDialogOpen(false);
      toast.success('Marine access data deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const handleCreate = () => {
    setFormData({
      timezone: terminal.timezone || '',
      approachChannelDepthMCD: '',
      basinOrBerthDepthMCD: '',
      pilotageRequired: false,
      pilotageNotes: '',
      tugsRequired: false,
      tugsNotes: '',
      navigationNotes: '',
      dataSource: '',
      lastVerifiedDate: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = () => {
    setFormData({
      timezone: marineAccess.timezone || '',
      approachChannelDepthMCD: marineAccess.approachChannelDepthMCD || '',
      basinOrBerthDepthMCD: marineAccess.basinOrBerthDepthMCD || '',
      pilotageRequired: marineAccess.pilotageRequired || false,
      pilotageNotes: marineAccess.pilotageNotes || '',
      tugsRequired: marineAccess.tugsRequired || false,
      tugsNotes: marineAccess.tugsNotes || '',
      navigationNotes: marineAccess.navigationNotes || '',
      dataSource: marineAccess.dataSource || '',
      lastVerifiedDate: marineAccess.lastVerifiedDate || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (marineAccess) {
      updateMutation.mutate({ id: marineAccess.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <>
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-600" />
            Marine Access
          </CardTitle>
          {marineAccess ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleCreate} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Marine Access
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {marineAccess ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {marineAccess.timezone && (
                  <div>
                    <p className="text-sm text-gray-600">Timezone</p>
                    <p className="text-gray-900 font-medium">{marineAccess.timezone}</p>
                  </div>
                )}
                {marineAccess.approachChannelDepthMCD && (
                  <div>
                    <p className="text-sm text-gray-600">Approach Channel Depth (m CD)</p>
                    <p className="text-gray-900 font-medium">{marineAccess.approachChannelDepthMCD} m</p>
                  </div>
                )}
                {marineAccess.basinOrBerthDepthMCD && (
                  <div>
                    <p className="text-sm text-gray-600">Basin or Inner Depth (m CD)</p>
                    <p className="text-gray-900 font-medium">{marineAccess.basinOrBerthDepthMCD} m</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Pilotage Required</p>
                  <p className="text-gray-900 font-medium">{marineAccess.pilotageRequired ? 'Yes' : 'No'}</p>
                  {marineAccess.pilotageNotes && (
                    <p className="text-sm text-gray-700 mt-1">{marineAccess.pilotageNotes}</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Tugs Required</p>
                  <p className="text-gray-900 font-medium">{marineAccess.tugsRequired ? 'Yes' : 'No'}</p>
                  {marineAccess.tugsNotes && (
                    <p className="text-sm text-gray-700 mt-1">{marineAccess.tugsNotes}</p>
                  )}
                </div>
                {marineAccess.navigationNotes && (
                  <div>
                    <p className="text-sm text-gray-600">Navigation Notes</p>
                    <p className="text-sm text-gray-700">{marineAccess.navigationNotes}</p>
                  </div>
                )}
                {marineAccess.dataSource && (
                  <div>
                    <p className="text-sm text-gray-600">Data Source</p>
                    <p className="text-sm text-gray-700">{marineAccess.dataSource}</p>
                  </div>
                )}
                {marineAccess.lastVerifiedDate && (
                  <div>
                    <p className="text-sm text-gray-600">Last Verified</p>
                    <p className="text-sm text-gray-700">{marineAccess.lastVerifiedDate}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Anchor className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No marine access data configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{marineAccess ? 'Edit Marine Access' : 'Add Marine Access'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Timezone</Label>
                <Input value={formData.timezone} onChange={(e) => setFormData({...formData, timezone: e.target.value})} placeholder="e.g., UTC+3" />
              </div>
              <div>
                <Label>Approach Channel Depth (m CD)</Label>
                <Input type="number" step="0.1" value={formData.approachChannelDepthMCD} onChange={(e) => setFormData({...formData, approachChannelDepthMCD: e.target.value})} className="text-right" />
              </div>
              <div>
                <Label>Basin/Inner Depth (m CD)</Label>
                <Input type="number" step="0.1" value={formData.basinOrBerthDepthMCD} onChange={(e) => setFormData({...formData, basinOrBerthDepthMCD: e.target.value})} className="text-right" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="pilotage" checked={formData.pilotageRequired} onCheckedChange={(c) => setFormData({...formData, pilotageRequired: c})} />
                  <Label htmlFor="pilotage" className="cursor-pointer">Pilotage Required</Label>
                </div>
                <Textarea value={formData.pilotageNotes} onChange={(e) => setFormData({...formData, pilotageNotes: e.target.value})} placeholder="Pilotage notes..." rows={3} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="tugs" checked={formData.tugsRequired} onCheckedChange={(c) => setFormData({...formData, tugsRequired: c})} />
                  <Label htmlFor="tugs" className="cursor-pointer">Tugs Required</Label>
                </div>
                <Textarea value={formData.tugsNotes} onChange={(e) => setFormData({...formData, tugsNotes: e.target.value})} placeholder="Tug requirements..." rows={3} />
              </div>
            </div>

            <div>
              <Label>Navigation Notes</Label>
              <Textarea value={formData.navigationNotes} onChange={(e) => setFormData({...formData, navigationNotes: e.target.value})} placeholder="General navigation notes..." rows={3} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Data Source</Label>
                <Input value={formData.dataSource} onChange={(e) => setFormData({...formData, dataSource: e.target.value})} placeholder="e.g., Public sources" />
              </div>
              <div>
                <Label>Last Verified Date</Label>
                <Input type="date" value={formData.lastVerifiedDate} onChange={(e) => setFormData({...formData, lastVerifiedDate: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Marine Access Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the marine access data? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(marineAccess.id)} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}