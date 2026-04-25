import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const DEFAULT_PAGE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyAA0fzHZMvz6bqVgypsbz6oKk1oxjPLjkNDRxh3DoakpsIjlGW636o_lpwy9DWuTA/exec";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gsheetTarget = env.VITE_GSHEET_WEB_APP_URL || env.VITE_GSHEET_API_URL || "";
  const pageSheetTarget =
    String(env.VITE_PAGES_SHEET_WEB_APP_URL || env.VITE_GSHEET_WEB_APP_URL || env.VITE_GSHEET_API_URL || DEFAULT_PAGE_SHEET_WEBAPP_URL).trim();

  // Derive n8n host from env — strip /api/v1 suffix if present so it stays as the host root
  const rawN8nBase = env.VITE_N8N_BASE_URL || "https://n8n.kasunmadhuwantha.cv";
  const n8nHost = rawN8nBase.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

  const proxy: Record<string, string | ProxyOptions> = {
    "/api/verify": {
      target: n8nHost,
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace("/api/verify", "/webhook/verify"),
    },
    "/n8n-api": {
      target: n8nHost,
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace("/n8n-api", "/api/v1"),
    },
    "/api/n8n": {
      target: n8nHost,
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace("/api/n8n", "/api/v1"),
    },
    "/api/page-data": {
      target: pageSheetTarget,
      changeOrigin: true,
      secure: true,
      rewrite: () => "",
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
    plugins: [react()],
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
