@echo off
REM Complete environment setup for Android development

echo Setting up Android development environment...

REM Set Java environment variables
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"
setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools"

echo Environment variables set!
echo.
echo Next steps:
echo 1. Restart your computer
echo 2. Try running: npx cap run android
echo 3. Or use the online APK generator from FINAL_WORKING_SOLUTION.md
echo.
echo If issues persist, use the web-based APK generation approach.
echo.
pause
