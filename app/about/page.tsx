'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Info, Shield, Users, FileText, Globe, Smartphone, Database, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AboutPage() {
  const router = useRouter();

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Employee Management",
      description: "Comprehensive employee database with visa tracking and document management"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Document Storage",
      description: "Secure document storage with Backblaze B2 cloud integration"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security & Privacy",
      description: "Enterprise-grade security with Supabase authentication and RLS"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile Ready",
      description: "Hybrid mobile app built with Capacitor for iOS and Android"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Real-time Updates",
      description: "Live data synchronization and real-time notifications"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-platform",
      description: "Web and mobile applications with offline support"
    }
  ];

  const techStack = [
    { name: "Next.js 13", description: "React framework with App Router" },
    { name: "TypeScript", description: "Type-safe JavaScript development" },
    { name: "Supabase", description: "Backend-as-a-Service with PostgreSQL" },
    { name: "Capacitor", description: "Hybrid mobile app framework" },
    { name: "Tailwind CSS", description: "Utility-first CSS framework" },
    { name: "TanStack Query", description: "Data fetching and caching" },
    { name: "Backblaze B2", description: "Cloud storage for documents" },
    { name: "Gmail SMTP", description: "Email notifications service" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            About CUBS Technical
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Employee Management System - Version 1.0.0
          </p>
        </div>
      </div>

      {/* App Overview */}
      <Card className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#d3194f] rounded-lg">
            <Info className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              CUBS Technical Admin Portal
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              A comprehensive employee management system designed for businesses in the UAE, Qatar, Oman, and KSA. 
              Our platform streamlines employee data management, visa tracking, document organization, and administrative workflows.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Version</p>
                <p className="text-gray-600 dark:text-gray-400">1.0.0</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Platform</p>
                <p className="text-gray-600 dark:text-gray-400">Web & Mobile</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Last Updated</p>
                <p className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Developer</p>
                <p className="text-gray-600 dark:text-gray-400">ChocoSoft Dev</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Features */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="p-2 bg-[#d3194f] rounded-lg text-white">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Technology Stack */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Technology Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {techStack.map((tech, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {tech.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Legal & Compliance */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Legal & Compliance
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Privacy Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How we collect, use, and protect your data
              </p>
            </div>
            <Link href="/privacy">
              <Button variant="outline" size="sm">
                View Policy
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Terms of Service</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Terms and conditions for using our service
              </p>
            </div>
            <Link href="/terms">
              <Button variant="outline" size="sm">
                View Terms
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Contact Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get help with your account or technical issues
              </p>
            </div>
            <Link href="/contact">
              <Button variant="outline" size="sm">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Company Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Company Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">CUBS Technical</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>📍 Dubai, UAE - Business Bay</p>
              <p>📧 info@cubstechnical.com</p>
              <p>📞 +971-50-123-4567</p>
              <p>🕒 Sunday - Thursday: 9:00 AM - 6:00 PM</p>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Development Team</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>🏢 ChocoSoft Dev</p>
              <p>🌐 <a href="https://chocosoftdev.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">chocosoftdev.com</a></p>
              <p>💼 Full-stack development services</p>
              <p>🚀 Mobile & web application specialists</p>
            </div>
          </div>
        </div>
      </Card>

      {/* App Store Compliance */}
      <Card className="p-6 border-green-200 dark:border-green-800">
        <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">
          App Store Compliance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-200">Apple App Store</h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✅ Privacy Policy included<br/>
              ✅ Terms of Service included<br/>
              ✅ Contact information provided<br/>
              ✅ Age rating: 17+ (Business)
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-200">Google Play Store</h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✅ Data safety form ready<br/>
              ✅ Privacy Policy included<br/>
              ✅ Terms of Service included<br/>
              ✅ Content rating: Everyone
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

