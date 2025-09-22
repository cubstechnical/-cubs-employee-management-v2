'use client';

import { useState, useEffect } from 'react';
import { OfflineService } from '@/lib/services/offline';
import { Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react';
import Card from './Card';
import Button from './Button';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueStatus, setQueueStatus] = useState({ queued: 0, processing: false });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initialize offline service
    OfflineService.init();

    // Check initial status
    setIsOnline(OfflineService.isOnlineStatus());
    setQueueStatus(OfflineService.getQueueStatus());

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setQueueStatus(OfflineService.getQueueStatus());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setQueueStatus(OfflineService.getQueueStatus());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update queue status periodically
    const interval = setInterval(() => {
      setQueueStatus(OfflineService.getQueueStatus());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Don't render anything if online and no queued operations
  if (isOnline && queueStatus.queued === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className={`border-l-4 ${
        isOnline
          ? 'border-l-[#d3194f] bg-[#d3194f]/5 dark:bg-[#d3194f]/10'
          : 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20'
      }`}>
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${
            isOnline ? 'text-[#d3194f] dark:text-[#d3194f]' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {isOnline ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${
                isOnline ? 'text-[#d3194f] dark:text-[#d3194f]' : 'text-orange-800 dark:text-orange-200'
              }`}>
                {isOnline ? 'Back Online' : 'Offline Mode'}
              </p>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`text-xs underline ${
                  isOnline ? 'text-[#d3194f] dark:text-[#d3194f]' : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                {showDetails ? 'Less' : 'More'}
              </button>
            </div>

            <p className={`text-xs mt-1 ${
              isOnline ? 'text-[#d3194f] dark:text-[#d3194f]' : 'text-orange-700 dark:text-orange-300'
            }`}>
              {isOnline
                ? queueStatus.queued > 0
                  ? `Syncing ${queueStatus.queued} pending ${queueStatus.queued === 1 ? 'operation' : 'operations'}`
                  : 'All operations synced'
                : 'Operations will be synced when connection is restored'
              }
            </p>

            {/* Details */}
            {showDetails && (
              <div className="mt-3 space-y-2">
                {queueStatus.queued > 0 && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Clock className={`w-3 h-3 ${
                      isOnline ? 'text-[#d3194f] dark:text-[#d3194f]' : 'text-orange-600 dark:text-orange-400'
                    }`} />
                    <span className={
                      isOnline ? 'text-[#d3194f] dark:text-[#d3194f]' : 'text-orange-700 dark:text-orange-300'
                    }>
                      {queueStatus.queued} queued {queueStatus.queued === 1 ? 'operation' : 'operations'}
                    </span>
                  </div>
                )}

                {!isOnline && (
                  <div className="flex items-center space-x-2 text-xs">
                    <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-700 dark:text-orange-300">
                      Limited functionality available
                    </span>
                  </div>
                )}

                {queueStatus.queued > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Force process queue if online
                      if (isOnline) {
                        OfflineService.processOfflineQueue();
                      }
                    }}
                    disabled={!isOnline}
                    className="w-full text-xs"
                  >
                    {isOnline ? 'Sync Now' : 'Will Sync When Online'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
