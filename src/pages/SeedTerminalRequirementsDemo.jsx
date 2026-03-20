import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedTerminalRequirementsDemo() {
  const [seeding, setSeeding] = useState(false);
  const [logs, setLogs] = useState([]);

  const log = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const seedData = async () => {
    setSeeding(true);
    setLogs([]);

    try {
      const tenantId = 'default-tenant';

      // 1. Ensure Document Categories
      log('Checking Document Categories...');
      const existingCategories = await base44.entities.DocumentCategory.list();
      const categoryMap = {};

      const categories = [
        { code: 'VESSEL_CERTIFICATES', name: 'Vessel Certificates', sortOrder: 1 },
        { code: 'SAFETY_SECURITY', name: 'Safety & Security', sortOrder: 2 },
        { code: 'CREW_COMPLIANCE', name: 'Crew & Compliance', sortOrder: 3 },
        { code: 'COMMERCIAL_INSURANCE', name: 'Commercial / Insurance', sortOrder: 4 },
        { code: 'TERMINAL_PORT_FORMS', name: 'Terminal / Port Forms', sortOrder: 5 }
      ];

      for (const cat of categories) {
        let category = existingCategories.find(c => c.code === cat.code);
        if (!category) {
          category = await base44.entities.DocumentCategory.create({
            publicId: crypto.randomUUID(),
            tenantId,
            ...cat,
            isActive: true
          });
          log(`Created category: ${cat.name}`, 'success');
        } else {
          log(`Category exists: ${cat.name}`, 'info');
        }
        categoryMap[cat.code] = category.id;
      }

      // 2. Ensure Document Types
      log('Checking Document Types...');
      const existingDocTypes = await base44.entities.DocumentType.list();

      const docTypes = [
        // Vessel Certificates
        { code: 'CERT_REGISTRY', name: 'Certificate of Registry', categoryCode: 'VESSEL_CERTIFICATES', validityType: 'Permanent', requiresExpiry: false },
        { code: 'INT_TONNAGE_CERT', name: 'International Tonnage Certificate', categoryCode: 'VESSEL_CERTIFICATES', validityType: 'Permanent', requiresExpiry: false },
        { code: 'CLASS_CERT', name: 'Class Certificate', categoryCode: 'VESSEL_CERTIFICATES', validityType: 'Expiring', requiresExpiry: true },
        { code: 'CARGO_SAFETY_CONST', name: 'Cargo Ship Safety Construction Certificate', categoryCode: 'VESSEL_CERTIFICATES', validityType: 'Expiring', requiresExpiry: true },
        { code: 'CARGO_SAFETY_EQUIP', name: 'Cargo Ship Safety Equipment Certificate', categoryCode: 'VESSEL_CERTIFICATES', validityType: 'Expiring', requiresExpiry: true },
        { code: 'CARGO_SAFETY_RADIO', name: 'Cargo Ship Safety Radio Certificate', categoryCode: 'VESSEL_CERTIFICATES', validityType: 'Expiring', requiresExpiry: true },
        { code: 'INT_LOAD_LINE', name: 'International Load Line Certificate', categoryCode: 'VESSEL_CERTIFICATES', validityType: 'Expiring', requiresExpiry: true },
        
        // Safety & Security
        { code: 'ISSC', name: 'ISSC, International Ship Security Certificate', categoryCode: 'SAFETY_SECURITY', validityType: 'Expiring', requiresExpiry: true },
        { code: 'SHIP_SEC_PLAN', name: 'Ship Security Plan Approval Letter', categoryCode: 'SAFETY_SECURITY', validityType: 'Permanent', requiresExpiry: false },
        { code: 'DOC', name: 'DOC, Document of Compliance', categoryCode: 'SAFETY_SECURITY', validityType: 'Expiring', requiresExpiry: true },
        { code: 'SMC', name: 'SMC, Safety Management Certificate', categoryCode: 'SAFETY_SECURITY', validityType: 'Expiring', requiresExpiry: true },
        
        // Crew & Compliance
        { code: 'CREW_LIST', name: 'Crew List', categoryCode: 'CREW_COMPLIANCE', validityType: 'Per-Visit', requiresExpiry: false },
        
        // Commercial / Insurance
        { code: 'PI_CERT', name: 'P&I Club Entry Certificate / Letter', categoryCode: 'COMMERCIAL_INSURANCE', validityType: 'Expiring', requiresExpiry: true },
        { code: 'HULL_MACHINERY_INS', name: 'Hull & Machinery Insurance Certificate', categoryCode: 'COMMERCIAL_INSURANCE', validityType: 'Expiring', requiresExpiry: true },
        
        // Terminal Forms
        { code: 'TERMINAL_QUESTIONNAIRE', name: 'Terminal Questionnaire / Pre-Arrival Information Form', categoryCode: 'TERMINAL_PORT_FORMS', validityType: 'Per-Visit', requiresExpiry: false },
        { code: 'SHIP_SHORE_CHECKLIST', name: 'Ship/Shore Safety Checklist', categoryCode: 'TERMINAL_PORT_FORMS', validityType: 'Per-Visit', requiresExpiry: false }
      ];

      const docTypeMap = {};
      const docTypePublicIdMap = {};
      for (const docType of docTypes) {
        let dt = existingDocTypes.find(d => d.code === docType.code);
        if (!dt) {
          dt = await base44.entities.DocumentType.create({
            publicId: crypto.randomUUID(),
            tenantId,
            code: docType.code,
            name: docType.name,
            categoryId: categoryMap[docType.categoryCode],
            categoryPublicId: null,
            validityType: docType.validityType,
            requiresExpiry: docType.requiresExpiry,
            isActive: true,
            sortOrder: 0
          });
          log(`Created document type: ${docType.name}`, 'success');
        } else {
          log(`Document type exists: ${docType.name}`, 'info');
        }
        docTypeMap[docType.code] = dt.id;
        docTypePublicIdMap[docType.code] = dt.publicId;
      }

      // 3. Get terminals
      log('Finding terminals...');
      const terminals = await base44.entities.Terminal.list();
      const rasLaffan = terminals.find(t => t.name?.includes('Ras Laffan') || t.name?.includes('Ras Laffan'));
      const southHook = terminals.find(t => t.name?.includes('South Hook'));

      if (!rasLaffan || !southHook) {
        throw new Error('Required terminals not found. Please ensure Ras Laffan and South Hook terminals exist.');
      }

      log(`Found Ras Laffan: ${rasLaffan.name}`, 'success');
      log(`Found South Hook: ${southHook.name}`, 'success');

      // 4. Create Terminal Requirements
      log('Creating Terminal Requirements...');
      const existingRequirements = await base44.entities.TerminalDocumentRequirement.list();

      const validFrom = '2026-01-01';

      // Ras Laffan Requirements
      const rasLaffanReqs = [
        // Registration
        { docCode: 'CERT_REGISTRY', stage: 'Registration', isMandatory: true },
        { docCode: 'INT_TONNAGE_CERT', stage: 'Registration', isMandatory: true },
        { docCode: 'SHIP_SEC_PLAN', stage: 'Registration', isMandatory: true },
        // Renewal
        { docCode: 'CLASS_CERT', stage: 'Renewal', isMandatory: true },
        { docCode: 'ISSC', stage: 'Renewal', isMandatory: true },
        { docCode: 'DOC', stage: 'Renewal', isMandatory: true },
        { docCode: 'SMC', stage: 'Renewal', isMandatory: true },
        { docCode: 'CARGO_SAFETY_CONST', stage: 'Renewal', isMandatory: true },
        { docCode: 'CARGO_SAFETY_EQUIP', stage: 'Renewal', isMandatory: true },
        { docCode: 'CARGO_SAFETY_RADIO', stage: 'Renewal', isMandatory: true },
        { docCode: 'INT_LOAD_LINE', stage: 'Renewal', isMandatory: true },
        { docCode: 'PI_CERT', stage: 'Renewal', isMandatory: true },
        { docCode: 'HULL_MACHINERY_INS', stage: 'Renewal', isMandatory: true },
        // Per-Visit
        { docCode: 'TERMINAL_QUESTIONNAIRE', stage: 'PreVisit', isMandatory: true },
        { docCode: 'SHIP_SHORE_CHECKLIST', stage: 'PreVisit', isMandatory: true },
        { docCode: 'CREW_LIST', stage: 'PreVisit', isMandatory: true }
      ];

      // South Hook Requirements
      const southHookReqs = [
        // Registration
        { docCode: 'CERT_REGISTRY', stage: 'Registration', isMandatory: true },
        { docCode: 'INT_TONNAGE_CERT', stage: 'Registration', isMandatory: true },
        // Renewal
        { docCode: 'CLASS_CERT', stage: 'Renewal', isMandatory: true },
        { docCode: 'ISSC', stage: 'Renewal', isMandatory: true },
        { docCode: 'DOC', stage: 'Renewal', isMandatory: true },
        { docCode: 'SMC', stage: 'Renewal', isMandatory: true },
        { docCode: 'CARGO_SAFETY_EQUIP', stage: 'Renewal', isMandatory: true },
        { docCode: 'CARGO_SAFETY_RADIO', stage: 'Renewal', isMandatory: true },
        { docCode: 'INT_LOAD_LINE', stage: 'Renewal', isMandatory: true },
        { docCode: 'PI_CERT', stage: 'Renewal', isMandatory: true },
        // Per-Visit
        { docCode: 'TERMINAL_QUESTIONNAIRE', stage: 'PreVisit', isMandatory: true },
        { docCode: 'SHIP_SHORE_CHECKLIST', stage: 'PreVisit', isMandatory: true },
        { docCode: 'CREW_LIST', stage: 'PreVisit', isMandatory: true }
      ];

      for (const req of rasLaffanReqs) {
        const exists = existingRequirements.find(r => 
          r.terminalId === rasLaffan.id && 
          r.documentTypeId === docTypeMap[req.docCode] &&
          r.submissionStage === req.stage
        );
        if (!exists) {
          await base44.entities.TerminalDocumentRequirement.create({
            publicId: crypto.randomUUID(),
            tenantId,
            terminalId: rasLaffan.id,
            terminalPublicId: rasLaffan.publicId,
            berthId: null,
            berthPublicId: null,
            documentTypeId: docTypeMap[req.docCode],
            documentTypePublicId: docTypePublicIdMap[req.docCode],
            appliesLevel: 'Terminal',
            submissionStage: req.stage,
            isRequired: true,
            effectiveFrom: validFrom,
            validTo: null,
            isActive: true,
            isMandatory: req.isMandatory,
            priority: 0,
            notes: null,
            vesselConditionJson: null
          });
          log(`Created Ras Laffan requirement: ${req.docCode} (${req.stage})`, 'success');
        }
      }

      for (const req of southHookReqs) {
        const exists = existingRequirements.find(r => 
          r.terminalId === southHook.id && 
          r.documentTypeId === docTypeMap[req.docCode] &&
          r.submissionStage === req.stage
        );
        if (!exists) {
          await base44.entities.TerminalDocumentRequirement.create({
            publicId: crypto.randomUUID(),
            tenantId,
            terminalId: southHook.id,
            terminalPublicId: southHook.publicId,
            berthId: null,
            berthPublicId: null,
            documentTypeId: docTypeMap[req.docCode],
            documentTypePublicId: docTypePublicIdMap[req.docCode],
            appliesLevel: 'Terminal',
            submissionStage: req.stage,
            isRequired: true,
            effectiveFrom: validFrom,
            validTo: null,
            isActive: true,
            isMandatory: req.isMandatory,
            priority: 0,
            notes: null,
            vesselConditionJson: null
          });
          log(`Created South Hook requirement: ${req.docCode} (${req.stage})`, 'success');
        }
      }

      // 5. Create demo vessels
      log('Creating demo vessels...');
      const vessels = await base44.entities.Vessel.list();
      
      const vesselData = [
        { name: 'LNG Pioneer', imoNumber: '9876543', vesselType: 'LNG Carrier' },
        { name: 'Arctic Spirit', imoNumber: '9654321', vesselType: 'LNG Carrier' }
      ];

      const createdVessels = [];
      for (const vData of vesselData) {
        let vessel = vessels.find(v => v.imoNumber === vData.imoNumber || v.imo_number === vData.imoNumber);
        if (!vessel) {
          vessel = await base44.entities.Vessel.create({
            publicId: crypto.randomUUID(),
            tenantId,
            vesselInternalId: `VSL-${vData.imoNumber}`,
            name: vData.name,
            imoNumber: vData.imoNumber,
            imo_number: vData.imoNumber,
            vesselType: vData.vesselType,
            vessel_type: vData.vesselType,
            status: 'Active',
            isActive: true
          });
          log(`Created vessel: ${vData.name} (IMO: ${vData.imoNumber})`, 'success');
        } else {
          log(`Vessel exists: ${vData.name}`, 'info');
        }
        createdVessels.push(vessel);
      }

      // 6. Create vessel documents
      log('Creating vessel documents...');
      const existingDocs = await base44.entities.Document.list();

      for (const vessel of createdVessels) {
        // Permanent documents
        const permanentDocs = ['CERT_REGISTRY', 'INT_TONNAGE_CERT', 'SHIP_SEC_PLAN'];
        for (const docCode of permanentDocs) {
          const exists = existingDocs.find(d => 
            d.vessel_id === vessel.id && 
            d.documentTypeId === docTypeMap[docCode]
          );
          if (!exists) {
            await base44.entities.Document.create({
              publicId: crypto.randomUUID(),
              tenantId,
              vessel_id: vessel.id,
              vesselPublicId: vessel.publicId,
              documentTypeId: docTypeMap[docCode],
              documentTypePublicId: null,
              document_name: docTypes.find(dt => dt.code === docCode).name,
              issue_date: '2020-01-15',
              expiry_date: null,
              reference_number: `${docCode}-${vessel.imoNumber}`,
              file_url: null,
              status: 'Valid',
              isActive: true,
              notes: 'Demo document'
            });
          }
        }

        // Expiring documents (certificates)
        const expiringDocs = ['CLASS_CERT', 'ISSC', 'DOC', 'SMC', 'CARGO_SAFETY_CONST', 'CARGO_SAFETY_EQUIP', 'CARGO_SAFETY_RADIO', 'INT_LOAD_LINE'];
        for (const docCode of expiringDocs) {
          const exists = existingDocs.find(d => 
            d.vessel_id === vessel.id && 
            d.documentTypeId === docTypeMap[docCode]
          );
          if (!exists) {
            await base44.entities.Document.create({
              publicId: crypto.randomUUID(),
              tenantId,
              vessel_id: vessel.id,
              vesselPublicId: vessel.publicId,
              documentTypeId: docTypeMap[docCode],
              documentTypePublicId: null,
              document_name: docTypes.find(dt => dt.code === docCode).name,
              issue_date: '2025-01-01',
              expiry_date: '2027-06-30',
              reference_number: `${docCode}-${vessel.imoNumber}`,
              file_url: null,
              status: 'Valid',
              isActive: true,
              notes: 'Demo document'
            });
          }
        }

        // Insurance documents (shorter expiry)
        const insuranceDocs = ['PI_CERT', 'HULL_MACHINERY_INS'];
        for (const docCode of insuranceDocs) {
          const exists = existingDocs.find(d => 
            d.vessel_id === vessel.id && 
            d.documentTypeId === docTypeMap[docCode]
          );
          if (!exists) {
            await base44.entities.Document.create({
              publicId: crypto.randomUUID(),
              tenantId,
              vessel_id: vessel.id,
              vesselPublicId: vessel.publicId,
              documentTypeId: docTypeMap[docCode],
              documentTypePublicId: null,
              document_name: docTypes.find(dt => dt.code === docCode).name,
              issue_date: '2026-01-01',
              expiry_date: '2026-12-31',
              reference_number: `${docCode}-${vessel.imoNumber}`,
              file_url: null,
              status: 'Valid',
              isActive: true,
              notes: 'Demo document'
            });
          }
        }

        // Per-visit documents
        const perVisitDocs = ['TERMINAL_QUESTIONNAIRE', 'SHIP_SHORE_CHECKLIST', 'CREW_LIST'];
        for (const docCode of perVisitDocs) {
          const exists = existingDocs.find(d => 
            d.vessel_id === vessel.id && 
            d.documentTypeId === docTypeMap[docCode]
          );
          if (!exists) {
            await base44.entities.Document.create({
              publicId: crypto.randomUUID(),
              tenantId,
              vessel_id: vessel.id,
              vesselPublicId: vessel.publicId,
              documentTypeId: docTypeMap[docCode],
              documentTypePublicId: null,
              document_name: docTypes.find(dt => dt.code === docCode).name,
              issue_date: '2026-01-09',
              expiry_date: null,
              reference_number: `${docCode}-${vessel.imoNumber}-20260109`,
              file_url: null,
              status: 'Valid',
              isActive: true,
              notes: 'Demo per-visit document'
            });
          }
        }

        log(`Created documents for vessel: ${vessel.name}`, 'success');
      }

      log('=== Seeding completed successfully! ===', 'success');
      toast.success('Terminal requirements demo data seeded successfully');

    } catch (error) {
      log(`ERROR: ${error.message}`, 'error');
      toast.error('Failed to seed data: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Terminal Requirements Demo Data</h1>
        <p className="text-gray-600 mt-1">
          Creates document categories, types, terminal requirements for Ras Laffan and South Hook,
          and two demo vessels with compliant documents
        </p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Seeding Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={seedData} 
            disabled={seeding}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Start Seeding'
            )}
          </Button>

          {logs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-500 text-xs">{log.time}</span>
                  {log.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                  {log.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  {log.type === 'info' && <span className="w-4 h-4 flex-shrink-0" />}
                  <span className={log.type === 'error' ? 'text-red-600' : 'text-gray-700'}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}