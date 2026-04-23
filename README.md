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

My Pages Google Sheet flow:

- Frontend sends create/update/delete page data to `/api/page-data`.
- Hosted function `functions/api/page-data.js` writes directly to your Google Apps Script web app.
- Hosted function reads latest sheet rows after each write and returns canonical page data to the dashboard.
- Dashboard polls `/api/page-data?action=read&sheet=Sheet1` to keep pages synced.
- Submission history is cached in localStorage key `page-storage-submissions`.

The automation page uses:

- `GET https://n8n.kasunmadhuwantha.cv/api/v1/workflows`
- `POST https://n8n.kasunmadhuwantha.cv/api/v1/workflows/{id}/activate`
- `POST https://n8n.kasunmadhuwantha.cv/api/v1/workflows/{id}/deactivate`

## Build

```bash
npm run build
```
