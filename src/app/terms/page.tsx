import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Gavel,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="text-gray-400 text-lg">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <Gavel className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Agreement to Terms
                  </h2>
                  <p className="text-gray-300">
                    By accessing and using Komra's security auditing platform,
                    you agree to be bound by these Terms of Service and all
                    applicable laws and regulations. If you do not agree with
                    any of these terms, you are prohibited from using our
                    services.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Service Description */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="h-6 w-6 text-blue-400 mr-3" />
              Service Description
            </h2>

            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Komra provides enterprise-grade security auditing services
                including:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>
                  • Vulnerability assessment and scanning of infrastructure
                  endpoints
                </li>
                <li>
                  • CVE (Common Vulnerabilities and Exposures) identification
                  and reporting
                </li>
                <li>• Risk assessment and remediation planning tools</li>
                <li>• Compliance monitoring and audit trail generation</li>
                <li>• Real-time security dashboard and analytics</li>
                <li>• Integration APIs for third-party security tools</li>
              </ul>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 text-green-400 mr-3" />
              User Responsibilities
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Account Security
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>
                    • Maintain the confidentiality of your account credentials
                  </li>
                  <li>• Enable multi-factor authentication when available</li>
                  <li>• Notify us immediately of any unauthorized access</li>
                  <li>• Use strong passwords and update them regularly</li>
                  <li>
                    • Ensure only authorized personnel have access to your
                    account
                  </li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Acceptable Use
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>
                    • Use the service only for legitimate security auditing
                    purposes
                  </li>
                  <li>• Comply with all applicable laws and regulations</li>
                  <li>• Respect intellectual property rights</li>
                  <li>
                    • Do not attempt to reverse engineer or compromise the
                    platform
                  </li>
                  <li>
                    • Do not use the service to scan systems you do not own or
                    have permission to audit
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              Prohibited Activities
            </h2>

            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                The following activities are strictly prohibited:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Unauthorized access to systems or networks</li>
                <li>• Distribution of malware or malicious code</li>
                <li>• Attempting to bypass security measures</li>
                <li>• Sharing account credentials with unauthorized parties</li>
                <li>• Using the service for illegal activities</li>
                <li>
                  • Interfering with the platform's operation or other users
                </li>
                <li>• Extracting or scraping data for competitive purposes</li>
              </ul>
            </div>
          </section>

          {/* Data and Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Lock className="h-6 w-6 text-purple-400 mr-3" />
              Data Handling & Privacy
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Your Data
                </h3>
                <p className="text-gray-300 mb-3">
                  You retain ownership of all data you provide to our platform.
                  We process your data solely to provide security auditing
                  services.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>
                    • You are responsible for the accuracy of data provided
                  </li>
                  <li>• You must have proper authorization to scan systems</li>
                  <li>• You control data retention and deletion policies</li>
                  <li>• We implement industry-standard security measures</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Data Processing
                </h3>
                <p className="text-gray-300">
                  Our data processing practices are detailed in our{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Privacy Policy
                  </Link>
                  . We comply with GDPR, SOC 2, and other applicable data
                  protection regulations.
                </p>
              </div>
            </div>
          </section>

          {/* Service Availability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Clock className="h-6 w-6 text-orange-400 mr-3" />
              Service Availability & Support
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Uptime Commitment
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• 99.9% uptime SLA for Enterprise plans</li>
                  <li>• Scheduled maintenance windows</li>
                  <li>• Real-time status page available</li>
                  <li>• Incident notifications and updates</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Support Levels
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• 24/7 support for Enterprise customers</li>
                  <li>• Business hours support for Standard plans</li>
                  <li>• Documentation and knowledge base</li>
                  <li>• Training and onboarding assistance</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 text-yellow-400 mr-3" />
              Limitation of Liability
            </h2>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                <strong>Important Legal Notice:</strong> Our liability is
                limited as follows:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>
                  • We provide security auditing tools and reports, but cannot
                  guarantee complete security
                </li>
                <li>
                  • Users are responsible for implementing recommended security
                  measures
                </li>
                <li>
                  • Our liability is limited to the amount paid for services in
                  the preceding 12 months
                </li>
                <li>
                  • We are not liable for indirect, consequential, or punitive
                  damages
                </li>
                <li>
                  • Security recommendations are advisory and not guarantees
                </li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Termination</h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  By You
                </h3>
                <p className="text-gray-300 mb-3">
                  You may terminate your account at any time through the
                  platform settings or by contacting support.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• 30-day notice recommended for Enterprise accounts</li>
                  <li>• Data export available before termination</li>
                  <li>• Prorated refunds according to our refund policy</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">By Us</h3>
                <p className="text-gray-300 mb-3">
                  We may terminate accounts for violations of these terms or
                  non-payment.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• 30-day notice for non-payment issues</li>
                  <li>• Immediate termination for security violations</li>
                  <li>
                    • Data retention period as specified in Privacy Policy
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Changes to Terms
            </h2>
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We may update these Terms of Service periodically to reflect
                changes in our services or legal requirements.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• 30-day advance notice for material changes</li>
                <li>• Email notifications to account administrators</li>
                <li>• Continued use constitutes acceptance of updated terms</li>
                <li>• Previous versions available upon request</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Contact Information
            </h2>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">Legal Team</h3>
                  <p className="text-gray-300 text-sm">
                    Email: legal@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    Response time: Within 5 business days
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Customer Support
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Email: support@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    For account and service questions
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              These Terms of Service are effective as of{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              and supersede all previous versions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
