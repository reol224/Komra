import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Database,
  Globe,
  Server,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StatusPage() {
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
              System Status
            </h1>
            <p className="text-gray-400 text-lg">
              Real-time status of Komra services and infrastructure
            </p>
          </div>

          {/* Overall Status */}
          <section className="mb-12">
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-white">
                    All Systems Operational
                  </h2>
                  <p className="text-gray-300">
                    All services are running normally. Last updated:{" "}
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 text-center">
                <Activity className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-1">99.9%</h3>
                <p className="text-green-400 font-semibold">Uptime</p>
                <p className="text-xs text-gray-400">Last 30 days</p>
              </div>
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 text-center">
                <Zap className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-1">45ms</h3>
                <p className="text-blue-400 font-semibold">Response Time</p>
                <p className="text-xs text-gray-400">Average</p>
              </div>
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 text-center">
                <Database className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-1">1.2M</h3>
                <p className="text-purple-400 font-semibold">Scans Today</p>
                <p className="text-xs text-gray-400">Vulnerability scans</p>
              </div>
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 text-center">
                <Globe className="h-12 w-12 text-orange-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-1">5</h3>
                <p className="text-orange-400 font-semibold">Regions</p>
                <p className="text-xs text-gray-400">Global coverage</p>
              </div>
            </div>
          </section>

          {/* Service Status */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Server className="h-6 w-6 text-blue-400 mr-3" />
              Service Status
            </h2>

            <div className="space-y-4">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Vulnerability Scanner
                        </h3>
                        <p className="text-sm text-gray-400">
                          Core scanning engine and CVE database
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      Operational
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Dashboard & API
                        </h3>
                        <p className="text-sm text-gray-400">
                          Web interface and REST API endpoints
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      Operational
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Agent Communication
                        </h3>
                        <p className="text-sm text-gray-400">
                          Endpoint agent connectivity and data sync
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      Operational
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-6 w-6 text-yellow-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Report Generation
                        </h3>
                        <p className="text-sm text-gray-400">
                          PDF and CSV export functionality
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      Degraded
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Authentication
                        </h3>
                        <p className="text-sm text-gray-400">
                          User login and session management
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      Operational
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Database
                        </h3>
                        <p className="text-sm text-gray-400">
                          Primary and backup database systems
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      Operational
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Regional Status */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Globe className="h-6 w-6 text-purple-400 mr-3" />
              Regional Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    US East (Virginia)
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latency:</span>
                      <span className="text-white">23ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-green-400">100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    US West (Oregon)
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latency:</span>
                      <span className="text-white">31ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-green-400">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    Europe (Ireland)
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latency:</span>
                      <span className="text-white">45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-green-400">99.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    Asia Pacific (Tokyo)
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latency:</span>
                      <span className="text-yellow-400">89ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-yellow-400">98.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    Canada (Central)
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latency:</span>
                      <span className="text-white">28ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-green-400">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Recent Incidents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Clock className="h-6 w-6 text-orange-400 mr-3" />
              Recent Incidents
            </h2>

            <div className="space-y-4">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Report Generation Slowdown
                        </h3>
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          Investigating
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        Users may experience slower than normal report
                        generation times. We are investigating the cause.
                      </p>
                      <p className="text-gray-400 text-xs">
                        Started:{" "}
                        {new Date(
                          Date.now() - 2 * 60 * 60 * 1000,
                        ).toLocaleString()}{" "}
                        • Duration: 2h 15m
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Scheduled Maintenance Completed
                        </h3>
                        <Badge className="bg-green-500/20 text-green-400">
                          Resolved
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        Database maintenance completed successfully. All
                        services restored to normal operation.
                      </p>
                      <p className="text-gray-400 text-xs">
                        Resolved:{" "}
                        {new Date(
                          Date.now() - 24 * 60 * 60 * 1000,
                        ).toLocaleString()}{" "}
                        • Duration: 30m
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          API Rate Limiting Issue
                        </h3>
                        <Badge className="bg-green-500/20 text-green-400">
                          Resolved
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        Some API requests were being incorrectly rate limited.
                        Issue has been resolved.
                      </p>
                      <p className="text-gray-400 text-xs">
                        Resolved:{" "}
                        {new Date(
                          Date.now() - 3 * 24 * 60 * 60 * 1000,
                        ).toLocaleString()}{" "}
                        • Duration: 1h 45m
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Maintenance Schedule */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Upcoming Maintenance
            </h2>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Security Updates
                  </h3>
                  <p className="text-gray-300 mb-2">
                    Scheduled maintenance to apply security patches and system
                    updates.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white ml-2">
                        {new Date(
                          Date.now() + 7 * 24 * 60 * 60 * 1000,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white ml-2">
                        2:00 AM - 4:00 AM EST
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Expected Duration:</span>
                      <span className="text-white ml-2">2 hours</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Impact:</span>
                      <span className="text-white ml-2">
                        Brief service interruption
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-700">
            <p className="text-gray-400 text-sm">
              Status page last updated: {new Date().toLocaleString()} •
              <Link
                href="/support"
                className="text-blue-400 hover:text-blue-300 ml-1"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
