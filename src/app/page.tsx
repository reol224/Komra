"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Shield,
  Server,
  AlertTriangle,
  Search,
  Bell,
  Settings,
  User,
} from "lucide-react";
import VulnerabilitySummary from "@/components/dashboard/VulnerabilitySummary";
import EndpointInventory from "@/components/dashboard/EndpointInventory";
import RiskAssessment from "@/components/dashboard/RiskAssessment";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("vulnerabilities");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Koma Security Audit</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r bg-background md:flex">
          <nav className="grid gap-2 p-4">
            <Button
              variant={activeTab === "vulnerabilities" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("vulnerabilities")}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Vulnerabilities
            </Button>
            <Button
              variant={activeTab === "endpoints" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("endpoints")}
            >
              <Server className="mr-2 h-4 w-4" />
              Endpoints
            </Button>
            <Button
              variant={activeTab === "risk" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("risk")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Risk Assessment
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <TabsList className="md:hidden">
                <TabsTrigger value="vulnerabilities">
                  <AlertTriangle className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Vulnerabilities</span>
                </TabsTrigger>
                <TabsTrigger value="endpoints">
                  <Server className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Endpoints</span>
                </TabsTrigger>
                <TabsTrigger value="risk">
                  <BarChart3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Risk Assessment</span>
                </TabsTrigger>
              </TabsList>
              <h2 className="text-2xl font-bold">
                {activeTab === "vulnerabilities" && "Vulnerability Summary"}
                {activeTab === "endpoints" && "Endpoint Inventory"}
                {activeTab === "risk" && "Risk Assessment"}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline">Export</Button>
                <Button>Refresh Data</Button>
              </div>
            </div>

            <TabsContent value="vulnerabilities" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <VulnerabilitySummary />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endpoints" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <EndpointInventory />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <RiskAssessment />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dashboard Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Vulnerabilities
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,284</div>
                <p className="text-xs text-muted-foreground">
                  +24 since last scan
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Critical Vulnerabilities
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">86</div>
                <p className="text-xs text-muted-foreground">
                  +3 since last scan
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Monitored Endpoints
                </CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground">
                  +5 new endpoints
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Remediation Progress
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">
                  +12% since last month
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
