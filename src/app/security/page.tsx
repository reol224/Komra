import {
  Shield,
  Lock,
  Eye,
  Database,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Zap,
  Server,
} from "lucide-react";
import Link from "next/link";

export default function SecurityPolicyPage() {
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
              Security Policy
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
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Our Security Commitment
                  </h2>
                  <p className="text-gray-300">
                    Security is at the core of everything we do at Komra. This
                    Security Policy outlines our comprehensive approach to
                    protecting your data, our infrastructure, and maintaining
                    the highest standards of cybersecurity.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security Framework */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Lock className="h-6 w-6 text-blue-400 mr-3" />
              Security Framework
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Zero Trust Architecture
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Never trust, always verify principle</li>
                  <li>• Multi-factor authentication required</li>
                  <li>• Least privilege access controls</li>
                  <li>• Continuous security monitoring</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Defense in Depth
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Multiple layers of security controls</li>
                  <li>• Network segmentation and isolation</li>
                  <li>• Application-level security measures</li>
                  <li>• Physical security controls</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Database className="h-6 w-6 text-purple-400 mr-3" />
              Data Protection
            </h2>

            <div className="space-y-6">
              <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Encryption Standards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Lock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-1">
                      Data at Rest
                    </h4>
                    <p className="text-sm text-gray-300">AES-256 encryption</p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-1">
                      Data in Transit
                    </h4>
                    <p className="text-sm text-gray-300">TLS 1.3 protocol</p>
                  </div>
                  <div className="text-center">
                    <Eye className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-1">
                      Data in Use
                    </h4>
                    <p className="text-sm text-gray-300">Memory encryption</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Key Management
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Hardware Security Modules (HSMs) for key storage</li>
                  <li>• Regular key rotation and lifecycle management</li>
                  <li>• Secure key distribution and access controls</li>
                  <li>• Cryptographic key escrow and recovery procedures</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Infrastructure Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Server className="h-6 w-6 text-orange-400 mr-3" />
              Infrastructure Security
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Cloud Security
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Multi-region deployment with failover capabilities</li>
                  <li>• Virtual Private Cloud (VPC) isolation</li>
                  <li>• Web Application Firewall (WAF) protection</li>
                  <li>• DDoS mitigation and traffic filtering</li>
                  <li>
                    • Regular security assessments and penetration testing
                  </li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Network Security
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Network segmentation and micro-segmentation</li>
                  <li>
                    • Intrusion Detection and Prevention Systems (IDS/IPS)
                  </li>
                  <li>• Network traffic analysis and monitoring</li>
                  <li>• Secure VPN access for remote administration</li>
                  <li>• Regular vulnerability scanning and patching</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Access Controls */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 text-green-400 mr-3" />
              Access Controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Authentication
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Multi-factor authentication (MFA) required</li>
                  <li>• Single Sign-On (SSO) integration</li>
                  <li>• Biometric authentication options</li>
                  <li>• Session management and timeout controls</li>
                  <li>• Password complexity requirements</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Authorization
                </h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Role-based access control (RBAC)</li>
                  <li>• Attribute-based access control (ABAC)</li>
                  <li>• Principle of least privilege</li>
                  <li>• Regular access reviews and audits</li>
                  <li>• Automated provisioning and deprovisioning</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Monitoring & Incident Response */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Eye className="h-6 w-6 text-yellow-400 mr-3" />
              Monitoring & Incident Response
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  24/7 Security Monitoring
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Security Information and Event Management (SIEM)</li>
                  <li>• Real-time threat detection and alerting</li>
                  <li>• Behavioral analytics and anomaly detection</li>
                  <li>• Automated incident response workflows</li>
                  <li>• Security Operations Center (SOC) staffed 24/7</li>
                </ul>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  Incident Response Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="bg-red-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="text-red-400 font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-white text-sm">
                      Detection
                    </h4>
                    <p className="text-xs text-gray-400">
                      Less than 15 minutes
                    </p>
                  </div>
                  <div>
                    <div className="bg-orange-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="text-orange-400 font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-white text-sm">
                      Analysis
                    </h4>
                    <p className="text-xs text-gray-400">Less than 1 hour</p>
                  </div>
                  <div>
                    <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-400 font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-white text-sm">
                      Containment
                    </h4>
                    <p className="text-xs text-gray-400">Less than 4 hours</p>
                  </div>
                  <div>
                    <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-400 font-bold">4</span>
                    </div>
                    <h4 className="font-semibold text-white text-sm">
                      Recovery
                    </h4>
                    <p className="text-xs text-gray-400">Less than 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance & Certifications */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 text-blue-400 mr-3" />
              Compliance & Certifications
            </h2>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <Shield className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">
                    SOC 2 Type II
                  </h3>
                  <p className="text-xs text-gray-400">
                    Security & Availability
                  </p>
                </div>
                <div>
                  <Lock className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">ISO 27001</h3>
                  <p className="text-xs text-gray-400">Information Security</p>
                </div>
                <div>
                  <Eye className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">GDPR</h3>
                  <p className="text-xs text-gray-400">Data Protection</p>
                </div>
                <div>
                  <CheckCircle className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">NIST CSF</h3>
                  <p className="text-xs text-gray-400">
                    Cybersecurity Framework
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Regular Assessments
              </h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Annual third-party security audits</li>
                <li>• Quarterly penetration testing</li>
                <li>• Monthly vulnerability assessments</li>
                <li>• Continuous compliance monitoring</li>
                <li>• Regular security awareness training</li>
              </ul>
            </div>
          </section>

          {/* Security Reporting */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              Security Reporting
            </h2>

            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Report Security Issues
              </h3>
              <p className="text-gray-300 mb-4">
                We take security vulnerabilities seriously. If you discover a
                security issue, please report it responsibly:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Contact Information
                  </h4>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• Email: security@komrasec.com</li>
                    <li>• PGP Key: Available on request</li>
                    <li>• Response time: Within 24 hours</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Bug Bounty Program
                  </h4>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• Rewards for valid security findings</li>
                    <li>• Coordinated disclosure process</li>
                    <li>• Hall of fame recognition</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Security Contact
            </h2>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                For security-related questions or concerns, please contact our
                security team:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Security Team
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Email: security@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    Emergency: Available 24/7
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Chief Security Officer
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Email: cso@komrasec.com
                  </p>
                  <p className="text-gray-300 text-sm">
                    For executive security matters
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              This Security Policy is effective as of{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              and is reviewed quarterly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
