@echo off
REM Batch script to set up Android SDK for the project
REM Run this as Administrator

echo Setting up Android SDK environment variables...

REM Common Android SDK paths
set SDK_PATH_1=%LOCALAPPDATA%\Android\Sdk
set SDK_PATH_2=C:\Android\Sdk
set SDK_PATH_3=%USERPROFILE%\AppData\Local\Android\Sdk

if exist "%SDK_PATH_1%" (
    set SDK_PATH=%SDK_PATH_1%
    goto :found_sdk
)

if exist "%SDK_PATH_2%" (
    set SDK_PATH=%SDK_PATH_2%
    goto :found_sdk
)

if exist "%SDK_PATH_3%" (
    set SDK_PATH=%SDK_PATH_3%
    goto :found_sdk
)

goto :no_sdk

:found_sdk
echo Found Android SDK at: %SDK_PATH%

REM Set environment variables for current user
setx ANDROID_HOME "%SDK_PATH%"
setx ANDROID_SDK_ROOT "%SDK_PATH%"

REM Create local.properties file
echo sdk.dir=%SDK_PATH%> android\local.properties

echo Environment variables set successfully!
echo ANDROID_HOME: %SDK_PATH%
echo Created android/local.properties
goto :end

:no_sdk
echo Android SDK not found. Please install Android SDK through Android Studio first.
echo.
echo Steps:
echo 1. Open Android Studio
echo 2. Tools -^> SDK Manager
echo 3. Install Android SDK components
echo 4. Run this script again
goto :end

:end
echo Press any key to continue...
pause > nul
