import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, CheckCircle, User } from 'lucide-react';

export default function RoleWorkflowPermissionsTab({ roleId }) {
  const { data: perms = [] } = useQuery({
    queryKey: ['roleWorkflowPermissions', roleId],
    queryFn: () => base44.entities.RoleWorkflowPermission.filter({ application_role_id: roleId })
  });

  const { data: workflowDefs = [] } = useQuery({
    queryKey: ['workflowDefinitions'],
    queryFn: () => base44.entities.WorkflowDefinition.list()
  });

  const { data: workflowActions = [] } = useQuery({
    queryKey: ['workflowActions'],
    queryFn: () => base44.entities.WorkflowAction.list()
  });

  const allowedPerms = perms.filter(p => p.allowed);

  if (workflowDefs.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center text-gray-500">
          <p>No workflows defined. Create workflows first to configure permissions.</p>
        </CardContent>
      </Card>
    );
  }

  // Group allowed perms by workflow definition
  const workflowsWithPerms = workflowDefs
    .map(wfDef => {
      const allowedActions = allowedPerms
        .filter(p => p.workflow_definition_id === wfDef.id)
        .map(p => workflowActions.find(a => a.id === p.workflow_action_id)?.action_name)
        .filter(Boolean);
      return { wfDef, allowedActions };
    })
    .filter(({ allowedActions }) => allowedActions.length > 0);

  if (workflowsWithPerms.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center text-gray-500">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No workflow permissions assigned</p>
          <p className="text-sm mt-1">
            Workflow permissions are configured inside each workflow's "Permissions" tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Read-only summary. To modify permissions, open the workflow and go to its <strong>Permissions</strong> tab.
      </p>
      {workflowsWithPerms.map(({ wfDef, allowedActions }) => (
        <Card key={wfDef.id} className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <GitBranch className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{wfDef.workflow_name}</span>
                  <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">{wfDef.table_name}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-sm text-gray-500">Can:</span>
                  {allowedActions.map(actionName => (
                    <Badge key={actionName} className="bg-green-50 text-green-700 border border-green-200 text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {actionName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}