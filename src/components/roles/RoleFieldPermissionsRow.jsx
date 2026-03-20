import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableRow, TableCell } from '@/components/ui/table';
import { ENTITY_FIELD_SCHEMAS } from './entityFieldSchemas';

/**
 * Expandable field-level permissions for a given entity/table within a role.
 * Shown as sub-rows beneath the entity row in RoleTablePermissionsTab.
 * 
 * Permission model:
 *  - No record stored = full access (inherit from table-level grant)
 *  - Record stored = explicit override (can restrict read or update)
 */
export default function RoleFieldPermissionsRow({ roleId, tableName }) {
  const qc = useQueryClient();
  const fields = ENTITY_FIELD_SCHEMAS[tableName] || [];

  const { data: fieldPerms = [] } = useQuery({
    queryKey: ['roleFieldPermissions', roleId, tableName],
    queryFn: () => base44.entities.RoleFieldPermission.filter({ application_role_id: roleId, table_name: tableName }),
    enabled: !!roleId && !!tableName
  });

  const saveMut = useMutation({
    mutationFn: async ({ fieldName, permission, value }) => {
      const existing = fieldPerms.find(p => p.field_name === fieldName);
      if (existing) {
        return base44.entities.RoleFieldPermission.update(existing.id, { ...existing, [permission]: value });
      }
      // Create with both permissions defaulting to true (full access), then override the one changed
      return base44.entities.RoleFieldPermission.create({
        application_role_id: roleId,
        table_name: tableName,
        field_name: fieldName,
        can_read: permission === 'can_read' ? value : true,
        can_update: permission === 'can_update' ? value : true,
      });
    },
    onSuccess: () => qc.invalidateQueries(['roleFieldPermissions', roleId, tableName])
  });

  const getPerm = (fieldName, permission) => {
    const p = fieldPerms.find(p => p.field_name === fieldName);
    if (!p) return true; // No record = full access (inherits table grant)
    return p[permission];
  };

  if (fields.length === 0) {
    return (
      <TableRow className="bg-amber-50/50">
        <TableCell colSpan={5} className="py-2 pl-10 text-xs text-gray-400 italic">
          No field definitions available for this entity.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow className="bg-slate-50 border-b border-slate-200">
        <TableCell colSpan={5} className="py-1 pl-8 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100">
          Field-level overrides for {tableName} &nbsp;
          <span className="font-normal normal-case text-slate-400">(unchecked = field restricted for this role)</span>
        </TableCell>
      </TableRow>
      {fields.map(({ field, label }) => (
        <TableRow key={field} className="bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100">
          <TableCell className="py-1.5 pl-12 text-xs text-slate-600">
            <span className="font-medium">{label}</span>
            <span className="ml-2 text-slate-400 font-mono">{field}</span>
          </TableCell>
          <TableCell className="text-center py-1.5">
            <input
              type="checkbox"
              checked={getPerm(field, 'can_read')}
              onChange={e => saveMut.mutate({ fieldName: field, permission: 'can_read', value: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            />
          </TableCell>
          <TableCell className="text-center py-1.5 text-slate-300 text-xs">—</TableCell>
          <TableCell className="text-center py-1.5">
            <input
              type="checkbox"
              checked={getPerm(field, 'can_update')}
              onChange={e => saveMut.mutate({ fieldName: field, permission: 'can_update', value: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            />
          </TableCell>
          <TableCell className="text-center py-1.5 text-slate-300 text-xs">—</TableCell>
        </TableRow>
      ))}
    </>
  );
}