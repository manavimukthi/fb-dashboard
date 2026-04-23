// ── Pages spreadsheet (separate file) ───────────────────────────────────────
var PAGES_SHEET_ID   = "1ixrdmaoAtrd-GZo63i1CWChaUMcqgoNrRHZ_NtTz6-8";
var PAGES_SHEET_NAME = "Sheet1";
var PAGES_HEADERS    = ["page_id", "page_name", "access_token", "status", "added_date"];

// ── Templates spreadsheet (THIS file — Script is bound here) ─────────────────
var TEMPLATES_SHEET_NAME = "Sheet1";          // tab name in this spreadsheet
var TEMPLATE_HEADERS     = ["Template Name", "Template_code"];

// ── Sheet accessors ───────────────────────────────────────────────────────────
function getPagesSheet() {
  return SpreadsheetApp.openById(PAGES_SHEET_ID).getSheetByName(PAGES_SHEET_NAME);
}

function getTemplatesSheet() {
  // Uses the spreadsheet this script is bound to (the Templates spreadsheet)
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEMPLATES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TEMPLATES_SHEET_NAME);
    sheet.getRange(1, 1, 1, TEMPLATE_HEADERS.length).setValues([TEMPLATE_HEADERS]);
  }
  return sheet;
}

function ensurePagesHeaders(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, PAGES_HEADERS.length).getValues()[0];
  if (firstRow[0] !== PAGES_HEADERS[0]) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, PAGES_HEADERS.length).setValues([PAGES_HEADERS]);
  }
}

function ensureTemplateHeaders(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, TEMPLATE_HEADERS.length).getValues()[0];
  if (firstRow[0] !== TEMPLATE_HEADERS[0]) {
    sheet.getRange(1, 1, 1, TEMPLATE_HEADERS.length).setValues([TEMPLATE_HEADERS]);
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";

    if (action === "getAll") {
      var sheet = getPagesSheet();
      ensurePagesHeaders(sheet);
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var data = sheet.getRange(2, 1, lastRow - 1, PAGES_HEADERS.length).getValues();
      var rows = data
        .filter(function(row) { return row[0] || row[1]; })
        .map(function(row) {
          var obj = {};
          PAGES_HEADERS.forEach(function(key, i) {
            obj[key] = row[i] !== undefined && row[i] !== null ? String(row[i]) : "";
          });
          return obj;
        });
      return ContentService.createTextOutput(JSON.stringify(rows))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "getTemplates") {
      var tSheet = getTemplatesSheet();
      ensureTemplateHeaders(tSheet);
      var lastRow = tSheet.getLastRow();
      if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var data = tSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      var rows = data
        .filter(function(row) { return row[0]; })
        .map(function(row) {
          return {
            "Template Name": String(row[0] || ""),
            "Template_code": String(row[1] || "")
          };
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

// ── POST ──────────────────────────────────────────────────────────────────────
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

    // ── Pages ────────────────────────────────────────────────────────────────
    if (action === "add") {
      var sheet = getPagesSheet();
      ensurePagesHeaders(sheet);
      var pageId      = String(body.page_id      || "").trim();
      var pageName    = String(body.page_name    || "").trim();
      var accessToken = String(body.access_token || "").trim();

      if (!pageId || !pageName || !accessToken) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "page_id, page_name and access_token are required" })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < existing.length; i++) {
          if (String(existing[i][0]).trim() === pageId) {
            sheet.getRange(i + 2, 1, 1, PAGES_HEADERS.length).setValues([[
              pageId, pageName, accessToken,
              body.status     || "active",
              body.added_date || new Date().toISOString(),
            ]]);
            return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      sheet.appendRow([pageId, pageName, accessToken,
        body.status || "active",
        body.added_date || new Date().toISOString()]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete") {
      var sheet    = getPagesSheet();
      ensurePagesHeaders(sheet);
      var targetId = String(body.page_id || "").trim();
      if (!targetId) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "page_id is required" })
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

    // ── Templates ────────────────────────────────────────────────────────────
    if (action === "saveTemplate") {
      var tName = String(body["Template Name"] || "").trim();
      var tCode = String(body["Template_code"] || "");

      if (!tName) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "Template Name is required" })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var tSheet  = getTemplatesSheet();
      ensureTemplateHeaders(tSheet);
      var lastRow = tSheet.getLastRow();

      if (lastRow > 1) {
        var existing = tSheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < existing.length; i++) {
          if (String(existing[i][0]).trim() === tName) {
            tSheet.getRange(i + 2, 1, 1, 2).setValues([[tName, tCode]]);
            return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      tSheet.appendRow([tName, tCode]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "deleteTemplate") {
      var targetName = String(body["Template Name"] || "").trim();
      if (!targetName) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "Template Name is required" })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      var tSheet    = getTemplatesSheet();
      ensureTemplateHeaders(tSheet);
      var totalRows = tSheet.getLastRow();
      if (totalRows > 1) {
        var names = tSheet.getRange(2, 1, totalRows - 1, 1).getValues();
        for (var r = names.length - 1; r >= 0; r--) {
          if (String(names[r][0]).trim() === targetName) {
            tSheet.deleteRow(r + 2);
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
