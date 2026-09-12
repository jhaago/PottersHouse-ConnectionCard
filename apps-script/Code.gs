const SHEET_NAME = "Connections";
const HEADERS = [
  "Record ID",
  "Name",
  "Email",
  "Phone",
  "Address",
  "Altar Worker",
  "Date",
  "First Time Decision",
  "Age",
  "Received At"
];

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");

    if (!data.id || !data.name) {
      return jsonResponse({ ok: false, error: "Missing id or name" });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    } else if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      if (existingIds.includes(data.id)) {
        return jsonResponse({ ok: true, duplicate: true });
      }
    }

    sheet.appendRow([
      data.id,
      data.name || "",
      data.email || "",
      data.phone || "",
      data.address || "",
      data.altarWorker || data.recordedBy || "",
      data.cardDate || "",
      data.firstTimeDecision || "",
      data.age || "",
      new Date()
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
