# PowerShell script to set up Android SDK for the project
# Run this as Administrator

Write-Host "Setting up Android SDK environment variables..." -ForegroundColor Green

# Common Android SDK paths
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk"
)

$sdkPath = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $sdkPath = $path
        break
    }
}

if ($sdkPath) {
    Write-Host "Found Android SDK at: $sdkPath" -ForegroundColor Green

    # Set environment variables
    [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, [System.EnvironmentVariableTarget]::Machine)
    [System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, [System.EnvironmentVariableTarget]::Machine)

    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable('PATH', [System.EnvironmentVariableTarget]::Machine)
    $newPath = "$sdkPath\tools;$sdkPath\platform-tools;$currentPath"
    [System.Environment]::SetEnvironmentVariable('PATH', $newPath, [System.EnvironmentVariableTarget]::Machine)

    Write-Host "Environment variables set successfully!" -ForegroundColor Green
    Write-Host "ANDROID_HOME: $sdkPath" -ForegroundColor Yellow

    # Create local.properties file
    $localPropsPath = "android\local.properties"
    $content = "sdk.dir=$($sdkPath -replace '\\', '\\')"
    Set-Content -Path $localPropsPath -Value $content -Force

    Write-Host "Created android/local.properties" -ForegroundColor Green

} else {
    Write-Host "Android SDK not found. Please install Android SDK through Android Studio first." -ForegroundColor Red
    Write-Host "1. Open Android Studio" -ForegroundColor Yellow
    Write-Host "2. Tools → SDK Manager" -ForegroundColor Yellow
    Write-Host "3. Install Android SDK components" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
}

Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
