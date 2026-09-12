# Native app build notes

This branch wraps the existing Connection Card web app in Capacitor so it can be installed as a real app on Android and iPhone.

The app is bundled into the phone package. It does not need GitHub Pages to show the form during the trip.

## What stays the same

- The connection card UI is still `index.html`, `styles.css`, `app.js`, and `assets/brand-header.jpg`.
- Entries are saved locally on the phone first using IndexedDB.
- The Google Apps Script sync endpoint is embedded in `app.js`.
- The app syncs when it opens, when it returns to the foreground, when the network comes online while the app is open, and when the user presses **Sync Now**.
- The orange/blue Connection Card icon is generated into both Android launcher icons and the iOS AppIcon set from `native-assets/app-icon.png`.

## Android APK build from GitHub

The easiest Android test build path is the included GitHub Actions workflow.

1. Open the GitHub repository.
2. Switch to the `feature/native-app-shell` branch.
3. Go to **Actions**.
4. Choose **Android Debug APK**.
5. Press **Run workflow**.
6. Download the `connection-card-debug-apk` artifact when the build finishes.
7. Install the APK on an Android phone.

For test installation, Android may ask you to allow installing apps from the browser or file manager used to open the APK.

## Android local build

Requirements:

- Node.js
- Android Studio
- JDK 21

Commands:

```bash
npm install
npm run prepare:native
npx cap add android
npx cap sync android
npm run apply:native-icons
npx cap open android
```

Then build/run from Android Studio.

## iPhone validation build from GitHub

The `iOS Simulator Build` GitHub Actions workflow runs on a macOS GitHub runner and validates that the iOS app can be generated and compiled by Xcode.

It:

1. Bundles the web app into the native package.
2. Creates the Capacitor iOS project.
3. Syncs Capacitor plugins and web assets.
4. Generates the full iPhone/iPad AppIcon set from the Connection Card icon.
5. Builds an unsigned iOS Simulator `.app`.
6. Uploads `connection-card-ios-simulator` as a workflow artifact.

The simulator artifact proves the iOS project compiles, but it is not an installable physical-iPhone package because Apple requires code signing for real devices.

## iPhone/TestFlight build

Requirements for the real iPhone distribution step:

- Mac
- Xcode
- Apple Developer Program membership
- App Store Connect access

Local commands:

```bash
npm install
npm run prepare:native
npx cap add ios
npx cap sync ios
npm run apply:native-icons
npx cap open ios
```

Then in Xcode:

1. Select the Apple developer Team under Signing & Capabilities.
2. Confirm the bundle identifier `com.pottershouse.connectioncard` is available to that team.
3. Select **Any iOS Device (arm64)** as the destination.
4. Choose **Product > Archive**.
5. In Organizer choose **Distribute App > App Store Connect > Upload**.
6. In App Store Connect/TestFlight, add the required testers and distribute the build privately.

## Important iPhone limitation

iOS does not guarantee instant background sync the moment Wi-Fi becomes available while the app is fully closed. The reliable workflow is:

1. Enter cards offline during outreach.
2. Open the app later when Wi-Fi or mobile data is available.
3. The app will attempt to sync automatically.
4. Press **Sync Now** if anything is still waiting.

## Current app ID

```text
com.pottershouse.connectioncard
```

Current app name:

```text
Connection Card
```
