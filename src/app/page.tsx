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
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function Home() {
  return <DashboardLayout />;
}