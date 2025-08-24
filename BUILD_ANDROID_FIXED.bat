@echo off
REM ===================================================================
REM   FIXED ANDROID BUILD - No Duplicate Resources
REM   This script builds Android app without icon conflicts
REM ===================================================================

echo.
echo =====================================================
echo   FIXED ANDROID BUILD - CUBS Visa Management
echo =====================================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found - install from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js: Available

echo.
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🏗️ Building web application for production (cubsgroups.com)...
set NODE_ENV=production
set NEXT_PUBLIC_APP_URL=https://cubsgroups.com
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

echo.
echo 🧹 Cleaning existing Android resources...
if exist "android\app\src\main\res\mipmap-*" (
    rmdir /s /q "android\app\src\main\res\mipmap-hdpi" 2>nul
    rmdir /s /q "android\app\src\main\res\mipmap-mdpi" 2>nul
    rmdir /s /q "android\app\src\main\res\mipmap-xhdpi" 2>nul
    rmdir /s /q "android\app\src\main\res\mipmap-xxhdpi" 2>nul
    rmdir /s /q "android\app\src\main\res\mipmap-xxxhdpi" 2>nul
)

if exist "android\app\src\main\res\values\ic_launcher_background.xml" (
    del "android\app\src\main\res\values\ic_launcher_background.xml" 2>nul
)

echo.
echo 🎨 Generating clean app icons from assets/appicon.png...
node scripts/generate-android-icons.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Icon generation failed
    pause
    exit /b 1
)

echo.
echo 📱 Setting up Capacitor for production deployment...
if exist "android" (
    echo Android platform already exists, syncing...
) else (
    call npx cap add android
)

call npx cap sync android

echo.
echo 🧹 Cleaning Android project...
cd android

REM Clear problematic caches
rmdir /s /q %USERPROFILE%\.gradle\caches\transforms-3 2>nul
rmdir /s /q %USERPROFILE%\.gradle\caches\jars-3 2>nul

call gradlew clean --no-daemon --no-build-cache

echo.
echo 🚀 Building Android APK...
call gradlew assembleDebug ^
    --no-daemon ^
    --no-build-cache ^
    --no-scan ^
    --warning-mode all ^
    -Dorg.gradle.unsafe.configuration-cache=false ^
    -Dorg.gradle.workers.max=1 ^
    -Dkotlin.compiler.execution.strategy="in-process"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed. Checking for issues...
    echo.
    pause
    cd ..
    exit /b 1
)

cd ..

echo.
echo ===============================================
echo ✅ ANDROID BUILD SUCCESSFUL!
echo ===============================================
echo.
echo 📁 APK Location: android\app\build\outputs\apk\debug\app-debug.apk
echo 📱 App Name: CUBS Visa Management  
echo 📦 Package: com.cubstechnical.admin
echo 🌐 Production URL: https://cubsgroups.com
echo.
echo 🎯 Demo Credentials:
echo Email: info@cubstechnical.com
echo Password: Admin@123456
echo.
echo ✅ Android build completed successfully!
echo.

REM Show file info
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo 📋 APK Details:
    dir "android\app\build\outputs\apk\debug\app-debug.apk"
    echo.
    echo The APK is ready for deployment!
) else (
    echo ⚠️  APK file not found. Check the build output above for errors.
)

echo.
pause
