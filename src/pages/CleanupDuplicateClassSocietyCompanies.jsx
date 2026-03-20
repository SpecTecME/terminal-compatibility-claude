import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function CleanupDuplicateClassSocietyCompanies() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle');
  const [results, setResults] = useState({ vesselsUpdated: 0, companiesDeleted: 0, errors: [] });

  const runCleanup = async () => {
    setLoading(true);
    setStep('updating');
    setResults({ vesselsUpdated: 0, companiesDeleted: 0, errors: [] });

    const errors = [];

    // global publicId -> default-tenant publicId + internal id
    const mapping = [
      { globalPublicId: '550e8400-e29b-41d4-a716-446655660001', targetPublicId: 'ce92a908-5bbc-4d0e-ac01-11ae979663a5', targetId: '697c5ff1b40996a288059cb3', name: 'DNV' },
      { globalPublicId: '550e8400-e29b-41d4-a716-446655660002', targetPublicId: '1f1a34a3-753d-49ee-80df-e24af761c0b6', targetId: '697c5ff1b40996a288059cb2', name: 'ABS' },
      { globalPublicId: '550e8400-e29b-41d4-a716-446655660003', targetPublicId: 'd34909a1-1516-498c-9da8-3032bb70bcec', targetId: '697c5ff1b40996a288059cb1', name: "Lloyd's Register" },
      { globalPublicId: '550e8400-e29b-41d4-a716-446655660004', targetPublicId: 'bab11531-0a95-4e81-9348-2487abfbee96', targetId: '697c5ff1b40996a288059caf', name: 'Bureau Veritas' },
    ];

    const globalPublicIds = mapping.map(m => m.globalPublicId);

    // Step 1: Fetch all vessels and find those pointing to global companies
    const vessels = await base44.entities.Vessel.list('-created_date', 500);
    const vesselsToUpdate = vessels.filter(v =>
      v.classSocietyCompanyPublicId && globalPublicIds.includes(v.classSocietyCompanyPublicId)
    );

    let vesselsUpdated = 0;
    for (const vessel of vesselsToUpdate) {
      const m = mapping.find(x => x.globalPublicId === vessel.classSocietyCompanyPublicId);
      if (m) {
        await base44.entities.Vessel.update(vessel.id, {
          classSocietyCompanyPublicId: m.targetPublicId,
          classSocietyCompanyId: m.targetId,
        });
        vesselsUpdated++;
      }
    }

    setResults(prev => ({ ...prev, vesselsUpdated }));

    // Step 2: Delete the 4 global tenant duplicates
    setStep('deleting');
    const globalCompanyIds = [
      '697c5ff1b40996a288059c95', // ABS global
      '697c5ff1b40996a288059c97', // DNV global
      '697c5ff1b40996a288059c96', // Lloyd's Register global
      '697c5ff1b40996a288059c98', // Bureau Veritas global
    ];

    let companiesDeleted = 0;
    for (const id of globalCompanyIds) {
      try {
        await base44.entities.Company.delete(id);
        companiesDeleted++;
      } catch (err) {
        errors.push(`Failed to delete company ${id}: ${err.message}`);
      }
    }

    setResults({ vesselsUpdated, companiesDeleted, errors });
    setStep('done');
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Cleanup Duplicate Class Society Companies
          </CardTitle>
          <CardDescription>
            Migrates vessel references from minimal global-tenant companies to the complete default-tenant records, then deletes the duplicates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'idle' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium mb-1">What this does:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Updates all vessels whose class society points to the global DNV / ABS / Lloyd's Register / Bureau Veritas records</li>
                      <li>Re-points them to the richer default-tenant counterparts</li>
                      <li>Deletes the 4 minimal global-tenant duplicates</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button onClick={runCleanup} className="w-full">Run Cleanup</Button>
            </div>
          )}

          {(step === 'updating' || step === 'deleting') && (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{step === 'updating' ? 'Updating vessel references…' : 'Deleting duplicate companies…'}</span>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Cleanup complete!</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{results.vesselsUpdated}</div>
                  <div className="text-sm text-gray-600">Vessels Updated</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{results.companiesDeleted}</div>
                  <div className="text-sm text-gray-600">Companies Deleted</div>
                </div>
              </div>
              {results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  <p className="font-medium mb-1">Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {results.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => { setStep('idle'); setResults({ vesselsUpdated: 0, companiesDeleted: 0, errors: [] }); }}>
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}