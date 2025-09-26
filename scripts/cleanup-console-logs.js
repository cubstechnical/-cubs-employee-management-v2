#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up console logs for production...');

// Files to clean up console logs
const filesToClean = [
  'lib/services/employees.ts',
  'lib/services/documents.ts',
  'app/login/page.tsx',
  'app/dashboard/page.tsx',
  'app/employees/page.tsx',
  'app/employees/page-enhanced.tsx',
  'app/admin/employees/page.tsx',
  'app/admin/documents/page.tsx',
  'components/employees/VirtualizedEmployeeList.tsx',
  'lib/services/auth.ts',
  'lib/services/notifications.ts',
  'lib/services/dashboard.ts',
  'lib/services/backblaze.ts',
  'lib/services/email-server.ts',
  'lib/services/audit.ts',
  'lib/services/visaNotifications.ts',
  'lib/services/settings.ts',
  'lib/services/companyStats.ts',
  'lib/services/fileUpload.ts',
  'lib/services/edgeFunctions.ts',
  'lib/services/email.ts',
  'lib/services/offline.ts',
  'lib/monitoring/performance.ts',
  'lib/utils/performanceMonitor.ts',
  'lib/utils/performance.ts',
  'lib/utils/errorHandler.ts',
  'lib/utils/logger.ts',
  'lib/capacitor.ts',
  'lib/supabase/client.ts',
  'lib/contexts/AuthContext.tsx',
  'lib/contexts/SimpleAuthContext.tsx',
  'components/performance/PerformanceMonitor.tsx',
  'components/performance/LoadingTracker.tsx',
  'components/performance/CoreWebVitals.tsx',
  'components/ui/PerformanceTracker.tsx',
  'components/ui/UnifiedErrorBoundary.tsx',
  'components/ui/DashboardErrorBoundary.tsx',
  'components/ui/MobileErrorBoundary.tsx',
  'components/mobile/MobileErrorBoundary.tsx',
  'components/layout/OptimizedLayout.tsx',
  'components/dashboard/Settings.tsx',
  'components/dashboard/EmployeeGrowthChart.tsx',
  'components/dashboard/DashboardRefreshButton.tsx',
  'components/documents/UploadModal.tsx',
  'components/documents/DocumentPreview.tsx',
  'components/documents/SearchDemo.tsx',
  'components/documents/VirtualizedDocumentList.tsx',
  'components/documents/DocumentSearch.tsx',
  'components/documents/DocumentBulkActions.tsx',
  'components/auth/PendingApproval.tsx',
  'components/auth/ForgotPassword.tsx',
  'components/auth/ResetPassword.tsx',
  'components/auth/Register.tsx',
  'components/auth/Callback.tsx',
  'components/admin/EmployeeDetail.tsx',
  'components/admin/Notifications.tsx',
  'components/admin/EmployeeMappings.tsx',
  'components/admin/PerformanceDashboard.tsx',
  'components/debug/MobileAuthDebug.tsx',
  'components/layout/AppErrorBoundary.tsx',
  'components/pwa/PWARegistration.tsx',
  'hooks/usePWA.ts',
  'hooks/usePerformance.ts',
  'hooks/useMobileApp.ts',
  'hooks/useRealtimeDashboard.ts',
  'lib/hooks/useDocuments.ts',
  'lib/hooks/useEmployees.ts',
  'app/employees/[id]/page.tsx',
  'app/employees/new/page.tsx',
  'app/employees/components/EmployeeCard.tsx',
  'app/employees/components/BulkActions.tsx',
  'app/employees/components/EnhancedSearch.tsx',
  'app/employees/components/EnhancedFilters.tsx',
  'app/employees/components/EnhancedPagination.tsx',
  'app/notifications/page.tsx',
  'app/pending-approval/page.tsx',
  'app/delete-account/page.tsx',
  'app/admin/notifications/page.tsx',
  'app/admin/employee-mappings/page.tsx',
  'app/admin/dashboard/page.tsx',
  'app/admin/dashboard-new/page.tsx',
  'app/admin/dashboard-modern/page.tsx',
  'app/admin/settings/page.tsx',
  'app/admin/users/page.tsx',
  'app/admin/admins/page.tsx',
  'app/admin/employees/new/page.tsx',
  'app/error.tsx',
  'app/not-found.tsx',
  'app/callback/page.tsx',
  'app/forgot-password/page.tsx',
  'app/register/page.tsx',
  'app/reset-password/page.tsx',
  'app/settings/page.tsx',
  'app/contact/page.tsx',
  'app/about/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/diagnostics/page.tsx',
  'app/pending/page.tsx',
  'utils/mobileDetection.ts',
  'utils/performance.ts',
  'lib/utils/environment.ts',
  'lib/api/middleware.ts',
  'supabase/doc-manager/index.ts',
  'supabase/send-visa-notifications/index.ts'
];

// Production logger import
const productionLoggerImport = `import { log } from '@/lib/utils/productionLogger';`;

// Console log patterns to replace
const consolePatterns = [
  {
    pattern: /console\.log\(/g,
    replacement: 'log.info('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'log.warn('
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'log.error('
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'log.debug('
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'log.info('
  },
  {
    pattern: /console\.group\(/g,
    replacement: 'log.group('
  },
  {
    pattern: /console\.groupEnd\(/g,
    replacement: 'log.groupEnd('
  },
  {
    pattern: /console\.time\(/g,
    replacement: 'perfLog.start('
  },
  {
    pattern: /console\.timeEnd\(/g,
    replacement: 'perfLog.end('
  },
  {
    pattern: /console\.timeStamp\(/g,
    replacement: 'perfLog.mark('
  }
];

function cleanConsoleLogs(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasConsoleLogs = false;
  let hasLoggerImport = false;

  // Check if file has console logs
  if (content.includes('console.')) {
    hasConsoleLogs = true;
  }

  // Check if file already has logger import
  if (content.includes('@/lib/utils/productionLogger')) {
    hasLoggerImport = true;
  }

  if (!hasConsoleLogs) {
    return; // No console logs to clean
  }

  // Add logger import if needed
  if (hasConsoleLogs && !hasLoggerImport) {
    // Find the best place to add the import
    const lines = content.split('\n');
    let insertIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith("import ")) {
        insertIndex = i + 1;
      }
    }
    
    lines.splice(insertIndex, 0, productionLoggerImport);
    content = lines.join('\n');
  }

  // Replace console patterns
  consolePatterns.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  // Add perfLog import if needed
  if (content.includes('perfLog.') && !content.includes('perfLog')) {
    content = content.replace(
      productionLoggerImport,
      `${productionLoggerImport}\nimport { perfLog } from '@/lib/utils/productionLogger';`
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ Cleaned: ${filePath}`);
}

// Clean all files
filesToClean.forEach(cleanConsoleLogs);

console.log('🎉 Console log cleanup complete!');
console.log('📝 Note: All console statements now use production-safe logging.');
