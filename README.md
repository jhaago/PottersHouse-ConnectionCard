# Potter's House Connection Card

A very small offline-first connection-card app for mission outreach.

## Goal

- Open from a normal web link on iPhone or Android
- Add to the phone home screen
- Record connection details with no mobile data
- Save every entry locally on the phone first
- Sync unsent entries to Google Sheets later when internet/Wi-Fi is available

## Version 1

- New connection form
- Offline local storage
- Saved entries list
- Waiting/Synced status
- Manual sync button
- Automatic sync attempt when connectivity returns
- Google Apps Script receiver for Google Sheets
- Duplicate protection using a unique record ID

There is no build step and no npm dependency. It is plain HTML, CSS and JavaScript.

## Google Sheet setup

1. Create a Google Sheet for the trip.
2. Open **Extensions > Apps Script**.
3. Paste in `apps-script/Code.gs`.
4. Save.
5. Choose **Deploy > New deployment > Web app**.
6. Execute as yourself and select an access option that allows the mission phones to call the endpoint.
7. Copy the Web App URL.
8. Open the Connection Card app on each phone, go to **Settings**, paste the URL, and save.

The Apps Script creates a `Connections` sheet automatically on the first successful sync.

## Install on phone

Host the repository over HTTPS (for example GitHub Pages). Open the site once while online and add it to the phone home screen. After that, the form and saved entries work offline.

## Privacy

This app collects personal contact information. Keep the Google Sheet restricted to authorised follow-up workers, collect only what is needed, and obtain permission before sharing details with the local church.
