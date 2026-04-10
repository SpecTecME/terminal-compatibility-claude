import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const ALL_ENTITIES = [
  'Vessel', 'Terminal', 'Berth', 'Document', 'DocumentType', 'DocumentCategory',
  'Company', 'Contact', 'Country', 'IssuingAuthority', 'TerminalDocumentRequirement',
  'TerminalRegistrationApplication', 'TerminalRegistrationChecklistItem',
  'VesselCompatibility', 'VesselTerminalDocumentSet', 'VesselTerminalDocumentSetItem',
  'ApplicationUser', 'ApplicationRole', 'ApplicationUserRole',
  'WorkflowDefinition', 'WorkflowStatus', 'WorkflowAction', 'WorkflowTransition',
  'CompanyIdentityProvider', 'CompanyGroupRoleMapping', 'CompanySecurityPolicy',
  'SystemAuditLog', 'ApplicationFunction'
];

export default function PermissionMatrix() {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const qc = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['applicationRoles'],
    queryFn: () => base44.entities.ApplicationRole.list()
  });

  const { data: tablePerms = [], isLoading: loadingTable } = useQuery({
    queryKey: ['roleTablePermissions', selectedRoleId],
    queryFn: () => selectedRoleId ? base44.entities.RoleTablePermission.filter({ application_role_id: selectedRoleId }) : Promise.resolve([]),
    enabled: !!selectedRoleId
  });

  const { data: funcPerms = [], isLoading: loadingFunc } = useQuery({
    queryKey: ['roleFunctionPermissions', selectedRoleId],
    queryFn: () => selectedRoleId ? base44.entities.RoleFunctionPermission.filter({ application_role_id: selectedRoleId }) : Promise.resolve([]),
    enabled: !!selectedRoleId
  });

  const { data: functions = [] } = useQuery({
    queryKey: ['applicationFunctions'],
    queryFn: () => base44.entities.ApplicationFunction.list()
  });

  const { data: workflowPerms = [] } = useQuery({
    queryKey: ['roleWorkflowPermissions', selectedRoleId],
    queryFn: () => selectedRoleId ? base44.entities.RoleWorkflowPermission.filter({ application_role_id: selectedRoleId }) : Promise.resolve([]),
    enabled: !!selectedRoleId
  });

  const { data: workflowDefs = [] } = useQuery({
    queryKey: ['workflowDefinitions'],
    queryFn: () => base44.entities.WorkflowDefinition.list()
  });

  const { data: workflowActions = [] } = useQuery({
    queryKey: ['workflowActions'],
    queryFn: () => base44.entities.WorkflowAction.list()
  });

  const saveTablePerm = useMutation({
    mutationFn: async ({ tableName, field, value }) => {
      const existing = tablePerms.find(p => p.table_name === tableName);
      if (existing) {
        return base44.entities.RoleTablePermission.update(existing.id, { ...existing, [field]: value });
      } else {
        return base44.entities.RoleTablePermission.create({
          application_role_id: selectedRoleId,
          table_name: tableName,
          can_read: field === 'can_read' ? value : false,
          can_insert: field === 'can_insert' ? value : false,
          can_update: field === 'can_update' ? value : false,
          can_delete: field === 'can_delete' ? value : false
        });
      }
    },
    onSuccess: () => qc.invalidateQueries(['roleTablePermissions', selectedRoleId])
  });

  const saveFuncPerm = useMutation({
    mutationFn: async ({ funcKey, value }) => {
      const existing = funcPerms.find(p => p.function_name === funcKey);
      if (existing) return base44.entities.RoleFunctionPermission.update(existing.id, { ...existing, can_execute: value });
      return base44.entities.RoleFunctionPermission.create({ application_role_id: selectedRoleId, function_name: funcKey, can_execute: value });
    },
    onSuccess: () => qc.invalidateQueries(['roleFunctionPermissions', selectedRoleId])
  });

  const saveWorkflowPerm = useMutation({
    mutationFn: async ({ wfDefId, actionId, value }) => {
      const existing = workflowPerms.find(p => p.workflow_definition_id === wfDefId && p.workflow_action_id === actionId);
      if (existing) return base44.entities.RoleWorkflowPermission.update(existing.id, { ...existing, allowed: value });
      return base44.entities.RoleWorkflowPermission.create({ application_role_id: selectedRoleId, workflow_definition_id: wfDefId, workflow_action_id: actionId, allowed: value });
    },
    onSuccess: () => qc.invalidateQueries(['roleWorkflowPermissions', selectedRoleId])
  });

  const getTablePerm = (tableName, field) => {
    const p = tablePerms.find(p => p.table_name === tableName);
    return p ? p[field] : false;
  };

  const getFuncPerm = (funcKey) => {
    const p = funcPerms.find(p => p.function_name === funcKey);
    return p?.can_execute ?? false;
  };

  const getWorkflowPerm = (wfDefId, actionId) => {
    const p = workflowPerms.find(p => p.workflow_definition_id === wfDefId && p.workflow_action_id === actionId);
    return p?.allowed ?? false;
  };

  const Checkbox = ({ checked, onChange }) => (
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permission Matrix</h1>
        <p className="text-gray-600 mt-1">Configure role-based access rights for tables, functions, and workflows</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <span>
          <strong>Permission Matrix</strong> and <strong>Roles</strong> manage the same data from different perspectives.
          Here you see a full cross-role view. In <Link to="/Roles" className="underline font-medium">Roles</Link>, you drill into each role individually with full detail tabs.
        </span>
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-cyan-500" />
            <div className="flex-1 max-w-xs">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select a role to configure..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.role_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!selectedRoleId && <p className="text-sm text-gray-500">Select a role to configure its permissions</p>}
          </div>
        </CardContent>
      </Card>

      {selectedRoleId && (
        <Tabs defaultValue="tables">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="tables">Table Permissions</TabsTrigger>
            <TabsTrigger value="functions">Function Permissions</TabsTrigger>
            <TabsTrigger value="workflows">Workflow Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="mt-4">
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-900">Table / Entity Access Rights</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Entity / Table</TableHead>
                      <TableHead className="text-gray-600 text-center">Read</TableHead>
                      <TableHead className="text-gray-600 text-center">Insert</TableHead>
                      <TableHead className="text-gray-600 text-center">Update</TableHead>
                      <TableHead className="text-gray-600 text-center">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ALL_ENTITIES.map(tableName => (
                      <TableRow key={tableName} className="border-gray-200">
                        <TableCell className="font-mono text-sm text-gray-800">{tableName}</TableCell>
                        {['can_read', 'can_insert', 'can_update', 'can_delete'].map(field => (
                          <TableCell key={field} className="text-center">
                            <Checkbox
                              checked={getTablePerm(tableName, field)}
                              onChange={v => saveTablePerm.mutate({ tableName, field, value: v })}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="mt-4">
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-900">Function / Business Action Permissions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {functions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No functions defined in catalog.</p>
                    <p className="text-sm mt-1">Add functions via the Application Function catalog first.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Function</TableHead>
                        <TableHead className="text-gray-600">Module</TableHead>
                        <TableHead className="text-gray-600">Description</TableHead>
                        <TableHead className="text-gray-600 text-center">Allowed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {functions.filter(f => f.is_active).map(fn => (
                        <TableRow key={fn.id} className="border-gray-200">
                          <TableCell className="font-medium text-gray-900">{fn.function_name}</TableCell>
                          <TableCell><Badge variant="outline" className="border-gray-300 text-gray-600">{fn.module_name || '-'}</Badge></TableCell>
                          <TableCell className="text-gray-600 text-sm">{fn.description || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox checked={getFuncPerm(fn.function_key)} onChange={v => saveFuncPerm.mutate({ funcKey: fn.function_key, value: v })} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="mt-4">
            {workflowDefs.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-8 text-center text-gray-500">
                  <p>No workflow definitions exist yet.</p>
                  <p className="text-sm mt-1">Create workflows via the Workflow page first.</p>
                </CardContent>
              </Card>
            ) : workflowDefs.map(wfDef => {
              const actions = workflowActions.filter(a => a.workflow_definition_id === wfDef.id);
              return (
                <Card key={wfDef.id} className="bg-white border-gray-200 mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-gray-900">{wfDef.workflow_name}</CardTitle>
                    <p className="text-sm text-gray-500">Target: {wfDef.table_name}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200">
                          <TableHead className="text-gray-600">Action</TableHead>
                          <TableHead className="text-gray-600">Code</TableHead>
                          <TableHead className="text-gray-600 text-center">Allowed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actions.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-4">No actions defined for this workflow</TableCell></TableRow>
                        ) : actions.map(action => (
                          <TableRow key={action.id} className="border-gray-200">
                            <TableCell className="font-medium text-gray-900">{action.action_name}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-600">{action.action_code}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox checked={getWorkflowPerm(wfDef.id, action.id)} onChange={v => saveWorkflowPerm.mutate({ wfDefId: wfDef.id, actionId: action.id, value: v })} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}