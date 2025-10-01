"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { sanitizeWaitlistForm, sanitizeText, type WaitlistFormData } from '@/lib/sanitization';
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
  Mail,
  Building,
  Rocket,
  Star,
  TrendingUp,
  Globe,
  Clock,
  Send
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function PreLaunchPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<WaitlistFormData>({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    companySize: "",
    useCase: "",
    referralSource: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors({});

    try {
      // Sanitize all form data before processing
      const sanitizedData = sanitizeWaitlistForm(formData);
      
      // Additional validation
      if (!sanitizedData.email) {
        setFormErrors({ email: 'Valid email is required' });
        setIsLoading(false);
        return;
      }
      
      if (!sanitizedData.firstName || !sanitizedData.lastName) {
        setFormErrors({ 
          firstName: !sanitizedData.firstName ? 'First name is required' : '',
          lastName: !sanitizedData.lastName ? 'Last name is required' : ''
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("waitlist").insert([
        {
          email: sanitizedData.email,
          first_name: sanitizedData.firstName,
          last_name: sanitizedData.lastName,
          company: sanitizedData.company,
          job_title: sanitizedData.jobTitle,
          company_size: sanitizedData.companySize,
          use_case: sanitizedData.useCase,
          referral_source: sanitizedData.referralSource,
        },
      ]);

      if (error) {
        console.error("Error adding to waitlist:", error);
        // Handle duplicate email gracefully
        if (error.code === "23505") {
          // Get current position for existing email
          const { count } = await supabase
            .from("waitlist")
            .select("*", { count: "exact", head: true });
          setWaitlistPosition(count || 1);
          setIsSubmitted(true);
        } else {
          setFormErrors({ general: 'An error occurred. Please try again.' });
        }
      } else {
        // Get the current count to show position
        const { count } = await supabase
          .from("waitlist")
          .select("*", { count: "exact", head: true });
        setWaitlistPosition(count || 1);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        setFormErrors({ general: error.message });
      } else {
        setFormErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof WaitlistFormData, value: string) => {
    // Clear any existing error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Apply basic sanitization on input (more comprehensive sanitization happens on submit)
    const sanitizedValue = sanitizeText(value, field === 'useCase' ? 500 : 255);
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              You're on the list!
            </h2>
            <p className="text-gray-300 mb-4">
              Thank you for joining the Komra waitlist. We'll notify you as soon
              as we launch.
            </p>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Waitlist Position: #{waitlistPosition || 1}
            </Badge>
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
              <p className="text-sm text-gray-400">
                Follow our journey and get exclusive updates about Komra's
                development.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Image 
                src="/images/icon-rounded-corners.png" 
                alt="Komra Logo" 
                width={32} 
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-white">Komra</span>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                Coming Soon
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
              <Rocket className="h-5 w-5 text-orange-500" />
              <span className="text-orange-500 font-semibold text-sm">
                Pre-Launch • Join the Waitlist
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Security Intelligence
            <span className="text-orange-500"> Simplified</span>
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            The first SIEM platform designed for everyone. No PhD in
            cybersecurity required. Komra makes enterprise-grade security
            monitoring accessible to small and medium businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>No complex setup</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Affordable pricing</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Human-friendly alerts</span>
            </div>
          </div>
        </div>

        {/* Problem-Solution Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-semibold text-white">The Problem</h3>
            </div>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Traditional SIEMs cost $100K+ and require dedicated security
                  teams
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  SMBs are left vulnerable with basic antivirus and hope
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Security alerts are cryptic and overwhelming for non-experts
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">
                The Komra Solution
              </h3>
            </div>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Enterprise security at SMB prices - starting at $99/month
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Plain English alerts that anyone can understand and act on
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>5-minute setup with automated threat detection</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Waitlist Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Join the Komra Waitlist
                </h2>
                <p className="text-slate-300">
                  Be among the first to experience security monitoring that
                  actually makes sense. Get early access and exclusive launch
                  pricing.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {formErrors.general && (
                  <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{formErrors.general}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      First Name *
                    </label>
                    <Input
                      required
                      maxLength={50}
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                      className={`bg-slate-700 border-slate-600 text-white placeholder-gray-400 ${
                        formErrors.firstName ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-400 text-xs mt-1">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Last Name *
                    </label>
                    <Input
                      required
                      maxLength={50}
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                      className={`bg-slate-700 border-slate-600 text-white placeholder-gray-400 ${
                        formErrors.lastName ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-400 text-xs mt-1">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    required
                    maxLength={255}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@company.com"
                    className={`bg-slate-700 border-slate-600 text-white placeholder-gray-400 ${
                      formErrors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Company
                    </label>
                    <Input
                      maxLength={100}
                      value={formData.company}
                      onChange={(e) =>
                        handleInputChange("company", e.target.value)
                      }
                      placeholder="Your company name"
                      className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Job Title
                    </label>
                    <Input
                      maxLength={100}
                      value={formData.jobTitle}
                      onChange={(e) =>
                        handleInputChange("jobTitle", e.target.value)
                      }
                      placeholder="Your job title"
                      className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Company Size
                    </label>
                    <Select
                      value={formData.companySize}
                      onValueChange={(value) =>
                        handleInputChange("companySize", value)
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-1000">
                          201-1,000 employees
                        </SelectItem>
                        <SelectItem value="1000+">1,000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      How did you hear about us?
                    </label>
                    <Select
                      value={formData.referralSource}
                      onValueChange={(value) =>
                        handleInputChange("referralSource", value)
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="search">Search Engine</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="referral">
                          Friend/Colleague
                        </SelectItem>
                        <SelectItem value="conference">
                          Conference/Event
                        </SelectItem>
                        <SelectItem value="blog">Blog/Article</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    What's your biggest security challenge?
                  </label>
                  <Textarea
                    maxLength={500}
                    value={formData.useCase}
                    onChange={(e) =>
                      handleInputChange("useCase", e.target.value)
                    }
                    placeholder="Tell us about your current security pain points..."
                    rows={3}
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.useCase.length}/500 characters
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining Waitlist...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Join the Waitlist
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  We respect your inbox. No spam, ever. Unsubscribe at any time.
                  <br />
                  All data is encrypted and handled according to our{" "}
                  <a href="/privacy" className="text-orange-400 hover:text-orange-300">
                    Privacy Policy
                  </a>.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Early Access
            </h3>
            <p className="text-slate-300">
              Be the first to try Komra and help shape the future of accessible
              security monitoring.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Launch Pricing
            </h3>
            <p className="text-slate-300">
              Lock in exclusive early-bird pricing - up to 50% off our regular
              rates for the first year.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              VIP Support
            </h3>
            <p className="text-slate-300">
              Direct line to our founders and priority support during your
              onboarding process.
            </p>
          </div>
        </div>

        {/* Founder's Message */}
        <div className="mt-20">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-700">
                  <Image 
                    src="/images/icon-rounded-corners.png" 
                    alt="Komra Logo" 
                    width={60} 
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    A Message from Our Founder
                  </h3>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    "After years of watching small businesses struggle with
                    cybersecurity, I realized the problem wasn't lack of
                    awareness—it was accessibility. Enterprise security tools
                    are built for enterprises, with enterprise budgets and
                    enterprise teams.
                  </p>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Komra changes that. We're building the first SIEM that
                    speaks human, not just machine. You don't have a security
                    team. You don't have time for a demo. You don't want to talk
                    to sales.
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    Join us in democratizing cybersecurity. Your business
                    deserves enterprise-grade protection, regardless of size."
                  </p>
                  <div className="mt-4">
                    <p className="text-orange-400 font-semibold">— Iulia</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Image 
                src="/images/icon-rounded-corners.png" 
                alt="Komra Logo" 
                width={24} 
                height={24}
                className="rounded"
              />
              <span className="text-lg font-bold text-white">Komra</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Making enterprise security accessible to everyone.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <span>© 2025 Komra. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}