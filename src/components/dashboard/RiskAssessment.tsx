"use client";

import React, { useState, useEffect } from "react";
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
import DashboardDataService from "@/lib/dashboardDataService";

const COLORS = ["#7C3AED", "#DC2626", "#F97316", "#16A34A", "#64748B"];

interface ChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

const RiskAssessment = () => {
  const [timeRange, setTimeRange] = useState<string>("30days");
  const [selectedChart, setSelectedChart] = useState<string>("severity");
  const [selectedCVE, setSelectedCVE] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    severityData: ChartData[];
    environmentData: ChartData[];
    statusData: ChartData[];
    osTypeData: ChartData[];
  }>({
    severityData: [],
    environmentData: [],
    statusData: [],
    osTypeData: []
  });

  const dashboardService = new DashboardDataService();

  useEffect(() => {
    loadRiskData();
  }, [timeRange]);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      
      const [vulnerabilities, endpoints, distribution] = await Promise.all([
        dashboardService.getVulnerabilities(),
        dashboardService.getEndpoints(),
        dashboardService.getVulnerabilityDistribution()
      ]);

      // OS Type distribution based on endpoints
      const osTypes = endpoints.reduce((acc, endpoint) => {
        const osType = endpoint.osType;
        acc[osType] = (acc[osType] || 0) + endpoint.vulnerablePackages;
        return acc;
      }, {} as Record<string, number>);

      const osTypeData: ChartData[] = Object.entries(osTypes).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));

      setChartData({
        severityData: distribution.severityData,
        environmentData: distribution.environmentData,
        statusData: distribution.statusData,
        osTypeData
      });
    } catch (error) {
      console.error('Error loading risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock remediation progress data - in real implementation, this would come from historical data
  const remediationProgressData = [
    { name: "Jan", open: 65, resolved: 12 },
    { name: "Feb", open: 59, resolved: 18 },
    { name: "Mar", open: 52, resolved: 25 },
    { name: "Apr", open: 48, resolved: 29 },
    { name: "May", open: 42, resolved: 35 },
    { name: "Jun", open: 35, resolved: 42 },
  ];

  const getChartData = () => {
    switch (selectedChart) {
      case "severity":
        return chartData.severityData;
      case "environment":
        return chartData.environmentData;
      case "osType":
        return chartData.osTypeData;
      case "status":
        return chartData.statusData;
      default:
        return chartData.severityData;
    }
  };

  const handleChartClick = (data: any, index: number) => {
    setSelectedCVE(data.name);
    console.log(`Selected ${data.name} with ${data.value} vulnerabilities`);
  };

  if (loading) {
    return (
      <div className="w-full h-full p-6 bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading risk assessment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Risk Assessment</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="mb-4 bg-slate-600">
          <TabsTrigger value="distribution" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            Vulnerability Distribution
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            Remediation Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Vulnerability Distribution</CardTitle>
                  <Select
                    value={selectedChart}
                    onValueChange={setSelectedChart}
                  >
                    <SelectTrigger className="w-[180px] bg-slate-600 border-slate-500 text-white">
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="severity">By Severity</SelectItem>
                      <SelectItem value="environment">By Environment</SelectItem>
                      <SelectItem value="osType">By OS Type</SelectItem>
                      <SelectItem value="status">By Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription className="text-slate-300">
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
                        label={(props: any) => {
                          const { name, percent } = props;
                          return `${name}: ${(percent * 100).toFixed(0)}%`;
                        }}
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
                        contentStyle={{
                          backgroundColor: '#334155',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          color: 'white'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Vulnerability Count by Category</CardTitle>
                <CardDescription className="text-slate-300">
                  Comparison of vulnerability counts across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" tick={{ fill: '#CBD5E1' }} />
                      <YAxis tick={{ fill: '#CBD5E1' }} />
                      <Tooltip
                        formatter={(value) => [
                          `${value} vulnerabilities`,
                          "Count",
                        ]}
                        contentStyle={{
                          backgroundColor: '#334155',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          color: 'white'
                        }}
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
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Vulnerabilities for {selectedCVE}</CardTitle>
                <CardDescription className="text-slate-300">
                  Detailed list of CVEs in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-600 rounded-md p-4 bg-slate-600">
                  <p className="text-slate-300">
                    Showing vulnerabilities for the selected category. In a full implementation, 
                    this would display a filtered table of specific CVEs.
                  </p>
                  <p className="mt-2 text-slate-200">
                    Selected category:{" "}
                    <span className="font-medium text-white">{selectedCVE}</span>
                  </p>
                  <p className="mt-1 text-slate-300">
                    Count: {getChartData().find(item => item.name === selectedCVE)?.value || 0} vulnerabilities
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Remediation Progress Over Time</CardTitle>
              <CardDescription className="text-slate-300">
                Tracking open vs. resolved vulnerabilities (sample data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={remediationProgressData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" tick={{ fill: '#CBD5E1' }} />
                    <YAxis tick={{ fill: '#CBD5E1' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="open"
                      name="Open Vulnerabilities"
                      stackId="a"
                      fill="#DC2626"
                    />
                    <Bar
                      dataKey="resolved"
                      name="Resolved Vulnerabilities"
                      stackId="a"
                      fill="#16A34A"
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