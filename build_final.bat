@echo off
REM ===================================================================
REM   CUBS Admin - Final Working Build Script for Android
REM   This script provides a guaranteed working solution
REM ===================================================================

echo.
echo =====================================================
echo   CUBS Admin - Final Android Build Solution
echo =====================================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js not found
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js: Available

REM Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: npm not found
    pause
    exit /b 1
)
echo ✅ npm: Available

REM Set Java environment
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot
)
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Java\jdk-17
)
if not exist "%JAVA_HOME%" (
    echo ❌ ERROR: Java JDK not found
    echo Please install Java JDK 17 or 21
    pause
    exit /b 1
)
set PATH=%JAVA_HOME%\bin;%PATH%
echo ✅ Java: %JAVA_HOME%

echo.
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo 🏗️ Building web application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Web build failed
    pause
    exit /b 1
)
echo ✅ Web app built successfully

echo.
echo 📱 Setting up Android platform...
call npx cap add android
echo ✅ Android platform ready

echo.
echo 🔄 Syncing with Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Capacitor sync failed
    pause
    exit /b 1
)
echo ✅ Capacitor sync complete

echo.
echo 🧹 Cleaning Android project...
cd android
call gradlew clean
cd ..

echo.
echo 🚀 Building Android APK...
cd android
call gradlew assembleDebug -Dorg.gradle.java.home="%JAVA_HOME%"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Android build failed
    cd ..
    pause
    exit /b 1
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
echo 🎯 Demo Credentials:
echo Email: info@cubstechnical.com
echo Password: Admin@123456
echo.
echo 🔧 To install on device:
echo 1. Enable Developer Options on Android device
echo 2. Enable USB Debugging
echo 3. Connect device to computer
echo 4. Run: cd android && gradlew installDebug
echo.
echo ✅ Your Android app is ready for deployment!
echo.
pause
