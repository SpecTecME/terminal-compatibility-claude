/**
 * Admin Users Page (User Management)
 * 
 * PURPOSE:
 * Manage application users via invite system.
 * Admin-only functionality for user provisioning.
 * 
 * DOMAIN CONTEXT - USER INVITE SYSTEM:
 * 
 * NO DIRECT USER CREATION:
 * Cannot directly insert User records (built-in security).
 * Must use base44.users.inviteUser() API.
 * 
 * INVITE FLOW:
 * 1. Admin enters email + role
 * 2. System sends invite email
 * 3. User clicks link
 * 4. User sets password
 * 5. User record created
 * 
 * SECURITY MODEL (from base44 docs):
 * - Only admins can invite users
 * - Regular users cannot invite anyone
 * - Prevents unauthorized access creation
 * 
 * INVITE DIALOG (lines 102-148):
 * 
 * EMAIL FIELD (line 114-122):
 * Required, email type input.
 * Validated by browser (type="email").
 * 
 * ROLE SELECTION (line 124-137):
 * Two options:
 * - user: Regular access
 * - admin: Full access (can invite others)
 * 
 * ADMIN RESPONSIBILITY:
 * Choose role carefully.
 * Admin role grants significant permissions.
 * 
 * INVITE BUTTON (lines 139-145):
 * Disabled until email provided.
 * Shows "Sending..." during API call.
 * 
 * INVITE API (lines 66-79):
 * 
 * Uses base44.users.inviteUser(email, role).
 * 
 * SUCCESS:
 * - Refreshes user list
 * - Closes dialog
 * - Resets form
 * - Shows success toast
 * 
 * EMAIL SENT:
 * User receives invitation.
 * Link valid for limited time (platform default).
 * 
 * THREE VIEW MODES:
 * Standard pattern: List, Grid, Compact.
 * 
 * LIST VIEW (lines 191-238):
 * 
 * TABLE COLUMNS:
 * - Name (line 197, 207): Full name
 * - Email (line 198, 208): Login identifier
 * - Role (line 199, 209-212): Admin or User badge
 * - Joined (line 200, 214-216): Registration date
 * - Actions (line 201, 217-231): Dropdown menu
 * 
 * ACTIONS DROPDOWN (lines 218-230):
 * Currently only "Send Email" (placeholder).
 * 
 * FUTURE ACTIONS:
 * - Reset password
 * - Change role
 * - Deactivate user
 * - View activity log
 * 
 * GRID VIEW (lines 240-263):
 * Card-based display.
 * 
 * AVATAR (lines 246-248):
 * Gradient circle with initial letter.
 * Same pattern as Profile page.
 * 
 * ROLE BADGE (lines 249-252):
 * Shield icon for security emphasis.
 * Color-coded (purple for admin, gray for user).
 * 
 * COMPACT VIEW (lines 265-288):
 * Dense list for scanning.
 * Smaller avatars (w-8 h-8 vs w-12 h-12).
 * 
 * ROLE COLOR CODING (lines 86-89):
 * - admin: Violet (stands out)
 * - user: Slate (neutral)
 * 
 * Admins visually distinct in all views.
 * 
 * SEARCH SCOPE (lines 81-84):
 * Searches full_name and email.
 * Real-time filtering as user types.
 * 
 * NO DELETE FUNCTIONALITY:
 * Notice: No user deletion in current UI.
 * 
 * FUTURE ENHANCEMENT:
 * Could add deactivation (isActive flag).
 * Preserves user data, blocks login.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Mail,
  Shield,
  Search,
  MoreVertical,
  Trash2,
  Grid3x3,
  List,
  LayoutList
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list, grid, compact
  const [showDialog, setShowDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'user'
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDialog(false);
      setInviteData({ email: '', role: 'user' });
      toast.success('User invitation sent');
    },
    onError: (error) => {
      toast.error('Failed to send invitation');
    }
  });

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleColors = {
    admin: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    user: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-cyan-400" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Manage users and their access levels</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email Address *</Label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                  placeholder="user@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Role *</Label>
                <Select 
                  value={inviteData.role}
                  onValueChange={(v) => setInviteData({...inviteData, role: v})}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="user" className="text-white">User</SelectItem>
                    <SelectItem value="admin" className="text-white">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => inviteUserMutation.mutate(inviteData)}
                disabled={!inviteData.email || inviteUserMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & View Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Users Display */}
      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Name</TableHead>
                  <TableHead className="text-gray-600">Email</TableHead>
                  <TableHead className="text-gray-600">User ID</TableHead>
                  <TableHead className="text-gray-600">Role</TableHead>
                  <TableHead className="text-gray-600">Joined</TableHead>
                  <TableHead className="text-gray-600 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{user.full_name}</TableCell>
                    <TableCell className="text-gray-700">{user.email}</TableCell>
                    <TableCell className="text-gray-500 font-mono text-xs">{user.id}</TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[user.role]} border`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {new Date(user.created_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="text-slate-300">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-white border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <Badge className={`${roleColors[user.role]} border`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{user.full_name}</h3>
                <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                <div className="text-xs text-gray-600">
                  Joined {new Date(user.created_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.full_name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <Badge className={`${roleColors[user.role]} border text-xs`}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
          <p className="text-slate-400">
            {searchQuery ? 'Try a different search' : 'Invite your first user'}
          </p>
        </div>
      )}
    </div>
  );
}