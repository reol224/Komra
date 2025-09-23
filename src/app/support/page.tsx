import {
  Shield,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  FileText,
  Users,
  Search,
  Book,
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

export default function SupportPage() {
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Support Center
            </h1>
            <p className="text-gray-400 text-lg">
              Get help with Komra - we're here to assist you
            </p>
          </div>

          {/* Quick Actions */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-blue-900/20 border-blue-700/50 hover:bg-blue-900/30 transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <MessageCircle className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <CardTitle className="text-white">Live Chat</CardTitle>
                  <CardDescription className="text-gray-400">
                    Get instant help from our support team
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge className="bg-green-500/20 text-green-400">
                    Online
                  </Badge>
                  <p className="text-xs text-gray-400 mt-2">
                    Average response: 2 minutes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-900/20 border-green-700/50 hover:bg-green-900/30 transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <Phone className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <CardTitle className="text-white">Phone Support</CardTitle>
                  <CardDescription className="text-gray-400">
                    Speak directly with our experts
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-white font-semibold">+1 (555) 123-4567</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Mon-Fri, 9AM-6PM EST
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/20 border-purple-700/50 hover:bg-purple-900/30 transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <Mail className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                  <CardTitle className="text-white">Email Support</CardTitle>
                  <CardDescription className="text-gray-400">
                    Send us a detailed message
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-white font-semibold">
                    support@komrasec.com
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Response within 4 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Knowledge Base Search */}
          <section className="mb-12">
            <Card className="bg-slate-700/30 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-400" />
                  Search Knowledge Base
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Find answers to common questions and learn how to use Komra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search for help articles, tutorials, and guides..."
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 flex-1"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Popular Help Topics */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Book className="h-6 w-6 text-green-400 mr-3" />
              Popular Help Topics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Getting Started
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • How to set up your first vulnerability scan
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Understanding your dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Configuring endpoint monitoring
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • User roles and permissions
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Vulnerability Management
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Understanding CVE scores and ratings
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Creating remediation plans
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Triaging security issues
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Generating compliance reports
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Integration & API
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • API authentication and setup
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Webhook configuration
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Third-party tool integrations
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Data export and import
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Troubleshooting
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Agent installation issues
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Network connectivity problems
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Scan failures and errors
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      • Performance optimization
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="mb-12">
            <Card className="bg-slate-700/30 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-orange-400" />
                  Submit Support Request
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Can't find what you're looking for? Send us a message and
                  we'll help you out
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

                {/* Support Category */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Support Category *
                  </label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="technical">
                        Technical Support
                      </SelectItem>
                      <SelectItem value="billing">Billing & Account</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="integration">
                        Integration Help
                      </SelectItem>
                      <SelectItem value="training">
                        Training & Onboarding
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Priority Level *
                  </label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="urgent">
                        <div className="flex items-center">
                          <Badge className="bg-red-500 text-white mr-2">
                            Urgent
                          </Badge>
                          System down or critical issue
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center">
                          <Badge className="bg-orange-500 text-white mr-2">
                            High
                          </Badge>
                          Significant impact on operations
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center">
                          <Badge className="bg-yellow-500 text-white mr-2">
                            Medium
                          </Badge>
                          Moderate impact
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center">
                          <Badge className="bg-blue-500 text-white mr-2">
                            Low
                          </Badge>
                          General question or minor issue
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Subject *
                  </label>
                  <Input
                    placeholder="Brief description of your issue or question"
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Message *
                  </label>
                  <Textarea
                    placeholder="Please provide detailed information about your issue, including any error messages, steps you've taken, and what you expected to happen..."
                    rows={6}
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Submit Support Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Support Hours & SLA */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Clock className="h-6 w-6 text-yellow-400 mr-3" />
              Support Hours & Response Times
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Business Hours
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Monday - Friday: 9:00 AM - 6:00 PM EST</li>
                  <li>• Saturday: 10:00 AM - 4:00 PM EST</li>
                  <li>• Sunday: Closed</li>
                  <li>• Holidays: Limited support available</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Response Times
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>
                    • <span className="text-red-400">Urgent:</span> Within 1
                    hour
                  </li>
                  <li>
                    • <span className="text-orange-400">High:</span> Within 4
                    hours
                  </li>
                  <li>
                    • <span className="text-yellow-400">Medium:</span> Within 24
                    hours
                  </li>
                  <li>
                    • <span className="text-blue-400">Low:</span> Within 48
                    hours
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Enterprise Support */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 text-purple-400 mr-3" />
              Enterprise Support
            </h2>
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Need dedicated support for your organization? Our Enterprise
                Support plans offer:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Premium Features
                  </h3>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• Dedicated customer success manager</li>
                    <li>• 24/7 phone and email support</li>
                    <li>• Priority response times</li>
                    <li>• Custom training sessions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Contact Sales
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Email: sales@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    Phone: +1 (555) 123-SALE
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              Need immediate assistance? Our support team is standing by to help
              you succeed with Komra.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
