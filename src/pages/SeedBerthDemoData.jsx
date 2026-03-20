import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Anchor, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedBerthDemoData() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState([]);

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: existingBerths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const findTerminal = (namePattern) => {
    return terminals.find(t => t.name.toLowerCase().includes(namePattern.toLowerCase()));
  };

  const findBerth = (terminalId, berthName) => {
    return existingBerths.find(b => 
      b.terminal_id === terminalId && 
      (b.berthName === berthName || b.berth_name === berthName || b.berthCode === berthName)
    );
  };

  const createOrUpdateBerth = async (terminalId, terminalPublicId, berthData, terminalName) => {
    const existing = findBerth(terminalId, berthData.berthName);
    const today = new Date().toISOString().split('T')[0];

    const data = {
      publicId: existing?.publicId || crypto.randomUUID(),
      tenantId: 'default-tenant',
      terminal_id: terminalId,
      terminalPublicId: terminalPublicId,
      berth_number: berthData.berthCode || berthData.berthName,
      berthCode: berthData.berthCode || berthData.berthName,
      berthName: berthData.berthName,
      berthType: berthData.berthType || null,
      productService: berthData.productService || 'LNG',
      status: berthData.status || 'Operational',
      qmaxCapable: existing?.qmaxCapable !== undefined ? existing.qmaxCapable : (berthData.qmaxCapable || false),
      qflexCapable: existing?.qflexCapable !== undefined ? existing.qflexCapable : (berthData.qflexCapable || false),
      maxCargoCapacityM3: existing?.maxCargoCapacityM3 || berthData.maxCargoCapacityM3 || null,
      maxLOAM: existing?.maxLOAM || berthData.maxLOAM || null,
      maxBeamM: existing?.maxBeamM || berthData.maxBeamM || null,
      maxArrivalDraftM: existing?.maxArrivalDraftM || berthData.maxArrivalDraftM || null,
      operator: berthData.operator || null,
      dataSource: berthData.dataSource || 'Demo seed, public sources',
      lastVerifiedDate: berthData.lastVerifiedDate || today,
      notes: existing?.notes || berthData.notes || null,
      isActive: true
    };

    try {
      if (existing) {
        await base44.entities.Berth.update(existing.id, data);
        return { success: true, action: 'updated', terminal: terminalName, berth: berthData.berthName };
      } else {
        await base44.entities.Berth.create(data);
        return { success: true, action: 'created', terminal: terminalName, berth: berthData.berthName };
      }
    } catch (error) {
      return { success: false, terminal: terminalName, berth: berthData.berthName, error: error.message };
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setResults([]);
    const seedResults = [];

    // 1.1 South Hook LNG (UK)
    const southHook = findTerminal('South Hook');
    if (southHook) {
      const berths = [
        { berthName: 'South Hook LNG Berth 1', berthType: 'Jetty', notes: 'Two operational LNG berths, detailed dimensional limits to be verified' },
        { berthName: 'South Hook LNG Berth 2', berthType: 'Jetty', notes: 'Two operational LNG berths, detailed dimensional limits to be verified' }
      ];
      for (const berth of berths) {
        const result = await createOrUpdateBerth(southHook.id, southHook.publicId, berth, 'South Hook LNG');
        seedResults.push(result);
      }
    }

    // 1.2 President Lech Kaczynski's LNG Terminal (Poland)
    const swinoujscie = findTerminal('Lech Kaczynski');
    if (swinoujscie) {
      const result = await createOrUpdateBerth(
        swinoujscie.id, 
        swinoujscie.publicId,
        { 
          berthName: 'Świnoujście LNG Berth 1',
          berthType: 'Jetty',
          maxCargoCapacityM3: 217000
        },
        'President Lech Kaczynski\'s LNG Terminal'
      );
      seedResults.push(result);
    }

    // 1.3 Adriatic LNG (Italy)
    const adriatic = findTerminal('Adriatic');
    if (adriatic) {
      const result = await createOrUpdateBerth(
        adriatic.id,
        adriatic.publicId,
        {
          berthName: 'Adriatic LNG Offshore Berth 1',
          berthType: 'SPM',
          maxCargoCapacityM3: 217000,
          notes: 'Offshore gravity-based terminal, accepts mid-size to large LNGCs'
        },
        'Adriatic LNG'
      );
      seedResults.push(result);
    }

    // 1.4 Krk LNG Terminal (Croatia)
    const krk = findTerminal('Krk');
    if (krk) {
      const result = await createOrUpdateBerth(
        krk.id,
        krk.publicId,
        {
          berthName: 'Krk LNG FSRU Berth 1',
          berthType: 'Jetty',
          notes: 'FSRU-based LNG import terminal, carrier limits to be verified'
        },
        'Krk LNG Terminal'
      );
      seedResults.push(result);
    }

    // 1.5 Al-Zour LNG (Kuwait)
    const alZour = findTerminal('Al-Zour');
    if (alZour) {
      const berths = [
        { 
          berthName: 'Al-Zour LNG Jetty 1',
          berthType: 'Jetty',
          maxCargoCapacityM3: 266000,
          notes: 'Two LNG jetties, public sources indicate large LNG carrier capability'
        },
        { 
          berthName: 'Al-Zour LNG Jetty 2',
          berthType: 'Jetty',
          maxCargoCapacityM3: 266000,
          notes: 'Two LNG jetties, public sources indicate large LNG carrier capability'
        }
      ];
      for (const berth of berths) {
        const result = await createOrUpdateBerth(alZour.id, alZour.publicId, berth, 'Al-Zour LNG');
        seedResults.push(result);
      }
    }

    // 1.6 Energia Costa Azul LNG (Mexico)
    const costaAzul = findTerminal('Costa Azul');
    if (costaAzul) {
      const result = await createOrUpdateBerth(
        costaAzul.id,
        costaAzul.publicId,
        {
          berthName: 'Costa Azul LNG Berth 1',
          berthType: 'Jetty',
          notes: 'Single LNG berth, demo data, dimensional limits to be verified'
        },
        'Energia Costa Azul LNG'
      );
      seedResults.push(result);
    }

    // 1.7 Energas FSRU (Pakistan)
    const energas = findTerminal('Energas');
    if (energas) {
      const result = await createOrUpdateBerth(
        energas.id,
        energas.publicId,
        {
          berthName: 'Energas FSRU LNG Berth 1',
          berthType: 'Jetty',
          notes: 'FSRU import terminal, limits to be verified'
        },
        'Energas FSRU'
      );
      seedResults.push(result);
    }

    // 1.8 Japan LNG terminals
    const japanTerminals = [
      { name: 'Chita', berthName: 'Chita LNG Berth 1' },
      { name: 'Kawagoe', berthName: 'Kawagoe LNG Berth 1' },
      { name: 'Yokkaichi', berthName: 'Yokkaichi LNG Berth 1' },
      { name: 'Joetsu', berthName: 'Joetsu LNG Berth 1' },
      { name: 'Sodeshi', berthName: 'Sodeshi LNG Berth 1' }
    ];

    for (const jt of japanTerminals) {
      const terminal = findTerminal(jt.name);
      if (terminal) {
        const result = await createOrUpdateBerth(
          terminal.id,
          terminal.publicId,
          {
            berthName: jt.berthName,
            berthType: 'Jetty',
            notes: 'Demo seed, berth limits to be verified'
          },
          jt.name
        );
        seedResults.push(result);
      }
    }

    // 2) Enrich existing Ras Laffan berths
    const rasLaffan = findTerminal('Ras Laffan');
    if (rasLaffan) {
      const rlBerths = [
        'Ras Laffan LNG Berth 3',
        'Ras Laffan LNG Berth 4',
        'Ras Laffan LNG Berth 5',
        'Ras Laffan LNG Berth 6'
      ];
      
      for (const berthName of rlBerths) {
        const result = await createOrUpdateBerth(
          rasLaffan.id,
          rasLaffan.publicId,
          {
            berthName: berthName,
            berthType: 'Jetty',
            maxCargoCapacityM3: 266000,
            qmaxCapable: true,
            qflexCapable: true
          },
          'Ras Laffan LNG'
        );
        seedResults.push(result);
      }
    }

    setResults(seedResults);
    setIsSeeding(false);
    
    const successCount = seedResults.filter(r => r.success).length;
    const failCount = seedResults.filter(r => !r.success).length;
    
    if (failCount === 0) {
      toast.success(`Successfully processed ${successCount} berths`);
    } else {
      toast.warning(`Processed ${successCount} berths, ${failCount} failed`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Berth Demo Data</h1>
        <p className="text-gray-600 mt-1">Add realistic demo berths for selected LNG terminals</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Anchor className="w-5 h-5" />
            Berth Seeding Operation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              This will create or update berths for the following terminals:
            </p>
            <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>South Hook LNG (UK) - 2 berths</li>
              <li>President Lech Kaczynski's LNG Terminal (Poland) - 1 berth</li>
              <li>Adriatic LNG (Italy) - 1 berth</li>
              <li>Krk LNG Terminal (Croatia) - 1 berth</li>
              <li>Al-Zour LNG (Kuwait) - 2 berths</li>
              <li>Energia Costa Azul LNG (Mexico) - 1 berth</li>
              <li>Energas FSRU (Pakistan) - 1 berth</li>
              <li>Japan terminals (Chita, Kawagoe, Yokkaichi, Joetsu, Sodeshi) - 5 berths</li>
              <li>Ras Laffan LNG (Qatar) - enrich berths 3-6</li>
            </ul>
          </div>

          <Button
            onClick={handleSeed}
            disabled={isSeeding}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {isSeeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding Berths...
              </>
            ) : (
              <>
                <Anchor className="w-4 h-4 mr-2" />
                Seed Berth Data
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-gray-900">Results:</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      result.success
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                        {result.success
                          ? `${result.action === 'created' ? 'Created' : 'Updated'}: ${result.berth}`
                          : `Failed: ${result.berth}`}
                      </p>
                      <p className={`text-xs ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                        {result.terminal}
                        {result.error && ` - ${result.error}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}