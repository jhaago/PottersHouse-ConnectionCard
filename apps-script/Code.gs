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
  "Received At",
  "Notes",
  "Healed"
];

function doGet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return jsonResponse({
        ok: true,
        connections: 0,
        healed: 0,
        updatedAt: new Date().toISOString()
      });
    }

    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(value => String(value).trim());
    const recordIdIndex = headers.indexOf("Record ID");
    const healedIndex = headers.indexOf("Healed");

    let connections = 0;
    let healed = 0;

    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
      const row = values[rowIndex];
      const hasRecord = recordIdIndex >= 0
        ? String(row[recordIdIndex] || "").trim() !== ""
        : row.some(value => String(value || "").trim() !== "");

      if (!hasRecord) continue;
      connections++;

      if (healedIndex >= 0 && String(row[healedIndex] || "").trim().toLowerCase() === "yes") {
        healed++;
      }
    }

    return jsonResponse({
      ok: true,
      connections,
      healed,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

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
    }

    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);

    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      if (existingIds.includes(data.id)) {
        return jsonResponse({ ok: true, duplicate: true, notesSupported: true, healedSupported: true });
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
      new Date(),
      data.notes || "",
      data.healed || ""
    ]);

    return jsonResponse({ ok: true, notesSupported: true, healedSupported: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
