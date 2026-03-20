import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function RoleAssignedUsersTab({ roleId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const qc = useQueryClient();

  const { data: userRoles = [] } = useQuery({
    queryKey: ['userRolesForRole', roleId],
    queryFn: () => base44.entities.ApplicationUserRole.filter({ application_role_id: roleId })
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['applicationUsers'],
    queryFn: () => base44.entities.ApplicationUser.list()
  });

  const assignedUserIds = userRoles.map(ur => ur.application_user_id);
  const availableUsers = allUsers.filter(u => !assignedUserIds.includes(u.id));

  const assignMut = useMutation({
    mutationFn: () => base44.entities.ApplicationUserRole.create({
      application_user_id: selectedUserId,
      application_role_id: roleId,
      assigned_from: 'manual',
      active: true
    }),
    onSuccess: () => {
      qc.invalidateQueries(['userRolesForRole', roleId]);
      qc.invalidateQueries(['applicationUserRoles']);
      toast.success('User assigned to role');
      setDialogOpen(false);
      setSelectedUserId('');
    }
  });

  const removeMut = useMutation({
    mutationFn: (id) => base44.entities.ApplicationUserRole.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['userRolesForRole', roleId]);
      qc.invalidateQueries(['applicationUserRoles']);
      toast.success('User removed from role');
    }
  });

  const getUserName = (userId) => allUsers.find(u => u.id === userId)?.full_name || userId;
  const getUserEmail = (userId) => allUsers.find(u => u.id === userId)?.email || '';

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base text-gray-900">Assigned Users</CardTitle>
          <p className="text-sm text-gray-500">Users who have been assigned this role.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={availableUsers.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-blue-600">
          <Plus className="w-4 h-4 mr-1" /> Assign User
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-600">Name</TableHead>
              <TableHead className="text-gray-600">Email</TableHead>
              <TableHead className="text-gray-600">Assigned From</TableHead>
              <TableHead className="text-gray-600">Active</TableHead>
              <TableHead className="text-gray-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRoles.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No users assigned to this role</TableCell></TableRow>
            ) : userRoles.map(ur => (
              <TableRow key={ur.id} className="border-gray-200">
                <TableCell className="font-medium text-gray-900">{getUserName(ur.application_user_id)}</TableCell>
                <TableCell className="text-gray-600">{getUserEmail(ur.application_user_id)}</TableCell>
                <TableCell><Badge variant="outline" className="border-gray-300 text-gray-600">{ur.assigned_from || 'manual'}</Badge></TableCell>
                <TableCell>
                  {ur.active
                    ? <CheckCircle className="w-4 h-4 text-green-600" />
                    : <XCircle className="w-4 h-4 text-gray-400" />}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeMut.mutate(ur.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-sm">
          <DialogHeader><DialogTitle className="text-gray-900">Assign User to Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-300">Cancel</Button>
              <Button onClick={() => assignMut.mutate()} disabled={!selectedUserId || assignMut.isPending} className="bg-gradient-to-r from-cyan-500 to-blue-600">Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}