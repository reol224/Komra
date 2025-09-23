import {
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
              Privacy Policy
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
                <Shield className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Our Commitment to Privacy
                  </h2>
                  <p className="text-gray-300">
                    Komra is committed to protecting your privacy and the
                    security of your data. This Privacy Policy explains how we
                    collect, use, process, and protect information when you use
                    our security auditing platform.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Database className="h-6 w-6 text-blue-400 mr-3" />
              Information We Collect
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  System Information
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Installed software packages and versions</li>
                  <li>• Operating system details and patch levels</li>
                  <li>• Network configuration and endpoint information</li>
                  <li>• Vulnerability scan results and security assessments</li>
                  <li>• System performance and health metrics</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Account Information
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Email address and authentication credentials</li>
                  <li>• Organization name and contact information</li>
                  <li>• User roles and access permissions</li>
                  <li>• Audit logs and user activity records</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Usage Data
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Platform usage patterns and feature interactions</li>
                  <li>• Report generation and export activities</li>
                  <li>• Dashboard views and filter preferences</li>
                  <li>• API calls and integration usage</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 text-green-400 mr-3" />
              How We Use Your Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Security Services
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Vulnerability assessment and reporting</li>
                  <li>• Risk analysis and threat detection</li>
                  <li>• Compliance monitoring and auditing</li>
                  <li>• Security recommendations and remediation</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Platform Operations
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Account management and authentication</li>
                  <li>• Service delivery and support</li>
                  <li>• Platform improvements and optimization</li>
                  <li>• Billing and subscription management</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Lock className="h-6 w-6 text-purple-400 mr-3" />
              Data Security & Protection
            </h2>

            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-2">Encryption</h3>
                  <p className="text-sm text-gray-300">
                    AES-256 encryption for data at rest and TLS 1.3 for data in
                    transit
                  </p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-2">
                    Access Control
                  </h3>
                  <p className="text-sm text-gray-300">
                    Zero-trust architecture with role-based access controls
                  </p>
                </div>
                <div className="text-center">
                  <Eye className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-2">Monitoring</h3>
                  <p className="text-sm text-gray-300">
                    24/7 security monitoring and audit logging
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Security Measures
              </h3>
              <ul className="text-gray-300 space-y-2">
                <li>• SOC 2 Type II compliance and regular security audits</li>
                <li>• Multi-factor authentication and session management</li>
                <li>
                  • Regular penetration testing and vulnerability assessments
                </li>
                <li>
                  • Incident response procedures and breach notification
                  protocols
                </li>
                <li>• Data backup and disaster recovery procedures</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 text-orange-400 mr-3" />
              Data Sharing & Disclosure
            </h2>

            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    We Do Not Sell Your Data
                  </h3>
                  <p className="text-gray-300">
                    Komra does not sell, rent, or trade your personal
                    information or security data to third parties for marketing
                    or commercial purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Limited Sharing
                </h3>
                <p className="text-gray-300 mb-3">
                  We may share information only in these specific circumstances:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• With your explicit consent or at your direction</li>
                  <li>• To comply with legal obligations or court orders</li>
                  <li>• To protect our rights, property, or safety</li>
                  <li>
                    • With trusted service providers under strict
                    confidentiality agreements
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              Your Rights & Choices
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Data Rights
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Access your personal information</li>
                  <li>• Correct inaccurate data</li>
                  <li>• Delete your account and data</li>
                  <li>• Export your data</li>
                  <li>• Restrict data processing</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Contact Options
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Email: privacy@komrasec.com</li>
                  <li>• Support portal: /support</li>
                  <li>• Data Protection Officer</li>
                  <li>• Response within 30 days</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Data Retention
            </h2>
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We retain your information only as long as necessary to provide
                our services and comply with legal obligations:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>
                  • Account information: Duration of active subscription plus 7
                  years
                </li>
                <li>
                  • Security scan data: 3 years or as specified in your data
                  retention policy
                </li>
                <li>• Audit logs: 7 years for compliance purposes</li>
                <li>
                  • Usage analytics: 2 years in aggregated, anonymized form
                </li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                If you have questions about this Privacy Policy or our data
                practices, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Privacy Team
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Email: privacy@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    Response time: Within 48 hours
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Data Protection Officer
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Email: dpo@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    For GDPR and data rights inquiries
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              This Privacy Policy is effective as of{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              and may be updated periodically.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
