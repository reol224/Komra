"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Server,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  Settings,
} from "lucide-react";

import VulnerabilitySummary from "./VulnerabilitySummary";
import EndpointInventory from "./EndpointInventory";
import RiskAssessment from "./RiskAssessment";
import TriageInterface from "./TriageInterface";
import ReportGenerator from "./ReportGenerator";

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  // Mock dashboard statistics
  const dashboardStats = {
    totalEndpoints: 5,
    totalVulnerabilities: 21,
    criticalVulnerabilities: 2,
    openTriageItems: 15,
    remediationProgress: 9.5,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Koma Security Audit</h1>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive vulnerability assessment dashboard
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsReportDialogOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vulnerabilities
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="triage" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Triage
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Overview Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Endpoints
                  </CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalEndpoints}</div>
                  <p className="text-xs text-muted-foreground">
                    Monitored systems
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Vulnerabilities
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalVulnerabilities}</div>
                  <p className="text-xs text-muted-foreground">
                    Identified CVEs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Critical Issues
                  </CardTitle>
                  <Shield className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardStats.criticalVulnerabilities}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Require immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Open Triage Items
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.openTriageItems}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Remediation Progress
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardStats.remediationProgress}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CVEs resolved
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setActiveTab("vulnerabilities")}
                  >
                    <AlertTriangle className="h-6 w-6" />
                    <span>View Vulnerabilities</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setActiveTab("triage")}
                  >
                    <Users className="h-6 w-6" />
                    <span>Triage CVEs</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setIsReportDialogOpen(true)}
                  >
                    <FileText className="h-6 w-6" />
                    <span>Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Critical vulnerability detected in OpenSSL
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CVE-2023-1234 affects 2 endpoints • 2 hours ago
                      </p>
                    </div>
                    <Badge className="bg-red-600">Critical</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Vulnerability resolved in jQuery
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CVE-2023-9012 marked as resolved • 1 day ago
                      </p>
                    </div>
                    <Badge className="bg-green-500">Resolved</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        New endpoint added to monitoring
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Log Server (192.168.1.105) • 2 days ago
                      </p>
                    </div>
                    <Badge variant="outline">Info</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities">
            <VulnerabilitySummary />
          </TabsContent>

          <TabsContent value="endpoints">
            <EndpointInventory />
          </TabsContent>

          <TabsContent value="triage">
            <TriageInterface />
          </TabsContent>

          <TabsContent value="risk">
            <RiskAssessment />
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Generator Dialog */}
      <ReportGenerator 
        isOpen={isReportDialogOpen} 
        onClose={() => setIsReportDialogOpen(false)} 
      />
    </div>
  );
}