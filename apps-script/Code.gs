const SHEET_NAME = "Connections";

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
      sheet.appendRow([
        "Record ID",
        "Created At",
        "Name",
        "Phone",
        "Email",
        "Address / Area",
        "Age",
        "First-time Decision",
        "Connected By",
        "Notes",
        "Permission to Contact",
        "Received At"
      ]);
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
      data.createdAt || "",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.age || "",
      data.firstTimeDecision || "",
      data.recordedBy || "",
      data.notes || "",
      data.permissionToContact === true ? "Yes" : "No",
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
