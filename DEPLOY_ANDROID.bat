@echo off
REM ===================================================================
REM   ANDROID DEPLOYMENT SCRIPT
REM   Quick deployment options for CUBS Visa Management
REM ===================================================================

echo.
echo =====================================================
echo   ANDROID DEPLOYMENT - CUBS Visa Management
echo =====================================================
echo.

REM Check if APK exists
if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ❌ APK not found! Please build the app first.
    echo Run: .\BUILD_ANDROID_FIXED.bat
    pause
    exit /b 1
)

echo ✅ APK found: android\app\build\outputs\apk\debug\app-debug.apk
echo 📱 Size: 
dir "android\app\build\outputs\apk\debug\app-debug.apk" | find "app-debug.apk"
echo.

echo 🚀 Choose deployment option:
echo.
echo 1. Copy APK to Desktop (for manual distribution)
echo 2. Install via ADB (if device connected)
echo 3. Create production release build
echo 4. Show APK details
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto copy_desktop
if "%choice%"=="2" goto install_adb
if "%choice%"=="3" goto production_build
if "%choice%"=="4" goto show_details
if "%choice%"=="5" goto exit
goto invalid_choice

:copy_desktop
echo.
echo 📁 Copying APK to Desktop...
copy "android\app\build\outputs\apk\debug\app-debug.apk" "%USERPROFILE%\Desktop\CUBS_Visa_Management.apk"
if %ERRORLEVEL% EQU 0 (
    echo ✅ APK copied to Desktop as 'CUBS_Visa_Management.apk'
    echo 📱 You can now share this file via:
    echo    - Email attachment
    echo    - Google Drive
    echo    - USB transfer
    echo    - File sharing services
) else (
    echo ❌ Failed to copy APK
)
goto end

:install_adb
echo.
echo 📱 Installing via ADB...
adb devices
echo.
echo Checking for connected devices...
adb devices | find "device$" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Device found, installing APK...
    adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
    if %ERRORLEVEL% EQU 0 (
        echo ✅ APK installed successfully!
        echo 📱 App should now appear on your device
    ) else (
        echo ❌ Installation failed
    )
) else (
    echo ❌ No Android device found
    echo 💡 Please:
    echo    1. Connect your Android device via USB
    echo    2. Enable USB Debugging in Developer Options
    echo    3. Run this script again
)
goto end

:production_build
echo.
echo 🏭 Creating production release build...
echo ⚠️  This requires signing the APK with a keystore
echo.
set /p create_keystore="Do you want to create a new keystore? (y/n): "
if /i "%create_keystore%"=="y" (
    echo.
    echo 🔑 Creating new keystore...
    keytool -genkey -v -keystore cubs-release-key.keystore -alias cubs-key-alias -keyalg RSA -keysize 2048 -validity 10000
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to create keystore
        goto end
    )
)

if exist "cubs-release-key.keystore" (
    echo.
    echo 🏗️ Building release APK...
    cd android
    call gradlew assembleRelease
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo 🔐 Signing release APK...
        jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ..\cubs-release-key.keystore app\build\outputs\apk\release\app-release-unsigned.apk cubs-key-alias
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo ⚡ Optimizing APK...
            zipalign -v 4 app\build\outputs\apk\release\app-release-unsigned.apk app\build\outputs\apk\release\app-release.apk
            if %ERRORLEVEL% EQU 0 (
                echo.
                echo ✅ Production APK created: android\app\build\outputs\apk\release\app-release.apk
                echo 📱 This APK is ready for Google Play Store upload
            ) else (
                echo ❌ APK optimization failed
            )
        ) else (
            echo ❌ APK signing failed
        )
    ) else (
        echo ❌ Release build failed
    )
    cd ..
) else (
    echo ❌ Keystore not found. Please create one first.
)
goto end

:show_details
echo.
echo 📋 APK Details:
echo.
echo 📁 Location: android\app\build\outputs\apk\debug\app-debug.apk
dir "android\app\build\outputs\apk\debug\app-debug.apk"
echo.
echo 📱 App Information:
echo    Name: CUBS Visa Management
echo    Package: com.cubstechnical.admin
echo    Version: 1.0.0
echo    Target SDK: Android 13+
echo    Min SDK: Android 6.0+
echo.
echo 🎯 Demo Credentials:
echo    Email: info@cubstechnical.com
echo    Password: Admin@123456
echo.
echo 📞 Support: info@cubstechnical.com
goto end

:invalid_choice
echo.
echo ❌ Invalid choice. Please enter 1-5.
goto end

:end
echo.
echo 📚 For more deployment options, see: ANDROID_DEPLOYMENT_GUIDE.md
echo.
pause

:exit
