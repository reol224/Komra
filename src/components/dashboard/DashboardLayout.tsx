"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VulnerabilitySummary from "@/components/dashboard/VulnerabilitySummary";
import EndpointInventory from "@/components/dashboard/EndpointInventory";
import RiskAssessment from "@/components/dashboard/RiskAssessment";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/ui/icons";
import {
  BarChart3,
  Shield,
  Server,
  AlertTriangle,
  Settings,
  LogOut,
  User,
  Bell,
} from "lucide-react";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps = {}) {
  const [activeTab, setActiveTab] = useState("vulnerability-summary");

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Koma Security</h1>
        </div>

        <nav className="space-y-2">
          <Button
            variant={
              activeTab === "vulnerability-summary" ? "secondary" : "ghost"
            }
            className="w-full justify-start"
            onClick={() => setActiveTab("vulnerability-summary")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Vulnerabilities
          </Button>

          <Button
            variant={activeTab === "endpoint-inventory" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("endpoint-inventory")}
          >
            <Server className="mr-2 h-4 w-4" />
            Endpoints
          </Button>

          <Button
            variant={activeTab === "risk-assessment" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("risk-assessment")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Risk Assessment
          </Button>
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary rounded-full p-1">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">
                admin@koma-security.com
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {activeTab === "vulnerability-summary" && "Vulnerability Summary"}
              {activeTab === "endpoint-inventory" && "Endpoint Inventory"}
              {activeTab === "risk-assessment" && "Risk Assessment"}
            </h2>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                Run New Scan
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Card className="h-full bg-background border-0 shadow-sm overflow-hidden">
            {activeTab === "vulnerability-summary" && <VulnerabilitySummary />}
            {activeTab === "endpoint-inventory" && <EndpointInventory />}
            {activeTab === "risk-assessment" && <RiskAssessment />}
            {children}
          </Card>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
