"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { auditLogger } from "@/lib/auditLogger";
import AuditLogViewer from "./AuditLogViewer";

interface ReportData {
  metadata: {
    projectName: string;
    reportDate: string;
    targetEnvironments: string[];
    auditorIdentity: string;
    reportVersion: string;
  };
  executiveSummary: {
    auditScope: string;
    keyFindings: string;
    overallRiskRating: "Low" | "Medium" | "High" | "Critical";
    recommendedNextSteps: string[];
  };
  endpointInventory: {
    totalEndpoints: number;
    endpoints: Array<{
      hostname: string;
      ipAddress: string;
      osType: string;
      osVersion: string;
      lastScan: string;
      packageCount: number;
      vulnerabilityCount: number;
    }>;
  };
  vulnerabilitySummary: {
    totalCVEs: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byEnvironment: {
      production: number;
      testing: number;
      development: number;
    };
    byStatus: {
      open: number;
      inProgress: number;
      resolved: number;
    };
  };
  detailedFindings: Array<{
    cveId: string;
    description: string;
    affectedPackage: string;
    severityScore: number;
    affectedEndpoints: string[];
    triageStatus: string;
    referenceUrls: string[];
  }>;
  remediationTracker: {
    totalCVEs: number;
    resolvedCVEs: number;
    progressPercentage: number;
    assignedActions: Array<{
      assignee: string;
      actionCount: number;
      completedCount: number;
    }>;
    estimatedTimeToResolution: string;
  };
  riskAssessment: {
    vulnerabilityHeatmap: Array<{
      endpoint: string;
      riskScore: number;
      vulnerabilityCount: number;
    }>;
    riskDistribution: Array<{
      environment: string;
      riskLevel: string;
      count: number;
    }>;
  };
  recommendations: {
    prioritizedSteps: string[];
    patchingSchedule: string;
    policyChanges: string[];
    automationSuggestions: string[];
  };
}

