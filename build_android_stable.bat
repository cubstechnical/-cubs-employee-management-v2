@echo off
REM ===================================================================
REM   CUBS Admin - Stable Android Build Script
REM   This script provides maximum compatibility
REM ===================================================================

echo.
echo =====================================================
echo   CUBS Admin - Stable Android Build
echo =====================================================
echo.

REM Check prerequisites
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js not found
    pause
    exit /b 1
)
echo ✅ Node.js: Available

REM Set compatible Java environment
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.19.7-hotspot
)
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Java\jdk-17
)
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Java\jdk-11
)
if not exist "%JAVA_HOME%" (
    echo ❌ ERROR: Java JDK not found (need JDK 11 or 17)
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

echo.
echo 🏗️ Building web application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

echo.
echo 📱 Setting up Android platform...
call npx cap add android
call npx cap sync android

echo.
echo 🧹 Cleaning and invalidating caches...
cd android
call gradlew clean --no-daemon
call gradlew --stop

echo.
echo 🔧 Downloading dependencies...
call gradlew build --dry-run --no-daemon

echo.
echo 🚀 Building Android APK...
call gradlew assembleDebug --no-daemon --warning-mode all
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed, trying with different approach...
    echo.
    call gradlew assembleDebug --no-daemon --no-build-cache --rerun-tasks
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Build completely failed
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
echo 📁 APK: android\app\build\outputs\apk\debug\app-debug.apk
echo 📱 App: CUBS Visa Management
echo 📦 Package: com.cubstechnical.admin
echo.
echo 🎯 Demo Credentials:
echo Email: info@cubstechnical.com
echo Password: Admin@123456
echo.
echo ✅ Your Android app is ready!
echo.
pause
