import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedDocumentCategories() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const categories = [
    { name: 'Vessel Design', description: 'Vessel design and technical data, including structural drawings and technical specifications.', sortOrder: 10 },
    { name: 'Mooring & Berthing', description: 'Mooring and berthing analysis, including mooring loads, berthing energy, and environmental limits.', sortOrder: 20 },
    { name: 'Terminal Compatibility', description: 'Terminal and berth compatibility documents, including terminal-specific questionnaires, ESD compatibility, and gas forms.', sortOrder: 30 },
    { name: 'Vetting & OCIMF', description: 'Safety and vetting documents aligned with OCIMF requirements, including SIRE, TMSA, and VPQ submissions.', sortOrder: 40 },
    { name: 'Flag Certification', description: 'Statutory and flag state certification documents, including SOLAS, MARPOL, ISM, and other flag-issued certificates.', sortOrder: 50 },
    { name: 'Class Certification', description: 'Classification society certification, including class status, hull and machinery, and cargo containment system certification.', sortOrder: 60 },
    { name: 'Operations & Manuals', description: 'Operational procedures and manuals, including cargo operations manuals and emergency response documentation.', sortOrder: 70 },
    { name: 'Energy & Power', description: 'Electrical and energy system documentation, including shore power, cold ironing, and power availability studies.', sortOrder: 80 },
    { name: 'Cyber Compliance', description: 'Cyber and digital compliance documentation, including IMO cyber risk management and terminal IT requirements.', sortOrder: 90 },
    { name: 'Environmental Compliance', description: 'Environmental and emissions compliance documentation, including EEDI, EEXI, CII, and supporting records.', sortOrder: 100 }
  ];

  const handleSeed = async () => {
    setProcessing(true);
    const seedResults = { created: 0, skipped: 0, errors: [] };

    try {
      const existing = await base44.entities.DocumentCategory.list();
      const existingNames = new Set(existing.map(c => c.name));

      for (const category of categories) {
        if (existingNames.has(category.name)) {
          seedResults.skipped++;
          continue;
        }

        try {
          await base44.entities.DocumentCategory.create({
            ...category,
            publicId: generateUUID(),
            tenantId: getCurrentTenantId(),
            isActive: true
          });
          seedResults.created++;
        } catch (error) {
          seedResults.errors.push({ name: category.name, error: error.message });
        }
      }

      setResults(seedResults);
      toast.success(`Created ${seedResults.created} categories`);
    } catch (error) {
      toast.error('Seeding failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Document Categories</h1>
        <p className="text-gray-600 mt-1">Create master data for document categories</p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This will create 10 standard document categories. Existing categories will be skipped.
        </AlertDescription>
      </Alert>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Categories to Create</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            {categories.map((cat) => (
              <div key={cat.name} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="font-medium text-gray-900">{cat.name}</div>
                <div className="text-sm text-gray-600 mt-1">{cat.description}</div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSeed}
            disabled={processing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Categories'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Seeding Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-900">Created: {results.created}</p>
              <p className="text-gray-900">Skipped: {results.skipped}</p>
              {results.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-red-600 font-medium">Errors:</p>
                  {results.errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-red-600">{err.name}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}