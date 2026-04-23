import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { promises as fs } from "node:fs";
import path from "node:path";

type PageStatus = "Active" | "Paused";

type StoredPage = {
  displayName: string;
  handle: string;
  pageId: string;
  accessToken: string;
  fetchedName?: string;
  fetchedUsername?: string;
  followers?: string;
  reach?: string;
  status?: PageStatus;
  updatedAt?: string;
};

type PageAction = "create" | "update" | "delete";

const PAGE_ENV_KEY = "FB_DASHBOARD_PAGES";

const normalizePageRecord = (input: Partial<StoredPage>): StoredPage | null => {
  const displayName = String(input.displayName || input.fetchedName || "").trim();
  const pageId = String(input.pageId || "").trim();
  const accessToken = String(input.accessToken || "").trim();
  const rawHandle = String(input.handle || input.fetchedUsername || "").trim();
  const handle = rawHandle ? (rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`) : `@${displayName.toLowerCase().replace(/\s+/g, "")}`;
  const status: PageStatus = input.status === "Paused" ? "Paused" : "Active";

  if (!displayName || !pageId || !accessToken) {
    return null;
  }

  return {
    displayName,
    handle,
    pageId,
    accessToken,
    fetchedName: input.fetchedName ? String(input.fetchedName).trim() : undefined,
    fetchedUsername: input.fetchedUsername ? String(input.fetchedUsername).trim() : undefined,
    followers: input.followers ? String(input.followers).trim() : undefined,
    reach: input.reach ? String(input.reach).trim() : undefined,
    status,
    updatedAt: new Date().toISOString(),
  };
};

const parseJsonSafely = <T>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const escapeEnvValue = (value: string): string => value.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');

const getEnvVarValue = (content: string, key: string): string | null => {
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  const match = content.match(pattern);
  if (!match) return null;

  const raw = match[1].trim();
  if (!raw) return "";
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).replace(/\\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return raw;
};

const setEnvVar = (content: string, key: string, value: string): string => {
  const escapedValue = `"${escapeEnvValue(value)}"`;
  const line = `${key}=${escapedValue}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  return `${content}${suffix}${line}\n`;
};

const loadStoredPages = async (rootDir: string): Promise<StoredPage[]> => {
  const storeFile = path.join(rootDir, "data", "page-data.json");
  const envFile = path.join(rootDir, ".env.local");

  try {
    const fileRaw = await fs.readFile(storeFile, "utf8");
    const parsed = parseJsonSafely<StoredPage[]>(fileRaw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Continue to env fallback.
  }

  try {
    const envRaw = await fs.readFile(envFile, "utf8");
    const envValue = getEnvVarValue(envRaw, PAGE_ENV_KEY);
    if (!envValue) return [];
    const parsed = parseJsonSafely<StoredPage[]>(envValue, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistStoredPages = async (rootDir: string, pages: StoredPage[]): Promise<void> => {
  const storeDir = path.join(rootDir, "data");
  const storeFile = path.join(storeDir, "page-data.json");
  const envFile = path.join(rootDir, ".env.local");
  const serialized = JSON.stringify(pages);

  await fs.mkdir(storeDir, { recursive: true });
  await fs.writeFile(storeFile, JSON.stringify(pages, null, 2), "utf8");

  let envRaw = "";
  try {
    envRaw = await fs.readFile(envFile, "utf8");
  } catch {
    envRaw = "";
  }

  const nextEnv = setEnvVar(envRaw, PAGE_ENV_KEY, serialized);
  await fs.writeFile(envFile, nextEnv, "utf8");
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rootDir = process.cwd();
  const gsheetTarget = env.VITE_GSHEET_WEB_APP_URL || env.VITE_GSHEET_API_URL || "";

  const proxy: Record<string, string | ProxyOptions> = {
    "/api/verify": {
      target: "https://n8n.kasunmadhuwantha.cv",
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace("/api/verify", "/webhook/verify"),
    },
    "/n8n-api": {
      target: "https://n8n.kasunmadhuwantha.cv",
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace("/n8n-api", "/api/v1"),
    },
    "/api/n8n": {
      target: "https://n8n.kasunmadhuwantha.cv",
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace("/api/n8n", "/api/v1"),
    },
  };

  if (gsheetTarget) {
    proxy["/gsheet-api"] = {
      target: gsheetTarget,
      changeOrigin: true,
      secure: true,
      rewrite: () => "",
    };
  }

  return {
    plugins: [
      react(),
      {
        name: "local-page-data-store",
        configureServer(server) {
          server.middlewares.use("/api/page-data", async (req, res) => {
            res.setHeader("Content-Type", "application/json");

            if (req.method === "GET") {
              const pages = await loadStoredPages(rootDir);
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, pages }));
              return;
            }

            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end(JSON.stringify({ ok: false, message: "Method not allowed." }));
              return;
            }

            try {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk;
              });

              await new Promise<void>((resolve, reject) => {
                req.on("end", () => resolve());
                req.on("error", reject);
              });

              const parsedBody = parseJsonSafely<Record<string, unknown>>(body, {});
              const action = String(parsedBody.action || "").trim() as PageAction;
              const existing = await loadStoredPages(rootDir);

              if (action === "delete") {
                const pageId = String(parsedBody.pageId || "").trim();
                const displayName = String(parsedBody.displayName || "").trim().toLowerCase();
                const handle = String(parsedBody.handle || "").trim().toLowerCase();

                const next = existing.filter((item) => {
                  const sameId = pageId.length > 0 && item.pageId === pageId;
                  const sameName = displayName.length > 0 && item.displayName.toLowerCase() === displayName;
                  const sameHandle = handle.length > 0 && item.handle.toLowerCase() === handle;
                  return !(sameId || sameName || sameHandle);
                });

                await persistStoredPages(rootDir, next);

                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, message: "Page removed from local file storage.", pages: next }));
                return;
              }

              if (action !== "create" && action !== "update") {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, message: "Invalid action." }));
                return;
              }

              const normalized = normalizePageRecord(parsedBody as Partial<StoredPage>);
              if (!normalized) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, message: "displayName, pageId and accessToken are required." }));
                return;
              }

              const existingIndex = existing.findIndex((item) => {
                const sameId = item.pageId === normalized.pageId;
                const sameName = item.displayName.trim().toLowerCase() === normalized.displayName.trim().toLowerCase();
                const sameHandle = item.handle.trim().toLowerCase() === normalized.handle.trim().toLowerCase();
                return sameId || sameName || sameHandle;
              });

              let next = [...existing];
              if (existingIndex >= 0) {
                next[existingIndex] = {
                  ...next[existingIndex],
                  ...normalized,
                };
              } else {
                next = [normalized, ...next];
              }

              await persistStoredPages(rootDir, next);

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  ok: true,
                  message: existingIndex >= 0 ? "Page updated in local file storage." : "Page saved in local file storage.",
                  pages: next,
                })
              );
            } catch (error) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  ok: false,
                  message: error instanceof Error ? error.message : "Unexpected local storage error.",
                })
              );
            }
          });
        },
      },
    ],
    server: {
      proxy,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
