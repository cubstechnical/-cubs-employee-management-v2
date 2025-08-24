@echo off
REM ===================================================================
REM   CUBS Admin - FINAL WORKING SOLUTION for Android
REM   Guaranteed compatibility with proper JDK and versions
REM ===================================================================

echo.
echo =====================================================
echo   CUBS Admin - FINAL WORKING SOLUTION
echo =====================================================
echo.

REM Set specific JDK 17 path (most stable for Android builds)
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Java\jdk-17.0.9
)
if not exist "%JAVA_HOME%" (
    set JAVA_HOME=C:\Program Files\Eclipse Foundation\jdk-17.0.9.9-hotspot
)
if not exist "%JAVA_HOME%" (
    echo.
    echo ❌ ERROR: JDK 17 not found
    echo.
    echo Please install JDK 17 from: https://adoptium.net/temurin/releases/
    echo Choose version 17 LTS for maximum compatibility
    echo.
    pause
    exit /b 1
)

REM Force use of JDK 17
set PATH=%JAVA_HOME%\bin;%PATH%
echo ✅ Using JDK 17: %JAVA_HOME%

REM Verify Java version
java -version 2>&1 | find "17." >nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ WARNING: Not using JDK 17
    java -version
    echo.
    echo Please ensure JDK 17 is installed and set correctly
    pause
)

echo.
echo 📦 Installing Node dependencies...
call npm install --no-optional
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
call npx cap add android --skip-existing
call npx cap sync android

echo.
echo 🧹 Cleaning Android project...
cd android
call gradlew clean --no-daemon
call gradlew --stop

echo.
echo 🚀 Building Android APK with JDK 17...
call gradlew assembleDebug --no-daemon -Dorg.gradle.java.home="%JAVA_HOME%" --warning-mode all
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed. Trying alternative approach...
    echo.
    REM Clear Gradle cache and try again
    rmdir /s /q %USERPROFILE%\.gradle\caches\transforms-3 2>nul
    call gradlew clean --no-daemon
    call gradlew assembleDebug --no-daemon -Dorg.gradle.java.home="%JAVA_HOME%" --no-build-cache
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Build completely failed
        echo.
        echo Troubleshooting steps:
        echo 1. Ensure JDK 17 is properly installed
        echo 2. Try running: gradlew --version
        echo 3. Check Android SDK is up to date
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
echo 🔧 To install on device:
echo 1. Enable Developer Options and USB Debugging
echo 2. Connect Android device via USB
echo 3. Run: cd android && gradlew installDebug
echo.
echo Or copy the APK file to your device and install manually
echo.
echo ✅ Your Android app is ready for deployment!
echo.
pause
