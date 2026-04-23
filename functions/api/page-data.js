const DEFAULT_PAGE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyAA0fzHZMvz6bqVgypsbz6oKk1oxjPLjkNDRxh3DoakpsIjlGW636o_lpwy9DWuTA/exec";
const DEFAULT_SHEET_NAME = "Sheet1";
const FALLBACK_SHEET_NAMES = ["Sheet1", "Pages"];
const READ_ACTION_ALIASES = ["read", "list", "get"];
const WRITE_ACTION_ALIASES = {
  create: ["create", "add", "append", "insert", "write"],
  update: ["update", "edit", "upsert", "write", "create"],
  delete: ["delete", "remove", "del"],
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getSheetBaseCandidates(env) {
  const candidates = [
    String(env.PAGE_SHEET_WEBAPP_URL || "").trim(),
    String(env.GSHEET_WEB_APP_URL || "").trim(),
    DEFAULT_PAGE_SHEET_WEBAPP_URL,
  ].filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

  return candidates;
}

function getSheetNameCandidates(env, requestedSheet) {
  const candidates = [
    String(requestedSheet || "").trim(),
    String(env.PAGE_SHEET_NAME || "").trim(),
    DEFAULT_SHEET_NAME,
    ...FALLBACK_SHEET_NAMES,
  ].filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

  return candidates;
}

function buildSheetUrl(baseUrl, action, sheet) {
  const url = new URL(baseUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("sheet", sheet || DEFAULT_SHEET_NAME);
  return url;
}

function appendPayloadToQuery(url, payload) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    url.searchParams.set(key, normalized);
  });
}

