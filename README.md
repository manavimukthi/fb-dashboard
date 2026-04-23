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
VITE_N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NWQ1NmVmYi0zNzlhLTQ5Y2MtYTRmMS02OTliMTQyNzQ2MjYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZTUyMTk2OWUtM2I5Ny00NjYxLWE1ODktMmQxN2NjMmFjZDBjIiwiaWF0IjoxNzc2ODQzMjg1LCJleHAiOjE3Nzk0MjI0MDB9.wkMAp6agdfarsqIyFabHF1aF7rzYHJcHSKWxtSqT3xQ
VITE_N8N_PAGE_WEBHOOK_URL=https://n8n.kasunmadhuwantha.cv/webhook-test/page-data
VITE_VERIFY_WEBHOOK_URL=https://n8n.kasunmadhuwantha.cv/webhook/verify
```

My Pages local file flow:

- Frontend sends create/update/delete page data to `/api/page-data`.
- Vite local middleware stores all pages in `data/page-data.json`.
- Middleware also mirrors page records in `.env.local` under `FB_DASHBOARD_PAGES`.
- Deleting a page removes it from both file stores.
- Submission history is cached in localStorage key `page-storage-submissions`.

The automation page uses:

- `GET https://n8n.kasunmadhuwantha.cv/api/v1/workflows`
- `POST https://n8n.kasunmadhuwantha.cv/api/v1/workflows/{id}/activate`
- `POST https://n8n.kasunmadhuwantha.cv/api/v1/workflows/{id}/deactivate`

## Build

```bash
npm run build
```
