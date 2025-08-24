const fs = require('fs');
const path = require('path');

// App Store Metadata Template
const appStoreData = {
  appInfo: {
    name: "CUBS Technical Admin",
    subtitle: "Employee Management Portal",
    description: {
      short: "Comprehensive employee database and document management system for CUBS Technical",
      full: `Streamline your workforce management with our comprehensive employee administration platform. Manage employee records, track visa statuses, organize documents, and maintain compliance - all from your mobile device.

Key Features:
• Complete Employee Database Management
• Document Upload & Organization
• Visa & Permit Tracking
• Real-time Notifications
• Offline Functionality
• Secure Data Storage
• Multi-language Support
• Role-based Access Control

Perfect for HR managers, administrators, and business owners who need efficient employee management tools. Works seamlessly online and offline, ensuring you always have access to critical employee information.`
    },
    keywords: [
      "employee management",
      "HR portal",
      "document management",
      "visa tracking",
      "workforce management",
      "business admin",
      "HR software",
      "employee database",
      "document organization",
      "compliance tracking"
    ]
  },

  googlePlay: {
    title: "CUBS Technical Admin",
    shortDescription: "Complete employee management and document organization system",
    fullDescription: `Streamline your workforce management with our comprehensive employee administration platform. Manage employee records, track visa statuses, organize documents, and maintain compliance - all from your mobile device.

🎯 KEY FEATURES:
• Complete Employee Database Management
• Document Upload & Organization
• Visa & Permit Tracking
• Real-time Notifications
• Offline Functionality
• Secure Data Storage
• Multi-language Support
• Role-based Access Control

📱 PERFECT FOR:
• HR Managers & Administrators
• Business Owners
• Compliance Officers
• Office Managers
• Small to Medium Businesses

🔒 SECURITY & PRIVACY:
• Enterprise-grade security
• GDPR & CCPA compliant
• Encrypted data storage
• Secure authentication
• Privacy-focused design

🚀 WHY CHOOSE US:
• Works offline and online
• Intuitive mobile interface
• Real-time sync across devices
• Comprehensive compliance tools
• Dedicated customer support

Download now and transform your employee management workflow!`,
    website: "https://cubsgroups.com",
    email: "info@cubstechnical.com",
    phone: "+971-50-123-4567"
  },

  appleAppStore: {
    title: "CUBS Technical Admin",
    subtitle: "Employee Management Portal",
    description: `Streamline your workforce management with our comprehensive employee administration platform. Manage employee records, track visa statuses, organize documents, and maintain compliance - all from your mobile device.

Key Features:
• Complete Employee Database Management
• Document Upload & Organization
• Visa & Permit Tracking
• Real-time Notifications
• Offline Functionality
• Secure Data Storage
• Multi-language Support
• Role-based Access Control

Perfect for HR managers, administrators, and business owners who need efficient employee management tools. Works seamlessly online and offline, ensuring you always have access to critical employee information.

Privacy & Security:
Our app is designed with your privacy in mind. All data is encrypted and stored securely. We comply with GDPR and other international privacy regulations.`,
    keywords: "employee,management,HR,portal,document,visa,tracking,workforce,business,admin",
    supportUrl: "https://cubsgroups.com/support",
    marketingUrl: "https://cubsgroups.com"
  },

  screenshotGuidelines: {
    googlePlay: {
      requirements: [
        "At least 2 screenshots required",
        "Maximum 8 screenshots allowed",
        "PNG or JPEG format",
        "16:9 or 9:16 aspect ratio recommended",
        "Minimum 320px width",
        "Maximum 3840px width",
        "File size limit: 15MB per image"
      ],
      recommended: [
        "Phone screenshots: 1080x1920px (9:16)",
        "Tablet screenshots: 1200x1920px (5:8)",
        "Feature screenshots: 1080x1920px",
        "Include login screen, dashboard, key features"
      ]
    },
    appleAppStore: {
      requirements: [
        "At least 1 screenshot required",
        "Maximum 10 screenshots allowed",
        "PNG format only",
        "9:16 aspect ratio required",
        "1242x2688px (iPhone 6.5\") or 1179x2556px (iPhone 5.5\") recommended",
        "File size limit: 30MB per image"
      ],
      recommended: [
        "Use iPhone 13 Pro or iPhone 14 dimensions",
        "Include status bar in screenshots",
        "Show app in use with realistic data",
        "Highlight key features and workflows"
      ]
    }
  }
};

