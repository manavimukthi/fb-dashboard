# FB Dashboard

Email marketing dashboard built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Recharts.

## Run

```bash
npm install
npm run dev
```

## Environment

Set your n8n API key in a local env file:

```bash
VITE_N8N_API_KEY=your_n8n_api_key_here
VITE_N8N_PAGE_WEBHOOK_URL=https://n8n.kasunmadhuwantha.cv/webhook-test/page-data
VITE_VERIFY_WEBHOOK_URL=https://n8n.kasunmadhuwantha.cv/webhook/verify
```

My Pages webhook flow:

- Frontend sends page registration data to `/api/page-data` (Vite middleware proxy).
- Middleware forwards to `https://n8n.kasunmadhuwantha.cv/webhook-test/page-data`.
- If middleware is unavailable, app falls back to `VITE_N8N_PAGE_WEBHOOK_URL`.
- Submission history is cached in localStorage key `page-webhook-submissions`.

The automation page uses:

- `GET https://n8n.n8yland.me/api/v1/workflows`
- `PATCH https://n8n.n8yland.me/api/v1/workflows/{id}/activate`
- `PATCH https://n8n.n8yland.me/api/v1/workflows/{id}/deactivate`

## Build

```bash
npm run build
```
