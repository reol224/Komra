import {
  Shield,
  Cookie,
  Eye,
  Database,
  Settings,
  CheckCircle,
  FileText,
  Users,
  Globe,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function CookiesPolicyPage() {
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
              Cookie Policy
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
            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <Cookie className="h-6 w-6 text-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    About Cookies
                  </h2>
                  <p className="text-gray-300">
                    This Cookie Policy explains how Komra uses cookies and
                    similar technologies to recognize you when you visit our
                    platform. It explains what these technologies are and why we
                    use them, as well as your rights to control our use of them.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What are Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Cookie className="h-6 w-6 text-orange-400 mr-3" />
              What are Cookies?
            </h2>

            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Cookies are small data files that are placed on your computer or
                mobile device when you visit a website. Cookies are widely used
                by website owners to make their websites work, or to work more
                efficiently, as well as to provide reporting information.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>
                  • <strong>First-party cookies:</strong> Set directly by our
                  website
                </li>
                <li>
                  • <strong>Third-party cookies:</strong> Set by other domains
                  for analytics and functionality
                </li>
                <li>
                  • <strong>Session cookies:</strong> Temporary cookies that
                  expire when you close your browser
                </li>
                <li>
                  • <strong>Persistent cookies:</strong> Remain on your device
                  for a set period or until deleted
                </li>
              </ul>
            </div>
          </section>

          {/* Types of Cookies We Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Settings className="h-6 w-6 text-blue-400 mr-3" />
              Types of Cookies We Use
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Essential Cookies
                </h3>
                <p className="text-gray-300 mb-3">
                  These cookies are strictly necessary to provide you with
                  services available through our platform.
                </p>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Authentication and session management</li>
                  <li>• Security and fraud prevention</li>
                  <li>• Load balancing and performance</li>
                  <li>• CSRF protection tokens</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Eye className="h-5 w-5 text-blue-400 mr-2" />
                  Analytics Cookies
                </h3>
                <p className="text-gray-300 mb-3">
                  These cookies help us understand how visitors interact with
                  our platform.
                </p>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Google Analytics for usage statistics</li>
                  <li>• Page view and user journey tracking</li>
                  <li>• Performance monitoring and optimization</li>
                  <li>• Error tracking and debugging</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Settings className="h-5 w-5 text-purple-400 mr-2" />
                  Functional Cookies
                </h3>
                <p className="text-gray-300 mb-3">
                  These cookies enable enhanced functionality and
                  personalization.
                </p>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• User preferences and settings</li>
                  <li>• Language and region selection</li>
                  <li>• Dashboard customization</li>
                  <li>• Theme and display preferences</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Globe className="h-5 w-5 text-yellow-400 mr-2" />
                  Marketing Cookies
                </h3>
                <p className="text-gray-300 mb-3">
                  These cookies track your activity to help us deliver more
                  relevant advertising.
                </p>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Targeted advertising and remarketing</li>
                  <li>• Social media integration</li>
                  <li>• Campaign effectiveness measurement</li>
                  <li>• Cross-platform user identification</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cookie Details */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Database className="h-6 w-6 text-purple-400 mr-3" />
              Detailed Cookie Information
            </h2>

            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left text-white font-semibold py-3 px-2">
                        Cookie Name
                      </th>
                      <th className="text-left text-white font-semibold py-3 px-2">
                        Purpose
                      </th>
                      <th className="text-left text-white font-semibold py-3 px-2">
                        Duration
                      </th>
                      <th className="text-left text-white font-semibold py-3 px-2">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-2 font-mono">session_token</td>
                      <td className="py-3 px-2">User authentication</td>
                      <td className="py-3 px-2">Session</td>
                      <td className="py-3 px-2">Essential</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-2 font-mono">csrf_token</td>
                      <td className="py-3 px-2">Security protection</td>
                      <td className="py-3 px-2">Session</td>
                      <td className="py-3 px-2">Essential</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-2 font-mono">user_preferences</td>
                      <td className="py-3 px-2">Dashboard settings</td>
                      <td className="py-3 px-2">1 year</td>
                      <td className="py-3 px-2">Functional</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-2 font-mono">_ga</td>
                      <td className="py-3 px-2">Google Analytics</td>
                      <td className="py-3 px-2">2 years</td>
                      <td className="py-3 px-2">Analytics</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono">marketing_consent</td>
                      <td className="py-3 px-2">Advertising preferences</td>
                      <td className="py-3 px-2">1 year</td>
                      <td className="py-3 px-2">Marketing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Your Cookie Choices */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 text-green-400 mr-3" />
              Your Cookie Choices
            </h2>

            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Cookie Consent
                </h3>
                <p className="text-gray-300 mb-4">
                  When you first visit our platform, we'll ask for your consent
                  to use non-essential cookies. You can change your preferences
                  at any time through our cookie banner or account settings.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• Accept all cookies for full functionality</li>
                  <li>• Choose specific cookie categories</li>
                  <li>• Reject non-essential cookies</li>
                  <li>• Update preferences anytime</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Browser Settings
                  </h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Block all cookies</li>
                    <li>• Block third-party cookies only</li>
                    <li>• Delete cookies on browser close</li>
                    <li>• Manage cookies per website</li>
                  </ul>
                </div>

                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Opt-Out Tools
                  </h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Google Analytics opt-out</li>
                    <li>• Advertising preference centers</li>
                    <li>• Do Not Track browser settings</li>
                    <li>• Privacy-focused browser extensions</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Trash2 className="h-6 w-6 text-red-400 mr-3" />
              Managing and Deleting Cookies
            </h2>

            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                How to Delete Cookies
              </h3>
              <p className="text-gray-300 mb-4">
                You can delete cookies at any time through your browser
                settings. Here's how:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Chrome</h4>
                  <p className="text-sm text-gray-300">
                    Settings → Privacy and Security → Clear browsing data
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Firefox</h4>
                  <p className="text-sm text-gray-300">
                    Options → Privacy & Security → Clear Data
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Safari</h4>
                  <p className="text-sm text-gray-300">
                    Preferences → Privacy → Manage Website Data
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Edge</h4>
                  <p className="text-sm text-gray-300">
                    Settings → Privacy → Clear browsing data
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Impact of Disabling Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Impact of Disabling Cookies
            </h2>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                <strong>Important:</strong> Disabling certain cookies may impact
                your experience on our platform:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>
                  • <strong>Essential cookies:</strong> Platform may not
                  function properly
                </li>
                <li>
                  • <strong>Functional cookies:</strong> Loss of personalized
                  settings and preferences
                </li>
                <li>
                  • <strong>Analytics cookies:</strong> We cannot improve our
                  services based on usage data
                </li>
                <li>
                  • <strong>Marketing cookies:</strong> You may see less
                  relevant advertising
                </li>
              </ul>
            </div>
          </section>

          {/* Updates to Cookie Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Updates to This Policy
            </h2>
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We may update this Cookie Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• We will notify you of any material changes</li>
                <li>• Updated policy will be posted on this page</li>
                <li>• Check the "Last updated" date at the top</li>
                <li>• Continued use constitutes acceptance of changes</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                If you have questions about our use of cookies or this Cookie
                Policy, please contact us:
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
                    Response time: Within 3 business days
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
                    For data protection matters
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              This Cookie Policy is effective as of{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              and is part of our Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
