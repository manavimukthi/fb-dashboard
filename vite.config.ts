import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
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
    "/api/page-data": {
      target: "https://n8n.kasunmadhuwantha.cv",
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace("/api/page-data", "/webhook-test/page-data"),
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
