import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ship, CheckCircle, AlertCircle, Loader2, Flag, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MigrateVesselRelationships() {
  const [migrationResult, setMigrationResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const isLoading = vesselsLoading || countriesLoading || companiesLoading;

  const findCountryMatch = (flagText, flagCode) => {
    if (!flagText && !flagCode) return null;
    
    // Try ISO2 code match first
    if (flagCode) {
      const byCode = countries.find(c => 
        c.iso2?.toLowerCase() === flagCode.toLowerCase()
      );
      if (byCode) return byCode;
    }
    
    // Try name match
    if (flagText) {
      const byName = countries.find(c => 
        c.nameEn?.toLowerCase() === flagText.toLowerCase()
      );
      if (byName) return byName;
    }
    
    return null;
  };

  const findCompanyMatch = (companyText) => {
    if (!companyText) return null;
    
    return companies.find(c => 
      c.name?.toLowerCase().trim() === companyText.toLowerCase().trim()
    );
  };

  const runMigration = async () => {
    setIsRunning(true);
    const results = {
      total: 0,
      flagMigrated: 0,
      flagFailed: [],
      ownerMigrated: 0,
      ownerFailed: [],
      operatorMigrated: 0,
      operatorFailed: [],
      skipped: 0
    };

    try {
      for (const vessel of vessels) {
        results.total++;
        let needsUpdate = false;
        const updates = {};

        // Migrate Flag
        if (!vessel.flagCountryId) {
          const flagMatch = findCountryMatch(vessel.flag_state_name, vessel.flag_state_code);
          if (flagMatch) {
            updates.flagCountryId = flagMatch.id;
            updates.flagCountryPublicId = flagMatch.publicId;
            results.flagMigrated++;
            needsUpdate = true;
          } else if (vessel.flag_state_name || vessel.flag_state_code) {
            results.flagFailed.push({
              vesselName: vessel.name,
              legacyFlag: vessel.flag_state_name || vessel.flag_state_code
            });
          }
        }

        // Migrate Owner
        if (!vessel.ownerCompanyId) {
          const ownerMatch = findCompanyMatch(vessel.owner);
          if (ownerMatch) {
            updates.ownerCompanyId = ownerMatch.id;
            updates.ownerCompanyPublicId = ownerMatch.publicId;
            results.ownerMigrated++;
            needsUpdate = true;
          } else if (vessel.owner) {
            results.ownerFailed.push({
              vesselName: vessel.name,
              legacyOwner: vessel.owner
            });
          }
        }

        // Migrate Operator
        if (!vessel.operatorCompanyId) {
          const operatorMatch = findCompanyMatch(vessel.operator);
          if (operatorMatch) {
            updates.operatorCompanyId = operatorMatch.id;
            updates.operatorCompanyPublicId = operatorMatch.publicId;
            results.operatorMigrated++;
            needsUpdate = true;
          } else if (vessel.operator) {
            results.operatorFailed.push({
              vesselName: vessel.name,
              legacyOperator: vessel.operator
            });
          }
        }

        // Update vessel if changes needed
        if (needsUpdate) {
          await base44.entities.Vessel.update(vessel.id, updates);
        } else {
          results.skipped++;
        }
      }

      setMigrationResult(results);
      toast.success('Migration completed');
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const vesselsNeedingMigration = vessels.filter(v => 
    !v.flagCountryId || !v.ownerCompanyId || !v.operatorCompanyId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Vessel Relationships</h1>
        <p className="text-gray-600 mt-1">Populate Flag, Owner, and Operator relationship fields from legacy text values</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Ship className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Vessels</p>
                <p className="text-2xl font-semibold text-gray-900">{vessels.length}</p>
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
                <p className="text-sm text-gray-600">Needs Migration</p>
                <p className="text-2xl font-semibold text-gray-900">{vesselsNeedingMigration.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Companies</p>
                <p className="text-2xl font-semibold text-gray-900">{companies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Migration Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              This migration will populate relationship fields (flagCountryId, ownerCompanyId, operatorCompanyId) 
              from legacy text values by matching against existing Country and Company records.
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Only updates vessels with NULL relationship fields</li>
              <li>Preserves legacy text fields for audit/reference</li>
              <li>Case-insensitive matching on names and codes</li>
              <li>Safe to run multiple times (idempotent)</li>
            </ul>
          </div>

          <Button 
            onClick={runMigration}
            disabled={isRunning || vesselsNeedingMigration.length === 0}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Run Migration ({vesselsNeedingMigration.length} vessels)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {migrationResult && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Migration Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Processed</p>
                <p className="text-2xl font-bold text-blue-900">{migrationResult.total}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-600 font-medium">Flags Migrated</p>
                <p className="text-2xl font-bold text-emerald-900">{migrationResult.flagMigrated}</p>
              </div>
              <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                <p className="text-sm text-violet-600 font-medium">Owners Migrated</p>
                <p className="text-2xl font-bold text-violet-900">{migrationResult.ownerMigrated}</p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-50 border border-cyan-200">
                <p className="text-sm text-cyan-600 font-medium">Operators Migrated</p>
                <p className="text-2xl font-bold text-cyan-900">{migrationResult.operatorMigrated}</p>
              </div>
            </div>

            {migrationResult.flagFailed.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-500" />
                  Flags Not Matched ({migrationResult.flagFailed.length})
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vessel</TableHead>
                        <TableHead>Legacy Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrationResult.flagFailed.slice(0, 10).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.vesselName}</TableCell>
                          <TableCell>{item.legacyFlag}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {migrationResult.flagFailed.length > 10 && (
                    <p className="text-xs text-amber-700 mt-2">...and {migrationResult.flagFailed.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {migrationResult.ownerFailed.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-violet-500" />
                  Owners Not Matched ({migrationResult.ownerFailed.length})
                </h3>
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vessel</TableHead>
                        <TableHead>Legacy Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrationResult.ownerFailed.slice(0, 10).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.vesselName}</TableCell>
                          <TableCell>{item.legacyOwner}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {migrationResult.ownerFailed.length > 10 && (
                    <p className="text-xs text-violet-700 mt-2">...and {migrationResult.ownerFailed.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {migrationResult.operatorFailed.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-500" />
                  Operators Not Matched ({migrationResult.operatorFailed.length})
                </h3>
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vessel</TableHead>
                        <TableHead>Legacy Operator</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrationResult.operatorFailed.slice(0, 10).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.vesselName}</TableCell>
                          <TableCell>{item.legacyOperator}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {migrationResult.operatorFailed.length > 10 && (
                    <p className="text-xs text-cyan-700 mt-2">...and {migrationResult.operatorFailed.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Migration completed successfully. Legacy text fields have been preserved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Vessels Needing Migration</CardTitle>
        </CardHeader>
        <CardContent>
          {vesselsNeedingMigration.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <p>All vessels have relationship fields populated</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Vessel</TableHead>
                  <TableHead className="text-gray-600">Flag Status</TableHead>
                  <TableHead className="text-gray-600">Owner Status</TableHead>
                  <TableHead className="text-gray-600">Operator Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vesselsNeedingMigration.slice(0, 20).map((vessel) => (
                  <TableRow key={vessel.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{vessel.name}</TableCell>
                    <TableCell>
                      {vessel.flagCountryId ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border">
                          Populated
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 border">
                            Needs Migration
                          </Badge>
                          {vessel.flag_state_name && (
                            <span className="text-xs text-gray-600">Legacy: {vessel.flag_state_name}</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {vessel.ownerCompanyId ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border">
                          Populated
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 border">
                            Needs Migration
                          </Badge>
                          {vessel.owner && (
                            <span className="text-xs text-gray-600">Legacy: {vessel.owner}</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {vessel.operatorCompanyId ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border">
                          Populated
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 border">
                            Needs Migration
                          </Badge>
                          {vessel.operator && (
                            <span className="text-xs text-gray-600">Legacy: {vessel.operator}</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {vesselsNeedingMigration.length > 20 && (
            <p className="text-sm text-gray-600 mt-4">
              Showing 20 of {vesselsNeedingMigration.length} vessels needing migration
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}