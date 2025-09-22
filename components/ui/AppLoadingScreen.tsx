'use client';

import { Loader2, Shield, Users, FileText } from 'lucide-react';
import Image from 'next/image';

interface AppLoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export default function AppLoadingScreen({ 
  message = "Loading Your App", 
  showProgress = false,
  progress = 0 
}: AppLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d3194f]/5 via-white to-[#b0173a]/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        {/* Logo/Icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <Image
              src="/assets/cubs.webp"
              alt="CUBS Technical Logo"
              width={60}
              height={60}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* App Name */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            CUBS Visa Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Secure Employee Document Management
          </p>
        </div>

        {/* Loading Message */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {message}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please wait while we prepare everything for you...
          </p>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#d3194f] to-[#b0173a] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Loading Animation */}
        <div className="flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-[#d3194f] rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-[#d3194f] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-[#d3194f] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>

        {/* Feature Icons */}
        <div className="flex justify-center space-x-6 pt-4">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-xs">Employees</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Documents</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Secure</span>
          </div>
        </div>

        {/* Loading Tips */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p>💡 Tip: The app will load faster on subsequent visits</p>
        </div>
      </div>
    </div>
  );
}

