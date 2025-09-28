'use client';


// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <Card>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the CUBS Technical Admin Portal (&quot;the App&quot;), you accept 
              and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              The CUBS Technical Admin Portal is an employee management system that provides:
            </p>
            <ul>
              <li>Employee database management</li>
              <li>Document storage and organization</li>
              <li>Visa and permit tracking</li>
              <li>Administrative tools and reporting</li>
              <li>Communication features</li>
            </ul>

            <h2>3. User Accounts and Registration</h2>
            <p>
              To use certain features of the App, you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the App to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious code or content</li>
              <li>Attempt to gain unauthorized access to the system</li>
              <li>Interfere with the proper functioning of the App</li>
              <li>Use the App for any illegal or unauthorized purpose</li>
            </ul>

            <h2>5. Data and Privacy</h2>
            <p>
              Your use of the App is also governed by our Privacy Policy, which is incorporated 
              into these terms by reference. You consent to the collection and use of information 
              as outlined in our Privacy Policy.
            </p>

            <h2>6. Intellectual Property</h2>
            <p>
              The App and its original content, features, and functionality are owned by 
              CUBS Technical and are protected by international copyright, trademark, patent, 
              trade secret, and other intellectual property laws.
            </p>

            <h2>7. User Content</h2>
            <p>
              You retain ownership of any content you upload to the App. By uploading content, 
              you grant us a license to use, store, and display that content in connection 
              with providing the service.
            </p>

            <h2>8. Service Availability</h2>
            <p>
              We strive to maintain high availability of the App, but we do not guarantee 
              uninterrupted access. We may temporarily suspend the service for maintenance, 
              updates, or other operational reasons.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CUBS Technical shall not be liable 
              for any indirect, incidental, special, consequential, or punitive damages, 
              including but not limited to loss of profits, data, or use.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The App is provided &quot;as is&quot; without warranties of any kind, either express 
              or implied. We disclaim all warranties, including but not limited to 
              warranties of merchantability, fitness for a particular purpose, and 
              non-infringement.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless CUBS Technical from any claims, 
              damages, or expenses arising from your use of the App or violation of these terms.
            </p>

            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the App at any time, 
              with or without cause, with or without notice. Upon termination, your right 
              to use the App will cease immediately.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws 
              of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>

            <h2>14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users 
              of any material changes through the App or via email. Continued use of the 
              App after changes constitutes acceptance of the new terms.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <ul>
              <li>Email: info@cubstechnical.com</li>
              <li>Phone: +971-50-123-4567</li>
            </ul>

            <h2>16. Severability</h2>
            <p>
              If any provision of these terms is found to be unenforceable or invalid, 
              that provision will be limited or eliminated to the minimum extent necessary 
              so that these terms will otherwise remain in full force and effect.
            </p>

            <h2>17. Entire Agreement</h2>
            <p>
              These terms constitute the entire agreement between you and CUBS Technical 
              regarding the use of the App, superseding any prior agreements.
            </p>
          </div>
        </Card>
      </div>
  );
}


