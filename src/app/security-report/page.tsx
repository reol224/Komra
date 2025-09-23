import {
  Shield,
  AlertTriangle,
  Send,
  FileText,
  Eye,
  Lock,
  Mail,
  Phone,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SecurityReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">Komra</span>
            </Link>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Report Security Issue
            </h1>
            <p className="text-gray-400 text-lg">
              Help us keep Komra secure by reporting vulnerabilities or security
              concerns
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Responsible Disclosure
                  </h2>
                  <p className="text-gray-300">
                    We take security seriously and appreciate responsible
                    disclosure of vulnerabilities. Please report security issues
                    through this form rather than public channels to help
                    protect our users while we address the issue.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security Report Form */}
          <section className="mb-12">
            <Card className="bg-slate-700/30 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-400" />
                  Security Report Form
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Please provide as much detail as possible to help us
                  understand and address the issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Your Name *
                    </label>
                    <Input
                      placeholder="Enter your full name"
                      className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Issue Type *
                  </label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Select the type of security issue" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="xss">
                        Cross-Site Scripting (XSS)
                      </SelectItem>
                      <SelectItem value="sql-injection">
                        SQL Injection
                      </SelectItem>
                      <SelectItem value="csrf">
                        Cross-Site Request Forgery (CSRF)
                      </SelectItem>
                      <SelectItem value="auth-bypass">
                        Authentication Bypass
                      </SelectItem>
                      <SelectItem value="privilege-escalation">
                        Privilege Escalation
                      </SelectItem>
                      <SelectItem value="data-exposure">
                        Sensitive Data Exposure
                      </SelectItem>
                      <SelectItem value="dos">Denial of Service</SelectItem>
                      <SelectItem value="other">
                        Other Security Issue
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Severity Level *
                  </label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="critical">
                        <div className="flex items-center">
                          <Badge className="bg-red-500 text-white mr-2">
                            Critical
                          </Badge>
                          Immediate threat to system security
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center">
                          <Badge className="bg-orange-500 text-white mr-2">
                            High
                          </Badge>
                          Significant security risk
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center">
                          <Badge className="bg-yellow-500 text-white mr-2">
                            Medium
                          </Badge>
                          Moderate security concern
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center">
                          <Badge className="bg-blue-500 text-white mr-2">
                            Low
                          </Badge>
                          Minor security issue
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* URL/Location */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Affected URL or Location *
                  </label>
                  <Input
                    placeholder="https://komrasec.com/path/to/vulnerable/page"
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Detailed Description *
                  </label>
                  <Textarea
                    placeholder="Please provide a detailed description of the security issue, including steps to reproduce, potential impact, and any relevant technical details..."
                    rows={6}
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Steps to Reproduce */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Steps to Reproduce
                  </label>
                  <Textarea
                    placeholder="1. Navigate to [URL]&#10;2. Enter [specific input]&#10;3. Click [button/link]&#10;4. Observe [unexpected behavior]"
                    rows={4}
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Proof of Concept */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Proof of Concept (Optional)
                  </label>
                  <Textarea
                    placeholder="Include any code snippets, screenshots descriptions, or other evidence that demonstrates the vulnerability..."
                    rows={4}
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Additional Information
                  </label>
                  <Textarea
                    placeholder="Any additional context, browser information, or other relevant details..."
                    rows={3}
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Security Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Guidelines */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Eye className="h-6 w-6 text-green-400 mr-3" />
              Reporting Guidelines
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Do</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Provide detailed technical information</li>
                  <li>• Include steps to reproduce the issue</li>
                  <li>• Report issues promptly after discovery</li>
                  <li>• Use this official reporting channel</li>
                  <li>• Allow reasonable time for us to respond</li>
                  <li>• Work with us to verify and resolve issues</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Don't</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Access or modify user data without permission</li>
                  <li>• Perform actions that could harm our services</li>
                  <li>• Publicly disclose issues before resolution</li>
                  <li>• Use automated tools without permission</li>
                  <li>• Attempt social engineering attacks</li>
                  <li>• Violate any laws or regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Response Process */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Clock className="h-6 w-6 text-blue-400 mr-3" />
              Our Response Process
            </h2>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-400 font-bold text-lg">1</span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">
                    Acknowledgment
                  </h4>
                  <p className="text-xs text-gray-400">Within 24 hours</p>
                </div>
                <div>
                  <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-400 font-bold text-lg">2</span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">
                    Investigation
                  </h4>
                  <p className="text-xs text-gray-400">1-5 business days</p>
                </div>
                <div>
                  <div className="bg-orange-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-400 font-bold text-lg">3</span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">Resolution</h4>
                  <p className="text-xs text-gray-400">Based on severity</p>
                </div>
                <div>
                  <div className="bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-400 font-bold text-lg">4</span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">Follow-up</h4>
                  <p className="text-xs text-gray-400">Confirmation & thanks</p>
                </div>
              </div>
            </div>
          </section>

          {/* Alternative Contact Methods */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Alternative Contact Methods
            </h2>
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                If you prefer not to use this form, you can also report security
                issues through:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-blue-400" />
                    Email
                  </h3>
                  <p className="text-gray-300 text-sm">security@komrasec.com</p>
                  <p className="text-gray-400 text-xs">
                    PGP key available upon request
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-green-400" />
                    Encrypted Communication
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Proton: +email@proton.com
                  </p>
                  <p className="text-gray-400 text-xs">
                    For highly sensitive reports
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              Thank you for helping us maintain the security of Komra Audit.
              Your responsible disclosure helps protect all our users.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
