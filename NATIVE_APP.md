# Native app build notes

This branch wraps the existing Connection Card web app in Capacitor so it can be installed as a real app on Android and iPhone.

The app is bundled into the phone package. It does not need GitHub Pages to show the form during the trip.

## What stays the same

- The connection card UI is still `index.html`, `styles.css`, `app.js`, and `assets/brand-header.jpg`.
- Entries are saved locally on the phone first using IndexedDB.
- The Google Apps Script sync endpoint is embedded in `app.js`.
- The app syncs when it opens, when it returns to the foreground, when the network comes online while the app is open, and when the user presses **Sync Now**.

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
npx cap open android
```

Then build/run from Android Studio.

## iPhone build

Requirements:

- Mac
- Xcode
- Apple Developer account for TestFlight or wider install distribution

Commands:

```bash
npm install
npm run prepare:native
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then in Xcode:

1. Select your Apple team/signing settings.
2. Set the bundle identifier if needed.
3. Archive the app.
4. Upload to App Store Connect.
5. Distribute privately with TestFlight.

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
