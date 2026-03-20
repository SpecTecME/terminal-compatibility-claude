import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedAdditionalDocumentTypes() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: existingTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  const getCategoryId = (categoryName) => {
    const cat = categories.find(c => c.name === categoryName);
    return cat?.id;
  };

  const documentTypesData = [
    // SECURITY & ISPS
    {
      name: 'International Ship Security Certificate (ISSC)',
      code: 'ISSC',
      category: 'Flag Certification',
      appliesTo: 'Vessel',
      documentValidityType: 'RenewableCertified',
      defaultValidityDuration: 5,
      validityUnit: 'Years',
      isExpiryRequired: true,
      issuingAuthorityDefault: 'Flag State'
    },
    {
      name: 'Ship Security Plan Approval Letter',
      code: 'SSP_APPROVAL',
      category: 'Flag Certification',
      appliesTo: 'Vessel',
      documentValidityType: 'RenewableCertified',
      defaultValidityDuration: 5,
      validityUnit: 'Years',
      isExpiryRequired: true,
      issuingAuthorityDefault: 'Flag State'
    },
    // INSURANCE / LIABILITY
    {
      name: 'P&I Certificate of Entry',
      code: 'PI_COE',
      category: 'Insurance & Liability',
      appliesTo: 'Vessel',
      documentValidityType: 'VettingTimeSensitive',
      defaultValidityDuration: 12,
      validityUnit: 'Months',
      isExpiryRequired: true,
      issuingAuthorityDefault: 'Owner or Operator'
    },
    {
      name: 'Bunker Convention Certificate',
      code: 'BUNKER_CONV',
      category: 'Insurance & Liability',
      appliesTo: 'Vessel',
      documentValidityType: 'RenewableCertified',
      defaultValidityDuration: 5,
      validityUnit: 'Years',
      isExpiryRequired: true,
      issuingAuthorityDefault: 'Flag State'
    },
    // LNG TECHNICAL COMPATIBILITY
    {
      name: 'LNG Manifold Data Sheet',
      code: 'LNG_MANIFOLD',
      category: 'Vessel Design',
      appliesTo: 'Vessel',
      documentValidityType: 'PermanentStatic',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Manufacturer or Shipyard'
    },
    {
      name: 'Vapour Return Compatibility Statement',
      code: 'VR_COMPAT',
      category: 'Terminal Compatibility',
      appliesTo: 'Berth',
      documentValidityType: 'TerminalEventDriven',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Terminal'
    },
    {
      name: 'Emergency Release System (ERS) Compatibility Statement',
      code: 'ERS_COMPAT',
      category: 'Terminal Compatibility',
      appliesTo: 'Berth',
      documentValidityType: 'TerminalEventDriven',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Terminal'
    },
    // NAUTICAL / PILOTAGE
    {
      name: 'Mooring Arrangement Plan',
      code: 'MOORING_PLAN',
      category: 'Mooring & Berthing',
      appliesTo: 'Vessel',
      documentValidityType: 'PermanentStatic',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Manufacturer or Shipyard'
    },
    {
      name: 'Pilot Card / Wheelhouse Poster',
      code: 'PILOT_CARD',
      category: 'Nautical & Pilotage',
      appliesTo: 'Vessel',
      documentValidityType: 'PermanentStatic',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Owner or Operator'
    },
    // OPERATIONAL / PER VISIT
    {
      name: 'Pre-Arrival Information Form',
      code: 'PRE_ARRIVAL',
      category: 'Pre-Arrival & Operations',
      appliesTo: 'Terminal',
      documentValidityType: 'TerminalEventDriven',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Owner or Operator'
    },
    {
      name: 'Crew List',
      code: 'CREW_LIST',
      category: 'Pre-Arrival & Operations',
      appliesTo: 'Terminal',
      documentValidityType: 'TerminalEventDriven',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Owner or Operator'
    },
    {
      name: 'Last 10 Ports of Call',
      code: 'PORTS_CALL',
      category: 'Pre-Arrival & Operations',
      appliesTo: 'Terminal',
      documentValidityType: 'TerminalEventDriven',
      isExpiryRequired: false,
      issuingAuthorityDefault: 'Owner or Operator'
    }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };

      for (const docType of documentTypesData) {
        try {
          const exists = existingTypes.find(dt => dt.code === docType.code || dt.name === docType.name);
          if (exists) {
            results.skipped.push(docType.name);
            continue;
          }

          const categoryId = getCategoryId(docType.category);
          const category = categories.find(c => c.id === categoryId);

          await base44.entities.DocumentType.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            name: docType.name,
            code: docType.code,
            categoryId: categoryId,
            categoryPublicId: category?.publicId,
            appliesTo: docType.appliesTo,
            documentValidityType: docType.documentValidityType,
            isExpiryRequired: docType.isExpiryRequired,
            defaultValidityDuration: docType.defaultValidityDuration,
            validityUnit: docType.validityUnit,
            issuingAuthorityDefault: docType.issuingAuthorityDefault,
            isActive: true
          });

          results.success.push(docType.name);
        } catch (error) {
          results.errors.push({ name: docType.name, error: error.message });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} document types`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} document types`);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Additional Document Types</h1>
        <p className="text-sm text-gray-600 mt-1">Add LNG terminal document types</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Document Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create the following document types:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Security & ISPS: ISSC, Ship Security Plan</li>
              <li>Insurance: P&I Certificate, Bunker Convention</li>
              <li>LNG Technical: Manifold Data, Vapour Return, ERS Compatibility</li>
              <li>Nautical: Mooring Plan, Pilot Card</li>
              <li>Operational: Pre-Arrival Form, Crew List, Ports of Call</li>
            </ul>
          </div>

          {categories.length === 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Please seed Document Categories first before running this seed.
              </p>
            </div>
          )}

          {existingTypes.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {existingTypes.length} document type(s) already exist. Only missing types will be created.
              </p>
            </div>
          )}

          {seedResults && (
            <div className="space-y-3">
              {seedResults.success.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Successfully created:</span>
                  </div>
                  <p className="text-sm text-emerald-800">{seedResults.success.join(', ')}</p>
                </div>
              )}
              {seedResults.skipped.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Skipped:</span>
                  </div>
                  <p className="text-sm text-gray-700">{seedResults.skipped.join(', ')}</p>
                </div>
              )}
              {seedResults.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Errors:</span>
                  </div>
                  <div className="text-sm text-red-800 space-y-1">
                    {seedResults.errors.map((err, idx) => (
                      <div key={idx}>{err.name}: {err.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending || categories.length === 0}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Document Types'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}