function parseJsonSafely(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function looksLikeHtml(value) {
  return /<\s*!doctype\s+html|<\s*html|<\s*body|<\s*head/i.test(String(value || "").trim().slice(0, 220));
}

function looksLikeMissingPage(value) {
  const text = String(value || "").toLowerCase();
  return text.includes("file not found") || text.includes("page not found") || text.includes("requested file does not exist");
}

async function readPagesFromSheet(baseUrl, sheetCandidates) {
  for (const sheet of sheetCandidates) {
    for (const action of READ_ACTION_ALIASES) {
      const readUrl = buildSheetUrl(baseUrl, action, sheet);

      const upstream = await fetch(readUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json,text/plain,*/*",
        },
      });

      const text = await upstream.text();
      if (!upstream.ok) {
        continue;
      }

      if (looksLikeHtml(text) || looksLikeMissingPage(text)) {
        continue;
      }

      const parsed = parseJsonSafely(text, {});
      const pages = normalizeStoredPages(parsed);
      return {
        ok: true,
        pages,
        sheet,
      };
    }
  }

  return {
    ok: false,
    pages: [],
    sheet: "",
  };
}

function normalizeStoredPages(payload) {
  const rows = [];

  if (Array.isArray(payload)) {
    rows.push(...payload);
  } else if (payload && typeof payload === "object") {
    const data = payload;
    if (Array.isArray(data.rows)) rows.push(...data.rows);
    if (Array.isArray(data.data)) rows.push(...data.data);
    if (Array.isArray(data.items)) rows.push(...data.items);

    if (Array.isArray(data.values) && data.values.length > 1 && Array.isArray(data.values[0])) {
      const header = data.values[0].map((item) => String(item).trim().toLowerCase());
      const idxPageId = header.indexOf("page_id");
      const idxPageName = header.indexOf("page_name");
      const idxAccessToken = header.indexOf("access_token");
      const idxStatus = header.indexOf("status");

      for (const row of data.values.slice(1)) {
        if (!Array.isArray(row)) continue;
        rows.push({
          page_id: idxPageId >= 0 ? row[idxPageId] : "",
          page_name: idxPageName >= 0 ? row[idxPageName] : "",
          access_token: idxAccessToken >= 0 ? row[idxAccessToken] : "",
          status: idxStatus >= 0 ? row[idxStatus] : "ACTIVE",
        });
      }
    }
  }

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row;
      const displayName = String(item.displayName || item.page_name || item.pageName || "").trim();
      const rawHandle = String(item.handle || item.page_handle || item.pageHandle || "").trim();
      const pageId = String(item.pageId || item.page_id || "").trim();
      const accessToken = String(item.accessToken || item.access_token || "").trim();
      const followers = String(item.followers || "").trim();
      const reach = String(item.reach || "").trim();
      const rawStatus = String(item.status || "ACTIVE").trim().toUpperCase();
      const status = rawStatus === "PAUSED" ? "Paused" : "Active";

      if (!displayName && !pageId) return null;

      const handle = rawHandle
        ? rawHandle.startsWith("@")
          ? rawHandle
          : `@${rawHandle}`
        : displayName
          ? `@${displayName.toLowerCase().replace(/\s+/g, "")}`
          : "";

      return {
        displayName: displayName || `Page ${pageId || "Unknown"}`,
        handle,
        pageId,
        accessToken,
        followers,
        reach,
        status,
      };
    })
    .filter((item) => item !== null);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET,POST,OPTIONS",
      },
    });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return jsonResponse({ ok: false, message: "Method not allowed." }, 405);
  }

  const baseCandidates = getSheetBaseCandidates(env);
  if (baseCandidates.length === 0) {
    return jsonResponse({ ok: false, message: "Missing PAGE_SHEET_WEBAPP_URL environment variable." }, 500);
  }

  const reqUrl = new URL(request.url);
  const action = String(reqUrl.searchParams.get("action") || "").trim();
  const sheet = String(reqUrl.searchParams.get("sheet") || "").trim();
  const sheetCandidates = getSheetNameCandidates(env, sheet);

  if (request.method === "GET") {
    try {
      const preferredActions = action ? [action, ...READ_ACTION_ALIASES.filter((item) => item !== action)] : READ_ACTION_ALIASES;

      for (const baseUrl of baseCandidates) {
        for (const readAction of preferredActions) {
          for (const sheetName of sheetCandidates) {
            const readUrl = buildSheetUrl(baseUrl, readAction, sheetName);
          const upstream = await fetch(readUrl.toString(), {
            method: "GET",
            headers: {
              Accept: "application/json,text/plain,*/*",
            },
          });

          const text = await upstream.text();
          if (!upstream.ok) {
            continue;
          }

          if (looksLikeHtml(text) || looksLikeMissingPage(text)) {
            continue;
          }

          const parsed = parseJsonSafely(text, {});
          const pages = normalizeStoredPages(parsed);
          return jsonResponse({ ok: true, pages });
          }
        }
      }

      return jsonResponse({ ok: false, message: "Failed to read page data from Google Sheet. Check Apps Script deployment and access." }, 502);
    } catch {
      return jsonResponse({ ok: false, message: "Failed to read page data from Google Sheet." }, 502);
    }
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const bodyAction = String(body.action || "").trim().toLowerCase();
  const writeAction = bodyAction || action || "create";

  const payload = {
    action: writeAction,
    sheet: sheetCandidates[0],
    sheet_name: sheetCandidates[0],
    displayName: String(body.displayName || body.pageName || "").trim(),
    handle: String(body.handle || "").trim(),
    pageId: String(body.pageId || "").trim(),
    accessToken: String(body.accessToken || "").trim(),
    page_name: String(body.page_name || body.pageName || body.displayName || "").trim(),
    page_id: String(body.page_id || body.pageId || "").trim(),
    access_token: String(body.access_token || body.accessToken || "").trim(),
    fetchedName: String(body.fetchedName || "").trim(),
    fetchedUsername: String(body.fetchedUsername || "").trim(),
    followers: String(body.followers || "").trim(),
    reach: String(body.reach || "").trim(),
    status: String(body.status || "ACTIVE").trim().toUpperCase(),
    added_date: new Date().toISOString(),
  };

  if ((writeAction === "create" || writeAction === "update") && (!payload.displayName || !payload.pageId || !payload.accessToken)) {
    return jsonResponse({ ok: false, message: "displayName, pageId and accessToken are required." }, 400);
  }

  if (writeAction === "delete" && !payload.pageId && !payload.displayName && !payload.handle) {
    return jsonResponse({ ok: false, message: "pageId, displayName, or handle is required for delete." }, 400);
  }

  const actionAliases = WRITE_ACTION_ALIASES[writeAction] || [writeAction];

  try {
    let finalMessage = "";
    let usedBaseUrl = "";

    for (const baseUrl of baseCandidates) {
      for (const sheetName of sheetCandidates) {
        for (const alias of actionAliases) {
          const writePayload = {
            ...payload,
            action: alias,
            sheet: sheetName,
            sheet_name: sheetName,
          };

          const writeUrl = buildSheetUrl(baseUrl, alias, sheetName);

          const upstream = await fetch(writeUrl.toString(), {
            method: "POST",
            headers: {
              Accept: "application/json,text/plain,*/*",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(writePayload),
          });

          const text = await upstream.text();
          if (upstream.ok && !looksLikeHtml(text) && !looksLikeMissingPage(text)) {
            const parsed = parseJsonSafely(text, null);
            const parsedMessage = parsed && typeof parsed.message === "string" ? parsed.message.trim() : "";
            finalMessage = parsedMessage || `Sheet ${alias} completed.`;
            usedBaseUrl = baseUrl;
            break;
          }

          // Fallback: many Apps Script endpoints only support GET query writes.
          const fallbackUrl = buildSheetUrl(baseUrl, alias, sheetName);
          appendPayloadToQuery(fallbackUrl, writePayload);
          const fallback = await fetch(fallbackUrl.toString(), {
            method: "GET",
            headers: {
              Accept: "application/json,text/plain,*/*",
            },
          });

          const fallbackText = await fallback.text();
          if (fallback.ok && !looksLikeHtml(fallbackText) && !looksLikeMissingPage(fallbackText)) {
            const fallbackParsed = parseJsonSafely(fallbackText, null);
            const fallbackMessage = fallbackParsed && typeof fallbackParsed.message === "string" ? fallbackParsed.message.trim() : "";
            finalMessage = fallbackMessage || `Sheet ${alias} completed.`;
            usedBaseUrl = baseUrl;
            break;
          }
        }

        if (usedBaseUrl) {
          break;
        }
      }

      if (usedBaseUrl) {
        break;
      }
    }

    if (!usedBaseUrl) {
      return jsonResponse({ ok: false, message: "Google Sheet write failed. Check Apps Script deployment URL and public access." }, 502);
    }

    // Always re-read sheet after write so UI can render the canonical latest rows.
    const readBack = await readPagesFromSheet(usedBaseUrl, sheetCandidates);
    const pages = readBack.ok ? readBack.pages : [];

    return jsonResponse({ ok: true, message: finalMessage || `Sheet ${writeAction} completed.`, pages });
  } catch {
    return jsonResponse({ ok: false, message: "Failed to write page data to Google Sheet." }, 502);
  }
}
