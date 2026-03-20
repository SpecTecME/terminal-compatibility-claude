/**
 * UDF Configurations List Page (User-Defined Fields Management)
 * 
 * PURPOSE:
 * Configure user-defined fields (UDFs) for modules without schema changes.
 * Enables tenant-specific customization through admin-managed field definitions.
 * 
 * DOMAIN CONTEXT - UDF SYSTEM:
 * 
 * WHY UDFs EXIST:
 * Different organizations need different custom fields:
 * - Company A tracks "Fleet Number" on vessels
 * - Company B tracks "Project Code" on vessels
 * - Company C doesn't need extra fields
 * 
 * TRADITIONAL APPROACH (rejected):
 * Add fleet_number, project_code to Vessel schema.
 * Problem: Database bloat, most tenants don't use most fields.
 * 
 * UDF APPROACH (implemented):
 * Fixed number of "slots" (UDF01, UDF02).
 * Admin configures what each slot means.
 * Each tenant uses slots differently.
 * 
 * THREE-ENTITY SYSTEM:
 * 
 * 1. UdfConfiguration (this page):
 *    - Defines slot metadata (label, behavior)
 *    - Example: UDF01 label="Fleet Number", maxLength=10
 * 
 * 2. UdfListValue (managed in EditUdfConfiguration):
 *    - Dropdown options if createList=true
 *    - Example: Fleet Number values: "FLEET-A", "FLEET-B", "FLEET-C"
 * 
 * 3. Vessel.udf01/udf02 (actual data):
 *    - Stores the actual values
 *    - Example: Specific vessel's udf01 = "FLEET-A"
 * 
 * TABLE COLUMNS EXPLAINED:
 * 
 * MODULE (line 52, 65-69):
 * Which entity type this UDF belongs to.
 * Currently only "Vessel" supported.
 * Future: Terminal, Company, Contact UDFs.
 * 
 * UDF CODE (line 53, 71-74):
 * Slot identifier: UDF01, UDF02.
 * Corresponds to vessel.udf01, vessel.udf02 fields.
 * Fixed codes, preconfigured in database.
 * 
 * LABEL (line 54, 76-81):
 * Display name for the field.
 * 
 * SPECIAL BEHAVIOR:
 * - If label is NULL/empty → Field HIDDEN everywhere
 * - If label is set → Field visible in forms/views
 * 
 * SHOWN AS:
 * - "Fleet Number" (if set)
 * - "Not set (hidden)" in italics (if null)
 * 
 * FIELD TYPE (line 55, 83):
 * Preconfigured, read-only.
 * Currently always "Text".
 * Future: Could add Number, Date, Boolean.
 * 
 * MAX LENGTH (line 56, 84):
 * Preconfigured character limit.
 * UDF01: 10 characters
 * UDF02: 12 characters
 * Read-only, set during seed/initialization.
 * 
 * INCLUDE IN SEARCH (line 57, 85-90):
 * Whether this UDF appears in:
 * - List page search/filter
 * - Global search
 * 
 * CHECK/X ICONS:
 * Green checkmark: Included in search
 * Gray X: Not searchable
 * 
 * CREATE LIST (line 58, 92-97):
 * Determines input type:
 * - TRUE: Dropdown/select (values from UdfListValue)
 * - FALSE: Free-text input
 * 
 * BADGES:
 * - Purple "Dropdown": List-based
 * - Gray "Text": Free-text
 * 
 * PRECONFIGURED RECORDS:
 * UDF configurations created by seed script.
 * Admin doesn't create new UDF slots, only configures existing ones.
 * 
 * EMPTY STATE (lines 113-122):
 * If no configs found, suggests seeding.
 * Links to SeedUdfConfigurations utility page.
 * 
 * SORT ORDER (line 26):
 * Displays UDFs in configured order.
 * UDF01 typically before UDF02.
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, Pencil, Ship, Check, X } from 'lucide-react';
import BackToConfiguration from '../components/configuration/BackToConfiguration';

export default function UdfConfigurations() {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['udfConfigurations'],
    queryFn: () => base44.entities.UdfConfiguration.list()
  });

  const sortedConfigs = [...configs].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackToConfiguration to="ConfigurationSystemConfig" label="Back to System Configuration" />

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UDF Configuration</h1>
          <p className="text-gray-600 mt-1">Configure user-defined fields for modules</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Module</TableHead>
                <TableHead className="text-gray-600">UDF Code</TableHead>
                <TableHead className="text-gray-600">Label</TableHead>
                <TableHead className="text-gray-600">Field Type</TableHead>
                <TableHead className="text-gray-600">Max Length</TableHead>
                <TableHead className="text-gray-600">Include in Search</TableHead>
                <TableHead className="text-gray-600">Create List</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedConfigs.map((config) => (
                <TableRow key={config.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{config.module}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {config.udfCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {config.label ? (
                      <span className="text-gray-900">{config.label}</span>
                    ) : (
                      <span className="text-gray-400 italic">Not set (hidden)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">{config.fieldType}</TableCell>
                  <TableCell className="text-gray-600">{config.maxLength}</TableCell>
                  <TableCell>
                    {config.includeInSearch ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    {config.createList ? (
                      <Badge className="bg-purple-100 text-purple-800">Dropdown</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600">Text</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={createPageUrl(`EditUdfConfiguration?id=${config.id}`)}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {sortedConfigs.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No UDF configurations found</h3>
          <p className="text-gray-600 mb-6">Run the seed page to initialize UDF configurations.</p>
          <Link to={createPageUrl('SeedUdfConfigurations')}>
            <Button>Seed UDF Configurations</Button>
          </Link>
        </div>
      )}
    </div>
  );
}