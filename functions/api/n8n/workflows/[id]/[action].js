const DEFAULT_N8N_BASE_URL = "https://n8n.kasunmadhuwantha.cv/api/v1";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getUpstreamBase(env) {
  const raw = String(env.N8N_BASE_URL || DEFAULT_N8N_BASE_URL).trim();
  return raw.replace(/\/$/, "");
}

function getApiKey(request, env) {
  return String(request.headers.get("X-N8N-API-KEY") || env.N8N_API_KEY || "").trim();
}

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "POST,OPTIONS",
      },
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  const apiKey = getApiKey(request, env);
  if (!apiKey) {
    return jsonResponse({ message: "Missing n8n API key." }, 400);
  }

  const workflowId = String(params.id || "").trim();
  const action = String(params.action || "").trim();
  if (!workflowId || !action) {
    return jsonResponse({ message: "Missing workflow id or action." }, 400);
  }

  const endpoint = `${getUpstreamBase(env)}/workflows/${encodeURIComponent(workflowId)}/${encodeURIComponent(action)}`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-N8N-API-KEY": apiKey,
      },
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return jsonResponse({ message: "Failed to reach n8n upstream." }, 502);
  }
}
