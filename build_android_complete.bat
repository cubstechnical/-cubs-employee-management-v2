@echo off
REM Comprehensive Android Build Script - Working Solution
echo =====================================================
echo   CUBS Admin - Android Build Script (Complete)
echo =====================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: npm is not available
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Set Java environment (adjust path as needed)
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot
)
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Java\jdk-17
)
if not exist "%JAVA_HOME%" (
    echo ❌ ERROR: Java JDK not found
    echo Please install Java JDK 17 or 21 from:
    echo https://adoptium.net/
    pause
    exit /b 1
)

set PATH=%JAVA_HOME%\bin;%PATH%
echo ✅ Java Home: %JAVA_HOME%

REM Verify Java version
java -version 2>&1 | findstr "17\|21" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  WARNING: Java version might not be optimal
    echo Recommended: Java 17 or 21
    java -version
)

echo.
echo 📦 Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🏗️  Step 2: Building Next.js app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Failed to build Next.js app
    echo Make sure your .env file is configured properly
    pause
    exit /b 1
)

echo.
echo 📱 Step 3: Adding Android platform (if not exists)...
call npx cap add android --skip-existing
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Android platform might already exist
)

echo.
echo 🔄 Step 4: Syncing with Capacitor...
call npx cap copy android
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Failed to sync with Capacitor
    pause
    exit /b 1
)

echo.
echo 🧹 Step 5: Cleaning Android project...
cd android
call gradlew clean --warning-mode all
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Clean had some issues, continuing...
)

echo.
echo 🚀 Step 6: Building Android APK...
call gradlew assembleDebug -Dorg.gradle.java.home="%JAVA_HOME%" --warning-mode all --info
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Android build failed
    echo.
    echo Trying with additional flags...
    call gradlew assembleDebug -Dorg.gradle.java.home="%JAVA_HOME%" --warning-mode all --stacktrace --info
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ ERROR: Android build failed completely
        cd ..
        pause
        exit /b 1
    )
)

cd ..

echo.
echo ===============================================
echo ✅ BUILD SUCCESSFUL!
echo ===============================================
echo.
echo 📁 APK Location: android\app\build\outputs\apk\debug\app-debug.apk
echo 📱 App Name: CUBS Visa Management
echo 📦 Package: com.cubstechnical.admin
echo.
echo 🔧 Next Steps:
echo 1. Install APK: gradlew installDebug (in android folder)
echo 2. Run on device: gradlew runDebug (in android folder)
echo 3. Open Android Studio: npm run cap:android
echo.
echo 🎯 Demo Credentials:
echo Email: info@cubstechnical.com
echo Password: Admin@123456
echo.

pause
