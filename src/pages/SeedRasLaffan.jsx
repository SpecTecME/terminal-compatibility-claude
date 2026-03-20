import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';

export default function SeedRasLaffan() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: marineAccessRecords = [] } = useQuery({
    queryKey: ['marineAccess'],
    queryFn: () => base44.entities.TerminalMarineAccess.list()
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const tenantId = getCurrentTenantId();
      const results = { success: [], errors: [] };

      // Find or create Ras Laffan terminal
      let rasLaffanTerminal = terminals.find(t => t.name === 'Ras Laffan');
      
      if (!rasLaffanTerminal) {
        const qatarCountry = countries.find(c => c.nameEn === 'Qatar');
        rasLaffanTerminal = await base44.entities.Terminal.create({
          publicId: generateUUID(),
          tenantId,
          name: 'Ras Laffan',
          countryId: qatarCountry?.id,
          countryPublicId: qatarCountry?.publicId,
          port: 'Ras Laffan',
          latitude: 26.1305,
          longitude: 51.5469,
          operation_type: 'Export',
          status: 'Operational',
          isActive: true
        });
        results.success.push('Created Ras Laffan terminal');
      }

      const terminalId = rasLaffanTerminal.id;

      // Create TerminalMarineAccess if not exists
      const existingAccess = marineAccessRecords.find(ma => ma.terminalId === terminalId);
      if (!existingAccess) {
        await base44.entities.TerminalMarineAccess.create({
          publicId: generateUUID(),
          tenantId,
          terminalId,
          terminalPublicId: rasLaffanTerminal.publicId,
          timezone: 'UTC+3',
          approachChannelDepthMCD: 15.0,
          basinOrBerthDepthMCD: 13.5,
          pilotageRequired: true,
          pilotageNotes: 'Pilotage required, 24h service, demo record',
          tugsRequired: true,
          tugsNotes: 'Tugs required for berthing, demo record',
          navigationNotes: 'Marine access values are terminal-level defaults for demo purposes, berth-specific values may override later',
          dataSource: 'Demo seed',
          lastVerifiedDate: '2026-01-06'
        });
        results.success.push('Created Marine Access data');
      }

      // Create 6 berths
      const berthsData = [
        {
          berthCode: 'LNG1', berthName: 'Ras Laffan LNG Berth 1', qmaxCapable: false, qflexCapable: true,
          maxCargoCapacityM3: 145000, maxLOAM: 333, maxArrivalDisplacementT: 105000,
          manifoldLimitsNotes: 'Conventional LNG carrier berth, demo values'
        },
        {
          berthCode: 'LNG2', berthName: 'Ras Laffan LNG Berth 2', qmaxCapable: false, qflexCapable: true,
          maxCargoCapacityM3: 145000, maxLOAM: 333, maxArrivalDisplacementT: 105000,
          manifoldLimitsNotes: 'Conventional LNG carrier berth, demo values'
        },
        {
          berthCode: 'LNG3', berthName: 'Ras Laffan LNG Berth 3', qmaxCapable: true, qflexCapable: true,
          maxCargoCapacityM3: 266000,
          manifoldLimitsNotes: 'Q-Max capable, demo values, detailed dimensional limits to be added later'
        },
        {
          berthCode: 'LNG4', berthName: 'Ras Laffan LNG Berth 4', qmaxCapable: true, qflexCapable: true,
          maxCargoCapacityM3: 266000,
          manifoldLimitsNotes: 'Q-Max capable, demo values, detailed dimensional limits to be added later'
        },
        {
          berthCode: 'LNG5', berthName: 'Ras Laffan LNG Berth 5', qmaxCapable: true, qflexCapable: true,
          maxCargoCapacityM3: 266000,
          manifoldLimitsNotes: 'Q-Max capable, demo values, detailed dimensional limits to be added later'
        },
        {
          berthCode: 'LNG6', berthName: 'Ras Laffan LNG Berth 6', qmaxCapable: true, qflexCapable: true,
          maxCargoCapacityM3: 266000,
          manifoldLimitsNotes: 'Q-Max capable, demo values, detailed dimensional limits to be added later'
        }
      ];

      for (const berthData of berthsData) {
        const exists = berths.find(b => b.terminal_id === terminalId && b.berthCode === berthData.berthCode);
        if (!exists) {
          try {
            await base44.entities.Berth.create({
              publicId: generateUUID(),
              tenantId,
              terminal_id: terminalId,
              terminalPublicId: rasLaffanTerminal.publicId,
              berth_number: berthData.berthCode,
              berth_name: berthData.berthName,
              berthCode: berthData.berthCode,
              berthName: berthData.berthName,
              berthType: 'Jetty',
              productService: 'LNG',
              status: 'Operational',
              qmaxCapable: berthData.qmaxCapable,
              qflexCapable: berthData.qflexCapable,
              maxCargoCapacityM3: berthData.maxCargoCapacityM3,
              maxLOAM: berthData.maxLOAM,
              maxArrivalDisplacementT: berthData.maxArrivalDisplacementT,
              manifoldLimitsNotes: berthData.manifoldLimitsNotes,
              operator: 'QatarEnergy LNG',
              dataSource: 'Demo seed',
              lastVerifiedDate: '2026-01-06'
            });
            results.success.push(`Created berth ${berthData.berthCode}`);
          } catch (error) {
            results.errors.push({ code: berthData.berthCode, error: error.message });
          }
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} records`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} records`);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Ras Laffan Terminal</h1>
        <p className="text-sm text-gray-600 mt-1">Initialize Ras Laffan terminal with marine access and 6 berths</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Ras Laffan Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create or update:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ras Laffan terminal (if not exists)</li>
              <li>Marine access data with pilotage and tug requirements</li>
              <li>6 LNG berths (LNG1-LNG6) with Q-Flex/Q-Max capabilities</li>
            </ul>
          </div>

          {seedResults && (
            <div className="space-y-3">
              {seedResults.success.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Successfully created:</span>
                  </div>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    {seedResults.success.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {seedResults.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Errors:</span>
                  </div>
                  <div className="text-sm text-red-800 space-y-1">
                    {seedResults.errors.map((err, idx) => (
                      <div key={idx}>{err.code}: {err.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Ras Laffan Data'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}