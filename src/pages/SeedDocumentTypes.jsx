import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedDocumentTypes() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  const getCategoryId = (name) => {
    const cat = categories.find(c => c.name === name);
    return cat ? { id: cat.id, publicId: cat.publicId } : null;
  };

  const documentTypes = [
    // Vessel Design
    { name: 'LNG Carrier General Arrangement (GA)', category: 'Vessel Design', appliesTo: 'Vessel', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Owner or Operator', allowedIssuers: ['Owner or Operator', 'Manufacturer or Shipyard', 'Class Society'] },
    { name: 'Manifold Arrangement Drawing', category: 'Vessel Design', appliesTo: 'Vessel', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Owner or Operator', allowedIssuers: ['Owner or Operator', 'Manufacturer or Shipyard', 'Class Society'] },
    { name: 'Ship or Shore Interface Drawings', category: 'Vessel Design', appliesTo: 'Vessel', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Owner or Operator', allowedIssuers: ['Owner or Operator', 'Manufacturer or Shipyard', 'Terminal'] },
    { name: 'Cargo Tank Insulation Type and Thickness', category: 'Vessel Design', appliesTo: 'Vessel', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Manufacturer or Shipyard', allowedIssuers: ['Manufacturer or Shipyard', 'Class Society'] },
    { name: 'Pump Capacity Curves and Maximum Discharge Rate', category: 'Vessel Design', appliesTo: 'Vessel', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Manufacturer or Shipyard', allowedIssuers: ['Manufacturer or Shipyard', 'Owner or Operator'] },
    { name: 'Bow Thruster or Stern Thruster Details', category: 'Vessel Design', appliesTo: 'Vessel', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Manufacturer or Shipyard', allowedIssuers: ['Manufacturer or Shipyard', 'Owner or Operator'] },
    { name: 'Ship Energy Management or Power Availability (Cold Ironing)', category: 'Energy & Power', appliesTo: 'Vessel', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Owner or Operator', allowedIssuers: ['Owner or Operator', 'Class Society'] },
    
    // Mooring & Berthing
    { name: 'Maximum Allowable Berthing Velocity', category: 'Mooring & Berthing', appliesTo: 'Berth', validityType: 'PermanentStatic', expiryRequired: false, defaultAuthority: 'Terminal', allowedIssuers: ['Terminal', 'Class Society'] },
    
    // Terminal Compatibility
    { name: 'Completed Terminal Compatibility Spreadsheet (Gate or Terminal Template)', category: 'Terminal Compatibility', appliesTo: 'Terminal', validityType: 'TerminalEventDriven', expiryRequired: false, defaultAuthority: 'Terminal', allowedIssuers: ['Terminal', 'Owner or Operator'] },
    { name: 'Optimoor Mooring Study or Equivalent', category: 'Mooring & Berthing', appliesTo: 'Berth', validityType: 'TerminalEventDriven', expiryRequired: false, defaultAuthority: 'Engineering Consultant', allowedIssuers: ['Engineering Consultant', 'Class Society'] },
    { name: 'Gas Form C', category: 'Terminal Compatibility', appliesTo: 'Terminal', validityType: 'TerminalEventDriven', expiryRequired: false, defaultAuthority: 'Terminal', allowedIssuers: ['Terminal', 'Owner or Operator'] },
    { name: 'ESD Link Compatibility Statement', category: 'Terminal Compatibility', appliesTo: 'Berth', validityType: 'TerminalEventDriven', expiryRequired: false, defaultAuthority: 'Terminal', allowedIssuers: ['Terminal', 'Owner or Operator'] },
    
    // Vetting & OCIMF
    { name: 'OCIMF Vessel Particular Questionnaire (VPQ LNG)', category: 'Vetting & OCIMF', appliesTo: 'Vessel', validityType: 'VettingTimeSensitive', expiryRequired: true, validityDuration: 12, validityUnit: 'Months', defaultAuthority: 'OCIMF', allowedIssuers: ['Owner or Operator', 'OCIMF'] },
    { name: 'OCIMF TMSA Report', category: 'Vetting & OCIMF', appliesTo: 'Vessel', validityType: 'VettingTimeSensitive', expiryRequired: true, validityDuration: 12, validityUnit: 'Months', defaultAuthority: 'OCIMF', allowedIssuers: ['Owner or Operator', 'OCIMF'] },
    { name: 'OCIMF SIRE Inspection Report or SIRE 2.0', category: 'Vetting & OCIMF', appliesTo: 'Vessel', validityType: 'VettingTimeSensitive', expiryRequired: true, validityDuration: 6, validityUnit: 'Months', defaultAuthority: 'OCIMF', allowedIssuers: ['OCIMF'] },
    { name: 'Survey Class Status Report', category: 'Class Certification', appliesTo: 'Vessel', validityType: 'VettingTimeSensitive', expiryRequired: true, validityDuration: 30, validityUnit: 'Days', defaultAuthority: 'Class Society', allowedIssuers: ['Class Society'] },
    
    // Flag Certification
    { name: 'Certificate of Registry', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'International Tonnage Certificate', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'Cargo Ship Safety Construction Certificate', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'Cargo Ship Safety Equipment Certificate', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'Cargo Ship Safety Radio Certificate', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'International Load Line Certificate', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'International Oil Pollution Prevention (IOPP) Certificate', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'International Air Pollution Prevention (IAPP) Certificate', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'International Energy Efficiency Certificate (IEEC)', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    { name: 'DOC and SMC (ISM Code)', category: 'Flag Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Flag State', allowedIssuers: ['Flag State', 'Class Society'] },
    
    // Class Certification
    { name: 'Certificate of Class', category: 'Class Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Class Society', allowedIssuers: ['Class Society'] },
    { name: 'Hull and Machinery Certificate', category: 'Class Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Class Society', allowedIssuers: ['Class Society'] },
    { name: 'Cargo Containment System Certificate', category: 'Class Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Class Society', allowedIssuers: ['Class Society'] },
    { name: 'Class Memorandum or Conditions of Class', category: 'Class Certification', appliesTo: 'Vessel', validityType: 'RenewableCertified', expiryRequired: true, validityDuration: 5, validityUnit: 'Years', defaultAuthority: 'Class Society', allowedIssuers: ['Class Society'] }
  ];

  const handleSeed = async () => {
    if (categories.length === 0) {
      toast.error('Please seed DocumentCategory first');
      return;
    }

    setProcessing(true);
    const seedResults = { created: 0, skipped: 0, errors: [] };

    try {
      const existing = await base44.entities.DocumentType.list();
      const existingNames = new Set(existing.map(dt => dt.name));

      for (const docType of documentTypes) {
        if (existingNames.has(docType.name)) {
          seedResults.skipped++;
          continue;
        }

        const categoryRef = getCategoryId(docType.category);
        if (!categoryRef) {
          seedResults.errors.push({ name: docType.name, error: 'Category not found: ' + docType.category });
          continue;
        }

        try {
          await base44.entities.DocumentType.create({
            publicId: generateUUID(),
            tenantId: getCurrentTenantId(),
            name: docType.name,
            categoryId: categoryRef.id,
            categoryPublicId: categoryRef.publicId,
            appliesTo: docType.appliesTo,
            documentValidityType: docType.validityType,
            isExpiryRequired: docType.expiryRequired,
            defaultValidityDuration: docType.validityDuration || null,
            validityUnit: docType.validityUnit || null,
            reminderLeadTime: 30,
            reminderUnit: docType.validityUnit === 'Days' ? 'Days' : 'Months',
            issuingAuthorityDefault: docType.defaultAuthority,
            allowedIssuers: docType.allowedIssuers,
            isActive: true,
            sortOrder: seedResults.created + 1
          });
          seedResults.created++;
        } catch (error) {
          seedResults.errors.push({ name: docType.name, error: error.message });
        }
      }

      setResults(seedResults);
      toast.success(`Created ${seedResults.created} document types`);
    } catch (error) {
      toast.error('Seeding failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Document Types</h1>
        <p className="text-gray-600 mt-1">Create 30 standard LNG document types</p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This will create 30 standard document types. DocumentCategory must be seeded first.
        </AlertDescription>
      </Alert>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Document Types to Create: {documentTypes.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-gray-600">
            <p>Categories loaded: {categories.length}</p>
          </div>

          <Button
            onClick={handleSeed}
            disabled={processing || categories.length === 0}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Document Types'
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