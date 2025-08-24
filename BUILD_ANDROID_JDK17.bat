@echo off
REM ===================================================================
REM   CUBS Admin - JDK 17 Compatible Android Build
REM   Uses JDK 17 for maximum compatibility
REM ===================================================================

echo.
echo =====================================================
echo   CUBS Admin - JDK 17 Compatible Build
echo =====================================================
echo.

REM Try to use JDK 17 if available
set "JDK17_PATH=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
if exist "%JDK17_PATH%" (
    set "JAVA_HOME=%JDK17_PATH%"
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo ✅ Using JDK 17: %JAVA_HOME%
) else (
    echo ⚠️  JDK 17 not found, using system default Java
    echo    Download JDK 17 from: https://adoptium.net/temurin/releases/
    java -version
)

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
echo 📱 Setting up Capacitor...
REM Check if android platform already exists
if exist "android" (
    echo Android platform already exists, skipping add command
) else (
    call npx cap add android
)
call npx cap sync android

echo.
echo 🧹 Cleaning Android project...
cd android

REM Clear problematic caches
rmdir /s /q "%USERPROFILE%\.gradle\caches\transforms-3" 2>nul
rmdir /s /q "%USERPROFILE%\.gradle\caches\jars-3" 2>nul

call gradlew clean --no-daemon --no-build-cache

echo.
echo 🚀 Building Android APK with compatibility settings...
REM Use simpler Gradle settings that work with JDK 21
call gradlew assembleDebug ^
    --no-daemon ^
    --no-build-cache ^
    --no-parallel ^
    --max-workers=1 ^
    -Dorg.gradle.jvmargs="-Xmx2g -XX:MaxMetaspaceSize=512m" ^
    --warning-mode all

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed, trying with even simpler settings...
    echo.

    REM Last resort: Use basic gradle command
    call gradlew assembleDebug --no-daemon
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Build completely failed
        echo.
        echo TROUBLESHOOTING:
        echo 1. Try installing JDK 17 from https://adoptium.net/temurin/releases/
        echo 2. Make sure Android SDK is properly installed
        echo 3. Try running: gradlew --version
        echo 4. Check Android Studio SDK manager
        echo.
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
echo 🎯 Demo Credentials:
echo Email: info@cubstechnical.com
echo Password: Admin@123456
echo.
echo 🔧 To install on Android device:
echo 1. Enable Developer Options
echo 2. Enable USB Debugging
echo 3. Connect device via USB
echo 4. Copy APK to device or use: adb install app-debug.apk
echo.

REM Show file info
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo 📋 APK Details:
    dir "android\app\build\outputs\apk\debug\app-debug.apk"
    echo.
    echo ✅ APK is ready to install!
) else (
    echo ⚠️  APK file not found
)

echo.
pause
