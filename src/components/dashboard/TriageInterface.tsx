"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Plus,
  Edit,
  Save,
  X,
} from "lucide-react";

interface CVE {
  id: string;
  cveId: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  environment: "Production" | "Testing" | "Development";
  status: "Open" | "In Progress" | "Resolved" | "False Positive";
  priority: "Critical" | "High" | "Medium" | "Low";
  affectedEndpoints: string[];
  assignedTo?: string;
  remediationPlan?: string;
  notes?: string;
  triageDate?: string;
  cvssScore: number;
}

interface RemediationPlan {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Completed" | "Cancelled";
  assignedTo: string;
  dueDate: string;
  cveCount: number;
}

const mockUntriagedCVEs: CVE[] = [
  {
    id: "1",
    cveId: "CVE-2023-1234",
    title: "Buffer Overflow in OpenSSL",
    severity: "Critical",
    environment: "Production",
    status: "Open",
    priority: "Critical",
    affectedEndpoints: ["Web Server 01", "Database Server"],
    cvssScore: 9.8,
  },
  {
    id: "2",
    cveId: "CVE-2023-5678",
    title: "SQL Injection in PostgreSQL",
    severity: "High",
    environment: "Testing",
    status: "Open",
    priority: "High",
    affectedEndpoints: ["Database Server"],
    cvssScore: 8.5,
  },
  {
    id: "3",
    cveId: "CVE-2023-9012",
    title: "Cross-Site Scripting in jQuery",
    severity: "Medium",
    environment: "Development",
    status: "Open",
    priority: "Medium",
    affectedEndpoints: ["Developer Workstation"],
    cvssScore: 6.4,
  },
];

const mockRemediationPlans: RemediationPlan[] = [
  {
    id: "1",
    name: "Critical Security Patches Q2 2023",
    description: "Immediate patching of critical vulnerabilities in production systems",
    status: "Active",
    assignedTo: "Security Team",
    dueDate: "2023-07-15",
    cveCount: 5,
  },
  {
    id: "2",
    name: "Infrastructure Hardening",
    description: "Comprehensive security hardening across all environments",
    status: "Active",
    assignedTo: "Infrastructure Team",
    dueDate: "2023-08-30",
    cveCount: 8,
  },
];

const teamMembers = [
  "Security Team",
  "Infrastructure Team",
  "Development Team",
  "John Smith",
  "Jane Doe",
  "Mike Johnson",
];

