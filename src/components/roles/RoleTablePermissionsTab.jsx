import React, { useRef, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import RoleFieldPermissionsRow from './RoleFieldPermissionsRow';

const ENTITY_LABELS = {
  'Vessel': 'Vessel',
  'Terminal': 'Terminal',
  'Berth': 'Berth',
  'Document': 'Document',
  'DocumentType': 'Document Type',
  'DocumentCategory': 'Document Category',
  'Company': 'Company',
  'Contact': 'Contact',
  'Country': 'Country',
  'IssuingAuthority': 'Issuing Authority',
  'TerminalDocumentRequirement': 'Terminal Document Requirement',
  'TerminalRegistrationApplication': 'Terminal Registration Application',
  'TerminalRegistrationChecklistItem': 'Registration Checklist Item',
  'VesselCompatibility': 'Vessel Compatibility',
  'VesselTerminalDocumentSet': 'Vessel Terminal Document Set',
  'VesselTerminalDocumentSetItem': 'Document Set Item',
  'ApplicationUser': 'Application User',
  'ApplicationRole': 'Application Role',
  'ApplicationUserRole': 'User Role Assignment',
  'WorkflowDefinition': 'Workflow Definition',
  'WorkflowStatus': 'Workflow Status',
  'WorkflowAction': 'Workflow Action',
  'WorkflowTransition': 'Workflow Transition',
  'CompanyIdentityProvider': 'Identity Provider',
  'CompanyGroupRoleMapping': 'Group Role Mapping',
  'CompanySecurityPolicy': 'Security Policy',
  'SystemAuditLog': 'Audit Log',
  'ApplicationFunction': 'Application Function',
};

const ALL_ENTITIES = Object.keys(ENTITY_LABELS);

export default function RoleTablePermissionsTab({ roleId }) {
  const qc = useQueryClient();
  const [expandedEntities, setExpandedEntities] = useState(new Set());

  const { data: perms = [] } = useQuery({
    queryKey: ['roleTablePermissions', roleId],
    queryFn: () => base44.entities.RoleTablePermission.filter({ application_role_id: roleId })
  });

  const saveMut = useMutation({
    mutationFn: async ({ tableName, field, value }) => {
      const existing = perms.find(p => p.table_name === tableName);
      if (existing) return base44.entities.RoleTablePermission.update(existing.id, { ...existing, [field]: value });
      return base44.entities.RoleTablePermission.create({
        application_role_id: roleId, table_name: tableName,
        can_read: field === 'can_read' ? value : false,
        can_insert: field === 'can_insert' ? value : false,
        can_update: field === 'can_update' ? value : false,
        can_delete: field === 'can_delete' ? value : false
      });
    },
    onSuccess: () => qc.invalidateQueries(['roleTablePermissions', roleId])
  });

  const bulkMut = useMutation({
    mutationFn: async ({ field, value }) => {
      return Promise.all(ALL_ENTITIES.map(tableName => {
        const existing = perms.find(p => p.table_name === tableName);
        if (existing) {
          return base44.entities.RoleTablePermission.update(existing.id, { ...existing, [field]: value });
        }
        if (!value) return Promise.resolve();
        return base44.entities.RoleTablePermission.create({
          application_role_id: roleId, table_name: tableName,
          can_read: field === 'can_read' ? true : false,
          can_insert: field === 'can_insert' ? true : false,
          can_update: field === 'can_update' ? true : false,
          can_delete: field === 'can_delete' ? true : false
        });
      }));
    },
    onSuccess: () => qc.invalidateQueries(['roleTablePermissions', roleId])
  });

  const getPerm = (tableName, field) => {
    const p = perms.find(p => p.table_name === tableName);
    return p ? p[field] : false;
  };

  const isAllSelected = (field) => ALL_ENTITIES.every(t => getPerm(t, field));
  const isIndeterminate = (field) => !isAllSelected(field) && ALL_ENTITIES.some(t => getPerm(t, field));

  const toggleExpand = (tableName) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) next.delete(tableName);
      else next.add(tableName);
      return next;
    });
  };

  const Checkbox = ({ tableName, field }) => (
    <input type="checkbox"
      checked={getPerm(tableName, field)}
      onChange={e => saveMut.mutate({ tableName, field, value: e.target.checked })}
      className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
  );

  const HeaderCheckbox = ({ field }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current) ref.current.indeterminate = isIndeterminate(field);
    }, [field, perms]);
    return (
      <input type="checkbox" ref={ref}
        checked={isAllSelected(field)}
        onChange={e => bulkMut.mutate({ field, value: e.target.checked })}
        className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
    );
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-gray-900">Table / Entity Access Rights</CardTitle>
        <p className="text-sm text-gray-500">
          Define what this role can do with each data entity. Use the header checkboxes to select/deselect all.
          Click the <span className="font-semibold text-slate-600">▶</span> icon to expand field-level permissions for an entity.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 bg-gray-50">
              <TableHead className="text-gray-600 font-semibold">Entity</TableHead>
              <TableHead className="text-gray-600 text-center font-semibold">
                <div className="flex flex-col items-center gap-1">
                  <span>Read</span>
                  <HeaderCheckbox field="can_read" />
                </div>
              </TableHead>
              <TableHead className="text-gray-600 text-center font-semibold">
                <div className="flex flex-col items-center gap-1">
                  <span>Insert</span>
                  <HeaderCheckbox field="can_insert" />
                </div>
              </TableHead>
              <TableHead className="text-gray-600 text-center font-semibold">
                <div className="flex flex-col items-center gap-1">
                  <span>Update</span>
                  <HeaderCheckbox field="can_update" />
                </div>
              </TableHead>
              <TableHead className="text-gray-600 text-center font-semibold">
                <div className="flex flex-col items-center gap-1">
                  <span>Delete / Archive</span>
                  <HeaderCheckbox field="can_delete" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALL_ENTITIES.map(tableName => {
              const isExpanded = expandedEntities.has(tableName);
              return (
                <React.Fragment key={tableName}>
                  <TableRow className="border-gray-200 hover:bg-gray-50/50">
                    <TableCell className="text-sm text-gray-800 font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost" size="icon"
                          className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => toggleExpand(tableName)}
                          title="Expand field-level permissions"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5" />
                            : <ChevronRight className="w-3.5 h-3.5" />
                          }
                        </Button>
                        {ENTITY_LABELS[tableName]}
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Checkbox tableName={tableName} field="can_read" /></TableCell>
                    <TableCell className="text-center"><Checkbox tableName={tableName} field="can_insert" /></TableCell>
                    <TableCell className="text-center"><Checkbox tableName={tableName} field="can_update" /></TableCell>
                    <TableCell className="text-center"><Checkbox tableName={tableName} field="can_delete" /></TableCell>
                  </TableRow>
                  {isExpanded && (
                    <RoleFieldPermissionsRow roleId={roleId} tableName={tableName} />
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}