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

const SHEET_URL = import.meta.env.VITE_GSHEET_URL;

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
      const res = await fetch(SHEET_URL);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();

      const mapped: Post[] = data.map((row: any, index: number) => ({
        id: String(index),
        page: row.page || row.PAGE || '',
        imageUrl:
          row.imageUrl ||
          row.image_url ||
          row.IMAGE_URL ||
          row.image ||
          row.IMAGE ||
          row.post ||
          row.POST ||
          '',
        caption: row.caption || row.CAPTION || '',
        scheduledTime: formatTime(row.time || row.TIME || ''),
        status: mapStatus(row.status || row.STATUS || ''),
      }));

      setPosts(mapped);
      setLastSynced(new Date());
      setError(null);
    } catch (err) {
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
