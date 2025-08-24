# PowerShell script to fix Android build issues
# Run this in the android directory

Write-Host "🔧 Fixing Android build issues..." -ForegroundColor Green

# Set Java environment
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java Home: $env:JAVA_HOME" -ForegroundColor Yellow

# Stop Gradle daemon
Write-Host "Stopping Gradle daemon..." -ForegroundColor Cyan
./gradlew --stop

# Clean all caches
Write-Host "Cleaning Gradle caches..." -ForegroundColor Cyan
./gradlew clean
./gradlew cleanBuildCache

# Try debug build with explicit Java path
Write-Host "Building debug APK..." -ForegroundColor Green
./gradlew assembleDebug -Dorg.gradle.java.home="$env:JAVA_HOME"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "APK location: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Yellow

    # Try release build
    Write-Host "Building release APK..." -ForegroundColor Cyan
    ./gradlew assembleRelease -Dorg.gradle.java.home="$env:JAVA_HOME"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ RELEASE BUILD SUCCESSFUL!" -ForegroundColor Green
        Write-Host "APK location: android/app/build/outputs/apk/release/app-release.apk" -ForegroundColor Yellow
    } else {
        Write-Host "❌ RELEASE BUILD FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "❌ DEBUG BUILD FAILED" -ForegroundColor Red
    Write-Host "Trying with different approach..." -ForegroundColor Yellow

    # Try with daemon disabled
    ./gradlew assembleDebug -Dorg.gradle.java.home="$env:JAVA_HOME" -Dorg.gradle.daemon=false
}

Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
