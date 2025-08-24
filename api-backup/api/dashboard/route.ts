import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { EmployeeService } from '@/lib/services/employees';
import { FileUploadService } from '@/lib/services/fileUpload';
import { getVisaExpiryStats } from '@/lib/services/visaNotifications';

// GET /api/dashboard - Get dashboard analytics and statistics
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      // Get all required data in parallel
      const [
        employees,
        documentStats,
        visaStats
      ] = await Promise.all([
        EmployeeService.getEmployees({ page: 1, pageSize: 1000 }, {}),
        FileUploadService.getDocumentStats(),
        getVisaExpiryStats(),
      ]);

      // Calculate employee statistics
      const totalEmployees = employees.employees?.length || 0;
      const activeEmployees = employees.employees?.filter(emp => emp.is_active)?.length || 0;
      const inactiveEmployees = totalEmployees - activeEmployees;

      // Calculate company distribution
      const companyDistribution = employees.employees?.reduce((acc, emp) => {
        const company = emp.company_name || 'Unknown';
        acc[company] = (acc[company] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate trade distribution
      const tradeDistribution = employees.employees?.reduce((acc, emp) => {
        const trade = emp.trade || 'Unknown';
        acc[trade] = (acc[trade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate nationality distribution
      const nationalityDistribution = employees.employees?.reduce((acc, emp) => {
        const nationality = emp.nationality || 'Unknown';
        acc[nationality] = (acc[nationality] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate visa status distribution
      const visaStatusDistribution = employees.employees?.reduce((acc, emp) => {
        const status = emp.visa_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate monthly growth (last 6 months)
      const monthlyGrowth = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Count employees who joined in this month
        const employeesInMonth = employees.employees?.filter(emp => {
          if (!emp.join_date) return false;
          const joinDate = new Date(emp.join_date);
          return joinDate.getMonth() === date.getMonth() && 
                 joinDate.getFullYear() === date.getFullYear();
        })?.length || 0;
        
        monthlyGrowth.push({
          month: monthName,
          count: employeesInMonth,
        });
      }

      // Calculate urgent alerts from visa stats
      const urgentAlerts = visaStats.expiringSoon;
      const highPriorityAlerts = 0; // Will be calculated from employee data if needed

      const dashboardData = {
        overview: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          totalDocuments: documentStats.total,
          totalStorageUsed: FileUploadService.formatFileSize(documentStats.totalSize),
          urgentAlerts,
          highPriorityAlerts,
        },
        distributions: {
          companies: Object.entries(companyDistribution).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalEmployees) * 100),
          })),
          trades: Object.entries(tradeDistribution).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalEmployees) * 100),
          })),
          nationalities: Object.entries(nationalityDistribution).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalEmployees) * 100),
          })),
          visaStatuses: Object.entries(visaStatusDistribution).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalEmployees) * 100),
          })),
        },
        documents: {
          total: documentStats.total,
          byType: Object.entries(documentStats.byType).map(([type, count]) => ({
            type,
            count,
            percentage: Math.round((count / documentStats.total) * 100),
          })),
          totalSize: documentStats.totalSize,
          formattedSize: FileUploadService.formatFileSize(documentStats.totalSize),
        },
        visaAlerts: {
          total: visaStats.expiringSoon + visaStats.expired,
          urgent: urgentAlerts,
          highPriority: highPriorityAlerts,
          mediumPriority: 0,
          lowPriority: 0,
        },
        growth: {
          monthly: monthlyGrowth,
          totalGrowth: monthlyGrowth.reduce((sum, month) => sum + month.count, 0),
        },
        notifications: {
          totalEmployees: visaStats.totalEmployees,
          expiringSoon: visaStats.expiringSoon,
          expired: visaStats.expired,
          notificationsSent: visaStats.notificationsSent,
        },
      };

      return NextResponse.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
} 