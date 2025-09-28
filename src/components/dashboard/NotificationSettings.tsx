'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from '@/components/ui/use-toast';
import { 
  Bell, 
  BellOff, 
  Shield, 
  AlertTriangle, 
  Info, 
  Settings,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react';

interface NotificationSettings {
  criticalVulnerabilities: boolean;
  highSeverityThreats: boolean;
  systemOffline: boolean;
  newEndpoints: boolean;
  complianceAlerts: boolean;
  securityBreaches: boolean;
  weeklyReports: boolean;
  soundEnabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export default function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    requestPermission, 
    subscribe, 
    unsubscribe,
    sendTestNotification 
  } = useNotifications();

  const [settings, setSettings] = useState<NotificationSettings>({
    criticalVulnerabilities: true,
    highSeverityThreats: true,
    systemOffline: true,
    newEndpoints: false,
    complianceAlerts: true,
    securityBreaches: true,
    weeklyReports: false,
    soundEnabled: true,
    frequency: 'immediate',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('komra-notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('komra-notification-settings', JSON.stringify(newSettings));
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const handleToggleSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const permissionGranted = await requestPermission();
      if (permissionGranted) {
        await subscribe();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await unsubscribe();
      toast({
        title: "Notifications Disabled",
        description: "Push notifications have been disabled successfully.",
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatus = () => {
    // Check both permission and subscription status
    if (permission === 'granted' && isSubscribed) {
      return { text: 'Enabled', variant: 'default' as const, icon: Bell };
    } else if (permission === 'denied') {
      return { text: 'Blocked', variant: 'destructive' as const, icon: BellOff };
    } else {
      return { text: 'Disabled', variant: 'secondary' as const, icon: BellOff };
    }
  };

  const permissionStatus = getPermissionStatus();
  const StatusIcon = permissionStatus.icon;

  if (!isSupported) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <p className="text-muted-foreground">
            Configure how you receive security alerts and updates
          </p>
        </div>
        <Badge variant={permissionStatus.variant} className="flex items-center gap-1">
          <StatusIcon className="h-3 w-3" />
          {permissionStatus.text}
        </Badge>
      </div>

      {/* Permission Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Push Notification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {(permission === 'granted' && isSubscribed)
                  ? 'Notifications are enabled and working'
                  : permission === 'denied'
                  ? 'Notifications are blocked. Enable them in your browser settings.'
                  : 'Click to enable browser notifications'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(permission === 'granted' && isSubscribed) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={sendTestNotification}
                >
                  Test
                </Button>
              )}
              {(permission === 'granted' && isSubscribed) ? (
                <Button 
                  variant="destructive" 
                  onClick={handleDisableNotifications}
                  disabled={isLoading}
                >
                  {isLoading ? 'Disabling...' : 'Disable'}
                </Button>
              ) : (
                <Button 
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Enabling...' : 'Enable Notifications'}
                </Button>
              )}
            </div>
          </div>

          {isSubscribed && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Shield className="h-4 w-4" />
              Push notifications are active
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Alerts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            High-priority security events that require immediate attention
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <Label className="text-base">Critical Vulnerabilities</Label>
                  <p className="text-sm text-muted-foreground">CVSS 9.0+ vulnerabilities</p>
                </div>
              </div>
              <Switch
                checked={settings.criticalVulnerabilities}
                onCheckedChange={(checked) => handleToggleSetting('criticalVulnerabilities', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-red-500" />
                <div>
                  <Label className="text-base">System Offline</Label>
                  <p className="text-sm text-muted-foreground">When endpoints go offline</p>
                </div>
              </div>
              <Switch
                checked={settings.systemOffline}
                onCheckedChange={(checked) => handleToggleSetting('systemOffline', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-red-500" />
                <div>
                  <Label className="text-base">Security Breaches</Label>
                  <p className="text-sm text-muted-foreground">Detected intrusion attempts</p>
                </div>
              </div>
              <Switch
                checked={settings.securityBreaches}
                onCheckedChange={(checked) => handleToggleSetting('securityBreaches', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Priority Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            High Priority Alerts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Important security events that should be addressed promptly
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-orange-500" />
                <div>
                  <Label className="text-base">High Severity Threats</Label>
                  <p className="text-sm text-muted-foreground">CVSS 7.0-8.9 vulnerabilities</p>
                </div>
              </div>
              <Switch
                checked={settings.highSeverityThreats}
                onCheckedChange={(checked) => handleToggleSetting('highSeverityThreats', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-blue-500" />
                <div>
                  <Label className="text-base">New Endpoints</Label>
                  <p className="text-sm text-muted-foreground">When new systems are discovered</p>
                </div>
              </div>
              <Switch
                checked={settings.newEndpoints}
                onCheckedChange={(checked) => handleToggleSetting('newEndpoints', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-purple-500" />
                <div>
                  <Label className="text-base">Compliance Alerts</Label>
                  <p className="text-sm text-muted-foreground">Policy violations and compliance issues</p>
                </div>
              </div>
              <Switch
                checked={settings.complianceAlerts}
                onCheckedChange={(checked) => handleToggleSetting('complianceAlerts', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Notification Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Notification Frequency</Label>
              <Select
                value={settings.frequency}
                onValueChange={(value: 'immediate' | 'hourly' | 'daily') => {
                  const newSettings = { ...settings, frequency: value };
                  saveSettings(newSettings);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly Summary</SelectItem>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Quiet Hours Start</Label>
              <Input 
                type="time" 
                value={settings.quietHours.start}
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    quietHours: { ...settings.quietHours, start: e.target.value }
                  };
                  saveSettings(newSettings);
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quiet Hours End</Label>
              <Input 
                type="time" 
                value={settings.quietHours.end}
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    quietHours: { ...settings.quietHours, end: e.target.value }
                  };
                  saveSettings(newSettings);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label className="text-sm font-medium">Enable Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">Suppress non-critical notifications during specified hours</p>
            </div>
            <Switch
              checked={settings.quietHours.enabled}
              onCheckedChange={(checked) => {
                const newSettings = {
                  ...settings,
                  quietHours: { ...settings.quietHours, enabled: checked }
                };
                saveSettings(newSettings);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-blue-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-500" />
              )}
              <div>
                <Label className="text-base">Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">Play sound with notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => handleToggleSetting('soundEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}