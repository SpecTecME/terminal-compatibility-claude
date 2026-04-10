import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Save, Ship, Building2, Anchor } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AddVesselTerminalDocumentSet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [vesselId, setVesselId] = useState('');
  const [terminalId, setTerminalId] = useState('');
  const [berthId, setBerthId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const terminalBerths = berths.filter(b => b.terminal_id === terminalId);

  const createSetMutation = useMutation({
    mutationFn: async (data) => {
      const vessel = vessels.find(v => v.id === vesselId);
      const terminal = terminals.find(t => t.id === terminalId);
      const berth = berthId ? berths.find(b => b.id === berthId) : null;

      const setData = {
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        vesselId,
        vesselPublicId: vessel.publicId,
        terminalId,
        terminalPublicId: terminal.publicId,
        berthId: berthId || null,
        berthPublicId: berth?.publicId || null,
        status: 'DRAFT',
        notes
      };

      return base44.entities.VesselTerminalDocumentSet.create(setData);
    },
    onSuccess: (newSet) => {
      queryClient.invalidateQueries(['vesselTerminalDocumentSets']);
      toast({
        title: 'Document Set Created',
        description: 'Navigate to the set to add document types and link documents.'
      });
      navigate(createPageUrl(`EditVesselTerminalDocumentSet?id=${newSet.id}`));
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vesselId || !terminalId) {
      toast({
        title: 'Validation Error',
        description: 'Please select vessel and terminal',
        variant: 'destructive'
      });
      return;
    }
    createSetMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Document Set</h1>
        <p className="text-gray-600 mt-1">Define required documents for a vessel-terminal combination</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Document Set Details</CardTitle>
            <CardDescription>Select the vessel, terminal, and optionally a specific berth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vessel" className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Vessel *
              </Label>
              <Select value={vesselId} onValueChange={setVesselId} required>
                <SelectTrigger id="vessel">
                  <SelectValue placeholder="Select vessel" />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} {v.imoNumber ? `(IMO: ${v.imoNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminal" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Terminal *
              </Label>
              <Select value={terminalId} onValueChange={setTerminalId} required>
                <SelectTrigger id="terminal">
                  <SelectValue placeholder="Select terminal" />
                </SelectTrigger>
                <SelectContent>
                  {terminals.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {terminalId && terminalBerths.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="berth" className="flex items-center gap-2">
                  <Anchor className="w-4 h-4" />
                  Berth (Optional)
                </Label>
                <Select value={berthId} onValueChange={setBerthId}>
                  <SelectTrigger id="berth">
                    <SelectValue placeholder="Select berth (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No specific berth</SelectItem>
                    {terminalBerths.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.berthName || b.berth_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this document set..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createSetMutation.isPending}>
            {createSetMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create & Add Documents
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}