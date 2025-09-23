import {
  Shield,
  Lock,
  Eye,
  Database,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Award,
  Building,
} from "lucide-react";
import Link from "next/link";

export default function CompliancePage() {
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
              Compliance Framework
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
                <Award className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Comprehensive Compliance
                  </h2>
                  <p className="text-gray-300">
                    Komra maintains the highest standards of compliance across
                    multiple frameworks and regulations. Our platform is
                    designed to help organizations meet their security and
                    compliance requirements while providing transparent
                    reporting on our own compliance posture.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance Standards */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="h-6 w-6 text-green-400 mr-3" />
              Compliance Standards
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      SOC 2 Type II
                    </h3>
                    <p className="text-sm text-gray-400">
                      Security, Availability, Processing Integrity
                    </p>
                  </div>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Annual independent audits</li>
                  <li>• Continuous monitoring and controls</li>
                  <li>• Customer data protection</li>
                  <li>• System availability guarantees</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Lock className="h-8 w-8 text-blue-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      ISO 27001
                    </h3>
                    <p className="text-sm text-gray-400">
                      Information Security Management
                    </p>
                  </div>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Risk management framework</li>
                  <li>• Information security controls</li>
                  <li>• Continuous improvement process</li>
                  <li>• Third-party certification</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Eye className="h-8 w-8 text-purple-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">GDPR</h3>
                    <p className="text-sm text-gray-400">
                      General Data Protection Regulation
                    </p>
                  </div>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Data subject rights protection</li>
                  <li>• Privacy by design principles</li>
                  <li>• Data processing transparency</li>
                  <li>• Breach notification procedures</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Building className="h-8 w-8 text-orange-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      NIST CSF
                    </h3>
                    <p className="text-sm text-gray-400">
                      Cybersecurity Framework
                    </p>
                  </div>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Identify, Protect, Detect, Respond, Recover</li>
                  <li>• Risk-based approach</li>
                  <li>• Industry best practices</li>
                  <li>• Continuous assessment</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Industry Compliance */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 text-yellow-400 mr-3" />
              Industry-Specific Compliance
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Financial Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">PCI DSS</h4>
                    <p className="text-sm text-gray-300">
                      Payment card data protection standards
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">SOX</h4>
                    <p className="text-sm text-gray-300">
                      Sarbanes-Oxley financial reporting controls
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">FFIEC</h4>
                    <p className="text-sm text-gray-300">
                      Federal financial institution guidelines
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Healthcare
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">HIPAA</h4>
                    <p className="text-sm text-gray-300">
                      Health information privacy and security
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">HITECH</h4>
                    <p className="text-sm text-gray-300">
                      Health information technology standards
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Government & Defense
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">FedRAMP</h4>
                    <p className="text-sm text-gray-300">
                      Federal cloud security authorization
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">FISMA</h4>
                    <p className="text-sm text-gray-300">
                      Federal information security management
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">CMMC</h4>
                    <p className="text-sm text-gray-300">
                      Cybersecurity maturity model certification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Audit & Assessment */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Database className="h-6 w-6 text-purple-400 mr-3" />
              Audit & Assessment Process
            </h2>

            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Continuous Compliance Monitoring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-8 w-8 text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">Monitor</h4>
                  <p className="text-xs text-gray-400">
                    Real-time compliance tracking
                  </p>
                </div>
                <div>
                  <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">Assess</h4>
                  <p className="text-xs text-gray-400">
                    Regular compliance reviews
                  </p>
                </div>
                <div>
                  <div className="bg-orange-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-8 w-8 text-orange-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">Remediate</h4>
                  <p className="text-xs text-gray-400">
                    Address compliance gaps
                  </p>
                </div>
                <div>
                  <div className="bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">Report</h4>
                  <p className="text-xs text-gray-400">
                    Compliance documentation
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Internal Audits
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Monthly compliance assessments</li>
                  <li>• Quarterly risk evaluations</li>
                  <li>• Annual comprehensive reviews</li>
                  <li>• Continuous control testing</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  External Audits
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Independent third-party auditors</li>
                  <li>• Annual certification renewals</li>
                  <li>• Penetration testing assessments</li>
                  <li>• Compliance gap analysis</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Customer Compliance Support */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 text-green-400 mr-3" />
              Customer Compliance Support
            </h2>

            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Compliance Assistance
                </h3>
                <p className="text-gray-300 mb-4">
                  We help our customers achieve and maintain their compliance
                  requirements through:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• Pre-built compliance report templates</li>
                  <li>• Automated evidence collection</li>
                  <li>• Risk assessment frameworks</li>
                  <li>• Audit trail documentation</li>
                  <li>• Compliance dashboard and metrics</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Documentation
                  </h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• SOC 2 reports available</li>
                    <li>• Security questionnaire responses</li>
                    <li>• Compliance mapping guides</li>
                    <li>• Implementation best practices</li>
                  </ul>
                </div>

                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Support Services
                  </h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Compliance consultation</li>
                    <li>• Custom report generation</li>
                    <li>• Audit preparation assistance</li>
                    <li>• Training and workshops</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance Reporting */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 text-blue-400 mr-3" />
              Compliance Reporting
            </h2>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Available Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Award className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-white mb-1">
                    SOC 2 Reports
                  </h4>
                  <p className="text-sm text-gray-300">
                    Type I and Type II available
                  </p>
                </div>
                <div className="text-center">
                  <Shield className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-white mb-1">
                    Security Assessments
                  </h4>
                  <p className="text-sm text-gray-300">
                    Penetration test results
                  </p>
                </div>
                <div className="text-center">
                  <FileText className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-white mb-1">
                    Compliance Certificates
                  </h4>
                  <p className="text-sm text-gray-300">ISO 27001 and others</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Compliance Contact
            </h2>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                For compliance-related questions, documentation requests, or
                audit support:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Compliance Team
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Email: compliance@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    Response time: Within 2 business days
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Chief Compliance Officer
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Email: cco@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    For executive compliance matters
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              This Compliance Framework is effective as of{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              and is reviewed annually.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
