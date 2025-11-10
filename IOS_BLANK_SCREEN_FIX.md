# iPhone Blank Screen Fix Guide

## Problem
The iPhone app shows a blank screen when opened.

## Root Cause
The blank screen occurs when:
1. The app wasn't built with `BUILD_MOBILE=true` (no static files in `out/` directory)
2. Static files weren't synced to iOS
3. The app is trying to load files that don't exist

## Solution

### Step 1: Rebuild the App for Mobile
Run the mobile build script which will:
- Generate static files in the `out/` directory
- Sync files to iOS project
- Prepare the app for native deployment

```bash
npm run build:mobile
```

This script:
1. Cleans previous builds
2. Temporarily disables API routes (not needed for static export)
3. Builds with `BUILD_MOBILE=true` to create static export
4. Syncs files to Capacitor iOS project
5. Restores API routes

### Step 2: Sync with Capacitor
After building, sync the files to iOS:

```bash
npx cap sync ios
```

This copies the `out/` directory contents to the iOS project.

### Step 3: Rebuild in Xcode
1. Open the iOS project:
   ```bash
   npm run cap:ios
   ```
   Or manually: Open `ios/App/App.xcworkspace` in Xcode

2. In Xcode:
   - Select your device or simulator
   - Click the Play button or press `Cmd + R` to build and run
   - Wait for the build to complete

### Step 4: Verify
After rebuilding, the app should:
- ✅ Load without blank screen
- ✅ Show the login page or dashboard
- ✅ Work offline (uses local files)
- ✅ Stay within the app (no browser redirects)

## What Was Fixed

1. **AppId Mismatch**: Fixed `appId` in `ios/App/App/capacitor.config.json` to match `capacitor.config.ts`
2. **Blank Screen Detection**: Added automatic detection and error message if files are missing
3. **Initialization**: Improved Capacitor initialization to prevent blank screens

## Important Notes

- **The app MUST be rebuilt** with `npm run build:mobile` for the blank screen to be fixed
- Simply syncing without rebuilding won't work if the `out/` directory is empty or outdated
- The blank screen fix component will show an error message if files are missing, guiding you to rebuild

## Troubleshooting

### Still seeing blank screen after rebuild?

1. **Check if `out/` directory exists and has files:**
   ```bash
   ls -la out/
   ```
   Should see `index.html` and other files

2. **Verify Capacitor sync worked:**
   ```bash
   ls -la ios/App/App/public/
   ```
   Should see the same files as in `out/`

3. **Check Xcode console for errors:**
   - Open Xcode
   - Run the app
   - Check the console for any error messages

4. **Clear app data and reinstall:**
   - Delete the app from your iPhone
   - Rebuild and reinstall from Xcode

### App opens but shows error message?

The blank screen fix component detected missing files. Follow the steps above to rebuild the app.

## Configuration Verified

✅ `capacitor.config.ts` - No `server.url` (uses local files)  
✅ `ios/App/App/capacitor.config.json` - AppId matches  
✅ `next.config.js` - Static export enabled for mobile builds  
✅ Blank screen detection - Active and will show helpful error message

