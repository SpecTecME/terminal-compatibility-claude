import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrateLegacyDocumentTypeFields() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const handleMigration = async () => {
    setProcessing(true);
    const migrationResults = {
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      for (const docType of documentTypes) {
        const updates = {};
        let hasUpdates = false;

        // Migrate lifecycle_type to documentValidityType
        if (!docType.documentValidityType && docType.lifecycle_type) {
          // Map legacy values to new enum
          const mapping = {
            'Permanent': 'PermanentStatic',
            'Renewable': 'RenewableCertified',
            'Voyage-Specific': 'TerminalEventDriven'
          };
          if (mapping[docType.lifecycle_type]) {
            updates.documentValidityType = mapping[docType.lifecycle_type];
            hasUpdates = true;
          }
        }

        // Rename lifecycle_type to legacyLifecycleType
        if (docType.lifecycle_type && !docType.legacyLifecycleType) {
          updates.legacyLifecycleType = docType.lifecycle_type;
          hasUpdates = true;
        }

        // Migrate validity_duration to defaultValidityDuration
        if (!docType.defaultValidityDuration && docType.validity_duration) {
          updates.defaultValidityDuration = docType.validity_duration;
          hasUpdates = true;
        }

        // Rename validity_duration to legacyValidityDuration
        if (docType.validity_duration && !docType.legacyValidityDuration) {
          updates.legacyValidityDuration = docType.validity_duration;
          hasUpdates = true;
        }

        // Migrate validity_unit to validityUnit
        if (!docType.validityUnit && docType.validity_unit) {
          // Only copy if it matches the new enum
          if (['Days', 'Months', 'Years'].includes(docType.validity_unit)) {
            updates.validityUnit = docType.validity_unit;
            hasUpdates = true;
          }
        }

        // Rename validity_unit to legacyValidityUnit
        if (docType.validity_unit && !docType.legacyValidityUnit) {
          updates.legacyValidityUnit = docType.validity_unit;
          hasUpdates = true;
        }

        // Migrate reminder_window to reminderLeadTime
        if (!docType.reminderLeadTime && docType.reminder_window) {
          updates.reminderLeadTime = docType.reminder_window;
          hasUpdates = true;
        }

        // Rename reminder_window to legacyReminderWindow
        if (docType.reminder_window && !docType.legacyReminderWindow) {
          updates.legacyReminderWindow = docType.reminder_window;
          hasUpdates = true;
        }

        // Migrate reminder_unit to reminderUnit
        if (!docType.reminderUnit && docType.reminder_unit) {
          // Only copy if it matches the new enum
          if (['Days', 'Months'].includes(docType.reminder_unit)) {
            updates.reminderUnit = docType.reminder_unit;
            hasUpdates = true;
          }
        }

        // Rename reminder_unit to legacyReminderUnit
        if (docType.reminder_unit && !docType.legacyReminderUnit) {
          updates.legacyReminderUnit = docType.reminder_unit;
          hasUpdates = true;
        }

        // Rename required_for to legacyRequiredFor
        if (docType.required_for && !docType.legacyRequiredFor) {
          updates.legacyRequiredFor = docType.required_for;
          hasUpdates = true;
        }

        // Rename category to legacyCategoryText
        if (docType.category && !docType.legacyCategoryText) {
          updates.legacyCategoryText = docType.category;
          hasUpdates = true;
        }

        if (hasUpdates) {
          try {
            await base44.entities.DocumentType.update(docType.id, updates);
            migrationResults.updated++;
          } catch (error) {
            migrationResults.errors.push({
              name: docType.name,
              error: error.message
            });
          }
        } else {
          migrationResults.skipped++;
        }
      }

      setResults(migrationResults);
      toast.success(`Migration complete: ${migrationResults.updated} updated`);
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Legacy DocumentType Fields</h1>
        <p className="text-gray-600 mt-1">
          Copy values from legacy fields to canonical fields and rename legacy fields
        </p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This migration will:
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Copy lifecycle_type → documentValidityType (with enum mapping)</li>
            <li>Copy validity_duration → defaultValidityDuration</li>
            <li>Copy validity_unit → validityUnit (if compatible)</li>
            <li>Copy reminder_window → reminderLeadTime</li>
            <li>Copy reminder_unit → reminderUnit (if compatible)</li>
            <li>Rename category → legacyCategoryText</li>
            <li>Rename all legacy fields to legacy* versions</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{documentTypes.length}</p>
                <p className="text-xs text-gray-600">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {documentTypes.filter(dt => dt.lifecycle_type || dt.validity_duration || dt.reminder_window || dt.category).length}
                </p>
                <p className="text-xs text-gray-600">Have Legacy Fields</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {documentTypes.filter(dt => dt.documentValidityType && dt.categoryId).length}
                </p>
                <p className="text-xs text-gray-600">Using New Fields</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Run Migration</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleMigration}
            disabled={processing || documentTypes.length === 0}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              'Start Migration'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Migration Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-700 mb-1">Updated</p>
                <p className="text-2xl font-bold text-emerald-900">{results.updated}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-700 mb-1">Skipped</p>
                <p className="text-2xl font-bold text-gray-900">{results.skipped}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 mb-1">Errors</p>
                <p className="text-2xl font-bold text-red-900">{results.errors.length}</p>
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-red-600 font-medium mb-2">Errors:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {results.errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-red-600">{err.name}: {err.error}</p>
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