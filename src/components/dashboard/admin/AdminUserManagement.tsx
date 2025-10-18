'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Plus, Edit, Trash2, Shield, Search } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PermissionMatrix from './PermissionMatrix';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissionService';
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
  status: 'active' | 'inactive' | 'suspended';
}

interface RelatedRecords {
  remediationPlans: any[];
  triageActions: any[];
  auditLogs: any[];
}

interface ReassignmentData {
  remediationPlans: { [planId: string]: string }; // planId -> userId
  triageActions: { [actionId: string]: string }; // actionId -> userId
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState({
    email: '',
    full_name: '',
    role: 'viewer' as UserRole
  });
  const [editForm, setEditForm] = useState({
    email: '',
    full_name: '',
    role: '' as UserRole,
    status: '' as 'active' | 'inactive' | 'suspended'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showReassignmentDialog, setShowReassignmentDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [relatedRecords, setRelatedRecords] = useState<RelatedRecords | null>(null);
  const [reassignmentData, setReassignmentData] = useState<ReassignmentData>({
    remediationPlans: {},
    triageActions: {}
  });
  const [isReassigning, setIsReassigning] = useState(false);

  // Load users from database
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        // Fallback to mock data if database fails
        setUsers([
          {
            id: '1',
            email: 'admin@koma.security',
            full_name: 'System Administrator',
            role: 'admin',
            created_at: '2024-01-15T10:00:00Z',
            last_login: '2024-03-22T14:30:00Z',
            status: 'active'
          },
          {
            id: '2',
            email: 'analyst@koma.security',
            full_name: 'Security Analyst',
            role: 'analyst',
            created_at: '2024-02-01T09:00:00Z',
            last_login: '2024-03-22T13:45:00Z',
            status: 'active'
          }
        ]);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'analyst': return 'default';
      case 'viewer': return 'secondary';
      default: return 'default';
    }
  };

  const getRoleBadgeClassName = (role: UserRole) => {
    switch (role) {
      case 'admin': return '';
      case 'analyst': return '';
      case 'viewer': return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case 'active': return '';
      case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200';
      case 'suspended': return '';
      default: return '';
    }
  };

  const handleCreateUser = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Sanitize form data
      const sanitizedData = {
        email: sanitizeEmail(createForm.email),
        full_name: sanitizeText(createForm.full_name, 100),
        role: createForm.role
      };

      // Validate required fields
      if (!sanitizedData.email) {
        setFormErrors({ email: 'Valid email is required' });
        setIsSubmitting(false);
        return;
      }

      if (!sanitizedData.full_name) {
        setFormErrors({ full_name: 'Full name is required' });
        setIsSubmitting(false);
        return;
      }

