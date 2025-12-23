'use client';

import { useEffect } from 'react';
import { suppressMobileWarnings } from '@/utils/mobileDetection';
import { initializeEnvironment } from '@/lib/utils/environment';

export default function MobileNavigationHandler() {
    useEffect(() => {
        // Suppress warnings and check environment
        suppressMobileWarnings();
        initializeEnvironment();

        // Intercept anchor clicks and override window.open on native to stay in-app
        if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform()) {
            try {
                // 1) Override window.open to keep navigation in the same WebView
                const originalOpen = window.open;
                window.open = function (url?: string | URL, target?: string, features?: string) {
                    try {
                        if (typeof url === 'string' || url instanceof URL) {
                            const href = String(url);
                            // For http(s) links and app routes, navigate in place
                            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/')) {
                                window.location.href = href;
                                return window;
                            }
                        }
                    } catch { }
                    // Fallback to original if anything unexpected
                    return originalOpen.apply(window, [url as any, target as any, features as any]);
                };

                // 2) Global click capture to normalize anchor behavior
                const handler = (e: any) => {
                    const anchor = e.target?.closest?.('a');
                    if (!anchor) return;
                    const href = anchor.getAttribute('href');
                    if (!href) return;
                    const isHash = href.startsWith('#');
                    const isProtocol = /^(mailto:|tel:|sms:|geo:)/i.test(href);
                    if (isHash || isProtocol) return; // allow native handlers
                    e.preventDefault();
                    // Remove attributes that force external contexts
                    if (anchor.removeAttribute) {
                        anchor.removeAttribute('target');
                        anchor.removeAttribute('rel');
                    }
                    // Navigate inside WebView
                    window.location.href = href;
                };
                window.addEventListener('click', handler, { capture: true });

                return () => {
                    window.removeEventListener('click', handler, { capture: true });
                    window.open = originalOpen;
                };
            } catch { }
        }
    }, []);

    return null;
}
