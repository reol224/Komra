"use client";

import React, { useEffect, useState } from 'react';
import { SessionManagementService, ActiveSession } from '@/lib/sessionManagementService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Monitor, 
  LogOut, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  MapPin,
  User
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function SessionManagement() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeCount: 0, totalCount: 0, last24Hours: 0 });
  const [sessionToTerminate, setSessionToTerminate] = useState<ActiveSession | null>(null);
  const [userToForceLogout, setUserToForceLogout] = useState<ActiveSession | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    const data = await SessionManagementService.getAllActiveSessions();
    setSessions(data);
    
    const statsData = await SessionManagementService.getSessionStats();
    setStats(statsData);
    
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTerminateSession = async (session: ActiveSession) => {
    const success = await SessionManagementService.terminateSession(
      session.id,
      user?.id
    );

    if (success) {
      toast({
        title: "Session Terminated",
        description: `Session for ${session.user_email} has been terminated.`,
      });
      loadSessions();
    } else {
      toast({
        title: "Error",
        description: "Failed to terminate session.",
        variant: "destructive",
      });
    }
    setSessionToTerminate(null);
  };

  const handleForceLogout = async (session: ActiveSession) => {
    const count = await SessionManagementService.terminateAllUserSessions(
      session.user_id,
      user?.id
    );

    if (count > 0) {
      toast({
        title: "Force Logout Complete",
        description: `${count} session(s) terminated for ${session.user_email}.`,
      });
      loadSessions();
    } else {
      toast({
        title: "Error",
        description: "Failed to force logout user.",
        variant: "destructive",
      });
    }
    setUserToForceLogout(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const parseUserAgent = (ua?: string) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  // Group sessions by user
  const sessionsByUser = sessions.reduce((acc, session) => {
    const key = session.user_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(session);
    return acc;
  }, {} as Record<string, ActiveSession[]>);

  return (
    <div className="space-y-6 bg-slate-900 min-h-screen p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeCount}</div>
            <p className="text-xs text-slate-400 mt-1">Currently logged in</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalCount}</div>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">Last 24 Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.last24Hours}</div>
            <p className="text-xs text-slate-400 mt-1">Recent logins</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Active Sessions</CardTitle>
              <CardDescription className="text-slate-400">
                Monitor and manage user sessions across the platform
              </CardDescription>
            </div>
            <Button
              onClick={loadSessions}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No active sessions</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(sessionsByUser).map(([userId, userSessions]) => {
                const firstSession = userSessions[0];
                return (
                  <div key={userId} className="border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {firstSession.user_name || firstSession.user_email}
                          </div>
                          <div className="text-sm text-slate-400">{firstSession.user_email}</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setUserToForceLogout(firstSession)}
                        variant="destructive"
                        size="sm"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Force Logout ({userSessions.length})
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-750">
                          <TableHead className="text-slate-300">Device</TableHead>
                          <TableHead className="text-slate-300">Location</TableHead>
                          <TableHead className="text-slate-300">Last Activity</TableHead>
                          <TableHead className="text-slate-300">Expires</TableHead>
                          <TableHead className="text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userSessions.map((session) => (
                          <TableRow key={session.id} className="border-slate-700 hover:bg-slate-750">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-300">
                                  {parseUserAgent(session.user_agent)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-300">
                                  {session.ip_address || 'Unknown'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-300">
                                  {formatDate(session.last_activity)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-slate-600 text-slate-300">
                                {getTimeRemaining(session.expires_at)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => setSessionToTerminate(session)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <LogOut className="h-4 w-4 mr-1" />
                                End
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminate Single Session Dialog */}
      <AlertDialog open={!!sessionToTerminate} onOpenChange={() => setSessionToTerminate(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Terminate Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will immediately end this session for {sessionToTerminate?.user_email}. 
              The user will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToTerminate && handleTerminateSession(sessionToTerminate)}
              className="bg-red-600 hover:bg-red-700"
            >
              Terminate Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Logout Dialog */}
      <AlertDialog open={!!userToForceLogout} onOpenChange={() => setUserToForceLogout(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Force Logout User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will immediately terminate <strong>ALL</strong> active sessions for{' '}
              <strong>{userToForceLogout?.user_email}</strong>. This action is logged and 
              should only be used in emergency situations (e.g., employee termination, 
              security breach).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToForceLogout && handleForceLogout(userToForceLogout)}
              className="bg-red-600 hover:bg-red-700"
            >
              Force Logout All Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
