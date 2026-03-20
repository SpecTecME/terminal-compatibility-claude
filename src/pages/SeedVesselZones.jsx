import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from '../components/ui/SearchableSelect';

export default function SeedVesselZones() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlVesselId = urlParams.get('vesselId');
  const [selectedVesselId, setSelectedVesselId] = useState(urlVesselId || '');
  const [progress, setProgress] = useState([]);

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const vesselId = selectedVesselId || urlVesselId;

  const { data: vessel } = useQuery({
    queryKey: ['vessel', vesselId],
    queryFn: () => base44.entities.Vessel.filter({ id: vesselId }).then(r => r[0]),
    enabled: !!vesselId
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      if (!vessel) throw new Error('Vessel not found');
      
      const log = (msg) => setProgress(prev => [...prev, msg]);
      const tenantId = vessel.tenantId;
      
      // Create zones in hierarchical order
      log('Creating root zone: VESSEL...');
      const rootZone = await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        code: 'VESSEL',
        name: 'LNG Vessel',
        zoneType: 'VESSEL',
        side: 'NA',
        status: 'ACTIVE'
      });
      
      // Level 1: Main areas
      log('Creating main areas...');
      const accom = await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: rootZone.id,
        parentZonePublicId: rootZone.publicId,
        code: 'ACCOM',
        name: 'Accommodation',
        zoneType: 'AREA',
        side: 'NA',
        status: 'ACTIVE'
      });

      const cargo = await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: rootZone.id,
        parentZonePublicId: rootZone.publicId,
        code: 'CARGO',
        name: 'Cargo Area',
        zoneType: 'AREA',
        side: 'NA',
        status: 'ACTIVE'
      });

      const machinery = await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: rootZone.id,
        parentZonePublicId: rootZone.publicId,
        code: 'MACHINERY',
        name: 'Machinery Spaces',
        zoneType: 'AREA',
        side: 'NA',
        status: 'ACTIVE'
      });

      const openDeck = await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: rootZone.id,
        parentZonePublicId: rootZone.publicId,
        code: 'OPEN-DECK',
        name: 'Open Deck',
        zoneType: 'AREA',
        side: 'NA',
        status: 'ACTIVE'
      });

      // Level 2: Accommodation subdivisions
      log('Creating accommodation subdivisions...');
      const accomFwd = await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: accom.id,
        parentZonePublicId: accom.publicId,
        code: 'ACCOM-FWD',
        name: 'Accommodation Forward',
        zoneType: 'AREA',
        side: 'NA',
        status: 'ACTIVE'
      });

      const accomAft = await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: accom.id,
        parentZonePublicId: accom.publicId,
        code: 'ACCOM-AFT',
        name: 'Accommodation Aft',
        zoneType: 'AREA',
        side: 'NA',
        status: 'ACTIVE'
      });

      // Level 2: Other sections
      log('Creating cargo, machinery, and deck sections...');
      await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: cargo.id,
        parentZonePublicId: cargo.publicId,
        code: 'CARGO-FWD',
        name: 'Cargo Area Forward',
        zoneType: 'SECTION',
        side: 'NA',
        status: 'ACTIVE'
      });

      await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: machinery.id,
        parentZonePublicId: machinery.publicId,
        code: 'ENGINE-ROOM',
        name: 'Engine Room',
        zoneType: 'SECTION',
        side: 'CENTER',
        status: 'ACTIVE'
      });

      await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: openDeck.id,
        parentZonePublicId: openDeck.publicId,
        code: 'MANIFOLD-AREA',
        name: 'Manifold Area',
        zoneType: 'SECTION',
        side: 'CENTER',
        status: 'ACTIVE'
      });

      // Level 3: Decks
      log('Creating deck zones...');
      await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: accomFwd.id,
        parentZonePublicId: accomFwd.publicId,
        code: 'DECK-06',
        name: 'Deck 06',
        zoneType: 'DECK',
        deck: 'Deck 06',
        side: 'NA',
        status: 'ACTIVE'
      });

      await base44.entities.VesselZone.create({
        publicId: crypto.randomUUID(),
        tenantId,
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        parentZoneId: accomAft.id,
        parentZonePublicId: accomAft.publicId,
        code: 'DECK-08',
        name: 'Deck 08',
        zoneType: 'DECK',
        deck: 'Deck 08',
        side: 'NA',
        status: 'ACTIVE'
      });

      log('✅ Successfully created 12 vessel zones');
      return true;
    },
    onSuccess: () => {
      toast.success('Vessel zones seeded successfully');
      setTimeout(() => {
        window.location.href = `/app/VesselDetail?id=${vesselId}`;
      }, 2000);
    },
    onError: (error) => {
      toast.error('Failed to seed zones: ' + error.message);
      setProgress(prev => [...prev, `❌ Error: ${error.message}`]);
    }
  });



  return (
    <div className="p-6 space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Vessel Zones{vessel ? ` - ${vessel.name}` : ''}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!vesselId && (
            <div className="space-y-2">
              <Label>Select Vessel *</Label>
              <SearchableSelect
                value={selectedVesselId}
                onValueChange={setSelectedVesselId}
                options={vessels.map(v => ({ value: v.id, label: `${v.name} (IMO: ${v.imoNumber || v.imo_number})` }))}
                placeholder="Select vessel"
                searchPlaceholder="Search vessels..."
              />
            </div>
          )}

          {vesselId && (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900">
                  This will create the standard hierarchical zone structure for this LNG vessel:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Root vessel zone</li>
                    <li>4 main areas (Accommodation, Cargo, Machinery, Open Deck)</li>
                    <li>7 subdivisions (Forward/Aft sections, Engine Room, Manifold Area, Decks)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {seedMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Zones...
                  </>
                ) : (
                  'Create Zone Structure'
                )}
              </Button>
            </>
          )}

          {progress.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">Progress:</p>
              <div className="space-y-1">
                {progress.map((msg, idx) => (
                  <p key={idx} className="text-sm text-gray-700 font-mono">{msg}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}