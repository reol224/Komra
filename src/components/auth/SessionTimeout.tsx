"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Clock, LogOut, AlertTriangle } from "lucide-react";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

export function SessionTimeout() {
  const { signOut, user } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isIdle, setIsIdle] = useState(false);

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
    setIsIdle(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [signOut]);

  const extendSession = useCallback(() => {
    resetActivity();
    setShowWarning(false);
  }, [resetActivity]);

  useEffect(() => {
    if (!user) return;

    // Add activity listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, resetActivity, true);
    });

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, resetActivity, true);
      });
    };
  }, [user, resetActivity]);

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const remaining = SESSION_TIMEOUT - timeSinceActivity;

      if (remaining <= 0) {
        // Session expired - force logout
        setIsIdle(true);
        handleLogout();
        return;
      }

      if (remaining <= WARNING_TIME && !showWarning) {
        // Show warning
        setShowWarning(true);
        setTimeLeft(remaining);
      }

      if (showWarning) {
        setTimeLeft(remaining);
      }
    };

    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, [user, lastActivity, showWarning, handleLogout]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeoutByRole = () => {
    switch (user?.role) {
      case 'admin':
        return '15 minutes'; // Shorter timeout for admin
      case 'analyst':
        return '30 minutes';
      case 'viewer':
        return '30 minutes';
      default:
        return '30 minutes';
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Session Timeout Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Session Timeout Warning
            </DialogTitle>
            <DialogDescription>
              Your session will expire due to inactivity. This is a security measure to protect sensitive data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Time remaining: <strong>{formatTime(timeLeft)}</strong></p>
                  <Progress value={(timeLeft / WARNING_TIME) * 100} className="w-full" />
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-800">
                <p className="font-medium">Security Policy</p>
                <p>Sessions timeout after {getTimeoutByRole()} of inactivity for {user.role} users.</p>
                {user.role === 'admin' && (
                  <p className="mt-1 font-medium">⚠️ Administrative sessions have shorter timeouts for enhanced security.</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={extendSession} className="flex-1">
                <Clock className="mr-2 h-4 w-4" />
                Extend Session
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex-1">
                <LogOut className="mr-2 h-4 w-4" />
                Logout Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Idle Session Dialog */}
      <Dialog open={isIdle} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-500" />
              Session Expired
            </DialogTitle>
            <DialogDescription>
              Your session has expired due to inactivity. Please log in again to continue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have been automatically logged out for security reasons.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="text-xs text-gray-600">
                <p className="font-medium">Why did this happen?</p>
                <p>Automatic logout prevents unauthorized access from unattended sessions and protects sensitive security data.</p>
              </div>
            </div>

            <Button onClick={() => window.location.reload()} className="w-full">
              Return to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}