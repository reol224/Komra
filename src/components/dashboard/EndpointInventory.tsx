"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Server,
  Monitor,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
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

interface Endpoint {
  id: string;
  name: string;
  ipAddress: string;
  osType: "Windows 10" | "Windows Server" | "Red Hat Linux";
  status: "Healthy" | "Vulnerable" | "Critical";
  lastScan: string;
  vulnerablePackages: number;
  totalPackages: number;
}

interface Package {
  id: string;
  name: string;
  version: string;
  vulnerabilities: number;
  severity: "High" | "Medium" | "Low" | "None";
}

const mockEndpoints: Endpoint[] = [
  {
    id: "1",
    name: "Web Server 01",
    ipAddress: "192.168.1.101",
    osType: "Windows Server",
    status: "Vulnerable",
    lastScan: "2023-06-15T14:30:00Z",
    vulnerablePackages: 5,
    totalPackages: 124,
  },
  {
    id: "2",
    name: "Database Server",
    ipAddress: "192.168.1.102",
    osType: "Red Hat Linux",
    status: "Critical",
    lastScan: "2023-06-14T10:15:00Z",
    vulnerablePackages: 12,
    totalPackages: 89,
  },
  {
    id: "3",
    name: "Developer Workstation",
    ipAddress: "192.168.1.103",
    osType: "Windows 10",
    status: "Healthy",
    lastScan: "2023-06-15T09:45:00Z",
    vulnerablePackages: 0,
    totalPackages: 76,
  },
  {
    id: "4",
    name: "Application Server",
    ipAddress: "192.168.1.104",
    osType: "Windows Server",
    status: "Vulnerable",
    lastScan: "2023-06-13T16:20:00Z",
    vulnerablePackages: 3,
    totalPackages: 112,
  },
  {
    id: "5",
    name: "Log Server",
    ipAddress: "192.168.1.105",
    osType: "Red Hat Linux",
    status: "Healthy",
    lastScan: "2023-06-15T11:10:00Z",
    vulnerablePackages: 1,
    totalPackages: 65,
  },
];

const mockPackages: Record<string, Package[]> = {
  "1": [
    {
      id: "p1",
      name: "OpenSSL",
      version: "1.1.1k",
      vulnerabilities: 2,
      severity: "High",
    },
    {
      id: "p2",
      name: "Apache",
      version: "2.4.46",
      vulnerabilities: 1,
      severity: "Medium",
    },
    {
      id: "p3",
      name: "PHP",
      version: "7.4.16",
      vulnerabilities: 2,
      severity: "Medium",
    },
    {
      id: "p4",
      name: ".NET Framework",
      version: "4.8",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p5",
      name: "Windows Defender",
      version: "4.18.2103.7",
      vulnerabilities: 0,
      severity: "None",
    },
  ],
  "2": [
    {
      id: "p6",
      name: "MySQL",
      version: "5.7.33",
      vulnerabilities: 3,
      severity: "High",
    },
    {
      id: "p7",
      name: "OpenSSH",
      version: "7.4p1",
      vulnerabilities: 4,
      severity: "Critical",
    },
    {
      id: "p8",
      name: "Kernel",
      version: "3.10.0-1160",
      vulnerabilities: 5,
      severity: "High",
    },
    {
      id: "p9",
      name: "Bash",
      version: "4.2.46",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p10",
      name: "Python",
      version: "2.7.5",
      vulnerabilities: 0,
      severity: "None",
    },
  ],
  "3": [
    {
      id: "p11",
      name: "Chrome",
      version: "91.0.4472.124",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p12",
      name: "Firefox",
      version: "89.0.2",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p13",
      name: "Visual Studio",
      version: "16.10.2",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p14",
      name: "Node.js",
      version: "14.17.1",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p15",
      name: "Git",
      version: "2.32.0",
      vulnerabilities: 0,
      severity: "None",
    },
  ],
  "4": [
    {
      id: "p16",
      name: "IIS",
      version: "10.0.17763.1",
      vulnerabilities: 1,
      severity: "Low",
    },
    {
      id: "p17",
      name: "SQL Server",
      version: "15.0.4083.2",
      vulnerabilities: 1,
      severity: "Medium",
    },
    {
      id: "p18",
      name: "PowerShell",
      version: "5.1.17763.1",
      vulnerabilities: 1,
      severity: "Low",
    },
    {
      id: "p19",
      name: ".NET Core",
      version: "3.1.16",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p20",
      name: "Windows Admin Center",
      version: "2103.2",
      vulnerabilities: 0,
      severity: "None",
    },
  ],
  "5": [
    {
      id: "p21",
      name: "Elasticsearch",
      version: "7.13.2",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p22",
      name: "Logstash",
      version: "7.13.2",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p23",
      name: "Kibana",
      version: "7.13.2",
      vulnerabilities: 1,
      severity: "Low",
    },
    {
      id: "p24",
      name: "Filebeat",
      version: "7.13.2",
      vulnerabilities: 0,
      severity: "None",
    },
    {
      id: "p25",
      name: "Metricbeat",
      version: "7.13.2",
      vulnerabilities: 0,
      severity: "None",
    },
  ],
};

const EndpointInventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [osTypeFilter, setOsTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("overview");

  // Filter endpoints based on search term and filters
  const filteredEndpoints = mockEndpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOsType =
      osTypeFilter === "all" || endpoint.osType === osTypeFilter;
    const matchesStatus =
      statusFilter === "all" || endpoint.status === statusFilter;

    return matchesSearch && matchesOsType && matchesStatus;
  });

  const handleEndpointSelect = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setActiveTab("overview");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Vulnerable":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "Critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getOsIcon = (osType: string) => {
    switch (osType) {
      case "Windows 10":
      case "Windows Server":
        return <Monitor className="h-5 w-5 text-blue-500" />;
      case "Red Hat Linux":
        return <Server className="h-5 w-5 text-red-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-amber-100 text-amber-800";
      case "Low":
        return "bg-yellow-100 text-yellow-800";
      case "None":
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="bg-background p-6 h-full">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Endpoint Inventory</h1>
          <Button variant="outline">Scan Endpoints</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter endpoints by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search endpoints..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">OS Type</label>
                <Select value={osTypeFilter} onValueChange={setOsTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All OS Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All OS Types</SelectItem>
                    <SelectItem value="Windows 10">Windows 10</SelectItem>
                    <SelectItem value="Windows Server">
                      Windows Server
                    </SelectItem>
                    <SelectItem value="Red Hat Linux">Red Hat Linux</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Healthy">Healthy</SelectItem>
                    <SelectItem value="Vulnerable">Vulnerable</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Endpoints ({filteredEndpoints.length})</CardTitle>
              <CardDescription>
                Select an endpoint to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>OS Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Scan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEndpoints.length > 0 ? (
                      filteredEndpoints.map((endpoint) => (
                        <TableRow
                          key={endpoint.id}
                          className={`cursor-pointer ${selectedEndpoint?.id === endpoint.id ? "bg-muted" : ""}`}
                          onClick={() => handleEndpointSelect(endpoint)}
                        >
                          <TableCell className="font-medium">
                            {endpoint.name}
                          </TableCell>
                          <TableCell>{endpoint.ipAddress}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getOsIcon(endpoint.osType)}
                              <span>{endpoint.osType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(endpoint.status)}
                              <span>{endpoint.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(endpoint.lastScan).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getOsIcon(selectedEndpoint.osType)}
                    {selectedEndpoint.name}
                    <Badge variant="outline" className="ml-2">
                      {selectedEndpoint.ipAddress}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {selectedEndpoint.osType} | Last scanned:{" "}
                    {new Date(selectedEndpoint.lastScan).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge
                  className={`
                    ${selectedEndpoint.status === "Healthy" ? "bg-green-100 text-green-800" : ""}
                    ${selectedEndpoint.status === "Vulnerable" ? "bg-amber-100 text-amber-800" : ""}
                    ${selectedEndpoint.status === "Critical" ? "bg-red-100 text-red-800" : ""}
                  `}
                >
                  {selectedEndpoint.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="packages">Installed Packages</TabsTrigger>
                  <TabsTrigger value="vulnerabilities">
                    Vulnerabilities
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Packages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedEndpoint.totalPackages}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Vulnerable Packages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedEndpoint.vulnerablePackages}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Vulnerability Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(
                            (selectedEndpoint.vulnerablePackages /
                              selectedEndpoint.totalPackages) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="packages" className="pt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package Name</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Vulnerabilities</TableHead>
                          <TableHead>Severity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockPackages[selectedEndpoint.id]?.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell className="font-medium">
                              {pkg.name}
                            </TableCell>
                            <TableCell>{pkg.version}</TableCell>
                            <TableCell>{pkg.vulnerabilities}</TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(pkg.severity)}>
                                {pkg.severity}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="vulnerabilities" className="pt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package</TableHead>
                          <TableHead>CVE ID</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockPackages[selectedEndpoint.id]?.filter(
                          (pkg) => pkg.vulnerabilities > 0,
                        ).length > 0 ? (
                          mockPackages[selectedEndpoint.id]
                            ?.filter((pkg) => pkg.vulnerabilities > 0)
                            .map((pkg) => (
                              <TableRow key={`vuln-${pkg.id}`}>
                                <TableCell className="font-medium">
                                  {pkg.name} {pkg.version}
                                </TableCell>
                                <TableCell>
                                  CVE-2023-{Math.floor(Math.random() * 10000)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getSeverityColor(pkg.severity)}
                                  >
                                    {pkg.severity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-md truncate">
                                  Potential security vulnerability that could
                                  allow unauthorized access or code execution.
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
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
  );
};

export default EndpointInventory;
