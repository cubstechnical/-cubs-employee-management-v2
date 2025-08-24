@echo off
REM Fix Java compatibility issues for Android Studio

echo Fixing Java compatibility issues...

REM Set Java home to the main Java 21 installation
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"

REM Update PATH to use the correct Java
setx PATH "%JAVA_HOME%\bin;%PATH%"

REM Set Android Studio to use the correct Java
setx STUDIO_JDK "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"

echo Environment variables set!
echo.
echo Next steps:
echo 1. Close Android Studio completely
echo 2. Delete .gradle folder in your user directory
echo 3. Restart Android Studio
echo 4. Try building again
echo.
echo If issues persist, try:
echo - File → Invalidate Caches / Restart
echo - Tools → SDK Manager → Update Android SDK components

pause
