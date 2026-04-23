const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz5HtEOSeVhzjnPXEVistZ6jcrXogHL7V1jLk_zGKo5CCDMl5aVcGyIGhRCviVNfEI/exec";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const pageId = String(row.page_id || "").trim();
      const pageName = String(row.page_name || "").trim();
      const accessToken = String(row.access_token || "").trim();
      const rawStatus = String(row.status || "active").trim().toLowerCase();
      const status = rawStatus === "paused" ? "Paused" : "Active";
      if (!pageId && !pageName) return null;
      return {
        displayName: pageName || `Page ${pageId}`,
        handle: pageName ? `@${pageName.toLowerCase().replace(/\s+/g, "")}` : "",
        pageId,
        accessToken,
        followers: "",
        reach: "",
        status,
      };
    })
    .filter(Boolean);
}

async function getAllPages(scriptUrl) {
  const res = await fetch(`${scriptUrl}?action=getAll`, {
    method: "GET",
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Apps Script error: ${res.status}`);
  const data = await res.json();
  return normalizeRows(Array.isArray(data) ? data : []);
}

async function postToScript(scriptUrl, payload) {
  await fetch(scriptUrl, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const scriptUrl = env.GOOGLE_APPS_SCRIPT_URL || APPS_SCRIPT_URL;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: "GET,POST,OPTIONS" } });
  }

  if (request.method === "GET") {
    try {
      const pages = await getAllPages(scriptUrl);
      return jsonResponse({ ok: true, pages });
    } catch (err) {
      return jsonResponse({ ok: false, message: String(err), pages: [] }, 500);
    }
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "Method not allowed." }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const reqUrl = new URL(request.url);
  const writeAction = String(
    body.action || reqUrl.searchParams.get("action") || "create"
  )
    .trim()
    .toLowerCase();

  try {
    if (writeAction === "create" || writeAction === "update") {
      const displayName = String(body.displayName || body.page_name || "").trim();
      const pageId = String(body.pageId || body.page_id || "").trim();
      const accessToken = String(body.accessToken || body.access_token || "").trim();

      if (!displayName || !pageId || !accessToken) {
        return jsonResponse(
          { ok: false, message: "displayName, pageId and accessToken are required." },
          400
        );
      }

      await postToScript(scriptUrl, {
        action: "add",
        page_id: pageId,
        page_name: displayName,
        access_token: accessToken,
        status: "active",
        added_date: new Date().toISOString(),
      });

      const pages = await getAllPages(scriptUrl);
      return jsonResponse({ ok: true, message: "Account saved.", pages });
    }

    if (writeAction === "delete") {
      const pageId = String(body.pageId || body.page_id || "").trim();
      if (!pageId) {
        return jsonResponse({ ok: false, message: "pageId is required for delete." }, 400);
      }

      await postToScript(scriptUrl, { action: "delete", page_id: pageId });

      const pages = await getAllPages(scriptUrl);
      return jsonResponse({ ok: true, message: "Account deleted.", pages });
    }

    if (
      writeAction === "read" ||
      writeAction === "list" ||
      writeAction === "get"
    ) {
      const pages = await getAllPages(scriptUrl);
      return jsonResponse({ ok: true, pages });
    }

    return jsonResponse({ ok: false, message: "Unsupported action." }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, message: String(err) }, 500);
  }
}
