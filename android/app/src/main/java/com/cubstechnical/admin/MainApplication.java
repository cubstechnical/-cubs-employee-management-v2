package com.cubstechnical.admin;

import android.app.Application;
import android.webkit.WebView;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        
        // Enable WebView debugging in debug builds
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
