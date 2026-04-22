import { useState, useEffect, useCallback } from 'react';

interface Post {
  id: string;
  page: string;
  imageUrl: string;
  caption: string;
  scheduledTime: string;
  status: 'pending' | 'scheduled' | 'posted' | 'failed';
}

interface UseContentQueueReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
  refetch: () => void;
}

type ConnectionsConfigLike = {
  sheetWebAppUrl?: string;
  sheetDeploymentId?: string;
};

const DEFAULT_GSHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUerVxvoXhMXoPEK1v22kpGYCNdd9dkk_IXFlzBAdk01QJ6D0O3nUl-wRhsdCIMjvl/exec";

function getSheetEndpointCandidates(): string[] {
  const envSheetUrl = String(import.meta.env.VITE_GSHEET_URL ?? "").trim();
  const envWebAppUrl = String(import.meta.env.VITE_GSHEET_WEB_APP_URL ?? import.meta.env.VITE_GSHEET_API_URL ?? "").trim();

  let configSheetUrl = "";
  try {
    const raw = localStorage.getItem("connections-config");
    if (raw) {
      const parsed = JSON.parse(raw) as ConnectionsConfigLike;
      const direct = String(parsed.sheetWebAppUrl ?? "").trim();
      const deploymentId = String(parsed.sheetDeploymentId ?? "").trim();
      configSheetUrl = direct || (deploymentId ? `https://script.google.com/macros/s/${deploymentId}/exec` : "");
    }
  } catch {
    // Ignore localStorage parse errors and continue with env defaults.
  }

  const candidates = [
    envSheetUrl,
    envWebAppUrl,
    configSheetUrl,
    DEFAULT_GSHEET_WEB_APP_URL,
  ];

  if (import.meta.env.DEV) {
    candidates.unshift("/gsheet-api", "/gsheet-api?action=list");
  }

  return candidates.filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

function mapStatus(raw: string): Post['status'] {
  switch (raw?.toLowerCase()) {
    case 'ready': return 'pending';
    case 'scheduled': return 'scheduled';
    case 'posted': return 'posted';
    case 'failed': return 'failed';
    default: return 'pending';
  }
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (date.toDateString() === now.toDateString()) return `Today, ${timeStr}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${timeStr}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}

export function useContentQueue(): UseContentQueueReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const endpoints = getSheetEndpointCandidates();
      let rows: Record<string, unknown>[] = [];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
          if (!res.ok) continue;

          const rawText = await res.text();
          let payload: unknown = rawText;
          try {
            payload = JSON.parse(rawText) as unknown;
          } catch {
            continue;
          }

          const recordPayload = payload as { rows?: unknown; data?: unknown; items?: unknown };
          const extracted = Array.isArray(payload)
            ? payload
            : Array.isArray(recordPayload.rows)
              ? recordPayload.rows
              : Array.isArray(recordPayload.data)
                ? recordPayload.data
                : Array.isArray(recordPayload.items)
                  ? recordPayload.items
                  : [];

          rows = extracted.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
          if (rows.length > 0) {
            break;
          }
        } catch {
          // Try next endpoint candidate.
        }
      }

      if (rows.length === 0) {
        throw new Error('Fetch failed');
      }

      const mapped: Post[] = rows.map((row, index) => ({
        id: String(index),
        page: String(row.page ?? row.PAGE ?? ''),
        imageUrl: String(
          row.imageUrl ??
          row.image_url ??
          row.IMAGE_URL ??
          row.image ??
          row.IMAGE ??
          row.post ??
          row.POST ??
          ''
        ),
        caption: String(row.caption ?? row.CAPTION ?? ''),
        scheduledTime: formatTime(String(row.time ?? row.TIME ?? '')),
        status: mapStatus(String(row.status ?? row.STATUS ?? '')),
      }));

      setPosts(mapped);
      setLastSynced(new Date());
      setError(null);
    } catch {
      setError('Failed to sync. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { posts, loading, error, lastSynced, refetch: fetchData };
}
