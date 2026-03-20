import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SeedSimpleDocumentSets() {
  const [result, setResult] = useState(null);

  const seedMutation = useMutation({
    mutationFn: async () => {
      // Get first vessel and terminal for demo
      const vessels = await base44.entities.Vessel.list();
      const terminals = await base44.entities.Terminal.list();
      const documentTypes = await base44.entities.DocumentType.list();
      const vesselDocs = await base44.entities.Document.list();

      if (vessels.length === 0 || terminals.length === 0 || documentTypes.length === 0) {
        throw new Error('Need at least one vessel, terminal, and document type to seed demo data');
      }

      const vessel = vessels[0];
      const terminal = terminals[0];

      // Create a DRAFT document set
      const setData = {
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        vesselId: vessel.id,
        vesselPublicId: vessel.publicId,
        terminalId: terminal.id,
        terminalPublicId: terminal.publicId,
        status: 'DRAFT',
        notes: 'Demo document set for testing simple approval mode'
      };

      const createdSet = await base44.entities.VesselTerminalDocumentSet.create(setData);

      // Add 6 document type items
      const itemsToCreate = documentTypes.slice(0, 6).map((dt, idx) => {
        // Link first 2 items to existing vessel documents if available
        const linkedDoc = idx < 2 && vesselDocs.length > idx 
          ? vesselDocs.find(d => d.vessel_id === vessel.id) 
          : null;

        return {
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          documentSetId: createdSet.id,
          documentSetPublicId: createdSet.publicId,
          documentTypeId: dt.id,
          documentTypePublicId: dt.publicId,
          documentId: linkedDoc?.id || null,
          documentPublicId: linkedDoc?.publicId || null,
          isRequired: true,
          isProvided: !!linkedDoc,
          sortOrder: idx + 1,
          remark: idx < 2 ? 'Linked to existing vessel document' : 'Pending document upload'
        };
      });

      await base44.entities.VesselTerminalDocumentSetItem.bulkCreate(itemsToCreate);

      return {
        set: createdSet,
        itemsCreated: itemsToCreate.length,
        itemsLinked: itemsToCreate.filter(i => i.documentId).length
      };
    },
    onSuccess: (data) => {
      setResult({ success: true, data });
    },
    onError: (error) => {
      setResult({ success: false, error: error.message });
    }
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Seed Simple Document Sets (Demo Data)</h1>

      <Card>
        <CardHeader>
          <CardTitle>Demo Document Set</CardTitle>
          <CardDescription>
            Creates a sample VesselTerminalDocumentSet with 6 document type items (2 linked to existing docs, 4 missing)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="w-full"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Demo Document Set'
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Successfully seeded demo data</p>
                    <p className="text-sm text-green-800 mt-1">
                      Created document set with {result.data.itemsCreated} items ({result.data.itemsLinked} linked to existing documents)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Error seeding data</p>
                    <p className="text-sm text-red-800 mt-1">{result.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}