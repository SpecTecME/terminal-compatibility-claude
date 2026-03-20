import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Edit, Trash2, Search, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import BackToConfiguration from '../components/configuration/BackToConfiguration.jsx';
import { setBreadcrumbSubPage, clearBreadcrumbSubPage } from '../components/ui/Breadcrumbs.jsx';
import RoleTablePermissionsTab from '../components/roles/RoleTablePermissionsTab.jsx';
import RoleFunctionPermissionsTab from '../components/roles/RoleFunctionPermissionsTab.jsx';
import RoleWorkflowPermissionsTab from '../components/roles/RoleWorkflowPermissionsTab.jsx';
import RoleAssignedUsersTab from '../components/roles/RoleAssignedUsersTab.jsx';
import { toast } from 'sonner';

const EMPTY_FORM = { role_name: '', description: '', is_active: true, inherits_from_role_id: '' };

export default function Roles() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedRole, setSelectedRole] = useState(null);
  const qc = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['applicationRoles'],
    queryFn: () => base44.entities.ApplicationRole.list()
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['applicationUserRoles'],
    queryFn: () => base44.entities.ApplicationUserRole.list()
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.ApplicationRole.create(data),
    onSuccess: () => { qc.invalidateQueries(['applicationRoles']); toast.success('Role created'); closeDialog(); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ApplicationRole.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['applicationRoles']); toast.success('Role updated'); closeDialog(); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.ApplicationRole.delete(id),
    onSuccess: () => { qc.invalidateQueries(['applicationRoles']); toast.success('Role deleted'); setDeleteDialog(false); setToDelete(null); }
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY_FORM); };

  const openEdit = (role) => {
    setEditing(role);
    setForm({ role_name: role.role_name || '', description: role.description || '',
      is_active: role.is_active ?? true, inherits_from_role_id: role.inherits_from_role_id || '' });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.role_name) { toast.error('Role name is required'); return; }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const isRoleInUse = (roleId) => userRoles.some(ur => ur.application_role_id === roleId);

  const filtered = roles.filter(r =>
    r.role_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedRole) {
    return <RoleEditor role={selectedRole} onBack={() => setSelectedRole(null)} roles={roles} />;
  }

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <BackToConfiguration to="ConfigurationSystemConfig" label="Back" />
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Roles</h1>
          <p className="text-gray-600 mt-1">Manage application roles for permissions and workflow</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Role
        </Button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <span>
          <strong>Roles</strong> and <strong>Permission Matrix</strong> manage the same data from different perspectives.
          Here you define roles and drill into each role's permissions. In <Link to="/PermissionMatrix" className="underline font-medium">Permission Matrix</Link>, you see a full cross-role comparison table.
        </span>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search roles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-gray-300" />
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Role Name</TableHead>
                <TableHead className="text-gray-600">Description</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600">Assigned Users</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No roles defined yet</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map(role => (
                <TableRow key={role.id} className="border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedRole(role)}>
                  <TableCell className="font-medium text-gray-900">{role.role_name}</TableCell>
                  <TableCell className="text-gray-600 text-sm">{role.description || '-'}</TableCell>
                  <TableCell>
                    {role.is_active
                      ? <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /><span className="text-sm">Active</span></div>
                      : <div className="flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" /><span className="text-sm">Inactive</span></div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {userRoles.filter(ur => ur.application_role_id === role.id && ur.active).length} user(s)
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => openEdit(role)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700"
                        disabled={isRoleInUse(role.id)}
                        title={isRoleInUse(role.id) ? 'Role is in use' : 'Delete role'}
                        onClick={() => { setToDelete(role); setDeleteDialog(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) closeDialog(); }}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{editing ? 'Edit Role' : 'Add Role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Role Name *</Label>
              <Input value={form.role_name} onChange={e => setForm({...form, role_name: e.target.value})} className="bg-white border-gray-300" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white border-gray-300" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Inherits From (optional)</Label>
              <Select value={form.inherits_from_role_id || 'none'} onValueChange={v => setForm({...form, inherits_from_role_id: v === 'none' ? '' : v})}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="No inheritance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No inheritance —</SelectItem>
                  {roles.filter(r => r.id !== editing?.id).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.role_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Status</Label>
              <Select value={form.is_active ? 'active' : 'inactive'} onValueChange={v => setForm({...form, is_active: v === 'active'})}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="border-gray-300">Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Role</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete "{toDelete?.role_name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteMut.mutate(toDelete.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleEditor({ role, onBack, roles }) {
  useEffect(() => {
    setBreadcrumbSubPage(role.role_name);
    return () => clearBreadcrumbSubPage();
  }, [role.role_name]);

  return (
    <div className="space-y-6">
      <BackToConfiguration to="Roles" label="Back to Roles" onClickOverride={onBack} />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{role.role_name}</h1>
        <p className="text-gray-600 mt-1">{role.description || 'Configure permissions and assignments for this role'}</p>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="table">Table Permissions</TabsTrigger>
          <TabsTrigger value="function">Function Permissions</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Permissions</TabsTrigger>
          <TabsTrigger value="users">Assigned Users</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Role Name</p><p className="font-medium text-gray-900">{role.role_name}</p></div>
                <div><p className="text-sm text-gray-500">Status</p>
                  <Badge className={role.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="md:col-span-2"><p className="text-sm text-gray-500">Description</p><p className="text-gray-900">{role.description || '-'}</p></div>
                {role.inherits_from_role_id && (
                  <div><p className="text-sm text-gray-500">Inherits From</p>
                    <p className="text-gray-900">{roles.find(r => r.id === role.inherits_from_role_id)?.role_name || '-'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <RoleTablePermissionsTab roleId={role.id} />
        </TabsContent>
        <TabsContent value="function" className="mt-4">
          <RoleFunctionPermissionsTab roleId={role.id} />
        </TabsContent>
        <TabsContent value="workflow" className="mt-4">
          <RoleWorkflowPermissionsTab roleId={role.id} />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <RoleAssignedUsersTab roleId={role.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}