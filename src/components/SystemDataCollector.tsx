"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  RefreshCw, 
  Server, 
  Package, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  HardDrive,
  Cpu,
  Network
} from 'lucide-react';

interface SystemData {
  hostname: string;
  os_type: string;
  packages_count: number;
  last_scan: string;
}

interface CollectionResult {
  success: boolean;
  message?: string;
  data?: SystemData;
  error?: string;
}

export default function SystemDataCollector() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [result, setResult] = useState<CollectionResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleCollectData = async () => {
    setIsCollecting(true);
    setProgress(0);
    setResult(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await fetch('/api/system-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
      setProgress(100);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect system data'
      });
      setProgress(100);
    } finally {
      clearInterval(progressInterval);
      setIsCollecting(false);
    }
  };

  const formatLastScan = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Download className="h-8 w-8 text-blue-600" />
              System Data Collector
            </h1>
            <p className="text-muted-foreground mt-2">
              Collect comprehensive system information from Windows, Linux, and macOS machines
            </p>
          </div>
          <Button 
            onClick={handleCollectData} 
            disabled={isCollecting}
            size="lg"
            className="flex items-center gap-2"
          >
            {isCollecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Collecting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Collect System Data
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {isCollecting && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Collecting system data...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                {result.success ? result.message : result.error}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* System Information Cards */}
        {result?.success && result.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hostname</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.data.hostname}</div>
                <p className="text-xs text-muted-foreground">System identifier</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operating System</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.data.os_type}</div>
                <p className="text-xs text-muted-foreground">Platform detected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Packages Found</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.data.packages_count}</div>
                <p className="text-xs text-muted-foreground">Installed software</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{formatLastScan(result.data.last_scan)}</div>
                <p className="text-xs text-muted-foreground">Data collection time</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feature Overview */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="data-types">Data Types</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Platform System Data Collection</CardTitle>
                <CardDescription>
                  Comprehensive data collection across Windows, Linux, and macOS systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-50">
                      <Shield className="h-3 w-3 mr-1" />
                      Security Focused
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Real-time Updates
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-purple-50">
                      <Network className="h-3 w-3 mr-1" />
                      Cross-Platform
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  The system automatically detects the operating system and uses platform-specific 
                  commands to gather comprehensive information about installed software, system 
                  configuration, and security status.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    Windows
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Supported versions:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Windows 10</li>
                    <li>• Windows 11</li>
                    <li>• Windows Server 2016+</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Uses PowerShell and WMI for comprehensive data collection
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-orange-600" />
                    Linux
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Supported distributions:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Red Hat Enterprise Linux</li>
                    <li>• CentOS / Rocky Linux</li>
                    <li>• Ubuntu / Debian</li>
                    <li>• Fedora</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports RPM, DEB, and Snap package managers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-gray-600" />
                    macOS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Supported versions:</p>
                  <ul className="text-sm space-y-1">
                    <li>• macOS 10.15+</li>
                    <li>• macOS Big Sur</li>
                    <li>• macOS Monterey</li>
                    <li>• macOS Ventura+</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Collects Homebrew packages and installed applications
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data-types" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Cpu className="h-4 w-4" />
                    CPU information and architecture
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="h-4 w-4" />
                    Memory and disk usage
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4" />
                    Network interfaces and IP addresses
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Server className="h-4 w-4" />
                    Running services and processes
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Software Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    Installed packages and versions
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    Security updates and patches
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    Installation dates and history
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Vulnerability assessments
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
                <CardDescription>
                  Easy integration with your existing security infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">REST API Endpoints</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div>POST /api/system-data - Collect and store system data</div>
                    <div>GET /api/system-data - Retrieve stored system data</div>
                    <div>GET /api/system-data?hostname=server1 - Get specific host data</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Automated Scanning</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up scheduled scans using cron jobs, Windows Task Scheduler, or 
                    integrate with your existing configuration management tools.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}