import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Users, Plus, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
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
import { toast } from 'sonner';

const EMPTY_FORM = {
  full_name: '', email: '', username: '', status: 'active',
  base44_user_id: '', default_role_id: '', notes: ''
};

export default function ApplicationUsers() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['applicationUsers'],
    queryFn: () => base44.entities.ApplicationUser.list()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['applicationRoles'],
    queryFn: () => base44.entities.ApplicationRole.list()
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['applicationUserRoles'],
    queryFn: () => base44.entities.ApplicationUserRole.list()
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.ApplicationUser.create(data),
    onSuccess: () => { qc.invalidateQueries(['applicationUsers']); toast.success('User created'); closeDialog(); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ApplicationUser.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['applicationUsers']); toast.success('User updated'); closeDialog(); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.ApplicationUser.delete(id),
    onSuccess: () => { qc.invalidateQueries(['applicationUsers']); toast.success('User deleted'); setDeleteDialog(false); }
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY_FORM); };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ full_name: user.full_name || '', email: user.email || '', username: user.username || '',
      status: user.status || 'active', base44_user_id: user.base44_user_id || '',
      default_role_id: user.default_role_id || '', notes: user.notes || '' });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) { toast.error('Full name and email are required'); return; }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const getUserRoleCount = (userId) => userRoles.filter(ur => ur.application_user_id === userId && ur.active).length;
  const getRoleName = (roleId) => roles.find(r => r.id === roleId)?.role_name || '-';

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Users</h1>
          <p className="text-gray-600 mt-1">Application-level user registry for role assignment and permissions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Application Security Layer</p>
        <p>These users are separate from Base44 platform users. They represent the application-level security model for role assignment, permissions, and future exported deployment.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-gray-300" />
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Full Name</TableHead>
                <TableHead className="text-gray-600">Email</TableHead>
                <TableHead className="text-gray-600">Username</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600">Default Role</TableHead>
                <TableHead className="text-gray-600">Assigned Roles</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No application users found</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map(user => (
                <TableRow key={user.id} className="border-gray-200">
                  <TableCell className="font-medium text-gray-900">{user.full_name}</TableCell>
                  <TableCell className="text-gray-700">{user.email}</TableCell>
                  <TableCell className="text-gray-700 font-mono text-sm">{user.username || '-'}</TableCell>
                  <TableCell>
                    {user.status === 'active'
                      ? <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /><span className="text-sm">Active</span></div>
                      : <div className="flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" /><span className="text-sm">Inactive</span></div>}
                  </TableCell>
                  <TableCell className="text-gray-700">{user.default_role_id ? getRoleName(user.default_role_id) : '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gray-300 text-gray-700">{getUserRoleCount(user.id)} role(s)</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => openEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => { setToDelete(user); setDeleteDialog(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{editing ? 'Edit Application User' : 'Add Application User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Full Name *</Label>
                  <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="bg-white border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Username</Label>
                  <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="bg-white border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Platform Mapping</h3>
              <div className="space-y-2">
                <Label className="text-gray-700">Base44 User ID (optional)</Label>
                <Input value={form.base44_user_id} onChange={e => setForm({...form, base44_user_id: e.target.value})} placeholder="Link to Base44 internal user ID" className="bg-white border-gray-300" />
                <p className="text-xs text-gray-500">Optional mapping for future SSO-to-ApplicationUser resolution</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Role Assignment</h3>
              <div className="space-y-2">
                <Label className="text-gray-700">Default Role</Label>
                <Select value={form.default_role_id || 'none'} onValueChange={v => setForm({...form, default_role_id: v === 'none' ? '' : v})}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select default role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No default role —</SelectItem>
                    {roles.filter(r => r.is_active).map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.role_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Additional roles can be assigned via the Roles page</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Notes</h3>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-white border-gray-300" rows={3} />
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
            <AlertDialogTitle className="text-gray-900">Delete Application User</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete "{toDelete?.full_name}"? This will not affect Base44 platform access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteMut.mutate(toDelete.id)} className="bg-red-600 hover:bg-red-700" disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}