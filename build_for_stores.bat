@echo off
echo ========================================
echo   CUBS VISA MANAGEMENT - STORE BUILDER
echo ========================================
echo.

REM Set Java 17 environment (compatible with Android builds)
echo Setting Java 17 environment...
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.12.7-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

REM Verify Java version
echo Checking Java version...
java -version
echo.

echo Step 1: Installing dependencies...
npm install
echo.

echo Step 2: Building web application...
npm run build
echo.

echo Step 3: Syncing with native platforms...
npx cap sync
echo.

echo Step 4: Opening Android Studio for release build...
echo.
echo ============= ANDROID BUILD STEPS =============
echo 1. Android Studio will open automatically
echo 2. Wait for Gradle sync to complete
echo 3. Go to: Build → Generate Signed Bundle/APK
echo 4. Choose: Android App Bundle (.aab)
echo 5. Create new keystore:
echo    - Path: F:\final\android\app\release-key.jks
echo    - Password: cubs2024
echo    - Alias: cubs-key
echo    - Validity: 25 years
echo 6. Select Release build variant
echo 7. Click Finish
echo 8. Find output: android\app\release\app-release.aab
echo ===============================================
echo.
pause

npx cap open android

echo.
echo ============== iOS BUILD STEPS ==============
echo 1. Run: npx cap open ios
echo 2. In Xcode, set Bundle Identifier: com.cubstechnical.visa
echo 3. Select your Apple Developer Team
echo 4. Set Deployment Target: iOS 14.0
echo 5. Go to: Product → Archive
echo 6. In Organizer: Distribute App → App Store Connect
echo 7. Follow upload wizard
echo =============================================
echo.
echo Would you like to open iOS project? (y/n)
set /p choice="Enter choice: "
if /i "%choice%"=="y" (
    npx cap open ios
)

echo.
echo ========================================
echo           BUILD COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Upload Android AAB to Google Play Console
echo 2. Upload iOS Archive to App Store Connect
echo 3. Fill out store listings using provided assets
echo 4. Submit for review
echo.
echo Demo credentials for reviewers:
echo Email: info@cubstechnical.com
echo Password: Admin@123456
echo.
echo Technical support: admin@chocosoftdev.com
echo.
pause
