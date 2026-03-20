import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrateTerminalCountries() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleMigration = async () => {
    setProcessing(true);
    setResults(null);

    try {
      const terminals = await base44.entities.Terminal.list();
      const countries = await base44.entities.Country.list();

      const stats = {
        total: terminals.length,
        matched: 0,
        skipped: 0,
        errors: []
      };

      for (const terminal of terminals) {
        try {
          // Skip if already has countryId
          if (terminal.countryId) {
            stats.skipped++;
            continue;
          }

          let matchedCountry = null;

          // Try matching by ISO2 code (case-insensitive)
          if (terminal.legacyCountryCode) {
            matchedCountry = countries.find(
              c => c.iso2?.toLowerCase() === terminal.legacyCountryCode.toLowerCase()
            );
            // Also try legacyCountryCode matching against name if it looks like a name (length > 2)
            if (!matchedCountry && terminal.legacyCountryCode.length > 2) {
              matchedCountry = countries.find(
                c => c.nameEn?.toLowerCase() === terminal.legacyCountryCode.toLowerCase()
              );
              // Try partial match on name
              if (!matchedCountry) {
                matchedCountry = countries.find(
                  c => c.nameEn?.toLowerCase().includes(terminal.legacyCountryCode.toLowerCase())
                );
              }
            }
          }

          // If no match by code, try matching by name (case-insensitive)
          if (!matchedCountry && terminal.legacyCountryName) {
            // First try exact name match
            matchedCountry = countries.find(
              c => c.nameEn?.toLowerCase() === terminal.legacyCountryName.toLowerCase()
            );
            // If still no exact match, try partial match
            if (!matchedCountry) {
              matchedCountry = countries.find(
                c => c.nameEn?.toLowerCase().includes(terminal.legacyCountryName.toLowerCase()) ||
                   terminal.legacyCountryName.toLowerCase().includes(c.nameEn?.toLowerCase())
              );
            }
          }

          // Update if match found
          if (matchedCountry) {
            await base44.entities.Terminal.update(terminal.id, {
              countryId: matchedCountry.id,
              countryPublicId: matchedCountry.publicId
            });
            stats.matched++;
          } else {
            stats.skipped++;
            stats.errors.push({
              terminal: terminal.name,
              legacyCode: terminal.legacyCountryCode,
              legacyName: terminal.legacyCountryName,
              reason: `No matching country found for code: '${terminal.legacyCountryCode || 'N/A'}' or name: '${terminal.legacyCountryName || 'N/A'}'`
            });
          }
        } catch (err) {
          stats.errors.push({
            terminal: terminal.name,
            reason: err.message
          });
        }
      }

      setResults(stats);
      toast.success('Migration completed');
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Terminal Countries</h1>
        <p className="text-gray-600 mt-1">Populate Terminal.countryId/countryPublicId from Country lookup</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Migration Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-gray-700">
            <p>This migration will:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Match Terminal.legacyCountryCode with Country.iso2 (case-insensitive)</li>
              <li>If no match, try Terminal.legacyCountryName with Country.nameEn (case-insensitive)</li>
              <li>Populate Terminal.countryId and Terminal.countryPublicId when match found</li>
              <li>Skip terminals that already have countryId</li>
              <li>Leave unmatched terminals blank for manual review</li>
            </ul>
          </div>

          <Button
            onClick={handleMigration}
            disabled={processing}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {processing ? 'Processing...' : 'Start Migration'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Migration Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600">Total Terminals</p>
                <p className="text-2xl font-bold text-gray-900">{results.total}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700">Matched & Updated</p>
                </div>
                <p className="text-2xl font-bold text-emerald-900">{results.matched}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-700">Skipped/Unmatched</p>
                </div>
                <p className="text-2xl font-bold text-amber-900">{results.skipped}</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Unmatched Terminals:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.errors.map((error, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                      <p className="font-medium text-gray-900">{error.terminal}</p>
                      <p className="text-gray-600">
                        Code: {error.legacyCode || 'N/A'} | Name: {error.legacyName || 'N/A'}
                      </p>
                      <p className="text-amber-700">{error.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}