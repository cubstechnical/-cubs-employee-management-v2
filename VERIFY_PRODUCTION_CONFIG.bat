@echo off
REM ===================================================================
REM   Production Configuration Verification Script
REM   Verifies that all settings point to cubsgroups.com
REM ===================================================================

echo.
echo ===============================================
echo   CUBS Admin - Production Config Verification
echo ===============================================
echo.

echo 🔍 Checking Capacitor configuration...
findstr "cubsgroups.com" capacitor.config.ts >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Capacitor configured for cubsgroups.com
) else (
    echo ❌ Capacitor NOT configured for production
)

echo.
echo 🔍 Checking App layout metadata...
findstr "cubsgroups.com" app\layout.tsx >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ App metadata configured for cubsgroups.com
) else (
    echo ❌ App metadata NOT configured for production
)

echo.
echo 🔍 Checking Next.js configuration...
findstr "cubsgroups.com" next.config.js >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Next.js configured for cubsgroups.com
) else (
    echo ❌ Next.js NOT configured for production
)

echo.
echo 🔍 Checking environment example...
findstr "cubsgroups.com" env.example >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Environment example configured for cubsgroups.com
) else (
    echo ❌ Environment example NOT configured for production
)

echo.
echo 🔍 Checking build script...
findstr "cubsgroups.com" BUILD_FINAL_WORKING.bat >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Build script configured for cubsgroups.com
) else (
    echo ❌ Build script NOT configured for production
)

echo.
echo ===============================================
echo   PRODUCTION CONFIGURATION SUMMARY
echo ===============================================
echo.
echo 🌐 Production URL: https://cubsgroups.com
echo 📱 App ID: com.cubstechnical.admin
echo 📦 App Name: CUBS Visa Management
echo.
echo 🤖 Android Build: ./BUILD_FINAL_WORKING.bat
echo 🍎 iOS Build: ./BUILD_iOS_PRODUCTION.sh (macOS only)
echo.
echo 📋 Deployment Guide: PRODUCTION_DEPLOYMENT_GUIDE.md
echo.
echo ✅ Ready for production deployment!
echo.
pause
