package com.cubstechnical.admin;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable WebView debugging (for development)
        android.webkit.WebView.setWebContentsDebuggingEnabled(true);
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Enable necessary WebView settings
        if (this.bridge != null && this.bridge.getWebView() != null) {
            android.webkit.WebView webView = this.bridge.getWebView();
            android.webkit.WebSettings settings = webView.getSettings();
            
            // Enable JavaScript
            settings.setJavaScriptEnabled(true);
            
            // Enable DOM storage
            settings.setDomStorageEnabled(true);
            
            // Enable database storage
            settings.setDatabaseEnabled(true);
            
            // Enable file access
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
            
            // Enable mixed content (HTTP/HTTPS)
            settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }
}
