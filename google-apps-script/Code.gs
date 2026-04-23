var SHEET_ID = "1ixrdmaoAtrd-GZo63i1CWChaUMcqgoNrRHZ_NtTz6-8";
var SHEET_NAME = "Sheet1";

// Column order: A=page_id, B=page_name, C=access_token, D=status, E=added_date
var HEADERS = ["page_id", "page_name", "access_token", "status", "added_date"];

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function ensureHeaders(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var hasHeaders = firstRow[0] === HEADERS[0];
  if (!hasHeaders) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";

    if (action === "getAll") {
      var sheet = getSheet();
      ensureHeaders(sheet);

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
      var rows = data
        .filter(function (row) { return row[0] || row[1]; })
        .map(function (row) {
          var obj = {};
          HEADERS.forEach(function (key, i) {
            obj[key] = row[i] !== undefined && row[i] !== null ? String(row[i]) : "";
          });
          return obj;
        });

      return ContentService.createTextOutput(JSON.stringify(rows))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "Unknown action: " + action })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "Invalid JSON body" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var action = String(body.action || "").trim();
    var sheet = getSheet();
    ensureHeaders(sheet);

    if (action === "add") {
      var pageId = String(body.page_id || "").trim();
      var pageName = String(body.page_name || "").trim();
      var accessToken = String(body.access_token || "").trim();

      if (!pageId || !pageName || !accessToken) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "page_id, page_name and access_token are required" })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      // Check for existing row with same page_id and update it instead of duplicating
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < existing.length; i++) {
          if (String(existing[i][0]).trim() === pageId) {
            var rowNum = i + 2;
            sheet.getRange(rowNum, 1, 1, HEADERS.length).setValues([[
              pageId,
              pageName,
              accessToken,
              body.status || "active",
              body.added_date || new Date().toISOString(),
            ]]);
            return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      sheet.appendRow([
        pageId,
        pageName,
        accessToken,
        body.status || "active",
        body.added_date || new Date().toISOString(),
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete") {
      var targetId = String(body.page_id || "").trim();
      if (!targetId) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "page_id is required for delete" })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var totalRows = sheet.getLastRow();
      if (totalRows > 1) {
        var ids = sheet.getRange(2, 1, totalRows - 1, 1).getValues();
        for (var r = ids.length - 1; r >= 0; r--) {
          if (String(ids[r][0]).trim() === targetId) {
            sheet.deleteRow(r + 2);
            break;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "Unknown action: " + action })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
