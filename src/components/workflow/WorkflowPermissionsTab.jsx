import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Plus, X, Shield, User, Search, Check } from 'lucide-react';
import { toast } from 'sonner';

// --- Multi-select popover for roles or users ---
function MultiSelectPopover({ type, items, selectedIds, onAdd, onRemove, onClose }) {
  const [filter, setFilter] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = items.filter(item => {
    const label = type === 'role' ? item.role_name : (item.full_name || item.email || '');
    return label.toLowerCase().includes(filter.toLowerCase());
  });

  const getLabel = (item) => type === 'role' ? item.role_name : (item.full_name || item.email || item.id);
  const getSubLabel = (item) => type === 'user' ? item.email : null;

  return (
    <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <Input
          ref={inputRef}
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={`Filter ${type === 'role' ? 'roles' : 'users'}...`}
          className="h-6 text-xs border-0 p-0 focus-visible:ring-0 shadow-none"
        />
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="max-h-52 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">No {type === 'role' ? 'roles' : 'users'} found</div>
        ) : filtered.map(item => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
              onClick={() => isSelected ? onRemove(item.id) : onAdd(item.id)}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-gray-900 truncate">{getLabel(item)}</div>
                {getSubLabel(item) && <div className="text-xs text-gray-400 truncate">{getSubLabel(item)}</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer count */}
      <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-400">
        {selectedIds.length} selected
      </div>
    </div>
  );
}

