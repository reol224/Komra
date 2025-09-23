"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Users,
  Server,
  AlertTriangle,
  BarChart3,
  Lock,
  Zap,
  Eye,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-white">Komra</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Dashboard
                </Button>
              </Link>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                <Shield className="h-6 w-6 text-orange-500" />
                <span className="text-orange-500 font-semibold">
                  Komra Security Platform
                </span>
              </div>
            </div>

            <h1 className="text-5xl font-bold text-white mb-6">
              Enterprise Security
              <span className="text-orange-500"> Audit Dashboard</span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Comprehensive vulnerability assessment and management for your
              entire infrastructure. Monitor, analyze, and remediate security
              threats in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Access Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                View Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  500+
                </div>
                <div className="text-slate-400">Endpoints Monitored</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  99.9%
                </div>
                <div className="text-slate-400">Uptime Guarantee</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  24/7
                </div>
                <div className="text-slate-400">Security Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Complete Security Visibility
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Protect your infrastructure with enterprise-grade security
            monitoring and threat detection
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              Vulnerability Management
            </h3>
            <p className="text-slate-600 text-sm">
              Real-time CVE tracking and prioritization across your entire
              infrastructure
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <Server className="h-6 w-6 text-slate-700" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              Endpoint Monitoring
            </h3>
            <p className="text-slate-600 text-sm">
              Comprehensive visibility into Windows, Linux, and cloud
              environments
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              Risk Analytics
            </h3>
            <p className="text-slate-600 text-sm">
              AI-powered risk assessment and threat intelligence integration
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              Team Collaboration
            </h3>
            <p className="text-slate-600 text-sm">
              Streamlined triage workflows and incident response management
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-slate-50 rounded-2xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-2xl font-bold text-center mb-8 text-slate-900">
            Why Choose Komra Security?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">
                  Real-time Monitoring
                </h4>
                <p className="text-slate-600 text-sm">
                  Continuous vulnerability scanning across all your endpoints
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">
                  Multi-Environment Support
                </h4>
                <p className="text-slate-600 text-sm">
                  Windows, Linux, and cloud infrastructure coverage
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">
                  Advanced Analytics
                </h4>
                <p className="text-slate-600 text-sm">
                  AI-powered threat detection and risk prioritization
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">
                  Compliance Reporting
                </h4>
                <p className="text-slate-600 text-sm">
                  Automated reports for SOC 2, ISO 27001, and more
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">
                  Role-Based Access
                </h4>
                <p className="text-slate-600 text-sm">
                  Granular permissions for different team members
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">
                  API Integration
                </h4>
                <p className="text-slate-600 text-sm">
                  Connect with your existing security tools and workflows
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="bg-slate-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the plan that fits your organization's needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <h3 className="text-xl font-semibold mb-2 text-slate-900">
                Starter
              </h3>
              <div className="text-3xl font-bold text-slate-900 mb-4">
                $99<span className="text-lg text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Up to 50
                  endpoints
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Basic
                  vulnerability scanning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Email
                  alerts
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Get Started
              </Button>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-xl shadow-xl border-2 border-orange-500 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                Most Popular
              </Badge>
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <div className="text-3xl font-bold mb-4">
                $299<span className="text-lg text-slate-300">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Up to 500
                  endpoints
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Advanced
                  threat detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> 24/7
                  monitoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Compliance
                  reporting
                </li>
              </ul>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Start Free Trial
              </Button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <h3 className="text-xl font-semibold mb-2 text-slate-900">
                Enterprise
              </h3>
              <div className="text-3xl font-bold text-slate-900 mb-4">
                Custom
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Unlimited
                  endpoints
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Custom
                  integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> Dedicated
                  support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-500" /> On-premise
                  deployment
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Secure Your Infrastructure?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations that trust Komra Security to protect
            their digital assets
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Footer with Privacy and Security Disclaimers */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold text-white">Komra</span>
              </div>
              <p className="text-gray-400 mb-4">
                Enterprise-grade security auditing platform for comprehensive
                vulnerability assessment and infrastructure monitoring.
              </p>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-green-400" />
                  Security Notice
                </h4>
                <p className="text-xs text-gray-400">
                  All data is encrypted in transit and at rest. We follow SOC 2
                  Type II compliance standards and maintain zero-trust
                  architecture.
                </p>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/security"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Security Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/compliance"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Compliance
                  </a>
                </li>
                <li>
                  <a
                    href="/cookies"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Support
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/docs"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="/support"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact Support
                  </a>
                </li>
                <li>
                  <a
                    href="/status"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    System Status
                  </a>
                </li>
                <li>
                  <a
                    href="/security-report"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Report Security Issue
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-400">
                © 2025 Komra. All rights reserved.
              </div>

              {/* Security Badges */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span>ISO 27001</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Eye className="h-4 w-4 text-purple-400" />
                  <span>GDPR Ready</span>
                </div>
              </div>
            </div>

            {/* Data Handling Disclaimer */}
            <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">
                Data Handling & Privacy
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Komra processes security data to provide vulnerability
                assessments. We collect only necessary system information for
                audit purposes. All data is encrypted, access-controlled, and
                retained according to your organization's data retention
                policies. We do not share, sell, or use your security data for
                any purpose other than providing our auditing services. For
                detailed information about data processing, please review our{" "}
                <a
                  href="/privacy"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
