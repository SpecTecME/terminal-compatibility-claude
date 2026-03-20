/**
 * Vessel Identity View Component (Read-Only Display)
 * 
 * PURPOSE:
 * Displays core vessel identification and registry information in VesselDetail page.
 * Two-column card layout showing identity and ownership/classification.
 * 
 * DISPLAY PATTERN:
 * Read-only view counterpart to EditVessel's identity tab.
 * Shows same data, formatted for display not editing.
 * 
 * LEFT CARD - VESSEL IDENTIFICATION:
 * - Internal ID (tenant's internal tracking code)
 * - IMO Number (7-digit international identifier)
 * - MMSI (9-digit Maritime Mobile Service Identity - AIS transponder)
 * - Vessel Type (Primary Type + Sub-Type from VesselTypeRef)
 * - Call Sign (radio communications identifier)
 * - UDF01 (if configured and visible)
 * 
 * RIGHT CARD - REGISTRY, OWNERSHIP & CLASSIFICATION:
 * - Flag State (country of registration)
 * - Year Built (construction year)
 * - Shipyard (builder name)
 * - Owner (owning company)
 * - Operator (operating company)
 * - Class Society (classification society)
 * - Class Notation (e.g., "+1A LNGC")
 * - UDF02 (if configured and visible)
 * 
 * UDF DYNAMIC DISPLAY (lines 19-20, 37-38, 81-86, 142-147):
 * 
 * User-Defined Fields conditionally shown:
 * - Only if UdfConfiguration exists with non-empty label
 * - getVisibleUdfConfigs filters out hidden fields
 * - UDF01 typically shown in left card (identity)
 * - UDF02 typically shown in right card (ownership)
 * 
 * RATIONALE:
 * Different tenants need different custom fields.
 * Maritime company might want "Fleet Group", energy company wants "Project Code".
 * UDF system provides this flexibility without schema changes.
 * 
 * DATA RESOLUTION PATTERN (lines 27-35):
 * 
 * Helper functions resolve foreign keys:
 * - getCountryName(id) → looks up Country.nameEn
 * - getCompanyName(id) → looks up Company.name
 * 
 * Vessel stores IDs, display needs names.
 * Queries load all Countries and Companies once.
 * O(n) lookup acceptable for small reference lists.
 * 
 * Alternative: Could use joins/includes if Base44 supported.
 * Current approach simple and effective.
 * 
 * VESSEL TYPE DISPLAY (lines 62-76):
 * 
 * VesselTypeRef provides two-level classification:
 * - Primary Type: "LNG Carrier", "Oil Tanker", "Container Ship"
 * - Sub-Type: "Q-Max", "Suezmax", "Neo-Panamax"
 * 
 * Both shown for complete classification context.
 * Lookup uses publicId OR id (migration compatibility).
 * 
 * NULL HANDLING:
 * All fields default to '-' if missing.
 * Prevents empty/undefined rendering issues.
 * Clean presentation even for incomplete data.
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship, Building2, Flag } from 'lucide-react';
import { useUdfConfigurations, getVisibleUdfConfigs } from './VesselUdfFields';

export default function VesselIdentityView({ vessel, countries = [], companies = [] }) {
  const { data: udfConfigs = [] } = useUdfConfigurations('Vessel');
  const visibleUdfConfigs = getVisibleUdfConfigs(udfConfigs);

  const { data: vesselTypeRefs = [] } = useQuery({
    queryKey: ['vesselTypeRefs'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const getCountryName = (id) => {
    const country = countries?.find(c => c.id === id);
    return country?.nameEn || '-';
  };

  const getCompanyName = (id) => {
    const company = companies?.find(c => c.id === id);
    return company?.name || '-';
  };

  const udf01Config = visibleUdfConfigs.find(c => c.udfCode === 'UDF01');
  const udf02Config = visibleUdfConfigs.find(c => c.udfCode === 'UDF02');

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-400" />
            Vessel Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Internal ID</span>
            <span className="text-gray-900 font-medium">{vessel.vesselInternalId || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">IMO Number</span>
            <span className="text-gray-900 font-medium">{vessel.imoNumber || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">MMSI</span>
            <span className="text-gray-900 font-medium">{vessel.mmsi || '-'}</span>
          </div>
          {vessel.vesselTypeRefId && (() => {
            const typeRef = vesselTypeRefs.find(vt => vt.publicId === vessel.vesselTypeRefId || vt.id === vessel.vesselTypeRefId);
            return typeRef ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Type</span>
                  <span className="text-gray-900 font-medium">{typeRef.primaryType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sub-Type</span>
                  <span className="text-gray-900 font-medium">{typeRef.subType || '-'}</span>
                </div>
              </>
            ) : null;
          })()}
          <div className="flex justify-between">
            <span className="text-gray-600">Call Sign</span>
            <span className="text-gray-900 font-medium">{vessel.callSign || '-'}</span>
          </div>
          {udf01Config && (
            <div className="flex justify-between">
              <span className="text-gray-600">{udf01Config.label}</span>
              <span className="text-gray-900 font-medium">{vessel.udf01 || '-'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Registry, Ownership & Classification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Flag State</span>
            <span className="text-gray-900 font-medium">
              {vessel.flagCountryId 
                ? getCountryName(vessel.flagCountryId) 
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Year Built</span>
            <span className="text-gray-900 font-medium">{vessel.yearBuilt || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipyard</span>
            <span className="text-gray-900 font-medium">{vessel.shipyard || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Owner</span>
            <span className="text-gray-900 font-medium">
              {vessel.ownerCompanyId 
                ? getCompanyName(vessel.ownerCompanyId) 
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Operator</span>
            <span className="text-gray-900 font-medium">
              {vessel.operatorCompanyId 
                ? getCompanyName(vessel.operatorCompanyId) 
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Class Society</span>
            <span className="text-gray-900 font-medium">
              {vessel.classSocietyCompanyId 
                ? getCompanyName(vessel.classSocietyCompanyId) 
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Class Notation</span>
            <span className="text-gray-900 font-medium">{vessel.classNotation || '-'}</span>
          </div>
          {udf02Config && (
            <div className="flex justify-between">
              <span className="text-gray-600">{udf02Config.label}</span>
              <span className="text-gray-900 font-medium">{vessel.udf02 || '-'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}