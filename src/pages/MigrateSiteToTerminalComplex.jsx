import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrateSiteToTerminalComplex() {
  const [results, setResults] = useState(null);

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: terminalComplexes = [] } = useQuery({
    queryKey: ['terminalComplexes'],
    queryFn: () => base44.entities.TerminalComplex.list()
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const migrateMutation = useMutation({
    mutationFn: async () => {
      const migrated = [];
      const skipped = [];
      const errors = [];
      const updatedTerminals = [];

      // Step 1: Migrate Site records to TerminalComplex
      for (const site of sites) {
        try {
          // Check if already migrated (by publicId)
          const exists = terminalComplexes.find(tc => tc.publicId === site.publicId);
          if (exists) {
            skipped.push(site.name);
            continue;
          }

          // Create TerminalComplex record
          const tcData = {
            publicId: site.publicId,
            tenantId: site.tenantId,
            name: site.name,
            code: site.code,
            countryId: site.countryId,
            countryPublicId: site.countryPublicId,
            region: site.region,
            city: site.city,
            address: site.address,
            latitude: site.latitude,
            longitude: site.longitude,
            operatorAuthority: site.operatorAuthority,
            notes: site.notes,
            isActive: site.isActive
          };

          const newTC = await base44.entities.TerminalComplex.create(tcData);
          migrated.push(site.name);

          // Step 2: Update terminals that reference this site
          const relatedTerminals = terminals.filter(t => t.siteId === site.id);
          for (const terminal of relatedTerminals) {
            await base44.entities.Terminal.update(terminal.id, {
              terminalComplexId: newTC.id,
              terminalComplexPublicId: newTC.publicId
            });
            updatedTerminals.push(terminal.name);
          }
        } catch (error) {
          errors.push({ name: site.name, error: error.message });
        }
      }

      return { migrated, skipped, errors, updatedTerminals };
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.migrated.length > 0) {
        toast.success(`Migrated ${data.migrated.length} complexes, updated ${data.updatedTerminals.length} terminals`);
      }
    },
    onError: (error) => {
      toast.error('Migration failed: ' + error.message);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Site → Terminal Complex</h1>
        <p className="text-gray-600 mt-1">One-time migration to refactor entity naming</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Migration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Sites to Migrate</p>
              <p className="text-2xl font-bold text-blue-900">{sites.length}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-600 font-medium">Already Migrated</p>
              <p className="text-2xl font-bold text-emerald-900">{terminalComplexes.length}</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-600 font-medium">Terminals to Update</p>
              <p className="text-2xl font-bold text-amber-900">
                {terminals.filter(t => t.siteId && !t.terminalComplexId).length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-700">
              <p><strong>Migration will:</strong></p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Copy all Site records to TerminalComplex entity</li>
                <li>Preserve publicIds for data continuity</li>
                <li>Update Terminal records to reference terminalComplexId</li>
                <li>Keep original Site records intact (backward compatibility)</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={() => migrateMutation.mutate()}
            disabled={migrateMutation.isPending || sites.length === 0}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {migrateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              'Start Migration'
            )}
          </Button>

          {results && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {results.migrated.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-900">Successfully Migrated ({results.migrated.length})</p>
                      <p className="text-sm text-emerald-700 mt-1">{results.migrated.join(', ')}</p>
                      {results.updatedTerminals.length > 0 && (
                        <p className="text-xs text-emerald-600 mt-2">
                          Updated {results.updatedTerminals.length} terminals
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {results.skipped.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Already Migrated</p>
                      <p className="text-sm text-amber-700 mt-1">{results.skipped.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Errors</p>
                      {results.errors.map((err, i) => (
                        <p key={i} className="text-sm text-red-700 mt-1">
                          {err.name}: {err.error}
                        </p>
                      ))}
                    </div>
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