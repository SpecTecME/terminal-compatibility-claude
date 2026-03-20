import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrateBerthData() {
  const [migrationResults, setMigrationResults] = useState(null);

  const { data: berths = [], refetch } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const migrateMutation = useMutation({
    mutationFn: async () => {
      const results = {
        backfilled: [],
        statusNormalized: [],
        deleted: [],
        errors: []
      };

      // Part A: Backfill legacy dimension fields
      for (const berth of berths) {
        try {
          const updates = {};
          let needsUpdate = false;

          if (!berth.max_loa && berth.maxLOAM) {
            updates.max_loa = berth.maxLOAM;
            needsUpdate = true;
          }
          if (!berth.max_beam && berth.maxBeamM) {
            updates.max_beam = berth.maxBeamM;
            needsUpdate = true;
          }
          if (!berth.max_draft && berth.maxArrivalDraftM) {
            updates.max_draft = berth.maxArrivalDraftM;
            needsUpdate = true;
          }
          if (!berth.max_cargo_capacity && berth.maxCargoCapacityM3) {
            updates.max_cargo_capacity = berth.maxCargoCapacityM3;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await base44.entities.Berth.update(berth.id, updates);
            results.backfilled.push(`${berth.berthCode || berth.berth_number || berth.id}: ${Object.keys(updates).join(', ')}`);
          }
        } catch (error) {
          results.errors.push({ berth: berth.berth_number || berth.id, error: error.message, operation: 'backfill' });
        }
      }

      // Part B: Normalize status from "Active" to "Operational"
      for (const berth of berths) {
        try {
          if (berth.status === 'Active') {
            await base44.entities.Berth.update(berth.id, { status: 'Operational' });
            results.statusNormalized.push(berth.berthCode || berth.berth_number || berth.id);
          }
        } catch (error) {
          results.errors.push({ berth: berth.berth_number || berth.id, error: error.message, operation: 'normalize status' });
        }
      }

      // Part C: Delete dummy/placeholder berths
      const dummyNames = ['Berth 1', 'Berth 2', 'Berth 3', 'Berth A', 'Berth B'];
      for (const berth of berths) {
        try {
          const isDummy = dummyNames.includes(berth.berth_name) || 
                         dummyNames.includes(berth.berth_number) ||
                         !berth.terminal_id;
          
          if (isDummy) {
            await base44.entities.Berth.delete(berth.id);
            results.deleted.push(berth.berth_name || berth.berth_number || berth.id);
          }
        } catch (error) {
          results.errors.push({ berth: berth.berth_number || berth.id, error: error.message, operation: 'delete' });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setMigrationResults(results);
      refetch();
      const totalOps = results.backfilled.length + results.statusNormalized.length + results.deleted.length;
      if (totalOps > 0) {
        toast.success(`Migration completed: ${totalOps} operations`);
      }
      if (results.errors.length > 0) {
        toast.error(`${results.errors.length} errors occurred`);
      }
    },
    onError: (error) => {
      toast.error('Migration failed: ' + error.message);
    }
  });

  const dummyBerths = berths.filter(b => 
    ['Berth 1', 'Berth 2', 'Berth 3', 'Berth A', 'Berth B'].includes(b.berth_name) ||
    ['Berth 1', 'Berth 2', 'Berth 3', 'Berth A', 'Berth B'].includes(b.berth_number) ||
    !b.terminal_id
  );

  const activeBerths = berths.filter(b => b.status === 'Active');

  const needsBackfill = berths.filter(b => 
    (!b.max_loa && b.maxLOAM) ||
    (!b.max_beam && b.maxBeamM) ||
    (!b.max_draft && b.maxArrivalDraftM) ||
    (!b.max_cargo_capacity && b.maxCargoCapacityM3)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Berth Data</h1>
        <p className="text-sm text-gray-600 mt-1">Backfill dimensions, normalize status, and delete dummy berths</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-cyan-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{needsBackfill.length}</p>
                <p className="text-xs text-gray-600">Berths need backfill</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeBerths.length}</p>
                <p className="text-xs text-gray-600">Status to normalize</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{dummyBerths.length}</p>
                <p className="text-xs text-gray-600">Dummy berths to delete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Migration Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Part A:</strong> Backfill legacy dimension fields (max_loa, max_beam, max_draft, max_cargo_capacity) from new camelCase fields</p>
            <p><strong>Part B:</strong> Normalize status from "Active" to "Operational"</p>
            <p><strong>Part C:</strong> Permanently delete dummy/placeholder berths</p>
          </div>

          {dummyBerths.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900 mb-2">Berths to be deleted:</p>
              <ul className="text-xs text-amber-800 space-y-1">
                {dummyBerths.slice(0, 10).map((b) => (
                  <li key={b.id}>• {b.berth_name || b.berth_number || b.id} {!b.terminal_id && '(no terminal)'}</li>
                ))}
                {dummyBerths.length > 10 && <li>... and {dummyBerths.length - 10} more</li>}
              </ul>
            </div>
          )}

          {migrationResults && (
            <div className="space-y-3">
              {migrationResults.backfilled.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Backfilled {migrationResults.backfilled.length} berths:</span>
                  </div>
                  <div className="text-sm text-emerald-800 max-h-32 overflow-y-auto space-y-1">
                    {migrationResults.backfilled.map((item, idx) => (
                      <div key={idx}>• {item}</div>
                    ))}
                  </div>
                </div>
              )}
              {migrationResults.statusNormalized.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Normalized status for {migrationResults.statusNormalized.length} berths</span>
                  </div>
                </div>
              )}
              {migrationResults.deleted.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Deleted {migrationResults.deleted.length} dummy berths:</span>
                  </div>
                  <div className="text-sm text-red-800 max-h-32 overflow-y-auto space-y-1">
                    {migrationResults.deleted.map((item, idx) => (
                      <div key={idx}>• {item}</div>
                    ))}
                  </div>
                </div>
              )}
              {migrationResults.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Errors ({migrationResults.errors.length}):</span>
                  </div>
                  <div className="text-sm text-red-800 max-h-32 overflow-y-auto space-y-1">
                    {migrationResults.errors.map((err, idx) => (
                      <div key={idx}>• {err.berth} ({err.operation}): {err.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => migrateMutation.mutate()}
            disabled={migrateMutation.isPending || (needsBackfill.length === 0 && activeBerths.length === 0 && dummyBerths.length === 0)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {migrateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              'Run Migration'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}