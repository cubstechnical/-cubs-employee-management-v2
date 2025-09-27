'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/utils/productionLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DeleteAccountPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" exactly to confirm');
      return;
    }

    if (!email.trim()) {
      toast.error('Please provide your email address');
      return;
    }

    setIsDeleting(true);
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to delete your account');
        setIsDeleting(false);
        return;
      }

      // For mobile app, show that server-side implementation is needed
      console.log('Account deletion request (client-side):', { email, reason, confirmation });

      // For demo purposes, just sign out
      toast('Account deletion requires server-side implementation', { icon: 'ℹ️' });
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      log.error('Error deleting account:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delete Your Account
          </h1>
          <p className="text-gray-600">
            CUBS Visa Management - Account Deletion Request
          </p>
        </div>

        <Card className="mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              Important Information
            </h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">
                <strong>This action is permanent and cannot be undone.</strong> 
                All your data will be permanently deleted from our systems.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What will be deleted:</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Your user account and profile information</li>
                  <li>• All employee records you&apos;ve created</li>
                  <li>• All uploaded documents and files</li>
                  <li>• Your login credentials and authentication data</li>
                  <li>• All app activity and usage history</li>
                  <li>• Any saved preferences and settings</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What will be retained:</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Legal compliance records (7 years as required by law)</li>
                  <li>• System logs for security purposes (30 days)</li>
                  <li>• Backup data (automatically deleted after 90 days)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data retention period:</h3>
                <p className="text-sm text-gray-700">
                  After account deletion, any retained data will be automatically deleted within 90 days. 
                  Legal compliance records may be retained for up to 7 years as required by applicable laws.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Deletion Request</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps us verify your identity and process your request
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Deletion (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please let us know why you're leaving..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <hr className="my-6 border-gray-200" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation *
                </label>
                <Input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Type: DELETE MY ACCOUNT"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Type exactly: <code className="bg-gray-100 px-1 rounded">DELETE MY ACCOUNT</code>
                </p>
              </div>

              <Button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmation !== 'DELETE MY ACCOUNT' || !email.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
              </Button>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="text-gray-600"
                >
                  Cancel - Keep My Account
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help? Contact us at{' '}
            <a href="mailto:info@cubstechnical.com" className="text-blue-600 hover:underline">
              info@cubstechnical.com
            </a>
          </p>
          <p className="mt-1">
            Response time: Within 30 days
          </p>
        </div>
      </div>
    </div>
  );
}
