@echo off
echo ========================================
echo Building CUBS App for Android 15 (API 35)
echo ========================================
echo.

echo [1/5] Cleaning previous builds...
cd android
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Building release APK with Android 15 target...
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [3/5] Building AAB for Google Play...
call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo ERROR: Bundle failed!
    pause
    exit /b 1
)

echo.
echo [4/5] Checking build outputs...
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo ✓ APK created successfully
    echo Location: android\app\build\outputs\apk\release\app-release.apk
) else (
    echo ERROR: APK not found!
    pause
    exit /b 1
)

if exist "app\build\outputs\bundle\release\app-release.aab" (
    echo ✓ AAB created successfully
    echo Location: android\app\build\outputs\bundle\release\app-release.aab
) else (
    echo ERROR: AAB not found!
    pause
    exit /b 1
)

echo.
echo [5/5] Build completed successfully!
echo.
echo ========================================
echo SUMMARY:
echo - Target API Level: 35 (Android 15)
echo - Compile SDK: 35
echo - APK: android\app\build\outputs\apk\release\app-release.apk
echo - AAB: android\app\build\outputs\bundle\release\app-release.aab
echo ========================================
echo.
echo Next steps:
echo 1. Test the APK on a device
echo 2. Upload the AAB to Google Play Console
echo 3. Submit for review
echo.
pause