// --- Per-transition permission manager ---
function TransitionPermissions({ transition, actionId, perms, roles, appUsers, readOnly, onAdd, onRemove }) {
  const [popoverType, setPopoverType] = useState(null); // 'role' | 'user' | null
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!popoverType) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopoverType(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverType]);

  const rolePerms = perms.filter(p => p.application_role_id && p.allowed);
  const userPerms = perms.filter(p => p.application_user_id && p.allowed);
  const selectedRoleIds = rolePerms.map(p => p.application_role_id);
  const selectedUserIds = userPerms.map(p => p.application_user_id);

  const getRoleName = (id) => roles.find(r => r.id === id)?.role_name || id;
  const getUserLabel = (id) => {
    const u = appUsers.find(u => u.id === id);
    return u ? (u.full_name || u.email) : id;
  };

  const handleAddRole = (roleId) => onAdd({ actionId, roleId, userId: null });
  const handleRemoveRole = (roleId) => {
    const perm = rolePerms.find(p => p.application_role_id === roleId);
    if (perm) onRemove(perm.id);
  };
  const handleAddUser = (userId) => onAdd({ actionId, roleId: null, userId });
  const handleRemoveUser = (userId) => {
    const perm = userPerms.find(p => p.application_user_id === userId);
    if (perm) onRemove(perm.id);
  };

  const isEmpty = rolePerms.length === 0 && userPerms.length === 0;

  return (
    <div className="space-y-1.5">
      {/* Badges row */}
      <div className="flex flex-wrap gap-1 min-h-[22px]">
        {isEmpty && (
          <span className="text-xs text-gray-400 italic self-center">Unrestricted</span>
        )}
        {rolePerms.map(p => (
          <Badge key={p.id} variant="outline" className="border-indigo-300 text-indigo-700 flex items-center gap-1 text-xs py-0.5">
            <Shield className="w-3 h-3 flex-shrink-0" />
            <span>{getRoleName(p.application_role_id)}</span>
            {!readOnly && (
              <button onClick={() => onRemove(p.id)} className="ml-0.5 text-indigo-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
        {userPerms.map(p => (
          <Badge key={p.id} variant="outline" className="border-teal-300 text-teal-700 flex items-center gap-1 text-xs py-0.5">
            <User className="w-3 h-3 flex-shrink-0" />
            <span>{getUserLabel(p.application_user_id)}</span>
            {!readOnly && (
              <button onClick={() => onRemove(p.id)} className="ml-0.5 text-teal-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Add buttons + popovers */}
      {!readOnly && (
        <div ref={containerRef} className="relative flex items-center gap-1">
          <button
            onClick={() => setPopoverType(popoverType === 'role' ? null : 'role')}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${popoverType === 'role' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'}`}
          >
            <Shield className="w-3 h-3" />
            + Role
          </button>
          <button
            onClick={() => setPopoverType(popoverType === 'user' ? null : 'user')}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${popoverType === 'user' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600'}`}
          >
            <User className="w-3 h-3" />
            + User
          </button>

          {popoverType === 'role' && (
            <MultiSelectPopover
              type="role"
              items={roles}
              selectedIds={selectedRoleIds}
              onAdd={handleAddRole}
              onRemove={handleRemoveRole}
              onClose={() => setPopoverType(null)}
            />
          )}
          {popoverType === 'user' && (
            <MultiSelectPopover
              type="user"
              items={appUsers}
              selectedIds={selectedUserIds}
              onAdd={handleAddUser}
              onRemove={handleRemoveUser}
              onClose={() => setPopoverType(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// --- Main component ---
export default function WorkflowPermissionsTab({ workflowId, readOnly = false }) {
  const qc = useQueryClient();

  const { data: transitions = [] } = useQuery({
    queryKey: ['workflowTransitions', workflowId],
    queryFn: () => base44.entities.WorkflowTransition.filter({ workflow_definition_id: workflowId })
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['workflowStatuses', workflowId],
    queryFn: () => base44.entities.WorkflowStatus.filter({ workflow_definition_id: workflowId })
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['workflowActions', workflowId],
    queryFn: () => base44.entities.WorkflowAction.filter({ workflow_definition_id: workflowId })
  });

  const { data: perms = [] } = useQuery({
    queryKey: ['roleWorkflowPermissions', workflowId, 'byWorkflow'],
    queryFn: () => base44.entities.RoleWorkflowPermission.filter({ workflow_definition_id: workflowId })
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['applicationRoles'],
    queryFn: () => base44.entities.ApplicationRole.list()
  });

  const { data: appUsers = [] } = useQuery({
    queryKey: ['applicationUsers'],
    queryFn: () => base44.entities.ApplicationUser.list()
  });

  const addPermMut = useMutation({
    mutationFn: ({ actionId, roleId, userId }) =>
      base44.entities.RoleWorkflowPermission.create({
        workflow_definition_id: workflowId,
        workflow_action_id: actionId,
        ...(roleId ? { application_role_id: roleId } : {}),
        ...(userId ? { application_user_id: userId } : {}),
        allowed: true
      }),
    onSuccess: () => {
      qc.invalidateQueries(['roleWorkflowPermissions', workflowId, 'byWorkflow']);
    }
  });

  const removePermMut = useMutation({
    mutationFn: (permId) => base44.entities.RoleWorkflowPermission.delete(permId),
    onSuccess: () => {
      qc.invalidateQueries(['roleWorkflowPermissions', workflowId, 'byWorkflow']);
    }
  });

  const getStatusName = (id) => statuses.find(s => s.id === id)?.status_name || '?';
  const getStatusColor = (id) => statuses.find(s => s.id === id)?.color_code || '#9CA3AF';
  const getActionName = (id) => actions.find(a => a.id === id)?.action_name || '?';
  const getPermsForAction = (actionId) => perms.filter(p => p.workflow_action_id === actionId && p.allowed);

  if (transitions.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center text-gray-500">
          <p>No transitions defined yet. Add transitions first, then configure who can perform them.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        For each transition, specify which roles and/or users are allowed to trigger it. If none assigned, the transition is unrestricted.
      </p>

      <div className="space-y-2">
        {transitions.map(t => {
          const actionPerms = getPermsForAction(t.workflow_action_id);
          return (
            <Card key={t.id} className="bg-white border-gray-200">
              <CardContent className="p-4">
                {/* Transition header */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {t.from_status_id
                    ? <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(t.from_status_id) }} />
                        <span className="font-medium text-gray-900 text-sm">{getStatusName(t.from_status_id)}</span>
                      </div>
                    : <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">On Create</span>
                  }
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(t.to_status_id) }} />
                    <span className="font-medium text-gray-900 text-sm">{getStatusName(t.to_status_id)}</span>
                  </div>
                  <span className="text-gray-400 text-sm">via</span>
                  <Badge variant="outline" className="border-cyan-300 text-cyan-700 text-xs">{getActionName(t.workflow_action_id)}</Badge>
                </div>

                {/* Permissions */}
                <TransitionPermissions
                  transition={t}
                  actionId={t.workflow_action_id}
                  perms={actionPerms}
                  roles={roles}
                  appUsers={appUsers}
                  readOnly={readOnly}
                  onAdd={(data) => addPermMut.mutate(data)}
                  onRemove={(permId) => removePermMut.mutate(permId)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}