// Mock report data
const mockReportData: ReportData = {
  metadata: {
    projectName: "Koma Security Audit",
    reportDate: new Date().toISOString(),
    targetEnvironments: ["Personal Workstation – Windows 10", "Production Servers", "Development Environment"],
    auditorIdentity: "Koma Security System v2.1",
    reportVersion: "1.0",
  },
  executiveSummary: {
    auditScope: "Comprehensive security assessment of 5 endpoints across production, testing, and development environments",
    keyFindings: "12 critical CVEs identified across 3 endpoints, with 65% of vulnerabilities concentrated in production systems",
    overallRiskRating: "High",
    recommendedNextSteps: [
      "Immediate patching of critical OpenSSH vulnerabilities",
      "Implement automated vulnerability scanning",
      "Establish regular patching schedule",
      "Review access controls for production systems"
    ],
  },
  endpointInventory: {
    totalEndpoints: 5,
    endpoints: [
      {
        hostname: "Web Server 01",
        ipAddress: "192.168.1.101",
        osType: "Windows Server",
        osVersion: "2019",
        lastScan: "2023-06-15T14:30:00Z",
        packageCount: 124,
        vulnerabilityCount: 5,
      },
      {
        hostname: "Database Server",
        ipAddress: "192.168.1.102",
        osType: "Red Hat Linux",
        osVersion: "8.4",
        lastScan: "2023-06-14T10:15:00Z",
        packageCount: 89,
        vulnerabilityCount: 12,
      },
      {
        hostname: "Developer Workstation",
        ipAddress: "192.168.1.103",
        osType: "Windows 10",
        osVersion: "21H2",
        lastScan: "2023-06-15T09:45:00Z",
        packageCount: 76,
        vulnerabilityCount: 0,
      },
      {
        hostname: "Application Server",
        ipAddress: "192.168.1.104",
        osType: "Windows Server",
        osVersion: "2019",
        lastScan: "2023-06-13T16:20:00Z",
        packageCount: 112,
        vulnerabilityCount: 3,
      },
      {
        hostname: "Log Server",
        ipAddress: "192.168.1.105",
        osType: "Red Hat Linux",
        osVersion: "8.4",
        lastScan: "2023-06-15T11:10:00Z",
        packageCount: 65,
        vulnerabilityCount: 1,
      },
    ],
  },
  vulnerabilitySummary: {
    totalCVEs: 21,
    bySeverity: {
      critical: 2,
      high: 6,
      medium: 8,
      low: 5,
    },
    byEnvironment: {
      production: 14,
      testing: 4,
      development: 3,
    },
    byStatus: {
      open: 15,
      inProgress: 4,
      resolved: 2,
    },
  },
  detailedFindings: [
    {
      cveId: "CVE-2023-1234",
      description: "Buffer overflow vulnerability in OpenSSL allows remote code execution",
      affectedPackage: "openssl-1.1.1k",
      severityScore: 9.8,
      affectedEndpoints: ["Web Server 01", "Database Server"],
      triageStatus: "Open",
      referenceUrls: ["https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-1234"],
    },
    {
      cveId: "CVE-2023-5678",
      description: "SQL injection vulnerability in PostgreSQL",
      affectedPackage: "postgresql-13.4",
      severityScore: 8.5,
      affectedEndpoints: ["Database Server"],
      triageStatus: "In Progress",
      referenceUrls: ["https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-5678"],
    },
  ],
  remediationTracker: {
    totalCVEs: 21,
    resolvedCVEs: 2,
    progressPercentage: 9.5,
    assignedActions: [
      { assignee: "Security Team", actionCount: 12, completedCount: 2 },
      { assignee: "Infrastructure Team", actionCount: 6, completedCount: 0 },
      { assignee: "Development Team", actionCount: 3, completedCount: 0 },
    ],
    estimatedTimeToResolution: "4-6 weeks",
  },
  riskAssessment: {
    vulnerabilityHeatmap: [
      { endpoint: "Database Server", riskScore: 9.2, vulnerabilityCount: 12 },
      { endpoint: "Web Server 01", riskScore: 7.8, vulnerabilityCount: 5 },
      { endpoint: "Application Server", riskScore: 5.4, vulnerabilityCount: 3 },
      { endpoint: "Log Server", riskScore: 3.2, vulnerabilityCount: 1 },
      { endpoint: "Developer Workstation", riskScore: 0.0, vulnerabilityCount: 0 },
    ],
    riskDistribution: [
      { environment: "Production", riskLevel: "High", count: 14 },
      { environment: "Testing", riskLevel: "Medium", count: 4 },
      { environment: "Development", riskLevel: "Low", count: 3 },
    ],
  },
  recommendations: {
    prioritizedSteps: [
      "1. Immediately patch OpenSSL on Web Server 01 and Database Server",
      "2. Update PostgreSQL on Database Server to latest version",
      "3. Implement network segmentation for production systems",
      "4. Deploy automated vulnerability scanning tools",
      "5. Establish monthly security review meetings",
    ],
    patchingSchedule: "Critical: Within 24 hours, High: Within 1 week, Medium: Within 1 month, Low: Next maintenance window",
    policyChanges: [
      "Implement mandatory security training for all staff",
      "Require approval for all production system changes",
      "Establish incident response procedures",
    ],
    automationSuggestions: [
      "Deploy Nessus or OpenVAS for continuous vulnerability scanning",
      "Implement Ansible for automated patch management",
      "Set up SIEM solution for security monitoring",
    ],
  },
};

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportGenerator({ isOpen, onClose }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isAuditLogViewerOpen, setIsAuditLogViewerOpen] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Log the report generation initiation
      await auditLogger.log(
        'REPORT_GENERATION_INITIATED',
        'security_report',
        {
          report_type: 'security_audit',
          initiation_timestamp: new Date().toISOString(),
          user_action: 'manual_generation',
        },
        {
          severity: 'medium',
          status: 'success',
          metadata: {
            action_category: 'report_generation',
            compliance_relevant: true,
            data_sensitivity: 'high',
          },
        }
      );

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log successful report generation with comprehensive details
      await auditLogger.logReportGeneration(mockReportData);
      
      // Log data access for all endpoints included in report
      for (const endpoint of mockReportData.endpointInventory.endpoints) {
        await auditLogger.logDataAccess(
          'endpoint_data',
          endpoint.hostname,
          'READ'
        );
      }

      // Log vulnerability data access
      await auditLogger.logDataAccess(
        'vulnerability_data',
        'cve_database',
        'READ'
      );

      setReportGenerated(true);
      
    } catch (error) {
      // Log generation failure
      await auditLogger.log(
        'REPORT_GENERATION_FAILED',
        'security_report',
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failure_timestamp: new Date().toISOString(),
        },
        {
          severity: 'high',
          status: 'failure',
          metadata: {
            action_category: 'report_generation',
            requires_investigation: true,
          },
        }
      );
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Log PDF download attempt
      await auditLogger.logReportDownload('PDF');
      
      // Log sensitive data export
      await auditLogger.log(
        'SENSITIVE_DATA_EXPORTED',
        'security_report',
        {
          export_format: 'PDF',
          export_timestamp: new Date().toISOString(),
          data_classification: 'confidential',
          total_endpoints: mockReportData.endpointInventory.totalEndpoints,
          total_vulnerabilities: mockReportData.vulnerabilitySummary.totalCVEs,
        },
        {
          severity: 'high',
          status: 'success',
          metadata: {
            action_category: 'data_export',
            compliance_relevant: true,
            data_sensitivity: 'high',
            requires_approval: false, // Set to true if approval workflow needed
          },
        }
      );

      // In a real implementation, this would generate and download a PDF
      console.log("Downloading PDF report...");
      alert("PDF download would be implemented here");
      
    } catch (error) {
      await auditLogger.log(
        'REPORT_DOWNLOAD_FAILED',
        'security_report',
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          attempted_format: 'PDF',
        },
        {
          severity: 'medium',
          status: 'failure',
        }
      );
    }
  };

  const handleEmailReport = async () => {
    try {
      // In a real implementation, this would show an email dialog
      const mockRecipients = ['security-team@company.com', 'compliance@company.com'];
      
      // Log email sharing attempt
      await auditLogger.logReportEmail(mockRecipients);
      
      // Log sensitive data sharing
      await auditLogger.log(
        'SENSITIVE_DATA_SHARED',
        'security_report',
        {
          sharing_method: 'email',
          recipient_count: mockRecipients.length,
          data_classification: 'confidential',
          sharing_timestamp: new Date().toISOString(),
        },
        {
          severity: 'critical',
          status: 'success',
          metadata: {
            action_category: 'data_sharing',
            compliance_relevant: true,
            data_sensitivity: 'high',
            requires_approval: true,
            security_relevant: true,
          },
        }
      );

      console.log("Emailing report...");
      alert("Email functionality would be implemented here");
      
    } catch (error) {
      await auditLogger.log(
        'REPORT_EMAIL_FAILED',
        'security_report',
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
        {
          severity: 'medium',
          status: 'failure',
        }
      );
    }
  };

  const handleViewAuditLogs = () => {
    setIsAuditLogViewerOpen(true);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Critical":
        return <Badge className="bg-red-600">Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-500">High</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "Low":
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge>{risk}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Security Audit Report
            </DialogTitle>
            <DialogDescription>
              Comprehensive security assessment report for {mockReportData.metadata.projectName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!reportGenerated ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generate Security Report</h3>
                <p className="text-muted-foreground mb-6">
                  Create a comprehensive security audit report based on current vulnerability data
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={handleGenerateReport} 
                    disabled={isGenerating}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                  
                  {/* Audit Logging Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Audit Logging Active</h4>
                        <p className="text-blue-800 mb-3">
                          All report generation activities are logged for security and compliance purposes. 
                          This includes data access, report creation, downloads, and sharing activities.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleViewAuditLogs}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          View Audit Logs
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Report Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Generated: {new Date(mockReportData.metadata.reportDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleViewAuditLogs}>
                      <Shield className="mr-2 h-4 w-4" />
                      Audit Logs
                    </Button>
                    <Button variant="outline" onClick={handleEmailReport}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Report
                    </Button>
                    <Button onClick={handleDownloadPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>

                {/* Audit Trail Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Report generated successfully. All activities have been logged to the audit trail.
                    </span>
                  </div>
                </div>

                {/* Title Page */}
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{mockReportData.metadata.projectName}</CardTitle>
                    <div className="space-y-2 text-muted-foreground">
                      <p>Security Audit Report v{mockReportData.metadata.reportVersion}</p>
                      <p>Generated: {new Date(mockReportData.metadata.reportDate).toLocaleDateString()}</p>
                      <p>Target Environments: {mockReportData.metadata.targetEnvironments.join(", ")}</p>
                      <p>Auditor: {mockReportData.metadata.auditorIdentity}</p>
                    </div>
                  </CardHeader>
                </Card>

                {/* Executive Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Audit Scope</h4>
                      <p className="text-sm text-muted-foreground">{mockReportData.executiveSummary.auditScope}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Key Findings</h4>
                      <p className="text-sm text-muted-foreground">{mockReportData.executiveSummary.keyFindings}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Overall Risk Rating</h4>
                      {getRiskBadge(mockReportData.executiveSummary.overallRiskRating)}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Recommended Next Steps</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {mockReportData.executiveSummary.recommendedNextSteps.map((step, index) => (
                          <li key={index}>• {step}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Endpoint Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Endpoint Inventory ({mockReportData.endpointInventory.totalEndpoints} systems)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Hostname</th>
                            <th className="text-left p-2">IP Address</th>
                            <th className="text-left p-2">OS Type</th>
                            <th className="text-left p-2">Last Scan</th>
                            <th className="text-left p-2">Packages</th>
                            <th className="text-left p-2">Vulnerabilities</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockReportData.endpointInventory.endpoints.map((endpoint, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{endpoint.hostname}</td>
                              <td className="p-2">{endpoint.ipAddress}</td>
                              <td className="p-2">{endpoint.osType} {endpoint.osVersion}</td>
                              <td className="p-2">{new Date(endpoint.lastScan).toLocaleDateString()}</td>
                              <td className="p-2">{endpoint.packageCount}</td>
                              <td className="p-2">
                                {endpoint.vulnerabilityCount > 0 ? (
                                  <Badge variant="destructive">{endpoint.vulnerabilityCount}</Badge>
                                ) : (
                                  <Badge variant="secondary">0</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Vulnerability Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Vulnerability Summary ({mockReportData.vulnerabilitySummary.totalCVEs} CVEs)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">By Severity</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Critical:</span>
                            <Badge className="bg-red-600">{mockReportData.vulnerabilitySummary.bySeverity.critical}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>High:</span>
                            <Badge className="bg-orange-500">{mockReportData.vulnerabilitySummary.bySeverity.high}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Medium:</span>
                            <Badge className="bg-yellow-500">{mockReportData.vulnerabilitySummary.bySeverity.medium}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Low:</span>
                            <Badge className="bg-blue-500">{mockReportData.vulnerabilitySummary.bySeverity.low}</Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">By Environment</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Production:</span>
                            <Badge variant="destructive">{mockReportData.vulnerabilitySummary.byEnvironment.production}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Testing:</span>
                            <Badge variant="secondary">{mockReportData.vulnerabilitySummary.byEnvironment.testing}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Development:</span>
                            <Badge variant="outline">{mockReportData.vulnerabilitySummary.byEnvironment.development}</Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">By Status</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Open:</span>
                            <Badge variant="destructive">{mockReportData.vulnerabilitySummary.byStatus.open}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>In Progress:</span>
                            <Badge className="bg-yellow-500">{mockReportData.vulnerabilitySummary.byStatus.inProgress}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Resolved:</span>
                            <Badge className="bg-green-500">{mockReportData.vulnerabilitySummary.byStatus.resolved}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Findings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Detailed Findings (Top Critical CVEs)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockReportData.detailedFindings.map((finding, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{finding.cveId}</h4>
                              <Badge className={finding.severityScore >= 9 ? "bg-red-600" : "bg-orange-500"}>
                                CVSS {finding.severityScore}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(finding.triageStatus)}
                                <span className="text-sm">{finding.triageStatus}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                          <div className="text-sm space-y-1">
                            <p><strong>Affected Package:</strong> {finding.affectedPackage}</p>
                            <p><strong>Affected Endpoints:</strong> {finding.affectedEndpoints.join(", ")}</p>
                            <p><strong>References:</strong> 
                              {finding.referenceUrls.map((url, i) => (
                                <a key={i} href={url} className="text-blue-500 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                                  {url}
                                </a>
                              ))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Remediation Tracker */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Remediation Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Progress Overview</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total CVEs:</span>
                            <span>{mockReportData.remediationTracker.totalCVEs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Resolved:</span>
                            <span className="text-green-600">{mockReportData.remediationTracker.resolvedCVEs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Progress:</span>
                            <span>{mockReportData.remediationTracker.progressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Time to Resolution:</span>
                            <span>{mockReportData.remediationTracker.estimatedTimeToResolution}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Assigned Actions</h4>
                        <div className="space-y-2">
                          {mockReportData.remediationTracker.assignedActions.map((action, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{action.assignee}:</span>
                              <span>{action.completedCount}/{action.actionCount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Vulnerability Heatmap</h4>
                        <div className="space-y-2">
                          {mockReportData.riskAssessment.vulnerabilityHeatmap.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span>{item.endpoint}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={
                                  item.riskScore >= 8 ? "bg-red-600" :
                                  item.riskScore >= 6 ? "bg-orange-500" :
                                  item.riskScore >= 4 ? "bg-yellow-500" : "bg-green-500"
                                }>
                                  {item.riskScore.toFixed(1)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  ({item.vulnerabilityCount} CVEs)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Risk Distribution</h4>
                        <div className="space-y-2">
                          {mockReportData.riskAssessment.riskDistribution.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span>{item.environment}</span>
                              <div className="flex items-center gap-2">
                                {getRiskBadge(item.riskLevel)}
                                <span className="text-sm text-muted-foreground">
                                  ({item.count} CVEs)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Prioritized Remediation Steps</h4>
                      <ul className="text-sm space-y-1">
                        {mockReportData.recommendations.prioritizedSteps.map((step, index) => (
                          <li key={index} className="text-muted-foreground">{step}</li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Suggested Patching Schedule</h4>
                      <p className="text-sm text-muted-foreground">{mockReportData.recommendations.patchingSchedule}</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Policy Changes</h4>
                      <ul className="text-sm space-y-1">
                        {mockReportData.recommendations.policyChanges.map((change, index) => (
                          <li key={index} className="text-muted-foreground">• {change}</li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Automation Suggestions</h4>
                      <ul className="text-sm space-y-1">
                        {mockReportData.recommendations.automationSuggestions.map((suggestion, index) => (
                          <li key={index} className="text-muted-foreground">• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Log Viewer */}
      <AuditLogViewer 
        isOpen={isAuditLogViewerOpen} 
        onClose={() => setIsAuditLogViewerOpen(false)} 
      />
    </>
  );
}