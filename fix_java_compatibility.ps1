# PowerShell script to fix Java compatibility issues
# Run as Administrator

Write-Host "Fixing Java compatibility issues..." -ForegroundColor Green

$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot"

# Set environment variables
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, [System.EnvironmentVariableTarget]::Machine)
[System.Environment]::SetEnvironmentVariable('STUDIO_JDK', $javaHome, [System.EnvironmentVariableTarget]::Machine)

# Update PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('PATH', [System.EnvironmentVariableTarget]::Machine)
$newPath = "$javaHome\bin;$currentPath"
[System.Environment]::SetEnvironmentVariable('PATH', $newPath, [System.EnvironmentVariableTarget]::Machine)

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "JAVA_HOME: $javaHome" -ForegroundColor Yellow

Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Close Android Studio completely" -ForegroundColor Yellow
Write-Host "2. Delete .gradle folder in your user directory" -ForegroundColor Yellow
Write-Host "3. Restart Android Studio" -ForegroundColor Yellow
Write-Host "4. Try building again" -ForegroundColor Yellow

Write-Host "" -ForegroundColor White
Write-Host "If issues persist, try:" -ForegroundColor White
Write-Host "- File → Invalidate Caches / Restart" -ForegroundColor Yellow
Write-Host "- Tools → SDK Manager → Update Android SDK components" -ForegroundColor Yellow

Read-Host "Press Enter to continue"
