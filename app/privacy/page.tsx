'use client';

// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function PrivacyPolicy() {
  const router = useRouter();

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
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <Card>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              CUBS Technical Admin Portal is a mobile and web application that collects and processes the following types of information to provide employee management and document organization services:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, phone number, password, account preferences</li>
              <li><strong>Employee Data:</strong> Employee names, email addresses, phone numbers, employee IDs, job titles, nationalities, company affiliations</li>
              <li><strong>Document Information:</strong> Passport details, visa information, labor card details, work permits, identification documents</li>
              <li><strong>Usage Analytics:</strong> App usage patterns, feature interactions, login times, session duration</li>
              <li><strong>Device Information:</strong> Device type, operating system version, app version, screen resolution, unique device identifiers</li>
              <li><strong>Location Data:</strong> IP address and general geographic location for security and compliance purposes</li>
              <li><strong>Error Reports:</strong> Crash logs and error reports to improve app stability</li>
            </ul>

            <h3>Mobile App Specific Data Collection</h3>
            <ul>
              <li><strong>App Permissions:</strong> Access to camera (for document scanning), storage (for document uploads), notifications (for visa reminders)</li>
              <li><strong>Offline Usage:</strong> Local storage of data for offline functionality</li>
              <li><strong>Performance Data:</strong> App load times, memory usage, battery impact</li>
              <li><strong>Network Information:</strong> Connection type and network performance metrics</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Core App Functionality:</strong> Employee database management, document storage and organization, visa and permit tracking</li>
              <li><strong>Communication:</strong> Sending notifications, reminders, and updates to users and employees</li>
              <li><strong>Account Management:</strong> User authentication, account creation, password reset, and profile management</li>
              <li><strong>App Performance:</strong> Monitoring app usage, identifying bugs, and improving user experience</li>
              <li><strong>Security:</strong> Preventing fraud, unauthorized access, and ensuring data integrity</li>
              <li><strong>Legal Compliance:</strong> Meeting regulatory requirements for employee data management</li>
              <li><strong>Customer Support:</strong> Responding to user inquiries and providing technical assistance</li>
            </ul>

            <h3>Mobile App Specific Uses</h3>
            <ul>
              <li><strong>Offline Functionality:</strong> Local data storage and synchronization when network connectivity is restored</li>
              <li><strong>Push Notifications:</strong> Sending important alerts about visa expirations and document updates</li>
              <li><strong>Camera Access:</strong> Scanning and uploading documents using device camera</li>
              <li><strong>Storage Access:</strong> Saving and organizing documents locally on the device</li>
              <li><strong>Performance Optimization:</strong> Analyzing app performance and user interactions to improve mobile experience</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using:
            </p>
            <ul>
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Backblaze B2:</strong> Document storage with encryption</li>
              <li><strong>Gmail SMTP:</strong> Email notifications</li>
            </ul>
            <p>
              We implement industry-standard security measures including encryption, 
              secure authentication, and regular security audits.
            </p>

            <h2>4. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. 
              Information may be shared only in the following circumstances:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in app operation (under strict confidentiality agreements)</li>
            </ul>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of certain communications</li>
              <li>Export your data</li>
            </ul>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
              <h3 style={{ color: '#1e40af', marginBottom: '8px', fontWeight: '600' }}>Account Deletion</h3>
              <p style={{ color: '#1e40af', marginBottom: '12px' }}>
                You can request deletion of your account and all associated data at any time.
              </p>
              <div style={{ marginBottom: '8px' }}>
                                 <a 
                   href="/delete-account" 
                   className="inline-block bg-[#d3194f] hover:bg-[#e01a5a] text-white px-4 py-2 rounded-md no-underline font-medium transition-colors"
                 >
                   Delete My Account
                 </a>
              </div>
              <p style={{ fontSize: '14px', color: '#1e40af' }}>
                Or contact us at <a href="mailto:info@cubstechnical.com" style={{ textDecoration: 'underline' }}>info@cubstechnical.com</a>
              </p>
            </div>

            <h2>6. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our services 
              and comply with legal obligations. Employee records are typically retained 
              for the duration of employment plus applicable legal retention periods.
            </p>

            <h2>7. International Data Transfers</h2>
            <p>
              Your information may be processed and stored in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data in accordance 
              with applicable data protection laws.
            </p>

            <h2>8. Children&apos;s Privacy</h2>
            <p>
              This app is not intended for use by individuals under 18 years of age. 
              We do not knowingly collect personal information from children under 18.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you 
              of any material changes through the app or via email.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our data practices, 
              please contact us at:
            </p>
            <ul>
              <li>Email: info@cubstechnical.com</li>
              <li>Phone: +971-50-123-4567</li>
            </ul>

            <h2>11. Compliance</h2>
            <p>
              This privacy policy complies with:
            </p>
            <ul>
              <li>General Data Protection Regulation (GDPR)</li>
              <li>California Consumer Privacy Act (CCPA)</li>
              <li>App Store and Google Play Store requirements</li>
            </ul>
          </div>
        </Card>
      </div>
  );
}


