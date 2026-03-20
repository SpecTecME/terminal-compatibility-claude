import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function RoleFunctionPermissionsTab({ roleId }) {
  const qc = useQueryClient();

  const { data: perms = [] } = useQuery({
    queryKey: ['roleFunctionPermissions', roleId],
    queryFn: () => base44.entities.RoleFunctionPermission.filter({ application_role_id: roleId })
  });

  const { data: functions = [] } = useQuery({
    queryKey: ['applicationFunctions'],
    queryFn: () => base44.entities.ApplicationFunction.list()
  });

  const saveMut = useMutation({
    mutationFn: async ({ funcKey, value }) => {
      const existing = perms.find(p => p.function_name === funcKey);
      if (existing) return base44.entities.RoleFunctionPermission.update(existing.id, { ...existing, can_execute: value });
      return base44.entities.RoleFunctionPermission.create({ application_role_id: roleId, function_name: funcKey, can_execute: value });
    },
    onSuccess: () => qc.invalidateQueries(['roleFunctionPermissions', roleId])
  });

  const getPerm = (funcKey) => {
    const p = perms.find(p => p.function_name === funcKey);
    return p?.can_execute ?? false;
  };

  const activeFunctions = functions.filter(f => f.is_active);

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-gray-900">Function / Business Action Permissions</CardTitle>
        <p className="text-sm text-gray-500">Control which business functions this role can execute. Manage the function catalog via Application Functions.</p>
      </CardHeader>
      <CardContent className="p-0">
        {activeFunctions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No functions defined in the catalog.</p>
            <p className="text-sm mt-1">Add functions via the Application Function catalog to configure permissions here.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Function</TableHead>
                <TableHead className="text-gray-600">Module</TableHead>
                <TableHead className="text-gray-600">Description</TableHead>
                <TableHead className="text-gray-600 text-center">Can Execute</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeFunctions.map(fn => (
                <TableRow key={fn.id} className="border-gray-200">
                  <TableCell className="font-medium text-gray-900">{fn.function_name}</TableCell>
                  <TableCell><Badge variant="outline" className="border-gray-300 text-gray-600">{fn.module_name || '-'}</Badge></TableCell>
                  <TableCell className="text-gray-600 text-sm">{fn.description || '-'}</TableCell>
                  <TableCell className="text-center">
                    <input type="checkbox"
                      checked={getPerm(fn.function_key)}
                      onChange={e => saveMut.mutate({ funcKey: fn.function_key, value: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}