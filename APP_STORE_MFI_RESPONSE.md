# App Store MFi Issue - Response Template

## Issue
Apple rejected the app claiming it uses MFi (Made for iPhone/iPad) accessories, but the app does NOT use any MFi accessories.

## Solution Applied
Added explicit declaration in `Info.plist` that the app does NOT use MFi accessories:

```xml
<key>UIExternalAccessoryProtocols</key>
<array/>
```

This empty array explicitly tells Apple that the app does not communicate with any external accessories.

## Response to Apple (App Store Connect)

**Subject:** MFi Accessory Clarification - App Does Not Use MFi Accessories

**Message:**

Dear App Review Team,

Thank you for reviewing our app. We would like to clarify that our app (CUBS Employee Management) does NOT use any MFi (Made for iPhone/iPad) accessories.

We have updated our app's Info.plist file to explicitly declare that we do not use any external accessories by setting `UIExternalAccessoryProtocols` to an empty array. This clearly indicates that our app does not communicate with any MFi accessories.

Our app is a document management and employee management system that:
- Uploads documents to cloud storage (Backblaze B2)
- Manages employee data in Supabase database
- Does not connect to any external hardware accessories
- Does not use the External Accessory framework

The MFi requirement appears to be a false positive. We have verified that:
1. Our app does not import or use the ExternalAccessory framework
2. Our app does not communicate with any external hardware
3. Our Info.plist now explicitly declares no MFi protocols

We have updated the binary with this clarification. Please proceed with the review.

Thank you for your time and consideration.

Best regards,
[Your Name]

---

## Steps to Submit

1. **Rebuild the iOS app:**
   ```bash
   npm run build:mobile
   npx cap sync ios
   ```

2. **Open in Xcode:**
   ```bash
   npm run cap:ios
   ```

3. **Archive and upload** the new build to App Store Connect

4. **In App Store Connect:**
   - Go to your app version
   - Scroll to "App Review Information"
   - Add this note in the "Notes" section:
   
   ```
   This app does NOT use any MFi (Made for iPhone/iPad) accessories. 
   The Info.plist has been updated with UIExternalAccessoryProtocols set to an empty array 
   to explicitly declare that no external accessories are used.
   ```

5. **Submit for Review** with the updated binary and note

