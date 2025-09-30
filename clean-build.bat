@echo off
echo 🧹 Cleaning all build artifacts...

echo Removing .next directory...
if exist .next rmdir /s /q .next

echo Removing out directory...
if exist out rmdir /s /q out

echo Removing Android assets...
if exist android\app\src\main\assets\public rmdir /s /q android\app\src\main\assets\public

echo Removing iOS assets...
if exist ios\App\App\public rmdir /s /q ios\App\App\public

echo Removing node_modules cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo ✅ Clean complete!
echo.
echo 📦 Starting fresh build...
call npm run build

echo.
echo ✅ Build complete!
pause
