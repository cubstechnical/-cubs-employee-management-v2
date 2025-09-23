import { handleNetworkError } from '../monitoring/performance';

export interface OfflineQueueItem {
  id: string;
  type: 'upload' | 'update' | 'delete' | 'sync';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class OfflineService {
  private static readonly QUEUE_KEY = 'offline_queue';
  private static readonly CACHE_KEY = 'offline_cache';
  private static readonly MAX_RETRY_COUNT = 3;
  private static isOnline: boolean = true;

  // Initialize offline detection
  static init() {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - processing offline queue');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline - operations will be queued');
    });

    // Check connectivity periodically
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  // Check if the app is online
  static isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Add operation to offline queue
  static async queueOperation(type: OfflineQueueItem['type'], data: any): Promise<string> {
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRY_COUNT,
    };

    const queue = this.getOfflineQueue();
    queue.push(item);
    this.saveOfflineQueue(queue);

    console.log(`📋 Queued ${type} operation for offline processing: ${item.id}`);
    return item.id;
  }

  // Process offline queue when back online
  static async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`🔄 Processing ${queue.length} offline operations`);

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        // Remove successful items from queue
        this.removeFromQueue(item.id);
        console.log(`✅ Processed offline operation: ${item.id}`);
      } catch (error) {
        item.retryCount++;

        if (item.retryCount >= item.maxRetries) {
          console.error(`❌ Max retries reached for operation: ${item.id}`, error);
          this.removeFromQueue(item.id);
          handleNetworkError(error instanceof Error ? error : new Error(String(error)), `offline_operation_${item.type}`);
        } else {
          console.warn(`⚠️ Retry ${item.retryCount}/${item.maxRetries} for operation: ${item.id}`);
        }
      }
    }

    this.saveOfflineQueue(queue.filter(item => item.retryCount < item.maxRetries));
  }

  // Process individual queue item
  private static async processQueueItem(item: OfflineQueueItem): Promise<void> {
    switch (item.type) {
      case 'upload':
        // Handle document upload
        await this.handleUploadOperation(item.data);
        break;
      case 'update':
        // Handle data update
        await this.handleUpdateOperation(item.data);
        break;
      case 'delete':
        // Handle delete operation
        await this.handleDeleteOperation(item.data);
        break;
      case 'sync':
        // Handle sync operation
        await this.handleSyncOperation(item.data);
        break;
      default:
        throw new Error(`Unknown operation type: ${item.type}`);
    }
  }

  // Handle upload operations
  private static async handleUploadOperation(data: any): Promise<void> {
    // Implement your upload logic here
    // This should integrate with your existing upload service
    console.log('Processing offline upload:', data);
  }

  // Handle update operations
  private static async handleUpdateOperation(data: any): Promise<void> {
    // Implement your update logic here
    console.log('Processing offline update:', data);
  }

  // Handle delete operations
  private static async handleDeleteOperation(data: any): Promise<void> {
    // Implement your delete logic here
    console.log('Processing offline delete:', data);
  }

  // Handle sync operations
  private static async handleSyncOperation(data: any): Promise<void> {
    // Implement your sync logic here
    console.log('Processing offline sync:', data);
  }

  // Cache data for offline access
  static cacheData(key: string, data: any): void {
    if (typeof window === 'undefined') return;

    try {
      const cache = this.getCache();
      cache[key] = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  // Get cached data
  static getCachedData(key: string): any | null {
    if (typeof window === 'undefined') return null;

    try {
      const cache = this.getCache();
      const cached = cache[key];

      if (!cached) return null;

      if (Date.now() > cached.expiresAt) {
        delete cache[key];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Clear expired cache
  static clearExpiredCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cache = this.getCache();
      const now = Date.now();

      Object.keys(cache).forEach(key => {
        if (cache[key].expiresAt < now) {
          delete cache[key];
        }
      });

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  // Get offline queue
  private static getOfflineQueue(): OfflineQueueItem[] {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem(this.QUEUE_KEY) || '[]');
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  // Save offline queue
  private static saveOfflineQueue(queue: OfflineQueueItem[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  // Remove item from queue
  private static removeFromQueue(id: string): void {
    const queue = this.getOfflineQueue();
    const filtered = queue.filter(item => item.id !== id);
    this.saveOfflineQueue(filtered);
  }

  // Get cache
  private static getCache(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    try {
      return JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
    } catch (error) {
      console.error('Failed to get cache:', error);
      return {};
    }
  }

  // Check connectivity
  private static async checkConnectivity(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      const wasOffline = !this.isOnline;
      this.isOnline = response.ok;

      if (wasOffline && this.isOnline) {
        console.log('🌐 Connectivity restored');
        this.processOfflineQueue();
      } else if (!wasOffline && !this.isOnline) {
        console.log('📴 Connectivity lost');
      }
    } catch (error) {
      if (this.isOnline) {
        console.log('📴 Connectivity lost');
        this.isOnline = false;
      }
    }
  }

  // Get queue status
  static getQueueStatus(): { queued: number; processing: boolean } {
    const queue = this.getOfflineQueue();
    return {
      queued: queue.length,
      processing: false, // You could add a processing flag if needed
    };
  }

  // Clear all offline data
  static clearOfflineData(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.QUEUE_KEY);
      localStorage.removeItem(this.CACHE_KEY);
      console.log('🧹 Cleared all offline data');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
}

// Initialize offline service when module loads
OfflineService.init();
