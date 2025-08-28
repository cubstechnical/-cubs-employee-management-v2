# iOS Build Guide - CUBS Visa Management

## 🍎 iOS Build Requirements

### Prerequisites:
- **macOS** (required for iOS development)
- **Xcode** (latest version from App Store)
- **Apple Developer Account** ($99/year for App Store distribution)
- **CocoaPods** (for dependency management)

## 🚀 Building for iOS

### Step 1: Setup macOS Environment

1. **Install Xcode**
   ```bash
   # Download from App Store or Apple Developer website
   # Minimum version: Xcode 14.0+
   ```

2. **Install CocoaPods**
```bash
sudo gem install cocoapods
   ```

3. **Install Node.js** (if not already installed)
   ```bash
   # Using Homebrew
   brew install node
   
   # Or download from https://nodejs.org/
   ```

### Step 2: Build iOS App

1. **Clone/Transfer Project to macOS**
   ```bash
   # Copy your project to macOS
   # Or clone from your repository
   git clone <your-repo-url>
   cd final
   ```

2. **Run iOS Build Script**
```bash
# Make script executable
chmod +x BUILD_iOS_PRODUCTION.sh

# Run the build script
./BUILD_iOS_PRODUCTION.sh
```

3. **Open in Xcode**
   ```bash
   npx cap open ios
   ```

### Step 3: Configure Xcode Project

1. **Select Development Team**
   - Open project in Xcode
   - Select project in navigator
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team

2. **Configure Bundle Identifier**
   - Change to unique identifier
   - Example: `com.yourcompany.cubs-admin`

3. **Set App Version**
   - Update version number
   - Set build number

### Step 4: Build and Test

1. **Select Target Device**
   - Choose iPhone/iPad simulator
   - Or connect physical device

2. **Build and Run**
   - Press ⌘+R or click "Run" button
   - App should launch in simulator/device

## 📱 iOS Deployment Options

### Option 1: App Store (Recommended)

#### Prerequisites:
- Apple Developer Account ($99/year)
- App Store Connect access
- App review compliance

#### Steps:

1. **Archive the App**
   ```bash
   # In Xcode:
   # Product → Archive
   # Or use command line:
   xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -destination generic/platform=iOS archive -archivePath App.xcarchive
   ```

2. **Upload to App Store Connect**
   - Open Organizer in Xcode
   - Select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow upload process

3. **Configure App Store Listing**
   - App Store Connect → My Apps
   - Create new app
   - Fill in app information
   - Upload screenshots
   - Set pricing and availability

### Option 2: TestFlight (Beta Testing)

1. **Upload to TestFlight**
   - Same process as App Store
   - Choose "TestFlight" distribution

2. **Invite Testers**
   - Add internal testers (up to 100)
   - Add external testers (up to 10,000)
   - Send invitation emails

### Option 3: Enterprise Distribution

#### For Company Internal Use:
1. **Enterprise Developer Account** ($299/year)
2. **In-House Distribution**
   - Build IPA file
   - Distribute via MDM or web link
   - No App Store review required

### Option 4: Ad Hoc Distribution

#### For Limited Testing:
1. **Register Device UDIDs**
2. **Create Ad Hoc Provisioning Profile**
3. **Build and distribute IPA**

## 🔧 Build Commands

### Quick Build:
```bash
# Use the iOS build script
./BUILD_iOS_PRODUCTION.sh
```

### Manual Build:
```bash
# Install dependencies
npm install

# Build web app
npm run build

# Add iOS platform (if not exists)
npx cap add ios

# Sync with Capacitor
npx cap sync ios

# Install CocoaPods dependencies
cd ios/App
pod install
cd ../..

# Open in Xcode
npx cap open ios
```

### Command Line Build:
```bash
# Build for simulator
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 14' build

# Build for device
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -destination 'platform=iOS,name=iPhone' build
```

## 📋 iOS App Information

### App Details:
- **Name**: CUBS Visa Management
- **Bundle ID**: com.cubstechnical.admin
- **Version**: 1.0.0
- **Target iOS**: 13.0+
- **Device Support**: iPhone, iPad

### Features:
- ✅ Employee Management
- ✅ Document Upload/Management
- ✅ Visa Expiry Monitoring
- ✅ Real-time Notifications
- ✅ Admin Dashboard
- ✅ Offline Support
- ✅ iPad Optimization

### Demo Credentials:
- **Email**: info@cubstechnical.com
- **Password**: Admin@123456

## 🚨 Troubleshooting

### Common iOS Issues:

1. **Build Fails with CocoaPods**
```bash
cd ios/App
pod deintegrate
pod install
   cd ../..
   ```

2. **Signing Issues**
   - Check Apple Developer account
   - Verify provisioning profiles
   - Ensure bundle identifier is unique

3. **Simulator Issues**
   - Reset simulator: Device → Erase All Content and Settings
   - Update Xcode to latest version

4. **Device Installation Fails**
   - Trust developer certificate: Settings → General → Device Management
   - Check device UDID is registered

## 📱 App Store Requirements

### Technical Requirements:
- [ ] App builds successfully
- [ ] All features tested on multiple devices
- [ ] App icons generated correctly
- [ ] Launch screen configured
- [ ] Privacy permissions properly set
- [ ] Offline functionality working

### Store Requirements:
- [ ] App Store Connect account
- [ ] App description and keywords
- [ ] Screenshots (iPhone & iPad)
- [ ] App icon (1024x1024)
- [ ] Privacy policy URL
- [ ] Content rating
- [ ] App review compliance

### Legal Requirements:
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Data handling compliance
- [ ] GDPR compliance (if applicable)

## 🎯 Next Steps for iOS

1. **Set up macOS development environment**
2. **Transfer project to macOS**
3. **Run iOS build script**
4. **Test on simulator and device**
5. **Choose deployment method**
6. **Submit for App Store review**

## 📞 Support

For iOS build assistance:
- **Email**: info@cubstechnical.com
- **Apple Developer Documentation**: https://developer.apple.com/
- **Xcode Help**: Help → Xcode Help

---

**🍎 iOS build ready when you have macOS access!**
