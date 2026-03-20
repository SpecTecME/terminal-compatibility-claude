import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function FixTerminalCountryIds() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const fixCountryIds = async () => {
    setProcessing(true);
    setResults(null);
    
    try {
      // Fetch all terminals and countries
      const terminals = await base44.entities.Terminal.list();
      const countries = await base44.entities.Country.list();
      
      // Create ISO2 to ID mapping
      const iso2ToId = {};
      const iso2ToPublicId = {};
      countries.forEach(country => {
        iso2ToId[country.iso2] = country.id;
        iso2ToPublicId[country.iso2] = country.publicId;
      });
      
      let fixed = 0;
      let alreadyCorrect = 0;
      let failed = [];
      
      for (const terminal of terminals) {
        const countryId = terminal.countryId;
        
        // Check if countryId is an ISO2 code (2 letters) instead of a database ID
        if (countryId && countryId.length === 2) {
          const correctId = iso2ToId[countryId];
          const correctPublicId = iso2ToPublicId[countryId];
          
          if (correctId) {
            try {
              await base44.entities.Terminal.update(terminal.id, {
                countryId: correctId,
                countryPublicId: correctPublicId
              });
              fixed++;
            } catch (error) {
              failed.push({ terminal: terminal.name, error: error.message });
            }
          } else {
            failed.push({ terminal: terminal.name, error: `No country found for ISO2: ${countryId}` });
          }
        } else {
          alreadyCorrect++;
        }
      }
      
      setResults({
        total: terminals.length,
        fixed,
        alreadyCorrect,
        failed
      });
      
      toast.success('Migration completed!');
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fix Terminal Country IDs</h1>
        <p className="text-gray-600 mt-1">
          Migrate terminal countryId from ISO2 codes to database IDs
        </p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migration Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">What this does:</p>
                <ul className="text-sm text-amber-800 mt-2 space-y-1">
                  <li>• Scans all terminals for ISO2 country codes (e.g., "JP", "US")</li>
                  <li>• Converts them to proper database IDs</li>
                  <li>• Updates both countryId and countryPublicId fields</li>
                  <li>• Safe to run multiple times</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={fixCountryIds}
            disabled={processing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {processing ? 'Processing...' : 'Run Migration'}
          </Button>

          {results && (
            <div className="space-y-3 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-900">Migration Results</p>
                </div>
                <div className="text-sm text-green-800 space-y-1">
                  <p>Total terminals: {results.total}</p>
                  <p>Fixed: {results.fixed}</p>
                  <p>Already correct: {results.alreadyCorrect}</p>
                  {results.failed.length > 0 && (
                    <p className="text-red-600">Failed: {results.failed.length}</p>
                  )}
                </div>
              </div>

              {results.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium text-red-900 mb-2">Failed Updates:</p>
                  <div className="text-sm text-red-800 space-y-1">
                    {results.failed.map((f, i) => (
                      <p key={i}>• {f.terminal}: {f.error}</p>
                    ))}
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