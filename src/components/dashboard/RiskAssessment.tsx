"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const RiskAssessment = () => {
  const [timeRange, setTimeRange] = useState<string>("30days");
  const [selectedChart, setSelectedChart] = useState<string>("severity");
  const [selectedCVE, setSelectedCVE] = useState<string | null>(null);

  // Mock data for different chart types
  const severityData: ChartData[] = [
    { name: "Critical", value: 12, color: "#FF4842" },
    { name: "High", value: 24, color: "#FFA726" },
    { name: "Medium", value: 47, color: "#FFCD38" },
    { name: "Low", value: 31, color: "#54D62C" },
    { name: "Info", value: 18, color: "#2196F3" },
  ];

  const environmentData: ChartData[] = [
    { name: "Production", value: 42, color: "#FF4842" },
    { name: "Testing", value: 28, color: "#FFCD38" },
    { name: "Development", value: 62, color: "#54D62C" },
  ];

  const osTypeData: ChartData[] = [
    { name: "Windows 10", value: 35, color: "#2196F3" },
    { name: "Windows Server", value: 48, color: "#673AB7" },
    { name: "Red Hat Linux", value: 49, color: "#FF4842" },
  ];

  const statusData: ChartData[] = [
    { name: "Open", value: 65, color: "#FF4842" },
    { name: "In Progress", value: 32, color: "#FFCD38" },
    { name: "Resolved", value: 43, color: "#54D62C" },
  ];

  const remediationProgressData = [
    { name: "Jan", open: 65, resolved: 12 },
    { name: "Feb", open: 59, resolved: 18 },
    { name: "Mar", open: 52, resolved: 25 },
    { name: "Apr", open: 48, resolved: 29 },
    { name: "May", open: 42, resolved: 35 },
    { name: "Jun", open: 35, resolved: 42 },
  ];

  // Get the appropriate data based on the selected chart type
  const getChartData = () => {
    switch (selectedChart) {
      case "severity":
        return severityData;
      case "environment":
        return environmentData;
      case "osType":
        return osTypeData;
      case "status":
        return statusData;
      default:
        return severityData;
    }
  };

  // Handle chart click to drill down to specific vulnerabilities
  const handleChartClick = (data: any, index: number) => {
    setSelectedCVE(data.name);
    // In a real implementation, this would fetch the related CVEs for the selected category
    console.log(`Selected ${data.name} with ${data.value} vulnerabilities`);
  };

  return (
    <div className="w-full h-full p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Risk Assessment</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="distribution">
            Vulnerability Distribution
          </TabsTrigger>
          <TabsTrigger value="trends">Remediation Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Vulnerability Distribution</CardTitle>
                  <Select
                    value={selectedChart}
                    onValueChange={setSelectedChart}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="severity">By Severity</SelectItem>
                      <SelectItem value="environment">
                        By Environment
                      </SelectItem>
                      <SelectItem value="osType">By OS Type</SelectItem>
                      <SelectItem value="status">By Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>
                  {selectedChart === "severity" &&
                    "Distribution of vulnerabilities by severity level"}
                  {selectedChart === "environment" &&
                    "Distribution of vulnerabilities by environment"}
                  {selectedChart === "osType" &&
                    "Distribution of vulnerabilities by operating system"}
                  {selectedChart === "status" &&
                    "Distribution of vulnerabilities by remediation status"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        onClick={handleChartClick}
                      >
                        {getChartData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value} vulnerabilities`,
                          "Count",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Count by Category</CardTitle>
                <CardDescription>
                  Comparison of vulnerability counts across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `${value} vulnerabilities`,
                          "Count",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Vulnerabilities"
                        onClick={handleChartClick}
                        fill="#8884d8"
                      >
                        {getChartData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedCVE && (
            <Card>
              <CardHeader>
                <CardTitle>Vulnerabilities for {selectedCVE}</CardTitle>
                <CardDescription>
                  Detailed list of CVEs in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4">
                  <p className="text-muted-foreground">
                    In a real implementation, this would show a table of CVEs
                    related to the selected category.
                  </p>
                  <p className="mt-2">
                    Selected category:{" "}
                    <span className="font-medium">{selectedCVE}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Remediation Progress Over Time</CardTitle>
              <CardDescription>
                Tracking open vs. resolved vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={remediationProgressData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="open"
                      name="Open Vulnerabilities"
                      stackId="a"
                      fill="#FF4842"
                    />
                    <Bar
                      dataKey="resolved"
                      name="Resolved Vulnerabilities"
                      stackId="a"
                      fill="#54D62C"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskAssessment;