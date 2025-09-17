import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/components/auth/ProtectedComponent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Shield, Settings } from 'lucide-react';

export function UserProfile() {
  const { user, signOut } = useAuth();
  const { isAdmin, isAnalyst, canAccess } = usePermissions();

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'analyst': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Avatar className="mx-auto h-16 w-16">
          <AvatarFallback className="text-lg">
            {getInitials(user.full_name, user.email)}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="mt-2">
          {user.full_name || user.email}
        </CardTitle>
        <Badge className={getRoleColor(user.role)}>
          <Shield className="mr-1 h-3 w-3" />
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <User className="mr-2 h-4 w-4" />
            {user.email}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${canAccess('vulnerabilities', 'read') ? 'bg-green-500' : 'bg-red-500'}`} />
              View CVEs
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${canAccess('triage', 'create') ? 'bg-green-500' : 'bg-red-500'}`} />
              Triage CVEs
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${canAccess('reports', 'export') ? 'bg-green-500' : 'bg-red-500'}`} />
              Export Reports
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${canAccess('users', 'read') ? 'bg-green-500' : 'bg-red-500'}`} />
              Manage Users
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}