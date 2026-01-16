# 📱 Mobile App Build Guide - Personal Life Manager

This guide will help you convert your web app into an Android APK that can be installed on any Android phone.

## 🎯 Overview

We'll use **Capacitor** (by Ionic) to wrap your React app into a native Android application. This allows your web app to run as a native mobile app with access to device features.

---

## 📋 Prerequisites

### 1. Install Required Software

#### **Java Development Kit (JDK)**
```bash
# Check if Java is installed
java -version

# If not installed, install OpenJDK 17
sudo apt update
sudo apt install openjdk-17-jdk -y

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### **Android Studio** (Required for Android SDK)
1. Download from: https://developer.android.com/studio
2. Extract and run:
```bash
cd ~/Downloads
tar -xvf android-studio-*.tar.gz
sudo mv android-studio /opt/
/opt/android-studio/bin/studio.sh
```

3. During setup:
   - Choose "Standard" installation
   - Install Android SDK
   - Install Android SDK Platform-Tools
   - Install Android SDK Build-Tools

4. Set environment variables:
```bash
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
source ~/.bashrc
```

5. Verify installation:
```bash
adb --version
```

---

## 🚀 Step-by-Step Build Process

### Step 1: Install Capacitor

```bash
cd /home/user/omkar/Expense-Tracker

# Install Capacitor core and CLI
npm install @capacitor/core @capacitor/cli

# Install Android platform
npm install @capacitor/android

# Install additional Capacitor plugins (optional but recommended)
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
```

### Step 2: Initialize Capacitor

```bash
# Initialize Capacitor in your project
npx cap init "Personal Life Manager" "com.personallifemanager.app" --web-dir=dist
```

**Explanation:**
- `"Personal Life Manager"` - Your app name
- `"com.personallifemanager.app"` - Your app's package name (unique identifier)
- `--web-dir=dist` - Where Vite builds your app

### Step 3: Update Vite Configuration

The `vite.config.ts` needs to be updated for mobile builds. This should already be configured, but verify:

```typescript
// vite.config.ts should have:
export default defineConfig({
  base: './', // Important for Capacitor
  // ... rest of config
})
```

### Step 4: Build Your Web App

```bash
# Build the production version of your app
npm run build
```

This creates optimized files in the `dist` folder.

### Step 5: Add Android Platform

```bash
# Add Android platform to your project
npx cap add android
```

This creates an `android` folder with the native Android project.

### Step 6: Copy Web Assets to Android

```bash
# Copy your built web app to the Android project
npx cap copy android
```

Run this command every time you make changes to your web app.

### Step 7: Update Android App Configuration

Edit `android/app/src/main/AndroidManifest.xml` to add permissions:

```xml
<manifest>
    <!-- Add these permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    
    <!-- Rest of manifest -->
</manifest>
```

### Step 8: Update App Icon and Splash Screen (Optional)

1. **App Icon:**
   - Create a 1024x1024 PNG icon
   - Use online tool: https://icon.kitchen/
   - Replace files in `android/app/src/main/res/mipmap-*/ic_launcher.png`

2. **Splash Screen:**
   - Edit `android/app/src/main/res/values/styles.xml`
   - Customize splash screen colors

### Step 9: Open Android Project in Android Studio

```bash
# Open the Android project
npx cap open android
```

This opens Android Studio with your project.

### Step 10: Build APK in Android Studio

1. **Wait for Gradle Sync** to complete (bottom status bar)
2. **Build Menu** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete (5-10 minutes first time)
4. Click "locate" in the notification to find your APK

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 Alternative: Build APK via Command Line

If you prefer command line:

```bash
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK (for production)
./gradlew assembleRelease
```

**Output locations:**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 🔐 Building Signed Release APK (For Play Store)

### Step 1: Generate Keystore

```bash
cd android/app

# Generate keystore
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Answer the questions and remember your password!
```

### Step 2: Configure Gradle

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'my-key-alias'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Signed APK

```bash
cd android
./gradlew assembleRelease
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 📲 Installing APK on Your Phone

### Method 1: USB Cable

