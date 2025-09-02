// Optimized Dashboard Service - Single API Call Implementation
import { supabase } from '@/lib/supabase/client';

export interface OptimizedDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDocuments: number;
  pendingApprovals: number;
  visasExpiringSoon: number;
  departments: number;
  companyDistribution: Array<{
    name: string;
    employees: number;
    percentage: number;
  }>;
  departmentDistribution: Array<{
    name: string;
    employees: number;
    percentage: number;
  }>;
  expiringVisas: Array<{
    employee_id: string;
    name: string;
    visa_type: string;
    visa_expiry_date: string;
    daysLeft: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
    employee_id: string;
  }>;
}

class OptimizedDashboardService {
  private static cache: {
    data: OptimizedDashboardStats | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };

  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all dashboard data in a single optimized API call
   * Uses the consolidated get_dashboard_stats() RPC function
   */
  static async getDashboardStats(): Promise<OptimizedDashboardStats> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache.data && (now - this.cache.timestamp) < this.CACHE_DURATION) {
      return this.cache.data;
    }

    try {
      const startTime = performance.now();

      // Single RPC call to get all dashboard data
      const { data, error } = await supabase.rpc('get_dashboard_stats');

      if (error) {
        console.error('Dashboard RPC error:', error);
        
        // If function doesn't exist, return fallback data
        if (error.code === '42883' || error.message?.includes('does not exist')) {
          console.warn('Dashboard RPC function not found, using fallback data');
          return this.getFallbackDashboardData();
        }
        
        throw new Error(`Dashboard data fetch failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No dashboard data returned');
      }

      const endTime = performance.now();
      console.log(`✅ Dashboard data fetched in ${(endTime - startTime).toFixed(2)}ms`);

      // Transform the RPC response to match our interface
      const rpcData = data as any; // Type assertion for RPC response
      const stats: OptimizedDashboardStats = {
        totalEmployees: Number(rpcData.totalEmployees) || 0,
        activeEmployees: Number(rpcData.activeEmployees) || 0,
        totalDocuments: Number(rpcData.totalDocuments) || 0,
        pendingApprovals: Number(rpcData.pendingApprovals) || 0,
        visasExpiringSoon: Number(rpcData.visasExpiringSoon) || 0,
        departments: Number(rpcData.departments) || 0,
        companyDistribution: rpcData.companyDistribution || [],
        departmentDistribution: rpcData.departmentDistribution || [],
        expiringVisas: rpcData.expiringVisas || [],
        recentActivity: rpcData.recentActivity || []
      };

      // Cache the result
      this.cache = {
        data: stats,
        timestamp: now
      };

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Return fallback data structure to prevent crashes
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalDocuments: 0,
        pendingApprovals: 0,
        visasExpiringSoon: 0,
        departments: 0,
        companyDistribution: [],
        departmentDistribution: [],
        expiringVisas: [],
        recentActivity: []
      };
    }
  }

  /**
   * Get fallback dashboard data when RPC function is not available
   */
  private static async getFallbackDashboardData(): Promise<OptimizedDashboardStats> {
    console.log('🔄 Using fallback dashboard data...');
    
    // Return basic fallback data structure
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      totalDocuments: 0,
      pendingApprovals: 0,
      visasExpiringSoon: 0,
      departments: 0,
      companyDistribution: [],
      departmentDistribution: [],
      expiringVisas: [],
      recentActivity: []
    };
  }

  /**
   * Clear the cache to force fresh data
   */
  static clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }

  /**
   * Preload dashboard data in background
   */
  static async preloadDashboardData(): Promise<void> {
    try {
      await this.getDashboardStats();
      console.log('✅ Dashboard data preloaded');
    } catch (error) {
      console.warn('Dashboard preload failed:', error);
    }
  }
}

export { OptimizedDashboardService };
