'use client';

import { useEffect, useState } from 'react';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { log } from '@/lib/utils/productionLogger';

/**
 * Blank Screen Fix for iOS
 * Detects and fixes blank screen issues in Capacitor iOS apps
 * 
 * IMPORTANT: If you see a blank screen, the app needs to be rebuilt:
 * 1. Run: npm run build:mobile
 * 2. Run: npx cap sync ios
 * 3. Rebuild in Xcode
 */
export default function BlankScreenFix() {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!isCapacitorApp()) return;

    const checkAndFixBlankScreen = () => {
      // Wait for the app to render (give it time)
      setTimeout(() => {
        const rootElement = document.getElementById('__next');
        const body = document.body;
        
        // Check if app is blank (no content rendered)
        const hasRootContent = rootElement && rootElement.children.length > 0;
        const hasBodyContent = body && body.children.length > 1; // More than just script tags
        
        // Also check if there's any visible content
        const hasVisibleContent = body && (
          body.querySelector('div') || 
          body.querySelector('main') || 
          body.querySelector('section')
        );
        
        if (!hasRootContent && !hasBodyContent && !hasVisibleContent) {
          log.warn('⚠️ Blank screen detected!');
          setShowError(true);
          
          // Show error message to user
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #111827;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 99999;
            text-align: center;
          `;
          errorDiv.innerHTML = `
            <h1 style="font-size: 24px; margin-bottom: 20px;">⚠️ App Not Loaded</h1>
            <p style="margin-bottom: 20px; color: #9ca3af;">
              The app files may be missing. Please rebuild the app:
            </p>
            <ol style="text-align: left; max-width: 400px; margin: 0 auto 20px; color: #9ca3af;">
              <li style="margin-bottom: 10px;">Run: <code style="background: #1f2937; padding: 4px 8px; border-radius: 4px;">npm run build:mobile</code></li>
              <li style="margin-bottom: 10px;">Run: <code style="background: #1f2937; padding: 4px 8px; border-radius: 4px;">npx cap sync ios</code></li>
              <li>Rebuild in Xcode</li>
            </ol>
            <button onclick="window.location.reload()" style="
              background: #d3194f;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            ">Retry</button>
          `;
          document.body.appendChild(errorDiv);
          
          // Also try to reload once after showing error
          setTimeout(() => {
            log.info('🔄 Attempting automatic reload...');
            window.location.reload();
          }, 5000);
        } else {
          log.info('✅ App content detected, no blank screen issue');
          setShowError(false);
        }
      }, 3000); // Wait 3 seconds for app to render
    };

    // Check after app loads
    checkAndFixBlankScreen();
    
    // Listen for critical errors
    const errorHandler = (event: ErrorEvent) => {
      // Only log critical errors that might cause blank screen
      if (event.error && (
        event.error.message?.includes('Failed to fetch') ||
        event.error.message?.includes('Loading chunk') ||
        event.error.message?.includes('Cannot find module')
      )) {
        log.error('🚨 Critical error that might cause blank screen:', event.error);
        setShowError(true);
      }
    };

    window.addEventListener('error', errorHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  return null; // This component doesn't render anything (error shown via DOM manipulation)
}

