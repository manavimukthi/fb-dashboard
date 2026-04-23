const DEFAULT_PAGE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxY-ISB9twG0GldEtDNLu_f_dWHv-KmsMXAY9hSht1Vc-6ahTtjBJSWfDWO3UPyqncY/exec";
const DEFAULT_SHEET_NAME = "Sheet1";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getSheetBaseUrl(env) {
  return String(env.PAGE_SHEET_WEBAPP_URL || env.GSHEET_WEB_APP_URL || DEFAULT_PAGE_SHEET_WEBAPP_URL).trim();
}

function buildSheetUrl(baseUrl, action, sheet) {
  const url = new URL(baseUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("sheet", sheet || DEFAULT_SHEET_NAME);
  return url;
}

function parseJsonSafely(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
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

  const baseUrl = getSheetBaseUrl(env);
  if (!baseUrl) {
    return jsonResponse({ ok: false, message: "Missing PAGE_SHEET_WEBAPP_URL environment variable." }, 500);
  }

  const reqUrl = new URL(request.url);
  const action = String(reqUrl.searchParams.get("action") || "").trim();
  const sheet = String(reqUrl.searchParams.get("sheet") || DEFAULT_SHEET_NAME).trim();

  if (request.method === "GET") {
    const readUrl = buildSheetUrl(baseUrl, action || "read", sheet);

    try {
      const upstream = await fetch(readUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const text = await upstream.text();
      if (!upstream.ok) {
        return jsonResponse({ ok: false, message: `Sheet read failed (${upstream.status}).`, details: text.slice(0, 240) }, upstream.status);
      }

      const parsed = parseJsonSafely(text, {});
      const pages = normalizeStoredPages(parsed);
      return jsonResponse({ ok: true, pages });
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
    sheet,
    displayName: String(body.displayName || body.pageName || "").trim(),
    handle: String(body.handle || "").trim(),
    pageId: String(body.pageId || "").trim(),
    accessToken: String(body.accessToken || "").trim(),
    fetchedName: String(body.fetchedName || "").trim(),
    fetchedUsername: String(body.fetchedUsername || "").trim(),
    followers: String(body.followers || "").trim(),
    reach: String(body.reach || "").trim(),
    status: String(body.status || "Active").trim(),
  };

  if ((writeAction === "create" || writeAction === "update") && (!payload.displayName || !payload.pageId || !payload.accessToken)) {
    return jsonResponse({ ok: false, message: "displayName, pageId and accessToken are required." }, 400);
  }

  if (writeAction === "delete" && !payload.pageId && !payload.displayName && !payload.handle) {
    return jsonResponse({ ok: false, message: "pageId, displayName, or handle is required for delete." }, 400);
  }

  const writeUrl = buildSheetUrl(baseUrl, writeAction, sheet);

  try {
    const upstream = await fetch(writeUrl.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return jsonResponse({ ok: false, message: `Sheet write failed (${upstream.status}).`, details: text.slice(0, 240) }, upstream.status);
    }

    const parsed = parseJsonSafely(text, {});
    const message =
      typeof parsed.message === "string" && parsed.message.trim().length > 0
        ? parsed.message.trim()
        : `Sheet ${writeAction} completed.`;

    // Always re-read sheet after write so UI can render the canonical latest rows.
    const readBackUrl = buildSheetUrl(baseUrl, "read", sheet);
    const readBack = await fetch(readBackUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const readText = await readBack.text();
    const readParsed = parseJsonSafely(readText, {});
    const pages = normalizeStoredPages(readParsed);

    return jsonResponse({ ok: true, message, pages });
  } catch {
    return jsonResponse({ ok: false, message: "Failed to write page data to Google Sheet." }, 502);
  }
}
