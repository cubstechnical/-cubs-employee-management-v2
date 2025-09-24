#!/bin/bash

# iOS Certificate Fix Script
# This script helps diagnose and fix iOS certificate issues in Codemagic

echo "🔐 iOS Certificate Fix Script"
echo "=============================="

# Check if we're in Codemagic
if [ -n "$CM_BUILD_ID" ]; then
    echo "✅ Running in Codemagic environment"
else
    echo "⚠️  Not running in Codemagic - this script is designed for Codemagic builds"
fi

echo ""
echo "🔍 Diagnosing certificate issues..."

# Check App Store Connect integration
echo "1. Checking App Store Connect integration..."
if [ -n "$APP_STORE_CONNECT_API_KEY" ]; then
    echo "✅ App Store Connect API key is available"
else
    echo "❌ App Store Connect API key is NOT available"
    echo "   This means the App Store Connect integration is not properly configured"
    echo "   Go to Codemagic → Teams → Integrations → Apple Developer Portal"
    echo "   Make sure the integration is named 'appstorekey' and properly configured"
fi

# Check environment variables
echo ""
echo "2. Checking environment variables..."
echo "Bundle ID: $BUNDLE_ID"
echo "App Store App ID: $APP_STORE_APP_ID"
echo "Development Team: $DEVELOPMENT_TEAM"

# Check available certificates
echo ""
echo "3. Checking available certificates..."
CERT_COUNT=$(security find-identity -v -p codesigning | grep -c "valid identities found" || echo "0")
if [ "$CERT_COUNT" -gt 0 ]; then
    echo "✅ Found $CERT_COUNT valid certificates:"
    security find-identity -v -p codesigning
else
    echo "❌ No valid certificates found"
    echo "   This is the root cause of the export failure"
    echo "   The App Store Connect integration is not providing certificates"
fi

# Check if app exists in App Store Connect
echo ""
echo "4. Checking App Store Connect app existence..."
if [ -n "$APP_STORE_APP_ID" ] && [ "$APP_STORE_APP_ID" != "6752909710" ]; then
    echo "⚠️  App Store App ID is set to: $APP_STORE_APP_ID"
    echo "   Make sure this matches your app in App Store Connect"
else
    echo "ℹ️  Using default App Store App ID: 6752909710"
    echo "   Verify this is correct in App Store Connect"
fi

# Provide solutions
echo ""
echo "🛠️  Solutions to try:"
echo "==================="

if [ "$CERT_COUNT" -eq 0 ]; then
    echo "1. Fix App Store Connect Integration:"
    echo "   - Go to Codemagic → Teams → Integrations"
    echo "   - Check 'Apple Developer Portal' integration"
    echo "   - Ensure it's named 'appstorekey'"
    echo "   - Verify API key has 'App Manager' or 'Admin' access"
    echo ""
    echo "2. Create App in App Store Connect:"
    echo "   - Go to https://appstoreconnect.apple.com"
    echo "   - Create app with bundle ID: $BUNDLE_ID"
    echo "   - Wait 5-10 minutes for certificates to be generated"
    echo ""
    echo "3. Check Apple Developer Account:"
    echo "   - Ensure account is active and paid"
    echo "   - Verify team ID: $DEVELOPMENT_TEAM"
    echo "   - Check that certificates are not expired"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Fix the App Store Connect integration in Codemagic"
echo "2. Ensure the app exists in App Store Connect"
echo "3. Run a new build to test the fix"
echo "4. Check the logs for 'Available certificates: X valid identities found'"

echo ""
echo "🔗 Useful Links:"
echo "==============="
echo "- App Store Connect: https://appstoreconnect.apple.com"
echo "- Codemagic Integrations: https://codemagic.io/teams/integrations"
echo "- Apple Developer Portal: https://developer.apple.com/account"

echo ""
echo "✅ Certificate fix script completed"
