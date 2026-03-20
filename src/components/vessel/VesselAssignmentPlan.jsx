/**
 * Vessel Assignment Plan Component (Master-Detail UI)
 * 
 * PURPOSE:
 * Assigns personnel to vessel entities (cabins, muster stations, lifeboats, rafts, access points).
 * Implements complete crew accommodation and emergency planning workflow.
 * 
 * CRITICAL ARCHITECTURAL PATTERN - UNIFIED ENTITY LIST:
 * 
 * This component displays 5 different entity types in ONE unified interface:
 * - Cabins (sleeping quarters)
 * - Muster Stations (emergency assembly)
 * - Lifeboats (primary evacuation)
 * - Life Raft Groups (supplementary evacuation)
 * - Access Points (boarding/egress)
 * 
 * buildEntityList() function (lines 105-155):
 * Normalizes heterogeneous entities into common structure:
 * {
 *   type: entity type constant
 *   entity: { code, name, publicId, ...original fields }
 *   capacity: numeric capacity (if applicable)
 *   zone: linked VesselZone (if any)
 * }
 * 
 * This enables:
 * - Single filtering/search logic for all types
 * - Consistent UI rendering
 * - Unified assignment workflow
 * 
 * ALTERNATIVE REJECTED:
 * Five separate tabs with duplicate logic.
 * Current unified view provides better UX for holistic planning.
 * 
 * MASTER-DETAIL UI PATTERN:
 * 
 * LEFT PANEL (Master):
 * - List of all entities (cabins, stations, boats, rafts, access points)
 * - Filterable by type and search query
 * - Shows assignment count vs capacity (e.g., "3/4")
 * - Color-coded capacity status
 * - Click to select entity
 * 
 * RIGHT PANEL (Detail):
 * - Shows selected entity details
 * - Lists all assignments for that entity
 * - Add/Edit/Delete assignments
 * - Capacity validation warnings
 * 
 * CAPACITY MANAGEMENT:
 * 
 * OVER-CAPACITY DETECTION:
 * - Active assignments > capacity → Red warning (lines 400-404)
 * - Visual alerts prevent unsafe configurations
 * - Example: Cabin for 2, assigned to 3 people = VIOLATION
 * 
 * UNDER-CAPACITY DISPLAY:
 * - Shows available slots (lines 405-409)
 * - Example: "2 slots available"
 * - Helps planner fill accommodations efficiently
 * 
 * NOT ALL ENTITIES HAVE CAPACITY:
 * - Access Points: No capacity (null)
 * - Cabins: bedCount = capacity
 * - Muster Stations: capacityPersons
 * - Lifeboats: capacityPersons
 * - Life Rafts: totalCapacity (computed)
 * 
 * Handles null capacity gracefully (lines 417-422).
 * 
 * ASSIGNMENT ATTRIBUTES:
 * 
 * personName: Full name of assigned person
 * rankName: Maritime rank (Captain, Chief Engineer, AB, etc.)
 * personCategory: Classification for regulatory purposes
 *   - CREW: Regular ship's crew
 *   - SUPERNUMERARY: Extra persons (inspectors, riders)
 *   - PASSENGER: Paying passengers (cruise ships)
 *   - GUEST_WORKER: Temporary workers (shipyard workers during transit)
 * fromDateTime / toDateTime: Assignment validity period
 *   - Supports crew rotations (common on long voyages)
 *   - Empty toDateTime = open-ended assignment
 * status: ACTIVE / ENDED
 *   - ENDED = historical record (person no longer assigned)
 *   - Preserves assignment history for auditing
 * 
 * ENTITY STORAGE PATTERN:
 * - entityType: String constant (CABIN, MUSTER_STATION, etc.)
 * - entityId: publicId of entity (migration-portable)
 * - entityCode: Denormalized code for quick display (performance)
 * 
 * Denormalization trade-off:
 * - Faster queries (no join needed to show code)
 * - Risk of inconsistency if entity code changes
 * - Acceptable for relatively static codes
 * 
 * SHOW ONLY ASSIGNED FILTER:
 * Checkbox to hide unassigned entities (lines 168-175).
 * Useful when reviewing existing assignments.
 * Declutters view when many entities configured.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VesselAssignmentPlan({ vessel }) {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    personName: '', rankName: '', personCategory: 'CREW', fromDateTime: '', toDateTime: '', status: 'ACTIVE'
  });

  // Fetch all data
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', vessel.id],
    queryFn: () => base44.entities.Assignment.filter({ vesselId: vessel.id })
  });

  const { data: cabins = [] } = useQuery({
    queryKey: ['cabins', vessel.id],
    queryFn: () => base44.entities.Cabin.filter({ vesselId: vessel.id })
  });

  const { data: musterStations = [] } = useQuery({
    queryKey: ['musterStations', vessel.id],
    queryFn: () => base44.entities.MusterStation.filter({ vesselId: vessel.id })
  });

  const { data: lifeboats = [] } = useQuery({
    queryKey: ['lifeboats', vessel.id],
    queryFn: () => base44.entities.Lifeboat.filter({ vesselId: vessel.id })
  });

  const { data: lifeRaftGroups = [] } = useQuery({
    queryKey: ['lifeRaftGroups', vessel.id],
    queryFn: () => base44.entities.LifeRaftGroup.filter({ vesselId: vessel.id })
  });

  const { data: accessPoints = [] } = useQuery({
    queryKey: ['accessPoints', vessel.id],
    queryFn: () => base44.entities.AccessPoint.filter({ vesselId: vessel.id })
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['vesselZones', vessel.id],
    queryFn: () => base44.entities.VesselZone.filter({ vesselId: vessel.id })
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create({
      ...data,
      vesselId: vessel.id,
      vesselPublicId: vessel.publicId,
      publicId: crypto.randomUUID(),
      tenantId: vessel.tenantId,
      entityType: selectedEntity.type,
      entityId: selectedEntity.entity.publicId,
      entityCode: selectedEntity.entity.code
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setShowDialog(false);
      setEditingAssignment(null);
      toast.success('Assignment created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setShowDialog(false);
      setEditingAssignment(null);
      toast.success('Assignment updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setDeletingAssignment(null);
      toast.success('Assignment deleted');
    }
  });

  // Build unified entity list
  const buildEntityList = () => {
    const entities = [];

    cabins.forEach(cabin => {
      entities.push({
        type: 'CABIN',
        entity: { ...cabin, code: cabin.cabinCode, name: cabin.cabinName },
        capacity: cabin.bedCount,
        zone: zones.find(z => z.id === cabin.zoneId)
      });
    });

    musterStations.forEach(ms => {
      entities.push({
        type: 'MUSTER_STATION',
        entity: { ...ms, code: ms.musterCode, name: ms.name },
        capacity: ms.capacityPersons,
        zone: zones.find(z => z.id === ms.zoneId)
      });
    });

    lifeboats.forEach(lb => {
      entities.push({
        type: 'LIFEBOAT',
        entity: { ...lb, code: lb.boatCode, name: `${lb.boatType} ${lb.side}` },
        capacity: lb.capacityPersons,
        zone: zones.find(z => z.id === lb.zoneId)
      });
    });

    lifeRaftGroups.forEach(lr => {
      entities.push({
        type: 'LIFE_RAFT_GROUP',
        entity: { ...lr, code: lr.groupCode, name: lr.notes },
        capacity: lr.totalCapacity || (lr.raftCount * lr.capacityPerRaft),
        zone: zones.find(z => z.id === lr.zoneId)
      });
    });

    accessPoints.forEach(ap => {
      entities.push({
        type: 'ACCESS_POINT',
        entity: { ...ap, code: ap.accessCode, name: ap.name },
        capacity: null,
        zone: zones.find(z => z.id === ap.zoneId)
      });
    });

    return entities;
  };

  const allEntities = buildEntityList();

  // Filter entities
  const filteredEntities = allEntities.filter(item => {
    const typeMatch = entityTypeFilter === 'All' || item.type === entityTypeFilter;
    const searchMatch = !searchQuery || 
      item.entity.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.entity.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!typeMatch || !searchMatch) return false;

    if (showOnlyAssigned) {
      const assignedCount = assignments.filter(a => 
        a.entityType === item.type && 
        a.entityId === item.entity.publicId && 
        a.status === 'ACTIVE'
      ).length;
      return assignedCount > 0;
    }

    return true;
  });

  // Get assignments for selected entity
  const selectedAssignments = selectedEntity 
    ? assignments.filter(a => 
        a.entityType === selectedEntity.type && 
        a.entityId === selectedEntity.entity.publicId
      ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    : [];

  const activeCount = selectedAssignments.filter(a => a.status === 'ACTIVE').length;
  const capacity = selectedEntity?.capacity;

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setFormData({
      personName: '', rankName: '', personCategory: 'CREW', fromDateTime: '', toDateTime: '', status: 'ACTIVE'
    });
    setShowDialog(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      personName: assignment.personName,
      rankName: assignment.rankName || '',
      personCategory: assignment.personCategory,
      fromDateTime: assignment.fromDateTime || '',
      toDateTime: assignment.toDateTime || '',
      status: assignment.status
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getEntityTypeLabel = (type) => {
    const labels = {
      'CABIN': 'Cabin',
      'MUSTER_STATION': 'Muster Station',
      'LIFEBOAT': 'Lifeboat',
      'LIFE_RAFT_GROUP': 'Life Raft Group',
      'ACCESS_POINT': 'Access Point'
    };
    return labels[type] || type;
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'CREW': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      'SUPERNUMERARY': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      'PASSENGER': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      'GUEST_WORKER': 'bg-teal-500/10 text-teal-600 border-teal-500/30'
    };
    return colors[category] || 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* LEFT PANEL - Entity Selector */}
      <Card className="bg-white border-gray-200 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Entities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Entity Type</Label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="CABIN">Cabins</SelectItem>
                  <SelectItem value="MUSTER_STATION">Muster Stations</SelectItem>
                  <SelectItem value="LIFEBOAT">Lifeboats</SelectItem>
                  <SelectItem value="LIFE_RAFT_GROUP">Life Rafts</SelectItem>
                  <SelectItem value="ACCESS_POINT">Access Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-gray-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showOnlyAssigned"
                checked={showOnlyAssigned}
                onChange={(e) => setShowOnlyAssigned(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showOnlyAssigned" className="text-sm cursor-pointer">
                Show only assigned
              </Label>
            </div>
          </div>

          {/* Entity List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEntities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No entities found</p>
              </div>
            ) : (
              filteredEntities.map((item, idx) => {
                const assignedCount = assignments.filter(a => 
                  a.entityType === item.type && 
                  a.entityId === item.entity.publicId && 
                  a.status === 'ACTIVE'
                ).length;
                const isSelected = selectedEntity?.entity.publicId === item.entity.publicId;
                const hasCapacity = item.capacity !== null && item.capacity !== undefined;
                const isOverCapacity = hasCapacity && assignedCount > item.capacity;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedEntity(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {item.entity.code}
                        </p>
                        {item.entity.name && (
                          <p className="text-xs text-gray-600 truncate">{item.entity.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className="text-xs bg-slate-500/10 text-slate-600 border-slate-500/30">
                            {getEntityTypeLabel(item.type)}
                          </Badge>
                          {item.zone && (
                            <span className="text-xs text-gray-500">{item.zone.code}</span>
                          )}
                        </div>
                      </div>
                      {hasCapacity && (
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-semibold ${isOverCapacity ? 'text-red-600' : 'text-gray-900'}`}>
                            {assignedCount}/{item.capacity}
                          </p>
                          {isOverCapacity && (
                            <AlertCircle className="w-4 h-4 text-red-600 ml-auto" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* RIGHT PANEL - Selected Entity Details */}
      <div className="lg:col-span-2 space-y-4">
        {!selectedEntity ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="py-20 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Select an entity to view assignments</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header Card */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/30">
                        {getEntityTypeLabel(selectedEntity.type)}
                      </Badge>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedEntity.entity.code}
                      </h3>
                    </div>
                    {selectedEntity.entity.name && (
                      <p className="text-sm text-gray-600 mb-2">{selectedEntity.entity.name}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {selectedEntity.zone && (
                        <span>Zone: {selectedEntity.zone.code}</span>
                      )}
                      {selectedEntity.entity.deck && (
                        <span>Deck: {selectedEntity.entity.deck}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {capacity !== null && capacity !== undefined ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          {activeCount}/{capacity}
                        </p>
                        <p className="text-xs text-gray-600">Active Assignments</p>
                        {activeCount > capacity ? (
                          <Badge className="mt-2 bg-red-500/10 text-red-600 border-red-500/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Over capacity
                          </Badge>
                        ) : activeCount < capacity ? (
                          <Badge className="mt-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {capacity - activeCount} slots available
                          </Badge>
                        ) : (
                          <Badge className="mt-2 bg-amber-500/10 text-amber-600 border-amber-500/30">
                            Full capacity
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                        <p className="text-xs text-gray-600">Active Assignments</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignments Table */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Assigned Persons</CardTitle>
                <Button
                  onClick={handleAddAssignment}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Assignment
                </Button>
              </CardHeader>
              <CardContent>
                {selectedAssignments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No assignments yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person Name</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAssignments.map(assignment => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.personName}</TableCell>
                          <TableCell>{assignment.rankName || '-'}</TableCell>
                          <TableCell>
                            <Badge className={`${getCategoryBadgeColor(assignment.personCategory)} border text-xs`}>
                              {assignment.personCategory}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.fromDateTime ? format(new Date(assignment.fromDateTime), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {assignment.toDateTime ? format(new Date(assignment.toDateTime), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={assignment.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                              : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                              {assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditAssignment(assignment)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingAssignment(assignment)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Person Name *</Label>
                <Input
                  value={formData.personName}
                  onChange={(e) => setFormData({...formData, personName: e.target.value})}
                  required
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label>Rank / Position</Label>
                <Input
                  value={formData.rankName}
                  onChange={(e) => setFormData({...formData, rankName: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.personCategory} onValueChange={(v) => setFormData({...formData, personCategory: v})}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREW">Crew</SelectItem>
                  <SelectItem value="SUPERNUMERARY">Supernumerary</SelectItem>
                  <SelectItem value="PASSENGER">Passenger</SelectItem>
                  <SelectItem value="GUEST_WORKER">Guest Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={formData.fromDateTime}
                  onChange={(e) => setFormData({...formData, fromDateTime: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={formData.toDateTime}
                  onChange={(e) => setFormData({...formData, toDateTime: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ENDED">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                {editingAssignment ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAssignment} onOpenChange={() => setDeletingAssignment(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment for {deletingAssignment?.personName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingAssignment.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}