1. Enable **Developer Options** on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging
3. Connect phone to computer via USB
4. Run:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: Direct Transfer

1. Copy APK to your phone (via USB, email, or cloud)
2. On phone, enable **Install Unknown Apps**:
   - Settings → Security → Install Unknown Apps → Enable for File Manager
3. Open APK file on phone
4. Tap "Install"

### Method 3: QR Code

1. Upload APK to cloud storage (Google Drive, Dropbox)
2. Get shareable link
3. Create QR code: https://www.qr-code-generator.com/
4. Scan QR code on phone
5. Download and install

---

## 🔄 Development Workflow

### Making Changes

After updating your code:

```bash
# 1. Build web app
npm run build

# 2. Copy to Android
npx cap copy android

# 3. Sync (if you added new plugins)
npx cap sync android

# 4. Open in Android Studio and rebuild
npx cap open android
```

### Live Reload (Development)

```bash
# Run dev server
npm run dev

# In another terminal
npx cap run android -l --external

# This runs app on connected device with live reload
```

---

## 🐛 Troubleshooting

### Issue: "JAVA_HOME not set"
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Issue: "Android SDK not found"
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### Issue: "Gradle build failed"
- Open Android Studio
- File → Invalidate Caches / Restart
- Build → Clean Project
- Build → Rebuild Project

### Issue: "App crashes on startup"
- Check `npx cap copy android` was run after build
- Check `capacitor.config.ts` has correct `webDir: 'dist'`
- Check Chrome DevTools via `chrome://inspect` when phone is connected

### Issue: "White screen on app"
- Ensure `vite.config.ts` has `base: './'`
- Rebuild: `npm run build && npx cap copy android`

---

## 📊 App Size Optimization

### Reduce APK Size

1. **Enable Proguard** (minification):
```gradle
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

2. **Use App Bundle** (for Play Store):
```bash
./gradlew bundleRelease
```

3. **Optimize Images**:
```bash
npm install -D vite-plugin-imagemin
```

---

## 🎨 App Customization

### Change App Name

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">Personal Life Manager</string>
</resources>
```

### Change App Icon

1. Generate icons: https://icon.kitchen/
2. Download and replace in `android/app/src/main/res/mipmap-*`

### Change Theme Colors

Edit `android/app/src/main/res/values/styles.xml`:
```xml
<style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
    <item name="colorPrimary">#667eea</item>
    <item name="colorPrimaryDark">#764ba2</item>
    <item name="colorAccent">#667eea</item>
</style>
```

---

## 🚀 Publishing to Google Play Store

1. **Create Google Play Console Account** ($25 one-time fee)
2. **Build Signed Release APK** (see above)
3. **Create App Listing**:
   - App name, description
   - Screenshots (phone, tablet)
   - App icon
   - Feature graphic
4. **Upload APK/Bundle**
5. **Fill Content Rating Questionnaire**
6. **Set Pricing** (Free/Paid)
7. **Submit for Review**

---

## 📝 Quick Reference Commands

```bash
# Install dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize
npx cap init "Personal Life Manager" "com.personallifemanager.app" --web-dir=dist

# Build and sync
npm run build
npx cap copy android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK (command line)
cd android && ./gradlew assembleDebug

# Install on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ✅ Checklist

- [ ] Java JDK installed
- [ ] Android Studio installed
- [ ] Android SDK configured
- [ ] Capacitor installed
- [ ] Android platform added
- [ ] Web app built (`npm run build`)
- [ ] Assets copied (`npx cap copy android`)
- [ ] Permissions added to AndroidManifest.xml
- [ ] APK built successfully
- [ ] APK tested on device

---

## 🎯 Next Steps

After building your APK:

1. **Test thoroughly** on different Android devices
2. **Optimize performance** (check Chrome DevTools)
3. **Add app icon and splash screen**
4. **Build signed release APK**
5. **Publish to Google Play Store** (optional)

---

## 📞 Need Help?

- Capacitor Docs: https://capacitorjs.com/docs
- Android Docs: https://developer.android.com/docs
- Stack Overflow: Search "Capacitor Android"

---

**Good luck with your mobile app! 🚀📱**
