"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Server,
  Monitor,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardDataService, { DashboardEndpoint, DashboardPackage } from "@/lib/dashboardDataService";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const EndpointInventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [osTypeFilter, setOsTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<DashboardEndpoint | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [endpoints, setEndpoints] = useState<DashboardEndpoint[]>([]);
  const [packages, setPackages] = useState<DashboardPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(false);

  const dashboardService = new DashboardDataService();

  useEffect(() => {
    loadEndpoints();
  }, []);

  useEffect(() => {
    if (selectedEndpoint) {
      loadPackagesForEndpoint(selectedEndpoint.id);
    }
  }, [selectedEndpoint]);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      const endpointsData = await dashboardService.getEndpoints();
      setEndpoints(endpointsData);
    } catch (error) {
      console.error('Error loading endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPackagesForEndpoint = async (endpointId: string) => {
    try {
      setPackagesLoading(true);
      const packagesData = await dashboardService.getPackagesForEndpoint(endpointId);
      setPackages(packagesData);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadEndpoints();
    if (selectedEndpoint) {
      await loadPackagesForEndpoint(selectedEndpoint.id);
    }
  };

  const handleVulnerabilityAssessment = async (endpointId: string) => {
    try {
      await dashboardService.triggerVulnerabilityAssessment(endpointId);
      await loadEndpoints(); // Refresh data
      if (selectedEndpoint?.id === endpointId) {
        await loadPackagesForEndpoint(endpointId);
      }
    } catch (error) {
      console.error('Error running vulnerability assessment:', error);
    }
  };

  // Filter endpoints based on search term and filters
  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOsType =
      osTypeFilter === "all" || endpoint.osType === osTypeFilter;
    const matchesStatus =
      statusFilter === "all" || endpoint.status === statusFilter;

    return matchesSearch && matchesOsType && matchesStatus;
  });

  const handleEndpointSelect = (endpoint: DashboardEndpoint) => {
    setSelectedEndpoint(endpoint);
    setActiveTab("overview");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "vulnerable":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getOsIcon = (osType: string) => {
    if (osType.toLowerCase().includes('windows')) {
      return <Monitor className="h-5 w-5 text-blue-500" />;
    } else if (osType.toLowerCase().includes('linux') || osType.toLowerCase().includes('red hat')) {
      return <Server className="h-5 w-5 text-red-500" />;
    } else if (osType.toLowerCase().includes('macos')) {
      return <Monitor className="h-5 w-5 text-gray-500" />;
    } else {
      return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-violet-800 text-white";
      case "high":
        return "bg-red-600 text-white";
      case "medium":
        return "bg-orange-600 text-white";
      case "low":
        return "bg-green-600 text-white";
      case "none":
      default:
        return "bg-slate-600 text-white";
    }
  };

  const formatLastScan = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-slate-800 p-6 h-full rounded-lg border border-slate-700">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading endpoint data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="endpoints.view" fallback={
      <div className="bg-slate-800 p-6 h-full rounded-lg border border-slate-700">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-slate-300">You don't have permission to view endpoint data.</p>
          </div>
        </div>
      </div>
    }>
      <div className="bg-slate-800 p-6 h-full rounded-lg border border-slate-700">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Endpoint Inventory</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <PermissionGuard permission="endpoints.scan">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Scan Endpoints
                </Button>
              </PermissionGuard>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Filters</CardTitle>
                <CardDescription className="text-slate-300">
                  Filter endpoints by various criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search endpoints..."
                    className="pl-8 bg-slate-600 border-slate-500 text-white placeholder:text-slate-400 focus:border-orange-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    OS Type
                  </label>
                  <Select value={osTypeFilter} onValueChange={setOsTypeFilter}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                      <SelectValue placeholder="All OS Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">All OS Types</SelectItem>
                      <SelectItem value="Windows 10">Windows 10</SelectItem>
                      <SelectItem value="Windows Server">Windows Server</SelectItem>
                      <SelectItem value="Red Hat Linux">Red Hat Linux</SelectItem>
                      <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                      <SelectItem value="CentOS">CentOS</SelectItem>
                      <SelectItem value="macOS">macOS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="vulnerable">Vulnerable</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">
                  Endpoints ({filteredEndpoints.length})
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Select an endpoint to view details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-600">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600 hover:bg-slate-600">
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300">IP Address</TableHead>
                        <TableHead className="text-slate-300">OS Type</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Last Scan</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEndpoints.length > 0 ? (
                        filteredEndpoints.map((endpoint) => (
                          <TableRow
                            key={endpoint.id}
                            className={`cursor-pointer border-slate-600 hover:bg-slate-600 ${selectedEndpoint?.id === endpoint.id ? "bg-slate-600" : ""}`}
                            onClick={() => handleEndpointSelect(endpoint)}
                          >
                            <TableCell className="font-medium text-white">
                              {endpoint.name}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {endpoint.ipAddress}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getOsIcon(endpoint.osType)}
                                <span className="text-slate-300">
                                  {endpoint.osType}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(endpoint.status)}
                                <span className="text-slate-300 capitalize">
                                  {endpoint.status}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {formatLastScan(endpoint.lastScan)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVulnerabilityAssessment(endpoint.id);
                                }}
                                className="text-slate-300 hover:bg-slate-500 hover:text-white"
                              >
                                Assess
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-4 text-slate-400"
                          >
                            No endpoints found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedEndpoint && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      {getOsIcon(selectedEndpoint.osType)}
                      {selectedEndpoint.name}
                      <Badge
                        variant="outline"
                        className="ml-2 border-slate-500 text-slate-300"
                      >
                        {selectedEndpoint.ipAddress}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      {selectedEndpoint.osType} | Environment: {selectedEndpoint.environment} | Last scanned:{" "}
                      {formatLastScan(selectedEndpoint.lastScan)}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`
                      ${selectedEndpoint.status === "healthy" ? "bg-green-600 text-white border-green-700" : ""}
                      ${selectedEndpoint.status === "vulnerable" ? "bg-orange-600 text-white border-orange-700" : ""}
                      ${selectedEndpoint.status === "critical" ? "bg-violet-800 text-white border-violet-900" : ""}
                    `}
                  >
                    {selectedEndpoint.status.charAt(0).toUpperCase() + selectedEndpoint.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-slate-600">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="packages"
                      className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                    >
                      Installed Packages
                    </TabsTrigger>
                    <TabsTrigger
                      value="vulnerabilities"
                      className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                    >
                      Vulnerabilities
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-slate-600 border-slate-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-300">
                            Total Packages
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-white">
                            {selectedEndpoint.totalPackages}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-600 border-slate-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-300">
                            Vulnerable Packages
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-white">
                            {selectedEndpoint.vulnerablePackages}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-600 border-slate-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-300">
                            Vulnerability Rate
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-white">
                            {selectedEndpoint.totalPackages > 0 
                              ? ((selectedEndpoint.vulnerablePackages / selectedEndpoint.totalPackages) * 100).toFixed(1)
                              : '0'
                            }%
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="packages" className="pt-4">
                    {packagesLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-slate-600">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-600 hover:bg-slate-600">
                              <TableHead className="text-slate-300">Package Name</TableHead>
                              <TableHead className="text-slate-300">Version</TableHead>
                              <TableHead className="text-slate-300">Type</TableHead>
                              <TableHead className="text-slate-300">Vulnerabilities</TableHead>
                              <TableHead className="text-slate-300">Severity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {packages.length > 0 ? (
                              packages.map((pkg) => (
                                <TableRow
                                  key={pkg.id}
                                  className="border-slate-600 hover:bg-slate-600"
                                >
                                  <TableCell className="font-medium text-white">
                                    {pkg.name}
                                  </TableCell>
                                  <TableCell className="text-slate-300">
                                    {pkg.version}
                                  </TableCell>
                                  <TableCell className="text-slate-300">
                                    {pkg.packageType}
                                  </TableCell>
                                  <TableCell className="text-slate-300">
                                    {pkg.vulnerabilities}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getSeverityColor(pkg.severity)}>
                                      {pkg.severity.charAt(0).toUpperCase() + pkg.severity.slice(1)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-slate-400">
                                  No packages found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="vulnerabilities" className="pt-4">
                    <div className="rounded-md border border-slate-600">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-600 hover:bg-slate-600">
                            <TableHead className="text-slate-300">Package</TableHead>
                            <TableHead className="text-slate-300">CVE ID</TableHead>
                            <TableHead className="text-slate-300">Severity</TableHead>
                            <TableHead className="text-slate-300">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {packages.filter(pkg => pkg.vulnerabilities > 0).length > 0 ? (
                            packages
                              .filter(pkg => pkg.vulnerabilities > 0)
                              .map((pkg) => (
                                <TableRow
                                  key={`vuln-${pkg.id}`}
                                  className="border-slate-600 hover:bg-slate-600"
                                >
                                  <TableCell className="font-medium text-white">
                                    {pkg.name} {pkg.version}
                                  </TableCell>
                                  <TableCell className="text-slate-300">
                                    CVE-2024-{Math.floor(Math.random() * 10000)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getSeverityColor(pkg.severity)}>
                                      {pkg.severity.charAt(0).toUpperCase() + pkg.severity.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-md truncate text-slate-300">
                                    Potential security vulnerability that could allow unauthorized access or code execution.
                                  </TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-slate-400">
                                No vulnerabilities found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default EndpointInventory;