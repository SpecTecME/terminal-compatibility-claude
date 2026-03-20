import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { matchCountryFromText } from '../components/services/countryService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BackfillCountries() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const entitiesToProcess = [
    { name: 'Terminal', oldField: 'country', newField: 'countryIso2', snapshotField: 'countryName' },
    { name: 'IssuingAuthority', oldField: 'country', newField: 'countryIso2', snapshotField: 'countryName' },
    { name: 'Vessel', oldField: 'flag_state', newField: 'flag_state_code', snapshotField: 'flag_state_name' }
  ];

  const backfillEntity = async (entityConfig) => {
    const { name, oldField, newField, snapshotField } = entityConfig;
    
    try {
      const records = await base44.entities[name].list();
      
      let total = 0;
      let matched = 0;
      let skipped = 0;
      let failed = 0;
      const unmatchedValues = new Set();

      for (const record of records) {
        total++;
        
        // Skip if already has ISO code
        if (record[newField]) {
          skipped++;
          continue;
        }

        const oldValue = record[oldField];
        if (!oldValue) {
          skipped++;
          continue;
        }

        const country = await matchCountryFromText(oldValue);
        
        if (country) {
          try {
            const updates = {
              [newField]: country.iso2,
              [snapshotField]: country.nameEn
            };
            await base44.entities[name].update(record.id, updates);
            matched++;
          } catch (error) {
            console.error(`Error updating ${name} ${record.id}:`, error);
            failed++;
            unmatchedValues.add(oldValue);
          }
        } else {
          // No match found - keep old value in snapshot
          try {
            await base44.entities[name].update(record.id, {
              [snapshotField]: oldValue
            });
          } catch (error) {
            console.error(`Error preserving ${name} ${record.id}:`, error);
          }
          failed++;
          unmatchedValues.add(oldValue);
        }
      }

      return {
        total,
        matched,
        skipped,
        failed,
        unmatchedValues: Array.from(unmatchedValues)
      };
    } catch (error) {
      console.error(`Error processing ${name}:`, error);
      return {
        total: 0,
        matched: 0,
        skipped: 0,
        failed: 0,
        unmatchedValues: [],
        error: error.message
      };
    }
  };

  const handleBackfill = async () => {
    setProcessing(true);
    const entityResults = {};

    try {
      for (const entityConfig of entitiesToProcess) {
        const result = await backfillEntity(entityConfig);
        entityResults[entityConfig.name] = result;
      }

      setResults(entityResults);
      toast.success('Country backfill completed');
    } catch (error) {
      toast.error('Backfill failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backfill Country ISO Codes</h1>
        <p className="text-gray-600 mt-1">
          Convert free-text country fields to standardized ISO codes
        </p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This operation will match existing country text values to ISO codes from the Country master table.
          Records already having ISO codes will be skipped. Unmatched values will be logged for manual review.
        </AlertDescription>
      </Alert>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Entities to Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            {entitiesToProcess.map((entity) => (
              <div key={entity.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-gray-900 font-medium">{entity.name}</span>
                  <p className="text-xs text-gray-600">
                    {entity.oldField} → {entity.newField}
                  </p>
                </div>
                {results?.[entity.name] && (
                  <div className="flex items-center gap-2 text-sm">
                    {results[entity.name].error ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-gray-600">
                      {results[entity.name].matched} matched, {results[entity.name].failed} failed
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleBackfill}
            disabled={processing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Backfill'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          {Object.entries(results).map(([entityName, result]) => (
            <Card key={entityName} className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {result.error ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {entityName} Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.error ? (
                  <p className="text-red-600">Error: {result.error}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Scanned:</span>
                        <span className="ml-2 text-gray-900 font-medium">{result.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Matched:</span>
                        <span className="ml-2 text-emerald-600 font-medium">{result.matched}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Skipped:</span>
                        <span className="ml-2 text-gray-900 font-medium">{result.skipped}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed/Unmatched:</span>
                        <span className="ml-2 text-red-600 font-medium">{result.failed}</span>
                      </div>
                    </div>
                    
                    {result.unmatchedValues?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Unmatched Values (manual review needed):</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-auto">
                          <ul className="text-xs text-red-900 space-y-1">
                            {result.unmatchedValues.map((val, idx) => (
                              <li key={idx}>• {val}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}