function generateMetadataFiles() {
  const outputDir = 'app-store-assets';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate Google Play Store metadata
  const googlePlayContent = `# Google Play Store Listing

## Store Listing Information

**App Title:** ${appStoreData.googlePlay.title}
**Short Description:** ${appStoreData.googlePlay.shortDescription}

## Full Description

${appStoreData.googlePlay.fullDescription}

## Contact Information
- Website: ${appStoreData.googlePlay.website}
- Email: ${appStoreData.googlePlay.email}
- Phone: ${appStoreData.googlePlay.phone}

## Keywords for ASO
${appStoreData.appInfo.keywords.map(k => `- ${k}`).join('\n')}

---

*Note: Ensure all contact information is accurate before submission*
`;

  fs.writeFileSync(path.join(outputDir, 'google-play-listing.txt'), googlePlayContent);

  // Generate Apple App Store metadata
  const appleContent = `# Apple App Store Listing

## App Information

**App Name:** ${appStoreData.appleAppStore.title}
**Subtitle:** ${appStoreData.appleAppStore.subtitle}

## Description

${appStoreData.appleAppStore.description}

## Keywords (100 characters max)
${appStoreData.appleAppStore.keywords}

## URLs
- Support URL: ${appStoreData.appleAppStore.supportUrl}
- Marketing URL: ${appStoreData.appleAppStore.marketingUrl}

## Promotional Text (170 characters max)
Streamline employee management with offline support, document organization, and visa tracking. Perfect for HR managers and business administrators.

---

*Note: Subtitle and promotional text are optional but recommended*
`;

  fs.writeFileSync(path.join(outputDir, 'apple-app-store-listing.txt'), appleContent);

  // Generate screenshot guidelines
  const screenshotGuide = `# App Store Screenshots Guide

## Google Play Store Requirements
${appStoreData.screenshotGuidelines.googlePlay.requirements.map(r => `- ${r}`).join('\n')}

### Recommended Screenshots
${appStoreData.screenshotGuidelines.googlePlay.recommended.map(r => `- ${r}`).join('\n')}

## Apple App Store Requirements
${appStoreData.screenshotGuidelines.appleAppStore.requirements.map(r => `- ${r}`).join('\n')}

### Recommended Screenshots
${appStoreData.screenshotGuidelines.appleAppStore.recommended.map(r => `- ${r}`).join('\n')}

## Screenshot Checklist

### Must Include:
- [ ] Login/Authentication screen
- [ ] Main dashboard/home screen
- [ ] Key feature demonstration
- [ ] Settings or profile screen
- [ ] Any unique selling points

### Best Practices:
- [ ] Use real data (no lorem ipsum)
- [ ] Show the app in use
- [ ] Include different user flows
- [ ] Use consistent styling
- [ ] Ensure text is readable
- [ ] Follow platform design guidelines

## Tools for Screenshots

### Android (Physical Device or Emulator):
1. Enable Developer Options
2. Use "Screenshot" feature
3. Or use Android Studio's screen capture

### iOS (Physical Device):
1. Press Volume Up + Side Button simultaneously
2. Use QuickTime Player with device connected
3. Use Xcode's screenshot feature

### Browser (Web App):
1. Use browser dev tools responsive mode
2. Set exact dimensions
3. Take screenshot of viewport

---

*Tip: Take screenshots in portrait orientation for mobile apps*
`;

  fs.writeFileSync(path.join(outputDir, 'screenshot-guide.txt'), screenshotGuide);

  console.log('✅ App store metadata files generated in: app-store-assets/');
  console.log('\n📁 Generated files:');
  console.log('   - google-play-listing.txt');
  console.log('   - apple-app-store-listing.txt');
  console.log('   - screenshot-guide.txt');
}

generateMetadataFiles();