      // Insert user into database
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: sanitizedData.email,
            full_name: sanitizedData.full_name,
            role: sanitizedData.role,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        if (error.code === '23505') {
          setFormErrors({ email: 'A user with this email already exists' });
        } else {
          setFormErrors({ general: 'Failed to create user. Please try again.' });
        }
        return;
      }

      // Add to local state
      setUsers(prev => [data, ...prev]);
      
      // Reset form and close dialog
      setCreateForm({ email: '', full_name: '', role: 'viewer' });
      setIsCreateDialogOpen(false);
      
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error) {
        setFormErrors({ general: error.message });
      } else {
        setFormErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Sanitize form data
      const sanitizedData = {
        email: sanitizeEmail(editForm.email),
        full_name: sanitizeText(editForm.full_name, 100),
        role: editForm.role,
        status: editForm.status
      };

      // Validate required fields
      if (!sanitizedData.email) {
        setFormErrors({ email: 'Valid email is required' });
        setIsSubmitting(false);
        return;
      }

      if (!sanitizedData.full_name) {
        setFormErrors({ full_name: 'Full name is required' });
        setIsSubmitting(false);
        return;
      }

      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({
          email: sanitizedData.email,
          full_name: sanitizedData.full_name,
          role: sanitizedData.role,
          status: sanitizedData.status
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error('Error updating user:', error);
        if (error.code === '23505') {
          setFormErrors({ email: 'A user with this email already exists' });
        } else {
          setFormErrors({ general: 'Failed to update user. Please try again.' });
        }
        return;
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...sanitizedData }
          : user
      ));

      setIsEditDialogOpen(false);
      setEditingUser(null);
      setEditForm({ email: '', full_name: '', role: 'viewer', status: 'active' });
      
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error) {
        setFormErrors({ general: error.message });
      } else {
        setFormErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setIsDeleting(userId);
    
    try {
      // Check for related records - check ALL foreign key references
      const [remediationPlansAssigned, remediationPlansCreated, triageActionsAssigned, triageActionsTriaged, auditLogs] = await Promise.all([
        supabase
          .from('remediation_plans')
          .select('id, title, priority, status, created_at')
          .eq('assigned_to', userId),
        supabase
          .from('remediation_plans')
          .select('id, title, priority, status, created_at')
          .eq('created_by', userId),
        supabase
          .from('triage_actions')
          .select('id, action_type, description, status, created_at')
          .eq('assigned_to', userId),
        supabase
          .from('triage_actions')
          .select('id, action_type, description, status, created_at')
          .eq('triaged_by', userId),
        supabase.from('audit_logs').select('*').eq('user_id', userId)
      ]);

      // Combine remediation plans (remove duplicates if user is both creator and assignee)
      const allRemediationPlans = [
        ...(remediationPlansAssigned.data || []),
        ...(remediationPlansCreated.data || [])
      ].filter((plan, index, self) => 
        index === self.findIndex(p => p.id === plan.id)
      );

      // Combine triage actions (remove duplicates if user is both assignee and triager)
      const allTriageActions = [
        ...(triageActionsAssigned.data || []),
        ...(triageActionsTriaged.data || [])
      ].filter((action, index, self) => 
        index === self.findIndex(a => a.id === action.id)
      );

      const hasRelatedRecords = 
        allRemediationPlans.length > 0 ||
        allTriageActions.length > 0 ||
        (auditLogs.data && auditLogs.data.length > 0);

      if (hasRelatedRecords) {
        // Show info dialog with what they're assigned to
        setUserToDelete(user);
        setRelatedRecords({
          remediationPlans: allRemediationPlans,
          triageActions: allTriageActions,
          auditLogs: auditLogs.data || []
        });
        setShowReassignmentDialog(true);
        return;
      }

      // If no related records, proceed with deletion
      await performUserDeletion(userId);
      
    } catch (error) {
      console.error('Error checking user dependencies:', error);
      alert('An error occurred while checking user dependencies.');
    } finally {
      setIsDeleting(null);
    }
  };

  const performUserDeletion = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
        return;
      }

      setUsers(users.filter(user => user.id !== userId));
      alert('User deleted successfully.');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An unexpected error occurred while deleting the user.');
    }
  };

  const handleReassignAndDelete = async () => {
    if (!userToDelete || !relatedRecords) return;

    setIsReassigning(true);
    
    try {
      const updates: Promise<any>[] = [];

      // Reassign remediation plans individually (both assigned_to and created_by)
      Object.entries(reassignmentData.remediationPlans).forEach(([planId, assignedTo]) => {
        if (assignedTo) {
          // Update both assigned_to and created_by if they reference the deleted user
          updates.push(
            new Promise(async (resolve, reject) => {
              const { error } = await supabase
                .from('remediation_plans')
                .update({ 
                  assigned_to: assignedTo,
                  created_by: assignedTo
                })
                .eq('id', planId);
              
              if (error) reject(error);
              else resolve(null);
            })
          );
        }
      });

      // Reassign triage actions individually (both assigned_to and triaged_by)
      Object.entries(reassignmentData.triageActions).forEach(([actionId, assignedTo]) => {
        if (assignedTo) {
          // Update both assigned_to and triaged_by if they reference the deleted user
          updates.push(
            new Promise(async (resolve, reject) => {
              const { error } = await supabase
                .from('triage_actions')
                .update({ 
                  assigned_to: assignedTo,
                  triaged_by: assignedTo
                })
                .eq('id', actionId);
              
              if (error) reject(error);
              else resolve(null);
            })
          );
        }
      });

      // Execute all reassignments
      if (updates.length > 0) {
        const results = await Promise.all(updates);
        const hasErrors = results.some(result => result.error);
        
        if (hasErrors) {
          console.error('Reassignment errors:', results.filter(r => r.error));
          alert('Failed to reassign some records. Please try again.');
          return;
        }
      }

      // Log the reassignment actions with details
      const reassignmentDetails = {
        remediation_plans: Object.entries(reassignmentData.remediationPlans)
          .filter(([_, assignedTo]) => assignedTo)
          .map(([planId, assignedTo]) => ({
            plan_id: planId,
            plan_title: relatedRecords.remediationPlans.find(p => p.id === planId)?.title,
            reassigned_to: users.find(u => u.id === assignedTo)?.full_name
          })),
        triage_actions: Object.entries(reassignmentData.triageActions)
          .filter(([_, assignedTo]) => assignedTo)
          .map(([actionId, assignedTo]) => ({
            action_id: actionId,
            action_type: relatedRecords.triageActions.find(a => a.id === actionId)?.action_type,
            reassigned_to: users.find(u => u.id === assignedTo)?.full_name
          }))
      };

      const reassignmentLog = {
        action: 'user_deletion_reassignment',
        user_id: userToDelete.id,
        details: {
          deleted_user: userToDelete.full_name,
          reassignments: reassignmentDetails,
          counts: {
            remediation_plans: relatedRecords.remediationPlans.length,
            triage_actions: relatedRecords.triageActions.length,
            audit_logs: relatedRecords.auditLogs.length
          }
        }
      };

      await supabase.from('audit_logs').insert(reassignmentLog);

      // Now delete the user
      await performUserDeletion(userToDelete.id);
      
      // Close dialog and reset state
      setShowReassignmentDialog(false);
      setUserToDelete(null);
      setRelatedRecords(null);
      
    } catch (error) {
      console.error('Error during reassignment and deletion:', error);
      alert('An error occurred during reassignment. Please try again.');
    } finally {
      setIsReassigning(false);
    }
  };

  const canProceedWithDeletion = () => {
    if (!relatedRecords) return false;
    
    // Check if all items that need reassignment have been assigned
    const unassignedRemediation = relatedRecords.remediationPlans.some(
      plan => !reassignmentData.remediationPlans[plan.id]
    );
    const unassignedTriage = relatedRecords.triageActions.some(
      action => !reassignmentData.triageActions[action.id]
    );
    
    return !unassignedRemediation && !unassignedTriage;
  };

  const updateRemediationAssignment = (planId: string, userId: string) => {
    setReassignmentData(prev => ({
      ...prev,
      remediationPlans: {
        ...prev.remediationPlans,
        [planId]: userId
      }
    }));
  };

  const updateTriageAssignment = (actionId: string, userId: string) => {
    setReassignmentData(prev => ({
      ...prev,
      triageActions: {
        ...prev.triageActions,
        [actionId]: userId
      }
    }));
  };

  const getAvailableUsersForRemediation = () => {
    // Remediation plans should be assigned to Analysts or Admins
    return users.filter(user => 
      user.id !== userToDelete?.id && 
      (user.role === 'analyst' || user.role === 'admin')
    );
  };

  const getAvailableUsersForTriage = () => {
    // Triage actions should be assigned to Analysts or Admins
    return users.filter(user => 
      user.id !== userToDelete?.id && 
      (user.role === 'analyst' || user.role === 'admin')
    );
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return;
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">User Management</h3>
        </div>
      </div>

      {/* Tabs for User Management and Permission Matrix */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Accounts</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          {/* Add User Button */}
          <PermissionGuard permission={PERMISSIONS.USERS_CREATE}>
            <div className="flex justify-end">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {formErrors.general && (
                      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{formErrors.general}</p>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@company.com"
                        value={createForm.email}
                        onChange={(e) => {
                          setCreateForm({...createForm, email: e.target.value});
                          if (formErrors.email) setFormErrors(prev => ({...prev, email: ''}));
                        }}
                        className={formErrors.email ? 'border-red-500' : ''} />
                      {formErrors.email && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={createForm.full_name}
                        onChange={(e) => {
                          setCreateForm({...createForm, full_name: e.target.value});
                          if (formErrors.full_name) setFormErrors(prev => ({...prev, full_name: ''}));
                        }}
                        className={formErrors.full_name ? 'border-red-500' : ''} />
                      {formErrors.full_name && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.full_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={createForm.role}
                        onValueChange={(value: UserRole) => setCreateForm({...createForm, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="analyst">Analyst</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={handleCreateUser} className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating User...
                        </>
                      ) : (
                        'Create User'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </PermissionGuard>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10" />
                  </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <PermissionGuard permissions={[PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE]}>
                      <TableHead>Actions</TableHead>
                    </PermissionGuard>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleColor(user.role)} 
                          className={`capitalize ${getRoleBadgeClassName(user.role)}`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(user.status)}
                          className={getStatusBadgeClassName(user.status)}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_login ? 
                          new Date(user.last_login).toLocaleDateString() : 
                          'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <PermissionGuard permissions={[PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE]}>
                        <TableCell>
                          <div className="flex space-x-2">
                            <PermissionGuard permission={PERMISSIONS.USERS_EDIT}>
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.USERS_DELETE}>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.full_name}? 
                                      <br /><br />
                                      This will check for any related records (remediation plans, triage actions, audit logs) that reference this user. If any are found, you'll need to reassign them before deletion can proceed.
                                      <br /><br />
                                      <strong>This action cannot be undone.</strong>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting === user.id}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.id)}
                                      disabled={isDeleting === user.id}
                                      className="bg-red-600 hover:bg-red-700">
                                      {isDeleting === user.id ? (
                                        <>
                                          <div
                                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Deleting...
                                        </>
                                      ) : (
                                        'Delete User'
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </PermissionGuard>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.role === 'admin').length}
                    </div>
                    <div className="text-sm text-gray-500">Administrators</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.role === 'analyst').length}
                    </div>
                    <div className="text-sm text-gray-500">Analysts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.role === 'viewer').length}
                    </div>
                    <div className="text-sm text-gray-500">Viewers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-500">Active Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="permissions">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>

      {/* Reassignment Dialog */}
      <AlertDialog open={showReassignmentDialog} onOpenChange={setShowReassignmentDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Records Before Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete?.full_name} has related records that must be reassigned before deletion can proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            {relatedRecords?.remediationPlans && relatedRecords.remediationPlans.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  Remediation Plans ({relatedRecords.remediationPlans.length})
                </h4>
                <div className="space-y-2">
                  {relatedRecords.remediationPlans.map(plan => (
                    <div key={plan.id} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{plan.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {plan.priority} • {plan.status}
                        </div>
                      </div>
                      <Select 
                        value={reassignmentData.remediationPlans[plan.id] || ''} 
                        onValueChange={(value) => updateRemediationAssignment(plan.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableUsersForRemediation().map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedRecords?.triageActions && relatedRecords.triageActions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  Triage Actions ({relatedRecords.triageActions.length})
                </h4>
                <div className="space-y-2">
                  {relatedRecords.triageActions.map(action => (
                    <div key={action.id} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{action.action_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                      <Select 
                        value={reassignmentData.triageActions[action.id] || ''} 
                        onValueChange={(value) => updateTriageAssignment(action.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableUsersForTriage().map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedRecords?.auditLogs && relatedRecords.auditLogs.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  Audit Logs ({relatedRecords.auditLogs.length})
                </h4>
                <p className="text-sm text-muted-foreground">
                  Audit logs will be preserved for historical accuracy. No reassignment needed.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReassignmentDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReassignAndDelete}
              disabled={!canProceedWithDeletion() || isReassigning}
            >
              {isReassigning ? 'Processing...' : 'Reassign & Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formErrors.general && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{formErrors.general}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => {
                  setEditForm({...editForm, email: e.target.value});
                  if (formErrors.email) setFormErrors(prev => ({...prev, email: ''}));
                }}
                className={formErrors.email ? 'border-red-500' : ''} />
              {formErrors.email && (
                <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={editForm.full_name}
                onChange={(e) => {
                  setEditForm({...editForm, full_name: e.target.value});
                  if (formErrors.full_name) setFormErrors(prev => ({...prev, full_name: ''}));
                }}
                className={formErrors.full_name ? 'border-red-500' : ''} />
              {formErrors.full_name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.full_name}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-role">Role *</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: UserRole) => setEditForm({...editForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: 'active' | 'inactive' | 'suspended') => setEditForm({...editForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleUpdateUser} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div
                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating User...
                  </>
                ) : (
                  'Update User'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setFormErrors({});
                }}
                className="flex-1"
                disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}