export default function TriageInterface() {
  const [selectedCVE, setSelectedCVE] = useState<CVE | null>(null);
  const [isTriageDialogOpen, setIsTriageDialogOpen] = useState(false);
  const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false);
  const [triagedCVEs, setTriagedCVEs] = useState<CVE[]>([]);
  const [untriagedCVEs, setUntriagedCVEs] = useState<CVE[]>(mockUntriagedCVEs);
  const [remediationPlans, setRemediationPlans] = useState<RemediationPlan[]>(mockRemediationPlans);
  
  // Triage form state
  const [triageForm, setTriageForm] = useState({
    priority: "",
    assignedTo: "",
    remediationPlan: "",
    status: "",
    notes: "",
  });

  // New plan form state
  const [newPlanForm, setNewPlanForm] = useState({
    name: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  const handleTriageCVE = (cve: CVE) => {
    setSelectedCVE(cve);
    setTriageForm({
      priority: cve.priority,
      assignedTo: cve.assignedTo || "",
      remediationPlan: cve.remediationPlan || "",
      status: cve.status,
      notes: cve.notes || "",
    });
    setIsTriageDialogOpen(true);
  };

  const handleSaveTriage = () => {
    if (!selectedCVE) return;

    const updatedCVE: CVE = {
      ...selectedCVE,
      priority: triageForm.priority as CVE["priority"],
      assignedTo: triageForm.assignedTo,
      remediationPlan: triageForm.remediationPlan,
      status: triageForm.status as CVE["status"],
      notes: triageForm.notes,
      triageDate: new Date().toISOString(),
    };

    // Move from untriaged to triaged
    setUntriagedCVEs(prev => prev.filter(cve => cve.id !== selectedCVE.id));
    setTriagedCVEs(prev => [...prev, updatedCVE]);
    
    setIsTriageDialogOpen(false);
    setSelectedCVE(null);
  };

  const handleCreateRemediationPlan = () => {
    const newPlan: RemediationPlan = {
      id: Date.now().toString(),
      name: newPlanForm.name,
      description: newPlanForm.description,
      status: "Active",
      assignedTo: newPlanForm.assignedTo,
      dueDate: newPlanForm.dueDate,
      cveCount: 0,
    };

    setRemediationPlans(prev => [...prev, newPlan]);
    setNewPlanForm({ name: "", description: "", assignedTo: "", dueDate: "" });
    setIsNewPlanDialogOpen(false);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <Badge className="bg-red-600">{severity}</Badge>;
      case "High":
        return <Badge className="bg-orange-500">{severity}</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-500">{severity}</Badge>;
      case "Low":
        return <Badge className="bg-blue-500">{severity}</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "False Positive":
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge className="bg-red-600">{priority}</Badge>;
      case "High":
        return <Badge className="bg-orange-500">{priority}</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-500">{priority}</Badge>;
      case "Low":
        return <Badge className="bg-blue-500">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="bg-slate-800 p-6 space-y-6 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Triage Interface</h1>
        <Button onClick={() => setIsNewPlanDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          New Remediation Plan
        </Button>
      </div>

      <Tabs defaultValue="untriaged" className="w-full">
        <TabsList className="bg-slate-600">
          <TabsTrigger value="untriaged" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            Untriaged CVEs ({untriagedCVEs.length})
          </TabsTrigger>
          <TabsTrigger value="triaged" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            Triaged CVEs ({triagedCVEs.length})
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            Remediation Plans ({remediationPlans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="untriaged" className="space-y-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Untriaged Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-600">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600 hover:bg-slate-600">
                      <TableHead className="text-slate-300">CVE ID</TableHead>
                      <TableHead className="text-slate-300">Title</TableHead>
                      <TableHead className="text-slate-300">Severity</TableHead>
                      <TableHead className="text-slate-300">Environment</TableHead>
                      <TableHead className="text-slate-300">CVSS Score</TableHead>
                      <TableHead className="text-slate-300">Affected Endpoints</TableHead>
                      <TableHead className="text-right text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {untriagedCVEs.length > 0 ? (
                      untriagedCVEs.map((cve) => (
                        <TableRow key={cve.id} className="border-slate-600 hover:bg-slate-600">
                          <TableCell className="font-mono text-white">{cve.cveId}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-slate-300">
                            {cve.title}
                          </TableCell>
                          <TableCell>{getSeverityBadge(cve.severity)}</TableCell>
                          <TableCell className="text-slate-300">{cve.environment}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-500 text-slate-300">{cve.cvssScore}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {cve.affectedEndpoints.slice(0, 2).map((endpoint, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-slate-600 text-slate-200">
                                  {endpoint}
                                </Badge>
                              ))}
                              {cve.affectedEndpoints.length > 2 && (
                                <Badge variant="secondary" className="text-xs bg-slate-600 text-slate-200">
                                  +{cve.affectedEndpoints.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleTriageCVE(cve)}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Triage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                          No untriaged vulnerabilities found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triaged" className="space-y-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Triaged Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-600">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600 hover:bg-slate-600">
                      <TableHead className="text-slate-300">CVE ID</TableHead>
                      <TableHead className="text-slate-300">Title</TableHead>
                      <TableHead className="text-slate-300">Priority</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Assigned To</TableHead>
                      <TableHead className="text-slate-300">Remediation Plan</TableHead>
                      <TableHead className="text-slate-300">Triage Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triagedCVEs.length > 0 ? (
                      triagedCVEs.map((cve) => (
                        <TableRow key={cve.id} className="border-slate-600 hover:bg-slate-600">
                          <TableCell className="font-mono text-white">{cve.cveId}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-slate-300">
                            {cve.title}
                          </TableCell>
                          <TableCell>{getPriorityBadge(cve.priority)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(cve.status)}
                              <span className="text-sm text-slate-300">{cve.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{cve.assignedTo || "Unassigned"}</TableCell>
                          <TableCell>
                            {cve.remediationPlan ? (
                              <Badge variant="outline" className="border-slate-500 text-slate-300">{cve.remediationPlan}</Badge>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {cve.triageDate ? 
                              new Date(cve.triageDate).toLocaleDateString() : 
                              "N/A"
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                          No triaged vulnerabilities yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {remediationPlans.map((plan) => (
              <Card key={plan.id} className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <span className="truncate">{plan.name}</span>
                    <Badge 
                      className={
                        plan.status === "Active" ? "bg-green-500 text-white" :
                        plan.status === "Completed" ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
                      }
                    >
                      {plan.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {plan.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned to:</span>
                      <span className="font-medium text-slate-200">{plan.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Due date:</span>
                      <span className="text-slate-200">{new Date(plan.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CVEs:</span>
                      <Badge variant="outline" className="border-slate-500 text-slate-300">{plan.cveCount}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Triage Dialog */}
      <Dialog open={isTriageDialogOpen} onOpenChange={setIsTriageDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Triage CVE: {selectedCVE?.cveId}</DialogTitle>
            <DialogDescription className="text-slate-300">
              Set priority, assign responsibility, and add to remediation plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Priority</label>
                <Select
                  value={triageForm.priority}
                  onValueChange={(value) =>
                    setTriageForm(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <Select
                  value={triageForm.status}
                  onValueChange={(value) =>
                    setTriageForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="False Positive">False Positive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Assign To</label>
              <Select
                value={triageForm.assignedTo}
                onValueChange={(value) =>
                  setTriageForm(prev => ({ ...prev, assignedTo: value }))
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Remediation Plan</label>
              <Select
                value={triageForm.remediationPlan}
                onValueChange={(value) =>
                  setTriageForm(prev => ({ ...prev, remediationPlan: value }))
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select or create plan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {remediationPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.name}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Notes</label>
              <Textarea
                placeholder="Add any additional notes or comments..."
                value={triageForm.notes}
                onChange={(e) =>
                  setTriageForm(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTriageDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTriage} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Save className="mr-2 h-4 w-4" />
              Save Triage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Remediation Plan Dialog */}
      <Dialog open={isNewPlanDialogOpen} onOpenChange={setIsNewPlanDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Remediation Plan</DialogTitle>
            <DialogDescription className="text-slate-300">
              Create a new plan to organize and track vulnerability remediation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Plan Name</label>
              <Input
                placeholder="Enter plan name"
                value={newPlanForm.name}
                onChange={(e) =>
                  setNewPlanForm(prev => ({ ...prev, name: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <Textarea
                placeholder="Describe the remediation plan..."
                value={newPlanForm.description}
                onChange={(e) =>
                  setNewPlanForm(prev => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Assign To</label>
              <Select
                value={newPlanForm.assignedTo}
                onValueChange={(value) =>
                  setNewPlanForm(prev => ({ ...prev, assignedTo: value }))
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Due Date</label>
              <Input
                type="date"
                value={newPlanForm.dueDate}
                onChange={(e) =>
                  setNewPlanForm(prev => ({ ...prev, dueDate: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewPlanDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRemediationPlan} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}