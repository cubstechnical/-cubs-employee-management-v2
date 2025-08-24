@echo off
REM Simple Android build script

echo Setting up Java environment...
set JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java Home: %JAVA_HOME%

echo Stopping Gradle daemon...
cd android
gradlew --stop

echo Cleaning project...
gradlew clean

echo Building debug APK with explicit Java path...
gradlew assembleDebug -Dorg.gradle.java.home=%JAVA_HOME%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ BUILD SUCCESSFUL!
    echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install on device:
    echo gradlew installDebug
    echo.
    echo To run on device:
    echo gradlew runDebug
) else (
    echo.
    echo ❌ BUILD FAILED
    echo Trying alternative approach...
    echo.
    gradlew assembleDebug -Dorg.gradle.java.home=%JAVA_HOME% -Dorg.gradle.daemon=false
)

echo.
pause
