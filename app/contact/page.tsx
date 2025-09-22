'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '', type: 'general' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
            Contact Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get help with your account or technical issues
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-[#d3194f] mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <a href="mailto:info@cubstechnical.com" className="hover:underline">
                      info@cubstechnical.com
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-[#d3194f] mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <a href="tel:+971501234567" className="hover:underline">
                      +971-50-123-4567
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#d3194f] mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dubai, UAE<br />
                    Business Bay
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-[#d3194f] mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Business Hours</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sunday - Thursday: 9:00 AM - 6:00 PM<br />
                    Friday - Saturday: Closed
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Help
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Account Issues
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Forgot password, account locked, or login problems
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Technical Support
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  App crashes, slow performance, or feature issues
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Billing & Subscriptions
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Payment issues, subscription changes, or refunds
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Send us a Message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Inquiry Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d3194f]"
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Support</option>
                  <option value="account">Account Issues</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>

              <Input
                label="Subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                required
                placeholder="Brief description of your inquiry"
              />

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d3194f] resize-none"
                  placeholder="Please provide detailed information about your inquiry..."
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Additional Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Response Time
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200">General Inquiries</h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">24-48 hours</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Technical Support</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">12-24 hours</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="font-semibold text-red-800 dark:text-red-200">Urgent Issues</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">2-6 hours</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
