/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_N8N_WEBHOOK_URL?: string;
	readonly VITE_N8N_PAGE_WEBHOOK_URL?: string;
	readonly VITE_N8N_AUTOMATION_WEBHOOK_URL?: string;
	readonly VITE_N8N_COMMENTS_WEBHOOK_URL?: string;
	readonly VITE_N8N_SYNC_WEBHOOK_URL?: string;
	readonly VITE_N8N_API_KEY?: string;
	readonly VITE_N8N_PUBLIC_API_KEY?: string;
	readonly VITE_N8N_BASE_URL?: string;
	readonly VITE_VERIFY_WEBHOOK_URL?: string;
	readonly VITE_GSHEET_URL?: string;
	readonly VITE_GSHEET_WEB_APP_URL?: string;
	readonly VITE_GSHEET_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
