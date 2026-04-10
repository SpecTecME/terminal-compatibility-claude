import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Map } from 'lucide-react';

export default function MapConfigurationSettings() {
  const queryClient = useQueryClient();
  const [useMaritimeZones, setUseMaritimeZones] = useState(true);
  const [configId, setConfigId] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['mapConfiguration'],
    queryFn: () => base44.entities.MapConfiguration.list(),
  });

  useEffect(() => {
    if (configs.length > 0) {
      const active = configs.find(c => c.isActive !== false) || configs[0];
      setConfigId(active.id);
      setUseMaritimeZones(active.useMaritimeZones !== false); // default true if not set
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (configId) {
        await base44.entities.MapConfiguration.update(configId, { useMaritimeZones });
      } else {
        await base44.entities.MapConfiguration.create({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          useMaritimeZones,
          isActive: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapConfiguration'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Map Configuration</h1>
        <p className="text-gray-600 mt-1">Configure map display settings and maritime zone overlays</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="w-5 h-5 text-cyan-500" />
            Maritime Zones
          </CardTitle>
          <CardDescription>Control whether maritime zone overlays appear on the World Map</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div>
              <Label htmlFor="useMaritimeZones" className="text-sm font-medium text-gray-900 cursor-pointer">
                Use Maritime Zones
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                When enabled, ECA, MARPOL, Piracy HRA and other zone overlays are shown on the map legend.
                Turn off to hide all maritime zone overlays globally.
              </p>
            </div>
            <Switch
              id="useMaritimeZones"
              checked={useMaritimeZones}
              onCheckedChange={setUseMaritimeZones}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : saved ? (
                '✓ Saved'
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Settings</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}