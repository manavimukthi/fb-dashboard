import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Bell,
  Settings,
  Menu,
  Home,
  Layout,
  BarChart3,
  Plus,
  FileText,
  Upload,
  GitBranch,
  Calendar,
  Blocks,
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Zap,
  ChevronRight,
  Moon,
  Sun,
  MoreVertical,
  Trash2,
  RefreshCcw,
  Copy,
  Send,
  Bot,
  X,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Ban,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import LoginPage from "@/pages/LoginPage";
import { useContentQueue } from "@/hooks/useContentQueue";

type ViewKey =
  | "Dashboard"
  | "Content Queue"
  | "Post Monitor"
  | "Compose Post"
  | "Templates"
  | "Media Library"
  | "Automations"
  | "Schedulers"
  | "Workflows"
  | "My Pages"
  | "Comment Moderation"
  | "Page Analytics"
  | "Connections"
  | "Notifications";

type QueueStatus = "Pending" | "Scheduled" | "Posted" | "Failed";
type TemplateName = "Breaking" | "News" | "Fact" | "Opinion" | "Weekly Recap";
type TemplateCategory = "Breaking News" | "Fact" | "Opinion" | "Weekly Recap" | "News";
type PageStatus = "Active" | "Paused";
type AutomationStatus = "Running" | "Stopped";
type ModerationFilter = "All" | "Flagged" | "Approved" | "Blocked";
type CommentStatus = "Flagged" | "Approved" | "Blocked";

type QueueItem = {
  id: number;
  page: string;
  imageUrl?: string;
  headline: string;
  caption: string;
  template: TemplateName;
  status: QueueStatus;
  scheduledTime: string;
  pageColor: string;
};

type ManagedPage = {
  id: number;
  name: string;
  handle: string;
  pageId?: string;
  accessToken?: string;
  status: PageStatus;
  color: string;
  postsToday: number;
  reach: string;
  followers: string;
};

type AutomationItem = {
  id: number;
  name: string;
  linkedPage: string;
  lastRun: string;
  nextRun: string;
  status: AutomationStatus;
};

type TemplateItem = {
  id: number;
  name: string;
  category: TemplateCategory;
  usedCount: number;
  accent: string;
  bg: string;
};

type CommentItem = {
  id: number;
  username: string;
  handle: string;
  pageName: string;
  text: string;
  sentiment: "Safe" | "Flagged";
  status: CommentStatus;
};

type SchedulerPageKey = "all" | "canada" | "facts" | "world";

type SchedulerEvent = {
  id: number;
  title: string;
  pageKey: Exclude<SchedulerPageKey, "all">;
  pageName: string;
  date: string;
  hour: number;
  minute: number;
  durationHours: number;
  type: "Queue" | "Automation" | "Publish";
  color: string;
};

type ConnectionsConfig = {
  facebookTokens: Record<string, string>;
  baseWebhookUrl: string;
  postWebhook: string;
  syncWebhook: string;
  automationWebhook: string;
  n8nApiBaseUrl: string;
  n8nApiKey: string;
  sheetDeploymentId: string;
  sheetWebAppUrl: string;
  sheetId: string;
  serviceEmail: string;
  autoSyncSeconds: number;
  realTimeQueueSync: boolean;
  telegramAlerts: boolean;
};

type SyncState = {
  queue: QueueItem[];
  pages: ManagedPage[];
  automations: AutomationItem[];
  lastUpdated: string;
};

type DashboardChartPoint = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  sent: number;
  reached: number;
  clicked: number;
};

type DashboardRealtimeData = {
  postsToday: number;
  totalReach: number;
  totalFollowers: number;
  failedPosts: number;
  chart: DashboardChartPoint[];
  recentPosts: LivePostItem[];
};

type LivePostItem = {
  id: string;
  pageName: string;
  headline: string;
  template: string;
  status: QueueStatus;
  time: string;
  permalink?: string;
  createdAt?: string;
  graphPostId?: string;
};

type SyncContextValue = {
  syncData: SyncState;
  dashboardRealtimeData: DashboardRealtimeData;
  recentPosts: LivePostItem[];
  liveComments: CommentItem[];
  syncStatus: "idle" | "syncing" | "success" | "error";
  lastSyncedAt: number | null;
  failedAttempts: number;
  syncNow: () => Promise<void>;
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  setPages: React.Dispatch<React.SetStateAction<ManagedPage[]>>;
  setAutomations: React.Dispatch<React.SetStateAction<AutomationItem[]>>;
};

const statusClassMap: Record<QueueStatus, string> = {
  Posted: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  Pending: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  Failed: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  Scheduled: "bg-violet-500/15 text-violet-300 border-violet-500/40",
};

const progressStats = [
  { title: "Posts Today", value: "42", growth: "+9.4%", progress: 84, icon: Send },
  { title: "Total Reach", value: "218K", growth: "+14.1%", progress: 78, icon: TrendingUp },
  { title: "Total Followers", value: "64.2K", growth: "+4.8%", progress: 62, icon: Users },
  { title: "Failed Posts", value: "3", growth: "-35%", progress: 22, icon: AlertCircle },
];

const postsPerformanceData = [
  { day: "Mon", sent: 26, reached: 34000, clicked: 4500 },
  { day: "Tue", sent: 22, reached: 29800, clicked: 3900 },
  { day: "Wed", sent: 31, reached: 42100, clicked: 5300 },
  { day: "Thu", sent: 28, reached: 39200, clicked: 4900 },
  { day: "Fri", sent: 34, reached: 45500, clicked: 6100 },
  { day: "Sat", sent: 19, reached: 24800, clicked: 3200 },
  { day: "Sun", sent: 27, reached: 37600, clicked: 4700 },
];

const insights = [
  {
    title: "Best Time to Post",
    description: "7:30 PM to 9:00 PM gives highest reach.",
    icon: Clock,
    iconColor: "text-sky-300",
    iconBg: "bg-sky-500/15",
  },
  {
    title: "Page with Most Reach",
    description: "Tech Minute has 39% of total weekly reach.",
    icon: TrendingUp,
    iconColor: "text-teal-300",
    iconBg: "bg-teal-500/15",
  },
  {
    title: "Failed Post Alert",
    description: "2 posts failed due to expired media link.",
    icon: AlertCircle,
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/15",
  },
  {
    title: "Automation Status",
    description: "8 workflows active, 1 paused for review.",
    icon: Zap,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15",
  },
];

const mockQueueData: QueueItem[] = [
  {
    id: 1,
    page: "TrendWire Daily",
    headline: "Tech layoffs cool as hiring rebounds in Q2",
    caption: "Hiring sentiment is returning across product and data teams after two cautious quarters.",
    template: "News",
    status: "Pending",
    scheduledTime: "Today, 7:00 PM",
    pageColor: "bg-cyan-400",
  },
  {
    id: 2,
    page: "Civic Pulse",
    headline: "City launches pilot for cashless bus routes",
    caption: "Commuters can now pay with cards and digital wallets on 12 pilot routes this month.",
    template: "Breaking",
    status: "Scheduled",
    scheduledTime: "Tomorrow, 8:30 AM",
    pageColor: "bg-violet-400",
  },
  {
    id: 3,
    page: "Science Snap",
    headline: "Why your screen looks dim outdoors",
    caption: "A quick fact about ambient light sensors and how phones adapt brightness in sunlight.",
    template: "Fact",
    status: "Posted",
    scheduledTime: "Today, 11:20 AM",
    pageColor: "bg-emerald-400",
  },
  {
    id: 4,
    page: "TrendWire Daily",
    headline: "Breaking: cloud outage affects regional services",
    caption: "Multiple teams reported elevated latency after a regional provider incident.",
    template: "Breaking",
    status: "Failed",
    scheduledTime: "Today, 1:40 PM",
    pageColor: "bg-cyan-400",
  },
];

const initialManagedPages: ManagedPage[] = [];

const initialAutomations: AutomationItem[] = [
  { id: 1, name: "Breaking RSS to Queue", linkedPage: "TrendWire Daily", lastRun: "3 min ago", nextRun: "in 7 min", status: "Running" },
  { id: 2, name: "Daily Fact Curator", linkedPage: "Science Snap", lastRun: "12 min ago", nextRun: "in 18 min", status: "Stopped" },
  { id: 3, name: "City News Digest", linkedPage: "Civic Pulse", lastRun: "1 hour ago", nextRun: "in 4 min", status: "Running" },
];

const templateItemsData: TemplateItem[] = [
  { id: 1, name: "Rapid Alert", category: "Breaking News", usedCount: 246, accent: "#ef4444", bg: "from-rose-500/35 to-rose-800/20" },
  { id: 2, name: "Fact Snapshot", category: "Fact", usedCount: 189, accent: "#3b82f6", bg: "from-blue-500/35 to-blue-800/20" },
  { id: 3, name: "Opinion Pulse", category: "Opinion", usedCount: 131, accent: "#a855f7", bg: "from-fuchsia-500/35 to-purple-800/20" },
  { id: 4, name: "Week in 60", category: "Weekly Recap", usedCount: 92, accent: "#22c55e", bg: "from-emerald-500/35 to-emerald-800/20" },
  { id: 5, name: "Headline Flow", category: "News", usedCount: 274, accent: "#0d9488", bg: "from-teal-500/35 to-teal-800/20" },
  { id: 6, name: "Red Banner Live", category: "Breaking News", usedCount: 158, accent: "#ef4444", bg: "from-rose-500/35 to-rose-800/20" },
];

const templateCategoryToComposeTemplate: Record<TemplateCategory, TemplateName> = {
  "Breaking News": "Breaking",
  Fact: "Fact",
  Opinion: "Opinion",
  "Weekly Recap": "Weekly Recap",
  News: "News",
};

const templateCategoryFilters: Array<"All" | TemplateCategory> = ["All", "Breaking News", "Fact", "Opinion", "Weekly Recap", "News"];
const queueFilters: Array<"All" | QueueStatus> = ["All", "Pending", "Scheduled", "Posted", "Failed"];

const mockComments: CommentItem[] = [
  { id: 1, username: "Rina Hart", handle: "@rina_h", pageName: "TrendWire Daily", text: "This post is fake and useless.", sentiment: "Flagged", status: "Flagged" },
  { id: 2, username: "M. Cole", handle: "@mcole", pageName: "Civic Pulse", text: "Great update, this helped me plan.", sentiment: "Safe", status: "Approved" },
  { id: 3, username: "Janice", handle: "@janice84", pageName: "Science Snap", text: "Verify facts before posting nonsense.", sentiment: "Flagged", status: "Flagged" },
];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const nowDate = new Date();
const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

const schedulerEventsSeed: SchedulerEvent[] = [
  {
    id: 1,
    title: "Morning Political Summary",
    pageKey: "canada",
    pageName: "Canada Politics Now",
    date: formatDateKey(startOfToday),
    hour: 9,
    minute: 0,
    durationHours: 1,
    type: "Automation",
    color: "bg-teal-500/20 border-teal-500/40",
  },
  {
    id: 2,
    title: "Top 5 Daily Facts",
    pageKey: "facts",
    pageName: "True Facts Daily",
    date: formatDateKey(startOfToday),
    hour: 14,
    minute: 0,
    durationHours: 1,
    type: "Publish",
    color: "bg-sky-500/20 border-sky-500/40",
  },
  {
    id: 3,
    title: "Evening World Brief",
    pageKey: "world",
    pageName: "World News Brief",
    date: formatDateKey(addDays(startOfToday, 1)),
    hour: 11,
    minute: 0,
    durationHours: 1,
    type: "Queue",
    color: "bg-orange-500/20 border-orange-500/40",
  },
  {
    id: 4,
    title: "Afternoon Fact Burst",
    pageKey: "facts",
    pageName: "True Facts Daily",
    date: formatDateKey(addDays(startOfToday, 2)),
    hour: 16,
    minute: 0,
    durationHours: 1,
    type: "Publish",
    color: "bg-sky-500/20 border-sky-500/40",
  },
];

const menuSections: Array<{ title: string; items: Array<{ icon: React.ComponentType<{ className?: string }>; label: ViewKey }> }> = [
  { title: "Main", items: [{ icon: Home, label: "Dashboard" }, { icon: Layout, label: "Content Queue" }, { icon: BarChart3, label: "Post Monitor" }] },
  { title: "Content", items: [{ icon: Plus, label: "Compose Post" }, { icon: FileText, label: "Templates" }, { icon: Upload, label: "Media Library" }, { icon: Calendar, label: "Schedulers" }] },
  { title: "Automation", items: [{ icon: GitBranch, label: "Automations" }, { icon: Blocks, label: "Workflows" }] },
  { title: "Pages", items: [{ icon: Users, label: "My Pages" }, { icon: MessageSquare, label: "Comment Moderation" }, { icon: TrendingUp, label: "Page Analytics" }] },
  { title: "Settings", items: [{ icon: Settings, label: "Connections" }, { icon: Bell, label: "Notifications" }] },
];

const defaultConnections: ConnectionsConfig = {
  facebookTokens: {
    "TrendWire Daily": "EAAB***A91",
    "Civic Pulse": "EAAB***M17",
    "Science Snap": "EAAB***Z03",
  },
  baseWebhookUrl: "",
  postWebhook: "",
  syncWebhook: "",
  automationWebhook: "",
  n8nApiBaseUrl: "",
  n8nApiKey: "",
  sheetDeploymentId: "",
  sheetWebAppUrl: "",
  sheetId: "",
  serviceEmail: "service-account@project.iam.gserviceaccount.com",
  autoSyncSeconds: 30,
  realTimeQueueSync: true,
  telegramAlerts: false,
};

const DEFAULT_N8N_API_BASE_URL = "https://n8n.kasunmadhuwantha.cv/api/v1";
const DEFAULT_GSHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyAA0fzHZMvz6bqVgypsbz6oKk1oxjPLjkNDRxh3DoakpsIjlGW636o_lpwy9DWuTA/exec";
const CONNECTIONS_CONFIG_UPDATED_EVENT = "connections-config-updated";

const getSavedConnectionsConfig = (): Partial<ConnectionsConfig> => {
  try {
    const raw = localStorage.getItem("connections-config");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<ConnectionsConfig>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const useConnectionsConfig = (): Partial<ConnectionsConfig> => {
  const [config, setConfig] = React.useState<Partial<ConnectionsConfig>>(() => getSavedConnectionsConfig());

  React.useEffect(() => {
    const refreshConfig = () => setConfig(getSavedConnectionsConfig());

    window.addEventListener("storage", refreshConfig);
    window.addEventListener(CONNECTIONS_CONFIG_UPDATED_EVENT, refreshConfig as EventListener);

    return () => {
      window.removeEventListener("storage", refreshConfig);
      window.removeEventListener(CONNECTIONS_CONFIG_UPDATED_EVENT, refreshConfig as EventListener);
    };
  }, []);

  return config;
};

const resolveN8nApiConfig = (savedConfig: Partial<ConnectionsConfig> = getSavedConnectionsConfig()): { apiBaseUrls: string[]; apiKey: string } => {

  const apiKey = String(
    import.meta.env.VITE_N8N_API_KEY ??
      import.meta.env.VITE_N8N_PUBLIC_API_KEY ??
      savedConfig.n8nApiKey ??
      ""
  ).trim();

  const envBase = String(import.meta.env.VITE_N8N_BASE_URL ?? "").trim();
  const savedBase = String(savedConfig.n8nApiBaseUrl ?? "").trim();

  const directBaseCandidates = [savedBase, envBase, DEFAULT_N8N_API_BASE_URL]
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)
    .map((value) => value.replace(/\/$/, ""));

  const proxyBase = "/api/n8n";

  const apiBaseUrls = import.meta.env.DEV
    ? [proxyBase, "/n8n-api", ...directBaseCandidates]
    : [proxyBase, ...directBaseCandidates];

  return {
    apiBaseUrls,
    apiKey,
  };
};

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 12000): Promise<Response> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
};

const readResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

const looksLikeHtml = (value: string): boolean => /<\s*!doctype\s+html|<\s*html|<\s*body|<\s*head/i.test(value.trim().slice(0, 200));

const SyncContext = React.createContext<SyncContextValue | null>(null);

function useSync() {
  const ctx = React.useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSync must be used within SyncContext provider");
  }
  return ctx;
}

function SyncProvider({ children }: { children: React.ReactNode }) {
  const defaultDashboardChart: DashboardChartPoint[] = [
    { day: "Mon", sent: 0, reached: 0, clicked: 0 },
    { day: "Tue", sent: 0, reached: 0, clicked: 0 },
    { day: "Wed", sent: 0, reached: 0, clicked: 0 },
    { day: "Thu", sent: 0, reached: 0, clicked: 0 },
    { day: "Fri", sent: 0, reached: 0, clicked: 0 },
    { day: "Sat", sent: 0, reached: 0, clicked: 0 },
    { day: "Sun", sent: 0, reached: 0, clicked: 0 },
  ];

  const [queue, setQueue] = React.useState<QueueItem[]>(mockQueueData);

  // Keep hosted page storage as the source of truth.
  const [pages, setPages] = React.useState<ManagedPage[]>(initialManagedPages);

  const [automations, setAutomations] = React.useState<AutomationItem[]>(initialAutomations);
  const [lastUpdated, setLastUpdated] = React.useState(new Date().toISOString());
  const [dashboardRealtimeData, setDashboardRealtimeData] = React.useState<DashboardRealtimeData>({
    postsToday: 0,
    totalReach: 0,
    totalFollowers: 0,
    failedPosts: 0,
    chart: defaultDashboardChart,
    recentPosts: [],
  });
  const [recentPosts, setRecentPosts] = React.useState<LivePostItem[]>([]);
  const [liveComments, setLiveComments] = React.useState<CommentItem[]>([]);
  const [syncStatus, setSyncStatus] = React.useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSyncedAt, setLastSyncedAt] = React.useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = React.useState(0);

  const savedConnectionsConfig = useConnectionsConfig();

  const webhook =
    String(import.meta.env.VITE_N8N_SYNC_WEBHOOK_URL ?? "").trim() ||
    String(import.meta.env.VITE_N8N_WEBHOOK_URL ?? "").trim() ||
    String(savedConnectionsConfig.syncWebhook ?? "").trim() ||
    String(savedConnectionsConfig.baseWebhookUrl ?? "").trim();

  const parseGoogleSheetPages = React.useCallback((payload: unknown): Array<{ pageId: string; pageName: string; accessToken: string; status: PageStatus; handle: string; followers: string; reach: string }> => {
    const rows: unknown[] = [];

    const pushRows = (value: unknown) => {
      if (Array.isArray(value)) {
        rows.push(...value);
      }
    };

    if (Array.isArray(payload)) {
      pushRows(payload);
    } else if (payload && typeof payload === "object") {
      const data = payload as Record<string, unknown>;
      pushRows(data.rows);
      pushRows(data.data);
      pushRows(data.items);
      pushRows(data.pages);

      if (Array.isArray(data.values) && data.values.length > 1 && Array.isArray(data.values[0])) {
        const header = (data.values[0] as unknown[]).map((item) => String(item).trim().toLowerCase());
        const idxPageId = header.indexOf("page_id");
        const idxPageName = header.indexOf("page_name");
        const idxAccessToken = header.indexOf("access_token");
        const idxStatus = header.indexOf("status");

        for (const row of data.values.slice(1)) {
          if (!Array.isArray(row)) continue;
          rows.push({
            page_id: idxPageId >= 0 ? row[idxPageId] : "",
            page_name: idxPageName >= 0 ? row[idxPageName] : "",
            access_token: idxAccessToken >= 0 ? row[idxAccessToken] : "",
            status: idxStatus >= 0 ? row[idxStatus] : "ACTIVE",
          });
        }
      }
    }

    return rows
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const item = row as Record<string, unknown>;
        const pageId = String(item.page_id ?? item.pageId ?? "").trim();
        const pageName = String(item.page_name ?? item.pageName ?? item.displayName ?? "").trim();
        const handle = String(item.handle ?? "").trim();
        const accessToken = String(item.access_token ?? item.accessToken ?? "").trim();
        const followers = String(item.followers ?? "").trim();
        const reach = String(item.reach ?? "").trim();
        const rawStatus = String(item.status ?? "ACTIVE").trim().toUpperCase();
        const status: PageStatus = rawStatus === "ACTIVE" ? "Active" : "Paused";
        if (!pageId && !pageName) return null;
        return { pageId, pageName, accessToken, status, handle, followers, reach };
      })
      .filter((item): item is { pageId: string; pageName: string; accessToken: string; status: PageStatus; handle: string; followers: string; reach: string } => item !== null);
  }, []);

  const syncPagesFromGoogleSheet = React.useCallback(async () => {
    const endpoints = ["/api/page-data?action=read"];

    for (const endpoint of endpoints) {
      try {
        const response = await fetchWithTimeout(endpoint, { method: "GET", cache: "no-store" });
        if (!response.ok) continue;

        const rawText = await readResponseText(response);
        let payload: unknown = rawText;
        try {
          payload = JSON.parse(rawText) as unknown;
        } catch {
          continue;
        }

        const parsedPages = parseGoogleSheetPages(payload);
        if (parsedPages.length === 0) {
          setPages([]);
          return true;
        }

        const palette = ["bg-rose-500", "bg-blue-500", "bg-orange-500", "bg-purple-500", "bg-amber-500", "bg-teal-500"];

        setPages((prev) => {
          const usedIds = new Set(prev.map((item) => item.id));
          const next = [...prev];

          parsedPages.forEach((sheetPage, idx) => {
            const normalizedName = sheetPage.pageName.toLowerCase();
            const existingIndex = next.findIndex((page) => {
              const byPageId = Boolean(sheetPage.pageId && page.pageId && page.pageId === sheetPage.pageId);
              const byName = page.name.trim().toLowerCase() === normalizedName;
              return byPageId || byName;
            });

            const normalizedHandle = `@${sheetPage.pageName.toLowerCase().replace(/\s+/g, "")}`;

            if (existingIndex >= 0) {
              const current = next[existingIndex];
              next[existingIndex] = {
                ...current,
                name: sheetPage.pageName || current.name,
                pageId: sheetPage.pageId || current.pageId,
                accessToken: sheetPage.accessToken || current.accessToken,
                status: sheetPage.status,
                handle: sheetPage.handle || current.handle || normalizedHandle,
                followers: sheetPage.followers || current.followers,
                reach: sheetPage.reach || current.reach,
              };
              return;
            }

            let generatedId = Date.now() + idx;
            while (usedIds.has(generatedId)) {
              generatedId += 1;
            }
            usedIds.add(generatedId);

            next.push({
              id: generatedId,
              name: sheetPage.pageName || `Page ${idx + 1}`,
              handle: sheetPage.handle || normalizedHandle,
              pageId: sheetPage.pageId,
              accessToken: sheetPage.accessToken,
              status: sheetPage.status,
              color: palette[next.length % palette.length],
              postsToday: 0,
              reach: sheetPage.reach || "0",
              followers: sheetPage.followers || "0",
            });
          });

          return next;
        });

        return true;
      } catch {
        // Try next endpoint variant.
      }
    }

    return false;
  }, [parseGoogleSheetPages]);

  const formatCompactNumber = React.useCallback((value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
  }, []);

  const syncPageMetricsFromFacebook = React.useCallback(async () => {
    const candidates = pages.filter((page) => page.pageId && page.accessToken);
    if (candidates.length === 0) return false;

    const dayOrder: DashboardChartPoint["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayMap: Record<number, DashboardChartPoint["day"]> = {
      0: "Sun",
      1: "Mon",
      2: "Tue",
      3: "Wed",
      4: "Thu",
      5: "Fri",
      6: "Sat",
    };

    const chartAccumulator = new Map<DashboardChartPoint["day"], DashboardChartPoint>(
      dayOrder.map((day) => [day, { day, sent: 0, reached: 0, clicked: 0 }])
    );

    const updated = await Promise.all(
      candidates.map(async (page) => {
        try {
          const fields = "followers_count,fan_count,posts.limit(25){created_time}";
          const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(page.pageId ?? "")}?fields=${fields}&access_token=${encodeURIComponent(page.accessToken ?? "")}`;
          const response = await fetch(url, { method: "GET", cache: "no-store" });
          const json = (await response.json()) as {
            followers_count?: number;
            fan_count?: number;
            posts?: { data?: Array<{ created_time?: string }> };
            error?: { message?: string };
          };

          if (!response.ok || json.error) {
            return null;
          }

          const followersNum = json.followers_count ?? json.fan_count ?? 0;
          const fanCount = json.fan_count ?? followersNum;
          const reachNum = Math.max(0, Math.round(fanCount * 3.8));

          const today = new Date();
          const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const postsToday = (json.posts?.data ?? []).filter((post) => {
            if (!post.created_time) return false;
            return post.created_time.slice(0, 10) === todayKey;
          }).length;

          const avgReachPerPost = Math.max(100, Math.round((fanCount || followersNum) * 0.06));
          const posts = json.posts?.data ?? [];
          posts.forEach((post) => {
            if (!post.created_time) return;
            const postDate = new Date(post.created_time);
            const day = dayMap[postDate.getDay()];
            const row = chartAccumulator.get(day);
            if (!row) return;
            row.sent += 1;
            row.reached += avgReachPerPost;
            row.clicked += Math.max(1, Math.round(avgReachPerPost * 0.12));
          });

          return {
            id: page.id,
            followers: formatCompactNumber(followersNum),
            reach: formatCompactNumber(reachNum),
            postsToday,
            followersNum,
            reachNum,
          };
        } catch {
          return null;
        }
      })
    );

    const mapped = updated.filter((entry): entry is { id: number; followers: string; reach: string; postsToday: number; followersNum: number; reachNum: number } => entry !== null);
    if (mapped.length === 0) return false;

    const metricMap = new Map(mapped.map((entry) => [entry.id, entry]));
    setPages((prev) =>
      prev.map((page) => {
        const next = metricMap.get(page.id);
        if (!next) return page;
        return {
          ...page,
          followers: next.followers,
          reach: next.reach,
          postsToday: next.postsToday,
        };
      })
    );

    const totalFollowers = mapped.reduce((sum, item) => sum + item.followersNum, 0);
    const totalReach = mapped.reduce((sum, item) => sum + item.reachNum, 0);
    const postsToday = mapped.reduce((sum, item) => sum + item.postsToday, 0);
    const chart = dayOrder.map((day) => chartAccumulator.get(day) ?? { day, sent: 0, reached: 0, clicked: 0 });

    setDashboardRealtimeData({
      postsToday,
      totalReach,
      totalFollowers,
      failedPosts: failedAttempts,
      chart,
      recentPosts,
    });

    return true;
  }, [failedAttempts, formatCompactNumber, pages]);

  const syncRecentPostsFromFacebook = React.useCallback(async () => {
    const candidates = pages.filter((page) => page.pageId && page.accessToken);
    if (candidates.length === 0) return false;
    const recentPostFetchLimit = 100;
    const recentPostStoreLimit = 200;

    const fetched = await Promise.all(
      candidates.map(async (page) => {
        try {
          const fields = `posts.limit(${recentPostFetchLimit}){id,message,story,created_time,permalink_url}`;
          const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(page.pageId ?? "")}?fields=${fields}&access_token=${encodeURIComponent(page.accessToken ?? "")}`;
          const response = await fetch(url, { method: "GET", cache: "no-store" });
          const json = (await response.json()) as {
            posts?: { data?: Array<{ id?: string; message?: string; story?: string; created_time?: string; permalink_url?: string }> };
            error?: { message?: string };
          };

          if (!response.ok || json.error) return [] as LivePostItem[];

          return (json.posts?.data ?? []).map((post, index) => ({
            id: `${page.id}-${post.id ?? post.created_time ?? index}`,
            pageName: page.name,
            headline: (post.message ?? post.story ?? "Untitled post").slice(0, 120),
            template: "Live",
            status: "Posted" as QueueStatus,
            time: post.created_time ? new Date(post.created_time).toLocaleString() : "Unknown",
            permalink: post.permalink_url,
            createdAt: post.created_time,
            graphPostId: post.id,
          }));
        } catch {
          return [] as LivePostItem[];
        }
      })
    );

    const flattened = fetched.flat();
    if (flattened.length === 0) return false;

    flattened.sort((a, b) => {
      const left = a.createdAt ? Date.parse(a.createdAt) : 0;
      const right = b.createdAt ? Date.parse(b.createdAt) : 0;
      return right - left;
    });

    const nextRecentPosts = flattened.slice(0, recentPostStoreLimit);
    setRecentPosts(nextRecentPosts);
    setDashboardRealtimeData((prev) => ({ ...prev, recentPosts: nextRecentPosts }));
    return true;
  }, [pages]);

  const syncRecentCommentsFromFacebook = React.useCallback(async () => {
    const candidates = pages.filter((page) => page.pageId && page.accessToken);
    if (candidates.length === 0) return false;
    const commentFetchLimit = 50;

    const fetched = await Promise.all(
      candidates.map(async (page) => {
        try {
          const fields = `comments.limit(${commentFetchLimit}){id,message,created_time,from{name,username}}`;
          const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(page.pageId ?? "")}/feed?fields=${fields}&access_token=${encodeURIComponent(page.accessToken ?? "")}`;
          const response = await fetch(url, { method: "GET", cache: "no-store" });
          const json = (await response.json()) as {
            data?: Array<{ comments?: { data?: Array<{ id?: string; message?: string; created_time?: string; from?: { name?: string; username?: string } }> } }>;
            error?: { message?: string };
          };

          if (!response.ok || json.error) return [] as CommentItem[];

          const allComments: CommentItem[] = [];
          (json.data ?? []).forEach((post, postIndex) => {
            (post.comments?.data ?? []).forEach((comment, index) => {
              allComments.push({
                id: parseInt(comment.id?.split("_")[1] ?? `${postIndex}${index}`, 10),
                username: comment.from?.name ?? "Unknown",
                handle: comment.from?.username ?? "unknown",
                pageName: page.name,
                text: comment.message ?? "",
                sentiment: ((comment.message?.length ?? 0) > 100 || /negative|hate|bad|terrible/i.test(comment.message ?? "")) ? "Flagged" : "Safe",
                status: "Flagged" as CommentStatus,
              });
            });
          });
          return allComments;
        } catch {
          return [] as CommentItem[];
        }
      })
    );

    const flattened = fetched.flat();
    if (flattened.length === 0) {
      setLiveComments(mockComments);
      return false;
    }

    setLiveComments(flattened.slice(0, 100));
    return true;
  }, [pages]);

  React.useEffect(() => {
    const cached = localStorage.getItem("sync-cache");
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as SyncState;
      if (parsed.queue) setQueue(parsed.queue);
      // Do NOT restore pages from sync-cache — we manage them separately
      if (parsed.automations) setAutomations(parsed.automations);
      if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
    } catch {
      // ignore cache parse errors
    }
  }, []);

  const syncNow = React.useCallback(async () => {
    setSyncStatus("syncing");

    let webhookSuccess = false;
    let sheetSuccess = false;
    let facebookMetricsSuccess = false;
    let recentPostsSuccess = false;

    if (webhook) {
      try {
        const res = await fetch(webhook, { method: "GET" });
        if (!res.ok) throw new Error("Sync request failed");
        const data = (await res.json()) as Partial<SyncState>;

        if (Array.isArray(data.queue)) setQueue(data.queue as QueueItem[]);
        if (Array.isArray(data.pages)) setPages(data.pages as ManagedPage[]);
        if (Array.isArray(data.automations)) setAutomations(data.automations as AutomationItem[]);
        if (typeof data.lastUpdated === "string") setLastUpdated(data.lastUpdated);

        const newState: SyncState = {
          queue: Array.isArray(data.queue) ? (data.queue as QueueItem[]) : queue,
          pages: Array.isArray(data.pages) ? (data.pages as ManagedPage[]) : pages,
          automations: Array.isArray(data.automations) ? (data.automations as AutomationItem[]) : automations,
          lastUpdated: typeof data.lastUpdated === "string" ? data.lastUpdated : new Date().toISOString(),
        };
        localStorage.setItem("sync-cache", JSON.stringify(newState));
        webhookSuccess = true;
      } catch {
        webhookSuccess = false;
      }
    }

    sheetSuccess = await syncPagesFromGoogleSheet();
    facebookMetricsSuccess = await syncPageMetricsFromFacebook();
    recentPostsSuccess = await syncRecentPostsFromFacebook();
    await syncRecentCommentsFromFacebook();

    if (webhookSuccess || sheetSuccess || facebookMetricsSuccess || recentPostsSuccess) {
      setLastUpdated(new Date().toISOString());
      setLastSyncedAt(Date.now());
      setFailedAttempts(0);
      setSyncStatus("success");
      return;
    }

    setSyncStatus("error");
    setFailedAttempts((prev) => prev + 1);
  }, [automations, pages, queue, syncPageMetricsFromFacebook, syncPagesFromGoogleSheet, syncRecentPostsFromFacebook, webhook]);

  React.useEffect(() => {
    void syncNow();
    const timer = setInterval(() => {
      void syncNow();
    }, 30000);
    return () => clearInterval(timer);
  }, [syncNow]);

  const value: SyncContextValue = {
    syncData: { queue, pages, automations, lastUpdated },
    dashboardRealtimeData,
    recentPosts,
    liveComments,
    syncStatus,
    lastSyncedAt,
    failedAttempts,
    syncNow,
    setQueue,
    setPages,
    setAutomations,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

function DashboardOverview() {
  const { syncData, dashboardRealtimeData, recentPosts } = useSync();
  const [chartRange, setChartRange] = React.useState<"7 days" | "30 days" | "90 days">("7 days");

  const formatCompact = React.useCallback((value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
  }, []);

  const dynamicProgressStats = React.useMemo(() => ([
    { title: "Posts Today", value: String(dashboardRealtimeData.postsToday), growth: "+0%", progress: Math.min(100, dashboardRealtimeData.postsToday * 2), icon: Send },
    { title: "Total Reach", value: formatCompact(dashboardRealtimeData.totalReach), growth: "+0%", progress: Math.min(100, Math.round(dashboardRealtimeData.totalReach / 1000)), icon: TrendingUp },
    { title: "Total Followers", value: formatCompact(dashboardRealtimeData.totalFollowers), growth: "+0%", progress: Math.min(100, Math.round(dashboardRealtimeData.totalFollowers / 1000)), icon: Users },
    { title: "Failed Posts", value: String(dashboardRealtimeData.failedPosts), growth: dashboardRealtimeData.failedPosts > 0 ? "+0%" : "-100%", progress: Math.min(100, dashboardRealtimeData.failedPosts * 10), icon: AlertCircle },
  ]), [dashboardRealtimeData.failedPosts, dashboardRealtimeData.postsToday, dashboardRealtimeData.totalFollowers, dashboardRealtimeData.totalReach, formatCompact]);

  const topReachPage = React.useMemo(() => {
    const parseMetric = (value: string) => {
      const normalized = value.trim().toUpperCase();
      if (normalized.endsWith("M")) return Number.parseFloat(normalized.slice(0, -1)) * 1000000;
      if (normalized.endsWith("K")) return Number.parseFloat(normalized.slice(0, -1)) * 1000;
      return Number.parseFloat(normalized) || 0;
    };
    return [...syncData.pages].sort((a, b) => parseMetric(b.reach) - parseMetric(a.reach))[0] ?? null;
  }, [syncData.pages]);

  const dynamicInsights = React.useMemo(() => {
    const bestDay = [...dashboardRealtimeData.chart].sort((a, b) => b.reached - a.reached)[0];
    return [
      {
        title: "Best Day to Post",
        description: bestDay ? `${bestDay.day} gives highest estimated reach.` : "Waiting for real-time page post data.",
        icon: Clock,
        iconColor: "text-sky-300",
        iconBg: "bg-sky-500/15",
      },
      {
        title: "Page with Most Reach",
        description: topReachPage ? `${topReachPage.name} currently has the highest reach.` : "Waiting for page metrics.",
        icon: TrendingUp,
        iconColor: "text-teal-300",
        iconBg: "bg-teal-500/15",
      },
      {
        title: "Failed Post Alert",
        description: dashboardRealtimeData.failedPosts > 0 ? `${dashboardRealtimeData.failedPosts} sync failures detected.` : "No failures in latest sync cycle.",
        icon: AlertCircle,
        iconColor: "text-rose-300",
        iconBg: "bg-rose-500/15",
      },
      {
        title: "Automation Status",
        description: `${syncData.automations.filter((item) => item.status === "Running").length} workflows active, ${syncData.automations.filter((item) => item.status === "Stopped").length} paused for review.`,
        icon: Zap,
        iconColor: "text-amber-300",
        iconBg: "bg-amber-500/15",
      },
    ];
  }, [dashboardRealtimeData.chart, dashboardRealtimeData.failedPosts, syncData.automations, topReachPage]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dynamicProgressStats.map((item) => (
          <Card key={item.title} className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#0d9488]/15 text-[#0d9488] grid place-items-center">
                <item.icon className="h-5 w-5" />
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">{item.growth}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{item.title}</p>
            <p className="text-3xl font-black tracking-tight mb-4">{item.value}</p>
            <Progress value={item.progress} className="h-2 [&>div]:bg-[#0d9488]" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-9 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold">Posts Performance</h2>
            <div className="flex items-center gap-2">
              {(["7 days", "30 days", "90 days"] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setChartRange(range)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-colors",
                    chartRange === range ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border hover:bg-muted"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={315}>
            <LineChart data={dashboardRealtimeData.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" name="Posts Sent" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="reached" name="Reached" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="clicked" name="Clicked" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="xl:col-span-3 space-y-3 xl:sticky xl:top-24 h-fit">
          {dynamicInsights.map((item) => (
            <Card key={item.title} className="p-4 rounded-xl border border-white/10 bg-white/95 dark:bg-[#081328]">
              <div className="flex items-start gap-3">
                <div className={cn("h-9 w-9 rounded-lg grid place-items-center", item.iconBg)}>
                  <item.icon className={cn("h-4.5 w-4.5", item.iconColor)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
        <h3 className="text-xl font-bold mb-4">Recent Posts</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Page Name</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Headline</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Template</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Time</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((post) => (
                <tr key={post.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-3 px-3 font-medium">{post.pageName}</td>
                  <td className="py-3 px-3 text-sm">{post.headline}</td>
                  <td className="py-3 px-3 text-sm text-muted-foreground">{post.template}</td>
                  <td className="py-3 px-3">
                    <Badge className={cn("border", statusClassMap[post.status])}>{post.status}</Badge>
                  </td>
                  <td className="py-3 px-3 text-sm text-muted-foreground">{post.time}</td>
                  <td className="py-3 px-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (post.permalink) {
                          window.open(post.permalink, "_blank", "noreferrer");
                        }
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ContentQueuePage() {
  const [activeFilter, setActiveFilter] = React.useState<"All" | QueueStatus>("All");
  const [selectedPostId, setSelectedPostId] = React.useState<number | null>(null);
  const [copiedCaptionItemId, setCopiedCaptionItemId] = React.useState<number | null>(null);
  const [copiedPostItemId, setCopiedPostItemId] = React.useState<number | null>(null);
  const { posts, loading, error } = useContentQueue();
  const [queuePosts, setQueuePosts] = React.useState<QueueItem[]>([]);

  const mappedQueuePosts = React.useMemo<QueueItem[]>(() => {
    const palette = ["bg-cyan-400", "bg-violet-400", "bg-emerald-400", "bg-amber-400", "bg-rose-400"];

    return posts.map((post, index) => ({
      id: index + 1,
      page: post.page || "",
      imageUrl: post.imageUrl || "",
      headline: post.caption || "",
      caption: post.caption || "",
      template: "News",
      status:
        post.status === "scheduled"
          ? "Scheduled"
          : post.status === "posted"
            ? "Posted"
            : post.status === "failed"
              ? "Failed"
              : "Pending",
      scheduledTime: post.scheduledTime || "",
      pageColor: palette[index % palette.length],
    }));
  }, [posts]);

  React.useEffect(() => {
    setQueuePosts(mappedQueuePosts);
  }, [mappedQueuePosts]);

  React.useEffect(() => {
    if (queuePosts.length > 0 && selectedPostId === null) {
      setSelectedPostId(queuePosts[0].id);
    }
  }, [queuePosts, selectedPostId]);

  const filteredItems = React.useMemo(() => {
    if (activeFilter === "All") return queuePosts;
    return queuePosts.filter((item) => item.status === activeFilter);
  }, [activeFilter, queuePosts]);

  const retryFailedItem = (id: number) => {
    setQueuePosts((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Pending", scheduledTime: "Retrying now..." } : item)));
  };

  const deleteItem = (id: number) => {
    if (selectedPostId === id) {
      setSelectedPostId(null);
    }

    setQueuePosts((prev) => prev.filter((item) => item.id !== id));
  };

  React.useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedPostId(null);
      return;
    }

    const stillExists = filteredItems.some((item) => item.id === selectedPostId);
    if (!stillExists) {
      setSelectedPostId(filteredItems[0].id);
    }
  }, [filteredItems, selectedPostId]);

  const selectedPost = React.useMemo(
    () => queuePosts.find((item) => item.id === selectedPostId) ?? null,
    [queuePosts, selectedPostId]
  );

  const posterThemeByTemplate: Record<TemplateName, string> = {
    Breaking: "from-rose-500/25 via-orange-400/20 to-amber-300/20",
    News: "from-sky-500/25 via-cyan-400/20 to-teal-300/20",
    Fact: "from-emerald-500/25 via-lime-400/20 to-cyan-300/20",
    Opinion: "from-violet-500/25 via-indigo-400/20 to-sky-300/20",
    "Weekly Recap": "from-fuchsia-500/25 via-pink-400/20 to-orange-300/20",
  };

  const copyText = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  const copyCaption = async (item: QueueItem) => {
    try {
      await copyText(item.caption);

      setCopiedCaptionItemId(item.id);
      window.setTimeout(() => setCopiedCaptionItemId((prev) => (prev === item.id ? null : prev)), 1800);
    } catch {
      window.alert("Unable to copy caption. Please copy it manually.");
    }
  };

  const copyPost = async (item: QueueItem) => {
    try {
      if (!item.imageUrl) {
        throw new Error("Image URL missing");
      }

      const response = await fetch(item.imageUrl);
      if (!response.ok) {
        throw new Error("Image fetch failed");
      }

      const blob = await response.blob();
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        const mimeType = blob.type || "image/png";
        await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
      } else {
        await copyText(item.imageUrl);
      }

      setCopiedPostItemId(item.id);
      window.setTimeout(() => setCopiedPostItemId((prev) => (prev === item.id ? null : prev)), 1800);
    } catch {
      try {
        if (item.imageUrl) {
          await copyText(item.imageUrl);
          setCopiedPostItemId(item.id);
          window.setTimeout(() => setCopiedPostItemId((prev) => (prev === item.id ? null : prev)), 1800);
          return;
        }
      } catch {
        // fall through to alert
      }

      window.alert("Unable to copy post image. Please copy it manually.");
    }
  };

  const captionPreview = (caption: string) => (caption.length > 80 ? `${caption.slice(0, 80)}...` : caption);

  return (
    <div className="h-[calc(100vh-11.5rem)] flex flex-col overflow-hidden space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight">Content Queue</h2>
        <div className="flex flex-wrap items-center gap-2">
          {queueFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-sm transition-colors",
                activeFilter === filter ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 flex-1 min-h-0">
        <Card className="p-3 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] h-full overflow-hidden">
          <div className="h-full overflow-y-auto space-y-3 pr-1">
            {error && (
              <div className="text-red-400 text-sm px-4 py-2 bg-red-500/10 rounded mb-2">
                {error}
              </div>
            )}

            {loading && queuePosts.length === 0 ? (
              <div className="text-gray-400 text-sm px-4">Loading posts...</div>
            ) : (
              <>
                {filteredItems.map((item) => {
                  const isSelected = item.id === selectedPostId;

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPostId(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedPostId(item.id);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer",
                        isSelected
                          ? "border-[#0d9488] bg-[#0d9488]/10 shadow-[0_0_0_1px_rgba(13,148,136,0.35)]"
                          : "border-white/10 bg-white/50 dark:bg-[#071022] hover:border-[#0d9488]/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn("h-3 w-3 rounded-full mt-2 shrink-0", item.pageColor)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{item.page} • {item.template}</p>
                          <p className="font-semibold text-[14px] leading-5">{captionPreview(item.caption)}</p>
                          <p className="text-xs text-muted-foreground mt-2">Scheduled: {item.scheduledTime}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={(event) => event.stopPropagation()}>
                          <Badge className={cn("border", statusClassMap[item.status])}>{item.status}</Badge>
                          {item.status === "Failed" && (
                            <Button size="sm" variant="outline" onClick={() => retryFailedItem(item.id)} className="gap-1">
                              <RefreshCcw className="h-3.5 w-3.5" />
                              Retry
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <Card className="p-8 text-center rounded-xl border border-dashed border-white/15 bg-white/70 dark:bg-[#081328]/60">
                    <p className="text-muted-foreground">No posts found for this filter.</p>
                  </Card>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] h-full min-h-0 overflow-y-auto">
          {!selectedPost && (
            <div className="h-full flex items-center justify-center text-center px-6">
              <div>
                <p className="text-lg font-semibold mb-1">Select a post</p>
                <p className="text-sm text-muted-foreground">Click any post from the list to preview caption details here.</p>
              </div>
            </div>
          )}

          {selectedPost && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/65 dark:bg-[#061022] p-3 space-y-3">
                {selectedPost.imageUrl ? (
                  <img
                    src={selectedPost.imageUrl}
                    alt="Post preview"
                    style={{
                      width: "100%",
                      aspectRatio: "1080 / 1350",
                      objectFit: "cover",
                      borderRadius: "12px",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    className={cn(
                      "relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-white/15",
                      "bg-gradient-to-br",
                      posterThemeByTemplate[selectedPost.template]
                    )}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_78%_82%,rgba(20,184,166,0.28),transparent_38%)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/15" />
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-white/70 dark:bg-[#081327] p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Caption</p>
                  <p className="text-sm leading-6 whitespace-pre-wrap">{selectedPost.caption}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => copyPost(selectedPost)} className="gap-2 bg-sky-600 hover:bg-sky-700 text-white">
                  {copiedPostItemId === selectedPost.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedPostItemId === selectedPost.id ? "Post Copied" : "Copy Post"}
                </Button>
                <Button onClick={() => copyCaption(selectedPost)} className="gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white">
                  {copiedCaptionItemId === selectedPost.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedCaptionItemId === selectedPost.id ? "Caption Copied" : "Copy Caption"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function PostMonitorPage() {
  const { recentPosts, dashboardRealtimeData, syncStatus, syncData } = useSync();
  const [pageFilter, setPageFilter] = React.useState<string>("All");
  const [visibleCount, setVisibleCount] = React.useState(8);
  const [deletingPostId, setDeletingPostId] = React.useState<string | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = React.useState<string[]>([]);

  const visibleSourcePosts = React.useMemo(() => {
    if (hiddenPostIds.length === 0) return recentPosts;
    const hidden = new Set(hiddenPostIds);
    return recentPosts.filter((post) => !hidden.has(post.id));
  }, [hiddenPostIds, recentPosts]);

  const pageOptions = React.useMemo(() => ["All", ...Array.from(new Set(visibleSourcePosts.map((post) => post.pageName)))], [visibleSourcePosts]);

  const filteredPosts = React.useMemo(() => {
    if (pageFilter === "All") return visibleSourcePosts;
    return visibleSourcePosts.filter((post) => post.pageName === pageFilter);
  }, [pageFilter, visibleSourcePosts]);

  const deletePost = React.useCallback(async (post: LivePostItem) => {
    if (!post.graphPostId) {
      window.alert("This post cannot be deleted because post id is missing.");
      return;
    }

    const page = syncData.pages.find((item) => item.name === post.pageName && item.accessToken);
    if (!page?.accessToken) {
      window.alert("Missing page access token for this post.");
      return;
    }

    const confirmed = window.confirm(`Delete this post from ${post.pageName}?`);
    if (!confirmed) return;

    setDeletingPostId(post.id);
    try {
      const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(post.graphPostId)}?access_token=${encodeURIComponent(page.accessToken)}`;
      const response = await fetch(url, { method: "DELETE" });
      const json = (await response.json()) as { success?: boolean; error?: { message?: string } };

      if (!response.ok || json.success === false || json.error) {
        const message = json.error?.message || "Delete request failed.";
        window.alert(message);
        return;
      }

      setHiddenPostIds((prev) => (prev.includes(post.id) ? prev : [...prev, post.id]));
    } catch {
      window.alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingPostId(null);
    }
  }, [syncData.pages]);

  React.useEffect(() => {
    setVisibleCount(8);
  }, [pageFilter]);

  React.useEffect(() => {
    setVisibleCount((prev) => Math.min(Math.max(prev, 8), Math.max(filteredPosts.length, 8)));
  }, [filteredPosts.length]);

  const visiblePosts = React.useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
  const hasMorePosts = filteredPosts.length > visibleCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Post Monitor</h2>
          <p className="text-sm text-muted-foreground">Realtime posts from Google Sheet pages and Facebook Graph API.</p>
        </div>
        <Badge className={cn("border", syncStatus === "error" ? "bg-rose-500/15 text-rose-300 border-rose-500/35" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35")}>
          {syncStatus === "error" ? "Sync issue" : `${recentPosts.length} live posts`}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {pageOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPageFilter(option)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-sm transition-colors",
              pageFilter === option ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-black mt-1">{filteredPosts.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-muted-foreground">Reach</p>
            <p className="text-2xl font-black mt-1">{dashboardRealtimeData.totalReach}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-muted-foreground">Followers</p>
            <p className="text-2xl font-black mt-1">{dashboardRealtimeData.totalFollowers}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-muted-foreground">Failed Syncs</p>
            <p className="text-2xl font-black mt-1">{dashboardRealtimeData.failedPosts}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Page</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Post</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Time</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {visiblePosts.map((post) => (
                <tr key={post.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-3 px-3 font-medium">{post.pageName}</td>
                  <td className="py-3 px-3 text-sm">{post.headline}</td>
                  <td className="py-3 px-3 text-sm text-muted-foreground">{post.time}</td>
                  <td className="py-3 px-3">
                    <Badge className={cn("border", statusClassMap[post.status])}>{post.status}</Badge>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (post.permalink) {
                            window.open(post.permalink, "_blank", "noreferrer");
                          }
                        }}
                      >
                        Open Post
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/15"
                        onClick={() => void deletePost(post)}
                        disabled={deletingPostId === post.id}
                      >
                        {deletingPostId === post.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(visibleCount, filteredPosts.length)} of {filteredPosts.length} posts
            </p>
            <div className="flex items-center gap-2">
              {visibleCount > 8 && (
                <Button variant="ghost" size="sm" onClick={() => setVisibleCount(8)}>
                  View Less
                </Button>
              )}
              {hasMorePosts && (
                <Button variant="outline" size="sm" onClick={() => setVisibleCount((prev) => prev + 8)}>
                  View More (+8)
                </Button>
              )}
            </div>
          </div>
        )}

        {filteredPosts.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No live posts found for this filter yet.</div>
        )}
      </Card>
    </div>
  );
}

function ComposePostPage({ initialTemplate }: { initialTemplate?: TemplateName }) {
  const [selectedPage, setSelectedPage] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateName>(initialTemplate ?? "Breaking");
  const [headline, setHeadline] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [scheduleTime, setScheduleTime] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const { setQueue, syncData } = useSync();
  const previousPagesRef = React.useRef<string[]>([]);

  const pages = React.useMemo(() => {
    const dynamicPages = syncData.pages
      .map((page) => page.name.trim())
      .filter((name, index, arr) => name.length > 0 && arr.indexOf(name) === index);
    if (dynamicPages.length > 0) return dynamicPages;
    return ["TrendWire Daily", "Civic Pulse", "Science Snap"];
  }, [syncData.pages]);
  const templates: TemplateName[] = ["Breaking", "News", "Fact", "Opinion", "Weekly Recap"];
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  React.useEffect(() => {
    if (initialTemplate) setSelectedTemplate(initialTemplate);
  }, [initialTemplate]);

  React.useEffect(() => {
    if (pages.length === 0) {
      previousPagesRef.current = [];
      setSelectedPage("");
      return;
    }

    const previousPages = previousPagesRef.current;
    const addedPages = pages.filter((page) => !previousPages.includes(page));

    if (addedPages.length > 0) {
      setSelectedPage(addedPages[0]);
    } else if (!selectedPage || !pages.includes(selectedPage)) {
      setSelectedPage(pages[0]);
    }

    previousPagesRef.current = pages;
  }, [pages, selectedPage]);

  const submitToQueue = async () => {
    if (!selectedPage) {
      setToast({ type: "error", message: "Please select a page first." });
      return;
    }

    if (!headline.trim()) {
      setToast({ type: "error", message: "Headline is required." });
      return;
    }
    if (!caption.trim()) {
      setToast({ type: "error", message: "Caption is required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { page: selectedPage, template: selectedTemplate, headline: headline.trim(), caption: caption.trim(), scheduledTime: scheduleTime || null };
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Webhook request failed");
      }

      setQueue((prev) => [
        {
          id: Date.now(),
          page: selectedPage,
          headline: headline.trim(),
          caption: caption.trim(),
          template: selectedTemplate,
          status: scheduleTime ? "Scheduled" : "Pending",
          scheduledTime: scheduleTime || "Now",
          pageColor: selectedPage === "TrendWire Daily" ? "bg-cyan-400" : selectedPage === "Civic Pulse" ? "bg-violet-400" : "bg-emerald-400",
        },
        ...prev,
      ]);

      setToast({ type: "success", message: "Post sent to queue successfully." });
      setHeadline("");
      setCaption("");
      setScheduleTime("");
    } catch {
      setToast({ type: "error", message: "Failed to send post. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm shadow-xl",
            toast.type === "success" ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-200" : "bg-rose-500/20 border-rose-500/35 text-rose-200"
          )}
        >
          {toast.message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-3 p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
          <h2 className="text-2xl font-black tracking-tight mb-5">Compose Post</h2>

          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Select Page</Label>
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setSelectedPage(page)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm transition-colors",
                      selectedPage === page ? "border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10" : "border-border text-muted-foreground"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Template</Label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm transition-colors",
                      selectedTemplate === template ? "border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10" : "border-border text-muted-foreground"
                    )}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="headline">Headline</Label>
                <span className="text-xs text-muted-foreground">{headline.length}/80</span>
              </div>
              <Input id="headline" value={headline} maxLength={80} onChange={(e) => setHeadline(e.target.value)} placeholder="Enter a strong headline" className="h-12" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="caption">Caption</Label>
                <span className="text-xs text-muted-foreground">{caption.length}/300</span>
              </div>
              <textarea
                id="caption"
                rows={3}
                maxLength={300}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Write your caption..."
              />
            </div>

            <div>
              <Label htmlFor="schedule">Schedule Time</Label>
              <p className="text-xs text-muted-foreground mb-2">Leave empty to post now</p>
              <Input id="schedule" type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            </div>

            <Button onClick={submitToQueue} disabled={isSubmitting} className="w-full h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send to Queue
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </Card>

        <Card className="xl:col-span-2 p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
          <h3 className="text-lg font-bold mb-4">Live Preview</h3>
          <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0d9488]/20 text-[#0d9488] grid place-items-center font-bold">{(selectedPage || "?").charAt(0)}</div>
                <div>
                  <p className="font-semibold leading-5">{selectedPage || "No page selected"}</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
              <Badge className="border border-[#0d9488]/40 bg-[#0d9488]/15 text-[#2dd4bf]">{selectedTemplate}</Badge>
            </div>

            <p className="font-semibold text-base mb-2">{headline || "Your headline will appear here"}</p>
            <p className="text-sm text-muted-foreground leading-6">{caption || "Your caption preview updates in real time while you type."}</p>
          </div>
        </Card>
      </div>
    </>
  );
}

function TemplatesPage({ onUseTemplate }: { onUseTemplate: (template: TemplateName) => void }) {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<"All" | TemplateCategory>("All");

  const filteredTemplates = React.useMemo(() => {
    return templateItemsData.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight">Post Templates</h2>
        <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {templateCategoryFilters.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-sm",
                activeCategory === category ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTemplates.map((item) => (
          <motion.div key={item.id} whileHover={{ y: -2 }} className="group">
            <Card className="overflow-hidden rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
              <div className="relative aspect-[4/5] p-4 bg-gradient-to-br from-slate-900/80 to-slate-950/95">
                <div className={cn("h-full w-full rounded-xl border border-white/20 bg-gradient-to-br p-4 flex items-end", item.bg)}>
                  <p className="text-white text-xl font-bold leading-tight drop-shadow">{item.name}</p>
                </div>
                <div className="absolute inset-0 bg-[#020617]/70 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center p-4">
                  <div className="w-full max-w-[210px] space-y-2">
                    <Button className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white" onClick={() => onUseTemplate(templateCategoryToComposeTemplate[item.category])}>
                      Use Template
                    </Button>
                    <Button variant="outline" className="w-full border-white/40 text-white hover:bg-white/10">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="font-semibold text-base">{item.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge className="border" style={{ borderColor: item.accent, color: item.accent }}>
                    {item.category}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Used {item.usedCount} times</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MyPagesPage() {
  type PageAction = "create" | "update" | "delete";

  type PageStorageSubmission = {
    id: number;
    sentAt: string;
    ok: boolean;
    action: PageAction;
    responseMessage?: string;
    payload: {
      displayName: string;
      handle: string;
      pageId: string;
      fetchedName?: string;
      fetchedUsername?: string;
      followers?: string;
      reach?: string;
    };
  };

  type StoredPageRecord = {
    displayName: string;
    handle: string;
    pageId: string;
    accessToken: string;
    followers?: string;
    reach?: string;
    status?: PageStatus;
  };

  type PageStorageApiResponse = {
    ok: boolean;
    message?: string;
    pages?: StoredPageRecord[];
  };

  const { syncData, setPages } = useSync();
  const [showForm, setShowForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = React.useState({ displayName: "", handle: "", pageId: "", accessToken: "" });
  const [fetchedData, setFetchedData] = React.useState<{ name: string; username: string; followers: string; reach: string } | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submissionLog, setSubmissionLog] = React.useState<PageStorageSubmission[]>([]);

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5HtEOSeVhzjnPXEVistZ6jcrXogHL7V1jLk_zGKo5CCDMl5aVcGyIGhRCviVNfEI/exec";

  type AppsScriptRow = {
    page_id: string;
    page_name: string;
    access_token: string;
    status: string;
    added_date?: string;
  };

  const stableNumId = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return Math.abs(h) || 1;
  };

  const appsScriptToManagedPages = React.useCallback((rows: AppsScriptRow[]): ManagedPage[] => {
    const colors = ["bg-rose-500", "bg-blue-500", "bg-orange-500", "bg-purple-500", "bg-amber-500", "bg-teal-500"];
    return rows
      .filter((r) => r.page_id || r.page_name)
      .map((r, index) => ({
        id: stableNumId(r.page_id || r.page_name),
        name: r.page_name || `Page ${r.page_id}`,
        handle: r.page_name ? `@${r.page_name.toLowerCase().replace(/\s+/g, "")}` : "",
        pageId: r.page_id,
        accessToken: r.access_token,
        status: (r.status || "").toLowerCase() === "paused" ? ("Paused" as PageStatus) : ("Active" as PageStatus),
        color: colors[index % colors.length],
        postsToday: 0,
        reach: "0",
        followers: "0",
      }));
  }, []);

  const fetchAndSetPages = React.useCallback(async () => {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getAll`, { cache: "no-store" });
      if (!res.ok) return;
      const rows = await res.json() as AppsScriptRow[];
      if (Array.isArray(rows)) setPages(appsScriptToManagedPages(rows));
    } catch {
      // keep current state on network error
    }
  }, [appsScriptToManagedPages, setPages]);

  const pushSubmissionLog = React.useCallback((entry: PageStorageSubmission) => {
    setSubmissionLog((prev) => {
      return [entry, ...prev].slice(0, 20);
    });
  }, []);

  React.useEffect(() => {
    void fetchAndSetPages();
  }, [fetchAndSetPages]);

  // Poll every 30 s to stay in sync with Google Sheet
  React.useEffect(() => {
    const id = setInterval(() => void fetchAndSetPages(), 30_000);
    return () => clearInterval(id);
  }, [fetchAndSetPages]);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  // Auto-fetch when both fields look valid (debounced 900ms)
  React.useEffect(() => {
    const pid = form.pageId.trim();
    const tok = form.accessToken.trim();
    if (pid.length < 5 || tok.length < 10) {
      setFetchedData(null);
      setFetchError(null);
      return;
    }
    const timer = setTimeout(() => {
      void fetchPageData();
    }, 900);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pageId, form.accessToken]);

  const togglePause = (id: number) => {
    setPages((prev) => prev.map((page) => (page.id === id ? { ...page, status: page.status === "Active" ? "Paused" : "Active" } : page)));
  };

  const deletePage = async (id: number) => {
    if (!window.confirm("Remove this page from the dashboard?")) return;

    const page = syncData.pages.find((item) => item.id === id);
    const pageId = page?.pageId ?? "";
    const displayName = page?.name ?? "";

    if (!pageId) {
      setPages((prev) => prev.filter((p) => p.id !== id));
      return;
    }

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "delete", page_id: pageId }),
      });

      pushSubmissionLog({
        id: Date.now(),
        sentAt: new Date().toISOString(),
        ok: true,
        action: "delete",
        responseMessage: "Sent to Google Sheet",
        payload: { displayName, handle: page?.handle ?? "", pageId },
      });

      setToast({ type: "success", message: "Account deleted from Google Sheet." });
      // brief pause so Apps Script has time to commit the delete
      await new Promise<void>((r) => setTimeout(r, 1200));
      await fetchAndSetPages();
    } catch {
      setToast({ type: "error", message: "Delete request failed." });
      setPages((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const fetchPageData = async () => {
    if (!form.pageId.trim() || !form.accessToken.trim()) {
      setFetchError("Please enter both Facebook Page ID and Access Token first.");
      return;
    }
    setIsFetching(true);
    setFetchError(null);
    setFetchedData(null);
    try {
      const fields = "name,username,fan_count,followers_count";
      const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(form.pageId.trim())}?fields=${fields}&access_token=${encodeURIComponent(form.accessToken.trim())}`;
      const res = await fetch(url);
      const json = await res.json() as { name?: string; username?: string; fan_count?: number; followers_count?: number; error?: { message?: string } };
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? `Facebook API error (${res.status})`);
      }
      const followers = json.followers_count ?? json.fan_count ?? 0;
      const fanCount = json.fan_count ?? followers;
      const fmtFollowers = followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : String(followers);
      const fmtReach = fanCount >= 1000 ? `${Math.round(fanCount * 3.8 / 1000)}K` : String(Math.round(fanCount * 3.8));
      const data = { name: json.name ?? form.displayName, username: json.username ?? "", followers: fmtFollowers, reach: fmtReach };
      setFetchedData(data);
      setForm((prev) => ({ ...prev, displayName: prev.displayName || data.name, handle: prev.handle || (data.username ? `@${data.username}` : "") }));
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Could not fetch page data. Check your Page ID and Access Token.");
    } finally {
      setIsFetching(false);
    }
  };

  const registerPage = async () => {
    if (!form.displayName || !form.pageId || !form.accessToken) {
      setToast({ type: "error", message: "Display Name, Page ID and Access Token are required." });
      return;
    }
    setIsSubmitting(true);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "add",
          page_id: form.pageId.trim(),
          page_name: form.displayName.trim(),
          access_token: form.accessToken.trim(),
          status: "active",
          added_date: new Date().toISOString(),
        }),
      });

      pushSubmissionLog({
        id: Date.now(),
        sentAt: new Date().toISOString(),
        ok: true,
        action: "create",
        responseMessage: "Sent to Google Sheet",
        payload: {
          displayName: form.displayName.trim(),
          handle: form.handle || "",
          pageId: form.pageId.trim(),
        },
      });

      setForm({ displayName: "", handle: "", pageId: "", accessToken: "" });
      setFetchedData(null);
      setShowForm(false);
      setToast({ type: "success", message: "Account saved to Google Sheet." });
      // brief pause so Apps Script has time to commit the row
      await new Promise<void>((r) => setTimeout(r, 1200));
      await fetchAndSetPages();
    } catch {
      setToast({ type: "error", message: "Could not save to Google Sheet." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={cn("fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm shadow-xl",
            toast.type === "success" ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-200" : "bg-rose-500/20 border-rose-500/35 text-rose-200")}>
          {toast.message}
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight">Connected Pages</h2>
        <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2" onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="h-4 w-4" />
          Add New Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {syncData.pages.map((page) => (
          <Card key={page.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/95 dark:bg-[#081328]">
            <div className={cn("h-1.5", page.color)} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[16px]">{page.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{page.handle}</p>
                </div>
                <Badge className={cn("border", page.status === "Active" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" : "bg-amber-500/15 text-amber-300 border-amber-500/35")}>
                  {page.status}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground mt-2">
                <p className="truncate">Page ID: {page.pageId || "-"}</p>
                <p className="truncate">Access Token: {page.accessToken ? `${page.accessToken.slice(0, 8)}...` : "-"}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 my-4">
                <div className="rounded-lg border border-white/10 p-2"><p className="text-[11px] text-muted-foreground">Posts</p><p className="font-semibold mt-1">{page.postsToday}</p></div>
                <div className="rounded-lg border border-white/10 p-2"><p className="text-[11px] text-muted-foreground">Reach</p><p className="font-semibold mt-1">{page.reach}</p></div>
                <div className="rounded-lg border border-white/10 p-2"><p className="text-[11px] text-muted-foreground">Followers</p><p className="font-semibold mt-1">{page.followers}</p></div>
              </div>
              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline" onClick={() => togglePause(page.id)}>{page.status === "Active" ? "Pause" : "Resume"}</Button>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost"><SlidersHorizontal className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => void deletePage(page.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {syncData.pages.length === 0 && (
        <Card className="p-10 rounded-2xl border border-dashed border-white/20 text-center bg-white/70 dark:bg-[#081328]/60">
          <div className="h-14 w-14 rounded-2xl bg-[#0d9488]/15 text-[#2dd4bf] grid place-items-center mx-auto mb-4">
            <Users className="h-7 w-7" />
          </div>
          <p className="font-bold text-lg mb-1">No pages connected yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add your Facebook Page ID and Access Token below to get started.</p>
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Your First Page
          </Button>
        </Card>
      )}

      <Card className="rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
        <button type="button" onClick={() => setShowForm((prev) => !prev)} className="w-full flex items-center justify-between p-4 text-left">
          <span className="font-semibold">+ Add New Page</span>
          <ChevronRight className={cn("h-4 w-4 transition-transform", showForm && "rotate-90")} />
        </button>

        {showForm && (
          <div className="border-t border-white/10 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Display Name</Label>
                <Input placeholder="e.g. TrendWire Daily" value={form.displayName} onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Handle (optional — auto-filled)</Label>
                <Input placeholder="e.g. @trendwiredaily" value={form.handle} onChange={(e) => setForm((prev) => ({ ...prev, handle: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Facebook Page ID</Label>
                <Input placeholder="e.g. 123456789012345" value={form.pageId} onChange={(e) => setForm((prev) => ({ ...prev, pageId: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Page Access Token</Label>
                <Input type="password" placeholder="EAAb..." value={form.accessToken} onChange={(e) => setForm((prev) => ({ ...prev, accessToken: e.target.value }))} />
              </div>
            </div>

            {isFetching && (
              <div className="flex items-center gap-2 text-sky-300 text-sm">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-sky-300 border-t-transparent shrink-0" />
                Auto-fetching Facebook page data...
              </div>
            )}
            {!isFetching && (
              <Button variant="outline" className="gap-2 border-sky-500/50 text-sky-300 hover:bg-sky-500/10"
                onClick={() => void fetchPageData()}
                disabled={!form.pageId.trim() || !form.accessToken.trim()}>
                <RefreshCcw className="h-4 w-4" />
                {fetchedData ? "Re-fetch Page Data" : "Fetch Page Data from Facebook"}
              </Button>
            )}

            {fetchError && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{fetchError}</p>
              </div>
            )}

            {fetchedData && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Page data fetched successfully
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">Page Name</p>
                    <p className="text-sm font-semibold truncate">{fetchedData.name}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">Followers</p>
                    <p className="text-sm font-bold text-sky-300">{fetchedData.followers}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">Est. Reach</p>
                    <p className="text-sm font-bold text-teal-300">{fetchedData.reach}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="pt-1">
              <Button onClick={() => void registerPage()}
                disabled={isSubmitting || !form.displayName || !form.pageId || !form.accessToken}
                className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2">
                {isSubmitting ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-white border-t-transparent" />Registering...</>
                ) : "Register Page"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Hosted Storage</h3>
          <Badge className="border border-white/20 bg-white/5 text-xs text-muted-foreground">
            {submissionLog.length} stored
          </Badge>
        </div>

        {submissionLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hosted storage actions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {submissionLog.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold truncate">{entry.payload.displayName || "Unnamed page"}</p>
                  <Badge className={cn("border", entry.ok ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" : "bg-amber-500/15 text-amber-300 border-amber-500/35")}>
                    {entry.ok ? `${entry.action} sent` : `${entry.action} cached`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">Page ID: {entry.payload.pageId || "-"}</p>
                {entry.responseMessage && <p className="text-xs text-muted-foreground truncate">Storage: {entry.responseMessage.slice(0, 140)}</p>}
                <p className="text-xs text-muted-foreground">{new Date(entry.sentAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AutomationsPage() {
  type N8nWorkflow = {
    id: string;
    name: string;
    active: boolean;
  };

  const [workflows, setWorkflows] = React.useState<N8nWorkflow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<{ id: string; action: "start" | "stop" } | null>(null);

  const savedConnectionsConfig = useConnectionsConfig();
  const apiConfig = React.useMemo(() => resolveN8nApiConfig(savedConnectionsConfig), [savedConnectionsConfig]);
  const { apiBaseUrls, apiKey } = apiConfig;

  const getApiError = async (response: Response): Promise<string> => {
    const fallback = `Request failed (${response.status})`;

    try {
      const text = await response.text();
      if (!text.trim()) {
        return fallback;
      }

      try {
        const parsed = JSON.parse(text) as { message?: unknown };
        if (typeof parsed.message === "string" && parsed.message.trim()) {
          return parsed.message;
        }
      } catch {
        // Keep plain-text response when body is not JSON.
      }

      return `${fallback}: ${text.slice(0, 140)}`;
    } catch {
      return fallback;
    }
  };

  const parseWorkflows = (payload: unknown): N8nWorkflow[] => {
    const source = payload as { data?: unknown };
    const list = Array.isArray(payload) ? payload : Array.isArray(source.data) ? source.data : [];

    return list
      .map((item) => {
        const workflow = item as { id?: unknown; name?: unknown; active?: unknown };
        const id = String(workflow.id ?? "").trim();
        if (!id) {
          return null;
        }

        return {
          id,
          name: String(workflow.name ?? "Untitled workflow"),
          active: Boolean(workflow.active),
        };
      })
      .filter((item): item is N8nWorkflow => item !== null);
  };

  const fetchWorkflows = React.useCallback(async () => {
    if (!apiKey) {
      setError("Missing n8n API key. Add VITE_N8N_API_KEY or set it in Connections page.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let payload: unknown = null;
      let latestError = "Could not load workflows.";

      for (const apiBaseUrl of apiBaseUrls) {
        try {
          const response = await fetchWithTimeout(`${apiBaseUrl}/workflows`, {
            method: "GET",
            mode: "cors",
            headers: {
              "X-N8N-API-KEY": apiKey,
            },
          });

          if (!response.ok) {
            latestError = await getApiError(response);
            continue;
          }

          const rawText = await readResponseText(response);
          if (looksLikeHtml(rawText)) {
            latestError = `HTML response from ${apiBaseUrl}/workflows.`;
            continue;
          }

          try {
            payload = JSON.parse(rawText) as unknown;
          } catch {
            latestError = `Non-JSON response from ${apiBaseUrl}/workflows.`;
            continue;
          }
          break;
        } catch (endpointError) {
          latestError = endpointError instanceof Error ? endpointError.message : latestError;
        }
      }

      if (!payload) {
        throw new Error(latestError);
      }

      setWorkflows(parseWorkflows(payload));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load workflows.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrls, apiKey]);

  React.useEffect(() => {
    void fetchWorkflows();
  }, [fetchWorkflows]);

  const setWorkflowState = async (workflow: N8nWorkflow, nextAction: "start" | "stop") => {
    if (!apiKey) {
      setError("Missing n8n API key. Add VITE_N8N_API_KEY or set it in Connections page.");
      return;
    }

    setActionLoading({ id: workflow.id, action: nextAction });
    setError(null);

    try {
      let completed = false;
      let latestError = `Could not ${nextAction} workflow.`;

      for (const apiBaseUrl of apiBaseUrls) {
        try {
          const endpoint = `${apiBaseUrl}/workflows/${encodeURIComponent(workflow.id)}/${nextAction === "start" ? "activate" : "deactivate"}`;
          const response = await fetchWithTimeout(endpoint, {
            method: "POST",
            mode: "cors",
            headers: {
              "X-N8N-API-KEY": apiKey,
            },
          });

          if (!response.ok) {
            latestError = await getApiError(response);
            continue;
          }

          completed = true;
          break;
        } catch (endpointError) {
          latestError = endpointError instanceof Error ? endpointError.message : latestError;
        }
      }

      if (!completed) {
        throw new Error(latestError);
      }

      setWorkflows((prev) => prev.map((item) => (item.id === workflow.id ? { ...item, active: nextAction === "start" } : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : `Could not ${nextAction} workflow.`;
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black tracking-tight">Automation Workflows</h2>

      {error && (
        <Card className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-200 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => void fetchWorkflows()} className="border-rose-500/60 text-rose-200 hover:bg-rose-500/20">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card className="p-5 rounded-xl border border-white/10 bg-white/95 dark:bg-[#081328]">
          <p className="text-sm text-muted-foreground">Loading automations...</p>
        </Card>
      )}

      <div className="space-y-3">
        {!isLoading && workflows.filter((w) => w.active).map((workflow) => (
          <Card key={workflow.id} className="p-4 rounded-xl border border-white/10 bg-white/95 dark:bg-[#081328]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn("h-10 w-10 rounded-lg grid place-items-center", workflow.active ? "bg-[#0d9488]/20 text-[#2dd4bf]" : "bg-slate-500/15 text-slate-300")}>
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{workflow.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge className={cn("border", workflow.active ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" : "bg-amber-500/15 text-amber-300 border-amber-500/35")}>
                  {workflow.active ? "Running" : "Stopped"}
                </Badge>
                <Button
                  variant="outline"
                  className="border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => void setWorkflowState(workflow, "start")}
                  disabled={workflow.active || (actionLoading?.id === workflow.id && actionLoading.action === "start")}
                >
                  {actionLoading?.id === workflow.id && actionLoading.action === "start" ? "Starting..." : "Start"}
                </Button>
                <Button
                  variant="outline"
                  className="border-rose-500/60 text-rose-300 hover:bg-rose-500/10"
                  onClick={() => void setWorkflowState(workflow, "stop")}
                  disabled={!workflow.active || (actionLoading?.id === workflow.id && actionLoading.action === "stop")}
                >
                  {actionLoading?.id === workflow.id && actionLoading.action === "stop" ? "Stopping..." : "Stop"}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!isLoading && workflows.filter((w) => w.active).length === 0 && !error && (
          <Card className="p-5 rounded-xl border border-white/10 bg-white/95 dark:bg-[#081328]">
            <p className="text-sm text-muted-foreground">No active (published) workflows found.</p>
          </Card>
        )}
      </div>

      <button
        type="button"
        className="group w-full rounded-2xl border-2 border-dashed border-white/30 bg-white/5 p-8 text-center transition-colors hover:border-teal-300/70 hover:bg-white/10 cursor-pointer"
      >
        <p className="font-semibold text-lg text-foreground/90 group-hover:text-white">Add New Automation</p>
      </button>
    </div>
  );
}
function WorkflowsPage() {
  type N8nWorkflow = { id: string; name: string; active: boolean; updatedAt?: string; tags?: { id: string; name: string }[] };

  const [workflows, setWorkflows] = React.useState<N8nWorkflow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"All" | "Published" | "Unpublished">("All");
  const [search, setSearch] = React.useState("");

  const savedConnectionsConfig = useConnectionsConfig();
  const apiConfig = React.useMemo(() => resolveN8nApiConfig(savedConnectionsConfig), [savedConnectionsConfig]);
  const { apiBaseUrls, apiKey } = apiConfig;

  const fetchWorkflows = React.useCallback(async () => {
    if (!apiKey) { setError("Missing n8n API key. Add VITE_N8N_API_KEY or set it in Connections page."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      let payload: { data?: unknown[] } | unknown[] | null = null;
      let latestError = "Could not load workflows.";

      for (const apiBaseUrl of apiBaseUrls) {
        try {
          const response = await fetchWithTimeout(`${apiBaseUrl}/workflows`, { method: "GET", mode: "cors", headers: { "X-N8N-API-KEY": apiKey } });
          if (!response.ok) {
            const t = await readResponseText(response);
            latestError = `${response.status}: ${t.slice(0, 120)}`;
            continue;
          }

          const rawText = await readResponseText(response);
          if (looksLikeHtml(rawText)) {
            latestError = `HTML response from ${apiBaseUrl}/workflows.`;
            continue;
          }

          try {
            payload = JSON.parse(rawText) as { data?: unknown[] } | unknown[];
          } catch {
            latestError = `Non-JSON response from ${apiBaseUrl}/workflows.`;
            continue;
          }
          break;
        } catch (endpointError) {
          latestError = endpointError instanceof Error ? endpointError.message : latestError;
        }
      }

      if (!payload) {
        throw new Error(latestError);
      }

      const list = Array.isArray(payload) ? payload : Array.isArray((payload as { data?: unknown[] }).data) ? (payload as { data: unknown[] }).data : [];
      const parsed: N8nWorkflow[] = [];
      list.forEach((item) => {
        const w = item as { id?: unknown; name?: unknown; active?: unknown; updatedAt?: unknown; tags?: unknown };
        const id = String(w.id ?? "").trim();
        if (!id) return;
        parsed.push({
          id,
          name: String(w.name ?? "Untitled"),
          active: Boolean(w.active),
          updatedAt: w.updatedAt ? String(w.updatedAt) : undefined,
          tags: Array.isArray(w.tags) ? (w.tags as { id: string; name: string }[]) : [],
        });
      });
      setWorkflows(parsed);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load workflows."); }
    finally { setIsLoading(false); }
  }, [apiBaseUrls, apiKey]);

  React.useEffect(() => { void fetchWorkflows(); }, [fetchWorkflows]);

  const toggleWorkflow = async (workflow: N8nWorkflow) => {
    if (!apiKey) {
      setError("Missing n8n API key. Add VITE_N8N_API_KEY or set it in Connections page.");
      return;
    }
    const action = workflow.active ? "deactivate" : "activate";
    setActionLoading(workflow.id);
    try {
      let completed = false;
      let latestError = `Could not ${action} workflow.`;

      for (const apiBaseUrl of apiBaseUrls) {
        try {
          const response = await fetchWithTimeout(`${apiBaseUrl}/workflows/${encodeURIComponent(workflow.id)}/${action}`, { method: "POST", mode: "cors", headers: { "X-N8N-API-KEY": apiKey } });
          if (!response.ok) {
            const t = await response.text();
            latestError = `${response.status}: ${t.slice(0, 120)}`;
            continue;
          }
          completed = true;
          break;
        } catch (endpointError) {
          latestError = endpointError instanceof Error ? endpointError.message : latestError;
        }
      }

      if (!completed) {
        throw new Error(latestError);
      }

      setWorkflows((prev) => prev.map((w) => w.id === workflow.id ? { ...w, active: !w.active } : w));
    } catch (err) { setError(err instanceof Error ? err.message : `Could not ${action} workflow.`); }
    finally { setActionLoading(null); }
  };

  const visible = workflows
    .filter((w) => filter === "All" || (filter === "Published" ? w.active : !w.active))
    .filter((w) => !search || w.name.toLowerCase().includes(search.toLowerCase()));

  const publishedCount = workflows.filter((w) => w.active).length;
  const unpublishedCount = workflows.filter((w) => !w.active).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Workflows</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading..." : `${publishedCount} published · ${unpublishedCount} unpublished`}
          </p>
        </div>
        <button type="button" onClick={() => void fetchWorkflows()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <Card className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-200 text-sm"><AlertCircle className="h-4 w-4" /><span>{error}</span></div>
            <Button variant="outline" size="sm" onClick={() => void fetchWorkflows()} className="border-rose-500/60 text-rose-200 hover:bg-rose-500/20">Retry</Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workflows..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {(["All", "Published", "Unpublished"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-full border text-sm transition-colors",
                filter === f ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <Card className="p-5 rounded-xl border border-white/10 bg-white/95 dark:bg-[#081328]">
          <p className="text-sm text-muted-foreground">Loading workflows...</p>
        </Card>
      )}

      <div className="space-y-3">
        {!isLoading && visible.map((workflow) => (
          <Card key={workflow.id} className="p-4 rounded-xl border border-white/10 bg-white/95 dark:bg-[#081328] hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", workflow.active ? "bg-[#0d9488]/20 text-[#2dd4bf]" : "bg-slate-500/15 text-slate-400")}>
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{workflow.name}</p>
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {workflow.tags.map((tag) => (
                        <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10">{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={cn("border", workflow.active ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" : "bg-amber-500/15 text-amber-300 border-amber-500/35")}>
                  {workflow.active ? "Published" : "Unpublished"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void toggleWorkflow(workflow)}
                  disabled={actionLoading === workflow.id}
                  className={cn(workflow.active ? "border-rose-500/60 text-rose-300 hover:bg-rose-500/10" : "border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10")}>
                  {actionLoading === workflow.id ? "Updating..." : workflow.active ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!isLoading && visible.length === 0 && !error && (
          <Card className="p-8 rounded-xl border border-dashed border-white/20 text-center bg-white/80 dark:bg-[#081328]/70">
            <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">No workflows found</p>
            <p className="text-sm text-muted-foreground mt-1">{search ? "Try a different search term" : `No ${filter.toLowerCase()} workflows`}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function CommentModerationPage() {
  const { liveComments } = useSync();
  const [activeFilter, setActiveFilter] = React.useState<ModerationFilter>("All");
  const [pageFilter, setPageFilter] = React.useState<string>("All");
  const [comments, setComments] = React.useState<CommentItem[]>(liveComments);
  const [removingId, setRemovingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setComments(liveComments);
  }, [liveComments]);

  const pageOptions = React.useMemo(() => ["All", ...Array.from(new Set(liveComments.map((c) => c.pageName)))], [liveComments]);

  const filteredByPageComments = React.useMemo(() => {
    if (pageFilter === "All") return comments;
    return comments.filter((item) => item.pageName === pageFilter);
  }, [pageFilter, comments]);

  const unreadCount = filteredByPageComments.filter((item) => item.status === "Flagged").length;

  const visibleComments = React.useMemo(() => {
    if (activeFilter === "All") return filteredByPageComments;
    return filteredByPageComments.filter((item) => item.status === activeFilter);
  }, [activeFilter, filteredByPageComments]);

  const takeAction = (id: number, action: "Approved" | "Blocked") => {
    setRemovingId(id);
    setTimeout(() => {
      setComments((prev) => prev.map((item) => (item.id === id ? { ...item, status: action } : item)));
      setRemovingId(null);
    }, 240);
  };

  const filterTabs: ModerationFilter[] = ["All", "Flagged", "Approved", "Blocked"];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black tracking-tight">Comment Moderation</h2>
          <Badge className="bg-[#0d9488]/20 text-[#5eead4] border border-[#0d9488]/40">{unreadCount}</Badge>
        </div>
        <Badge className={cn("border", liveComments.length > 0 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" : "bg-gray-500/15 text-gray-300 border-gray-500/35")}>
          {liveComments.length} live comments
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {pageOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPageFilter(option)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-sm transition-colors",
              pageFilter === option ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveFilter(tab)} className={cn("px-3 py-1.5 rounded-full border text-sm", activeFilter === tab ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border")}>{tab}</button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleComments.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className={cn(item.status === "Flagged" && "border-l-2 border-l-rose-500")}>
              <Card className="p-4 rounded-xl border border-white/10 bg-white/95 dark:bg-[#081328]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-slate-500/20 text-slate-200 grid place-items-center shrink-0">{item.username.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{item.username}</p>
                        <p className="text-xs text-muted-foreground">{item.handle}</p>
                        <Badge className="border border-white/20 bg-white/5 text-xs">{item.pageName}</Badge>
                      </div>
                      <p className="text-[13px] text-muted-foreground mt-1">{item.text}</p>
                      <Badge className={cn("mt-2 border", item.sentiment === "Safe" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" : "bg-rose-500/15 text-rose-300 border-rose-500/35")}>
                        {item.sentiment}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => takeAction(item.id, "Approved")} disabled={removingId === item.id}>Keep</Button>
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => takeAction(item.id, "Blocked")} disabled={removingId === item.id}>Block</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {activeFilter === "Flagged" && visibleComments.length === 0 && (
        <Card className="p-9 rounded-xl border border-dashed border-white/20 text-center bg-white/80 dark:bg-[#081328]/70">
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
          <p className="font-semibold">No flagged comments</p>
        </Card>
      )}
    </div>
  );
}

function PageAnalyticsPage() {
  const { syncData, recentPosts, syncStatus, lastSyncedAt } = useSync();
  const pageNames = React.useMemo(() => {
    const fromPages = syncData.pages.map((page) => page.name);
    const fromPosts = Array.from(new Set(recentPosts.map((post) => post.pageName)));
    return Array.from(new Set([...fromPages, ...fromPosts]));
  }, [recentPosts, syncData.pages]);

  const [selectedPage, setSelectedPage] = React.useState(pageNames[0] ?? "");
  const [growthRange, setGrowthRange] = React.useState<"7 days" | "30 days" | "6 months">("6 months");

  React.useEffect(() => {
    if (pageNames.length > 0 && !pageNames.includes(selectedPage)) {
      setSelectedPage(pageNames[0]);
    }
  }, [pageNames, selectedPage]);

  const parseMetric = React.useCallback((value: string): number => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return 0;
    if (normalized.endsWith("M")) return Math.round(Number.parseFloat(normalized.slice(0, -1)) * 1000000);
    if (normalized.endsWith("K")) return Math.round(Number.parseFloat(normalized.slice(0, -1)) * 1000);
    return Number.parseFloat(normalized) || 0;
  }, []);

  const selectedPageMetrics = React.useMemo(
    () => syncData.pages.find((page) => page.name === selectedPage),
    [selectedPage, syncData.pages]
  );

  const selectedPagePosts = React.useMemo(() => {
    return recentPosts
      .filter((post) => post.pageName === selectedPage)
      .sort((a, b) => {
        const left = a.createdAt ? Date.parse(a.createdAt) : 0;
        const right = b.createdAt ? Date.parse(b.createdAt) : 0;
        return right - left;
      });
  }, [recentPosts, selectedPage]);

  const now = Date.now();
  const inLastDays = React.useCallback(
    (days: number) =>
      selectedPagePosts.filter((post) => {
        const ts = post.createdAt ? Date.parse(post.createdAt) : Number.NaN;
        if (Number.isNaN(ts)) return false;
        return ts >= now - days * 24 * 60 * 60 * 1000;
      }).length,
    [now, selectedPagePosts]
  );

  const postsThisMonth = React.useMemo(() => {
    const current = new Date();
    return selectedPagePosts.filter((post) => {
      if (!post.createdAt) return false;
      const postDate = new Date(post.createdAt);
      return postDate.getMonth() === current.getMonth() && postDate.getFullYear() === current.getFullYear();
    }).length;
  }, [selectedPagePosts]);

  const followersNumber = parseMetric(selectedPageMetrics?.followers ?? "0");
  const reachNumber = parseMetric(selectedPageMetrics?.reach ?? "0");
  const followersDisplay = selectedPageMetrics?.followers ?? "0";
  const reachDisplay = selectedPageMetrics?.reach ?? "0";
  const postsLast7 = inLastDays(7);
  const postsLast30 = inLastDays(30);

  const syncStatusLabel =
    syncStatus === "success"
      ? "Live"
      : syncStatus === "syncing"
        ? "Syncing"
        : syncStatus === "error"
          ? "Error"
          : "Idle";

  const syncStatusClass =
    syncStatus === "success"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
      : syncStatus === "syncing"
        ? "bg-sky-500/15 text-sky-300 border-sky-500/35"
        : syncStatus === "error"
          ? "bg-rose-500/15 text-rose-300 border-rose-500/35"
          : "bg-slate-500/15 text-slate-300 border-slate-500/35";

  const lastSyncedLabel =
    lastSyncedAt === null
      ? "Not synced yet"
      : `${Math.max(0, Math.floor((Date.now() - lastSyncedAt) / 1000))}s ago`;

  const metricCards = [
    { label: "Followers", value: followersDisplay, icon: Users, meta: followersNumber > 0 ? "Live" : "No data", progress: Math.min(100, Math.round(followersNumber / 500)) },
    { label: "Total Reach", value: reachDisplay, icon: TrendingUp, meta: reachNumber > 0 ? "Live" : "No data", progress: Math.min(100, Math.round(reachNumber / 1000)) },
    { label: "Posts (30 days)", value: String(postsLast30), icon: FileText, meta: `${postsLast7} in 7d`, progress: Math.min(100, postsLast30 * 5) },
    { label: "Sync Status", value: syncStatusLabel, icon: Zap, meta: lastSyncedLabel, progress: syncStatus === "success" ? 100 : syncStatus === "syncing" ? 70 : syncStatus === "error" ? 20 : 0 },
  ];

  const activityData = React.useMemo(() => {
    const makeKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    if (growthRange === "6 months") {
      const monthBins: Array<{ month: string; posts: number }> = [];
      const cursor = new Date();
      cursor.setDate(1);
      for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
        monthBins.push({
          month: d.toLocaleDateString(undefined, { month: "short" }),
          posts: 0,
        });
      }

      selectedPagePosts.forEach((post) => {
        if (!post.createdAt) return;
        const d = new Date(post.createdAt);
        const idx = monthBins.findIndex((bin) => bin.month === d.toLocaleDateString(undefined, { month: "short" }));
        if (idx >= 0) monthBins[idx].posts += 1;
      });

      return monthBins;
    }

    const days = growthRange === "30 days" ? 30 : 7;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const bins: Array<{ label: string; posts: number; key: string }> = Array.from({ length: days }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return {
        label: days === 7 ? day.toLocaleDateString(undefined, { weekday: "short" }) : day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        posts: 0,
        key: makeKey(day),
      };
    });

    const map = new Map(bins.map((bin) => [bin.key, bin]));
    selectedPagePosts.forEach((post) => {
      if (!post.createdAt) return;
      const d = new Date(post.createdAt);
      const key = makeKey(d);
      const bin = map.get(key);
      if (bin) {
        bin.posts += 1;
      }
    });

    return bins.map((bin) => ({ label: bin.label, posts: bin.posts }));
  }, [growthRange, selectedPagePosts]);

  const statusDistribution = React.useMemo(() => {
    const counts: Record<QueueStatus, number> = {
      Pending: 0,
      Scheduled: 0,
      Posted: 0,
      Failed: 0,
    };

    selectedPagePosts.forEach((post) => {
      counts[post.status] += 1;
    });

    return [
      { label: "Posted", count: counts.Posted },
      { label: "Scheduled", count: counts.Scheduled },
      { label: "Pending", count: counts.Pending },
      { label: "Failed", count: counts.Failed },
    ];
  }, [selectedPagePosts]);

  const topPosts = selectedPagePosts.slice(0, 8);

  if (pageNames.length === 0) {
    return (
      <Card className="p-8 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] text-center">
        <h3 className="text-xl font-bold">No connected pages yet</h3>
        <p className="text-sm text-muted-foreground mt-2">Connect at least one Facebook page in My Pages to see live analytics here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-5 border-b border-white/10">
        {pageNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSelectedPage(name)}
            className={cn("pb-2 text-sm font-medium border-b-2 transition-colors", selectedPage === name ? "border-[#0d9488] text-[#2dd4bf]" : "border-transparent text-muted-foreground")}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((item) => (
          <Card key={item.label} className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#0d9488]/15 text-[#0d9488] grid place-items-center">
                <item.icon className="h-5 w-5" />
              </div>
              <Badge className={cn("border", item.label === "Sync Status" ? syncStatusClass : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35")}>{item.meta}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
            <p className="text-3xl font-black tracking-tight mb-4">{item.value}</p>
            <Progress value={item.progress} className="h-2 [&>div]:bg-[#0d9488]" />
          </Card>
        ))}
      </div>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold">Live Post Activity</h3>
          <div className="flex gap-2">
            {(["7 days", "30 days", "6 months"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setGrowthRange(r)} className={cn("px-3 py-1.5 rounded-lg border text-sm", growthRange === r ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-border")}>{r}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey={growthRange === "6 months" ? "month" : "label"} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="posts" stroke="#0d9488" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
        <h3 className="text-xl font-bold mb-4">Post Status Distribution</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={statusDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip formatter={(value) => [`${value}`, "Posts"]} />
            <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
        <h3 className="text-xl font-bold mb-4">Latest Live Posts</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Headline</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Template</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground">Published</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post) => (
                <tr key={post.id} className="border-b border-white/10">
                  <td className="py-3 px-3">{post.headline}</td>
                  <td className="py-3 px-3 text-muted-foreground">{post.template}</td>
                  <td className="py-3 px-3">
                    <Badge className={cn("border", statusClassMap[post.status])}>{post.status}</Badge>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{post.time}</td>
                </tr>
              ))}
              {topPosts.length === 0 && (
                <tr>
                  <td className="py-5 px-3 text-muted-foreground" colSpan={4}>No live posts found for this page yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ConnectionsPage() {
  const [config, setConfig] = React.useState<ConnectionsConfig>(() => {
    const saved = localStorage.getItem("connections-config");
    if (!saved) return defaultConnections;
    try {
      return { ...defaultConnections, ...(JSON.parse(saved) as Partial<ConnectionsConfig>) };
    } catch {
      return defaultConnections;
    }
  });
  const [showToken, setShowToken] = React.useState<Record<string, boolean>>({});
  const [testStates, setTestStates] = React.useState<Record<string, "idle" | "ok" | "fail" | "loading">>({});
  const [sheetRows, setSheetRows] = React.useState<number | null>(null);
  const [sheetTestMessage, setSheetTestMessage] = React.useState<string>("");
  const [savedToast, setSavedToast] = React.useState(false);

  React.useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(false), 2200);
    return () => clearTimeout(t);
  }, [savedToast]);

  const setTestState = (key: string, state: "idle" | "ok" | "fail" | "loading") => {
    setTestStates((prev) => ({ ...prev, [key]: state }));
  };

  const ping = async (url: string, key: string) => {
    if (!url) {
      setTestState(key, "fail");
      return;
    }
    setTestState(key, "loading");
    try {
      const res = await fetch(url, { method: "GET" });
      setTestState(key, res.ok ? "ok" : "fail");
    } catch {
      setTestState(key, "fail");
    }
  };

  const buildSheetWebAppUrl = React.useCallback(() => {
    const directUrl = config.sheetWebAppUrl.trim();
    if (directUrl) return directUrl;

    const deploymentId = config.sheetDeploymentId.trim();
    if (!deploymentId) return "";

    return `https://script.google.com/macros/s/${deploymentId}/exec`;
  }, [config.sheetDeploymentId, config.sheetWebAppUrl]);

  const countRowsFromSheetPayload = (payload: unknown): number | null => {
    if (Array.isArray(payload)) return payload.length;
    if (!payload || typeof payload !== "object") return null;

    const parsed = payload as { rows?: unknown; data?: unknown; items?: unknown };
    if (Array.isArray(parsed.rows)) return parsed.rows.length;
    if (Array.isArray(parsed.data)) return parsed.data.length;
    if (Array.isArray(parsed.items)) return parsed.items.length;
    return null;
  };

  const isValidGoogleAppsScriptUrl = (value: string): boolean => {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:[?#].*)?$/i.test(value.trim());
  };

  const extractDeploymentIdFromUrl = (value: string): string => {
    const match = value.trim().match(/\/macros\/s\/([^/]+)\/exec/i);
    return match?.[1] ?? "";
  };

  const testSheet = async () => {
    const fallbackUrl = import.meta.env.VITE_GSHEET_WEB_APP_URL || import.meta.env.VITE_GSHEET_API_URL || "";
    const url = buildSheetWebAppUrl() || fallbackUrl;
    if (!url) {
      setSheetRows(null);
      setSheetTestMessage("Add a Deployment ID or Web App URL first.");
      setTestState("sheet", "fail");
      return;
    }

    if (!isValidGoogleAppsScriptUrl(url)) {
      setSheetRows(null);
      setSheetTestMessage("Use a valid Google Apps Script Web App URL ending with /exec.");
      setTestState("sheet", "fail");
      return;
    }

    const enteredDeploymentId = config.sheetDeploymentId.trim();
    const deploymentIdFromUrl = extractDeploymentIdFromUrl(url);
    if (enteredDeploymentId && deploymentIdFromUrl && enteredDeploymentId !== deploymentIdFromUrl) {
      setSheetRows(null);
      setSheetTestMessage("Deployment ID does not match the Web App URL.");
      setTestState("sheet", "fail");
      return;
    }

    setSheetRows(null);
    setSheetTestMessage("");
    setTestState("sheet", "loading");
    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        setSheetRows(null);
        setSheetTestMessage(`Web app returned ${res.status}.`);
        setTestState("sheet", "fail");
        return;
      }

      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = await res.text();
      }

      const count = countRowsFromSheetPayload(payload);
      setSheetRows(count);
      setSheetTestMessage(count !== null ? `Connected. ${count} rows accessible.` : "Connected to Google Apps Script web app.");
      setTestState("sheet", "ok");
    } catch {
      try {
        await fetch(url, { method: "GET", mode: "no-cors" });
        setSheetRows(null);
        setSheetTestMessage("Connected (CORS-restricted response in browser). Web app is reachable.");
        setTestState("sheet", "ok");
      } catch {
        setSheetRows(null);
        setSheetTestMessage("Cannot reach Google Apps Script web app. Check deployment access and URL.");
        setTestState("sheet", "fail");
      }
    }
  };

  const saveConfig = () => {
    localStorage.setItem("connections-config", JSON.stringify(config));
    window.dispatchEvent(new Event(CONNECTIONS_CONFIG_UPDATED_EVENT));
    setSavedToast(true);
  };

  const statusIcon = (state: "idle" | "ok" | "fail" | "loading") => {
    if (state === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (state === "fail") return <X className="h-4 w-4 text-rose-400" />;
    if (state === "loading") return <RefreshCcw className="h-4 w-4 animate-spin text-sky-300" />;
    return null;
  };

  return (
    <div className="space-y-6 pb-24">
      {savedToast && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 right-6 z-50 px-4 py-2 rounded-lg border border-emerald-500/35 bg-emerald-500/20 text-emerald-200 text-sm">
          Settings saved successfully.
        </motion.div>
      )}

      <h2 className="text-2xl font-black tracking-tight">Connections</h2>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] space-y-4">
        <h3 className="text-lg font-bold">Facebook</h3>
        {Object.keys(config.facebookTokens).map((pageName) => (
          <div key={pageName} className="grid grid-cols-1 lg:grid-cols-[220px,1fr,140px,24px] gap-2 items-center">
            <p className="text-sm font-medium">{pageName}</p>
            <div className="relative">
              <Input
                type={showToken[pageName] ? "text" : "password"}
                value={config.facebookTokens[pageName]}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, facebookTokens: { ...prev.facebookTokens, [pageName]: e.target.value } }))
                }
              />
              <button type="button" onClick={() => setShowToken((prev) => ({ ...prev, [pageName]: !prev[pageName] }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showToken[pageName] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white" onClick={() => ping(config.baseWebhookUrl || import.meta.env.VITE_N8N_WEBHOOK_URL || "", `fb-${pageName}`)}>
              Test Connection
            </Button>
            <div>{statusIcon(testStates[`fb-${pageName}`] ?? "idle")}</div>
          </div>
        ))}
      </Card>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] space-y-3">
        <h3 className="text-lg font-bold">n8n Webhooks</h3>
        {[
          { key: "baseWebhookUrl", label: "Base Webhook URL" },
          { key: "postWebhook", label: "Post Webhook" },
          { key: "syncWebhook", label: "Sync Webhook" },
          { key: "automationWebhook", label: "Stop/Start Automation Webhook" },
        ].map((field) => (
          <div key={field.key} className="grid grid-cols-1 lg:grid-cols-[220px,1fr,90px,24px] gap-2 items-center">
            <p className="text-sm font-medium">{field.label}</p>
            <Input
              value={config[field.key as keyof ConnectionsConfig] as string}
              onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
            <Button variant="outline" onClick={() => ping(config[field.key as keyof ConnectionsConfig] as string, field.key)}>Test</Button>
            <div>{statusIcon(testStates[field.key] ?? "idle")}</div>
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-2 items-center pt-2">
          <p className="text-sm font-medium">n8n API Base URL</p>
          <Input
            placeholder="https://n8n.example.com/api/v1"
            value={config.n8nApiBaseUrl}
            onChange={(e) => setConfig((prev) => ({ ...prev, n8nApiBaseUrl: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-2 items-center">
          <p className="text-sm font-medium">n8n API Key</p>
          <Input
            type="password"
            placeholder="Paste n8n Public API key"
            value={config.n8nApiKey}
            onChange={(e) => setConfig((prev) => ({ ...prev, n8nApiKey: e.target.value }))}
          />
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] space-y-3">
        <h3 className="text-lg font-bold">Google Sheets</h3>
        <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-2 items-center">
          <p className="text-sm font-medium">Deployment ID</p>
          <Input
            placeholder="AKfyc..."
            value={config.sheetDeploymentId}
            onChange={(e) => setConfig((prev) => ({ ...prev, sheetDeploymentId: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-2 items-center">
          <p className="text-sm font-medium">Web App URL</p>
          <Input
            placeholder="https://script.google.com/macros/s/.../exec"
            value={config.sheetWebAppUrl}
            onChange={(e) => setConfig((prev) => ({ ...prev, sheetWebAppUrl: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white" onClick={testSheet}>Test Sheet Access</Button>
          {statusIcon(testStates.sheet ?? "idle")}
          {!!sheetTestMessage && (
            <p className={cn("text-sm", testStates.sheet === "fail" ? "text-rose-300" : "text-muted-foreground")}>{sheetTestMessage}</p>
          )}
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] space-y-4">
        <h3 className="text-lg font-bold">Sync Settings</h3>
        <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-2 items-center">
          <p className="text-sm font-medium">Auto-sync every X seconds</p>
          <Input
            type="number"
            min={5}
            value={config.autoSyncSeconds}
            onChange={(e) => setConfig((prev) => ({ ...prev, autoSyncSeconds: Number(e.target.value || 30) }))}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
          <p className="text-sm font-medium">Enable real-time queue sync</p>
          <button type="button" onClick={() => setConfig((prev) => ({ ...prev, realTimeQueueSync: !prev.realTimeQueueSync }))} className={cn("w-12 h-6 rounded-full p-1 transition-colors", config.realTimeQueueSync ? "bg-[#0d9488]" : "bg-slate-600")}>
            <span className={cn("block h-4 w-4 rounded-full bg-white transition-transform", config.realTimeQueueSync ? "translate-x-6" : "translate-x-0")} />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
          <p className="text-sm font-medium">Send Telegram alerts on failure</p>
          <button type="button" onClick={() => setConfig((prev) => ({ ...prev, telegramAlerts: !prev.telegramAlerts }))} className={cn("w-12 h-6 rounded-full p-1 transition-colors", config.telegramAlerts ? "bg-[#0d9488]" : "bg-slate-600")}>
            <span className={cn("block h-4 w-4 rounded-full bg-white transition-transform", config.telegramAlerts ? "translate-x-6" : "translate-x-0")} />
          </button>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-white/10 z-40">
        <div className="max-w-7xl mx-auto">
          <Button onClick={saveConfig} className="w-full h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white">Save Connections</Button>
        </div>
      </div>
    </div>
  );
}

function SchedulersPage() {
  const pageMeta: Array<{
    key: Exclude<SchedulerPageKey, "all">;
    name: string;
    short: string;
    dot: string;
    status: "Active" | "Paused";
  }> = [
    { key: "canada", name: "Canada Politics Now", short: "Canada Politics", dot: "bg-teal-500", status: "Active" },
    { key: "facts", name: "True Facts Daily", short: "True Facts", dot: "bg-blue-500", status: "Active" },
    { key: "world", name: "World News Brief", short: "World News", dot: "bg-orange-500", status: "Paused" },
  ];

  const [selectedPageFilter, setSelectedPageFilter] = React.useState<SchedulerPageKey>("all");
  const [events, setEvents] = React.useState<SchedulerEvent[]>(schedulerEventsSeed);
  const [showModal, setShowModal] = React.useState(false);
  const [newEvent, setNewEvent] = React.useState({
    title: "",
    pageKey: "canada" as Exclude<SchedulerPageKey, "all">,
    date: formatDateKey(startOfToday),
    hour: "10",
    minute: "00",
    type: "Queue" as SchedulerEvent["type"],
  });

  const hours = React.useMemo(() => Array.from({ length: 12 }, (_, i) => i + 8), []);
  const weekDays = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfToday, i)), []);
  const filteredEvents = React.useMemo(
    () => events.filter((event) => selectedPageFilter === "all" || event.pageKey === selectedPageFilter),
    [events, selectedPageFilter]
  );

  const nextJobs = React.useMemo(() => {
    const now = new Date();
    return filteredEvents
      .map((event) => ({
        ...event,
        at: new Date(`${event.date}T${`${event.hour}`.padStart(2, "0")}:${`${event.minute}`.padStart(2, "0")}:00`),
      }))
      .filter((event) => event.at.getTime() >= now.getTime())
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, 3);
  }, [filteredEvents]);

  const jobsToday = React.useMemo(() => {
    const todayKey = formatDateKey(startOfToday);
    return filteredEvents.filter((event) => event.date === todayKey);
  }, [filteredEvents]);

  const stats = React.useMemo(() => {
    const queued = filteredEvents.length;
    const sent = filteredEvents.filter((event) => event.type === "Publish").length;
    const failed = 0;
    const pending = Math.max(0, queued - sent);
    return { queued, sent, failed, pending };
  }, [filteredEvents]);

  const getEventAt = (dateKey: string, hour: number) =>
    filteredEvents.filter((event) => event.date === dateKey && event.hour === hour);

  const saveNewSchedule = () => {
    if (!newEvent.title.trim()) return;
    const page = pageMeta.find((item) => item.key === newEvent.pageKey);
    if (!page) return;

    const colorByType: Record<SchedulerEvent["type"], string> = {
      Queue: "bg-violet-500/20 border-violet-500/40",
      Automation: "bg-teal-500/20 border-teal-500/40",
      Publish: "bg-sky-500/20 border-sky-500/40",
    };

    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newEvent.title.trim(),
        pageKey: newEvent.pageKey,
        pageName: page.name,
        date: newEvent.date,
        hour: Number(newEvent.hour),
        minute: Number(newEvent.minute),
        durationHours: 1,
        type: newEvent.type,
        color: colorByType[newEvent.type],
      },
    ]);

    setShowModal(false);
    setNewEvent({
      title: "",
      pageKey: "canada",
      date: formatDateKey(startOfToday),
      hour: "10",
      minute: "00",
      type: "Queue",
    });
  };

  const formatHour = (hour: number) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const value = hour > 12 ? hour - 12 : hour;
    return `${value}${suffix}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5">
        <Card className="p-4 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] h-fit space-y-6">
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Facebook Pages</h3>
            <button
              type="button"
              onClick={() => setSelectedPageFilter("all")}
              className="w-full flex items-center justify-between rounded-lg border border-white/10 px-2.5 py-2 text-sm hover:bg-white/5"
            >
              <span className="text-[13px] text-slate-800 dark:text-slate-100">All Pages</span>
              {selectedPageFilter === "all" && <Check className="h-4 w-4 text-[#0d9488]" />}
            </button>

            {pageMeta.map((page) => (
              <button
                key={page.key}
                type="button"
                onClick={() => setSelectedPageFilter(page.key)}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors",
                  selectedPageFilter === page.key
                    ? "border-[#0d9488]/60 bg-[#0d9488]/10"
                    : "border-white/10 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", page.dot)} />
                  <span className="text-[13px] text-slate-800 dark:text-slate-100 truncate">{page.short}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={cn("h-1.5 w-1.5 rounded-full", page.status === "Active" ? "bg-emerald-500" : "bg-slate-400")} />
                  <span className={cn("text-[11px]", page.status === "Active" ? "text-emerald-600" : "text-slate-400")}>
                    {page.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Today&apos;s Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Posts Queued", value: stats.queued },
                { label: "Posts Sent", value: stats.sent },
                { label: "Failed", value: stats.failed },
                { label: "Pending", value: stats.pending },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-2 text-center">
                  <p className="text-[16px] font-bold text-gray-900 dark:text-slate-100">{item.value}</p>
                  <p className="text-[10px] text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Next Scheduled</h3>
            {nextJobs.length === 0 && <p className="text-sm text-gray-400 italic">No jobs scheduled</p>}
            <div className="space-y-2">
              {nextJobs.map((job) => (
                <div key={job.id} className="rounded-lg border border-white/10 p-2.5 flex items-start gap-2">
                  <span className={cn("h-3.5 w-3.5 rounded-sm mt-1", job.color.includes("teal") ? "bg-teal-500" : job.color.includes("sky") ? "bg-sky-500" : "bg-violet-500")} />
                  <div className="min-w-0">
                    <p className="text-[12px] text-slate-800 dark:text-slate-100 truncate">{job.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{job.at.toDateString() === startOfToday.toDateString() ? "Today" : job.at.toLocaleDateString(undefined, { month: "short", day: "numeric" })} {job.at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold">Schedulers</h2>
              <p className="text-xs text-muted-foreground">Weekly automation timeline</p>
            </div>
            <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add New Schedule
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[70px_repeat(7,minmax(120px,1fr))] border-b border-white/10">
                <div />
                {weekDays.map((date) => {
                  const isToday = formatDateKey(date) === formatDateKey(startOfToday);
                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        "px-2 py-2 text-center border-l border-white/10",
                        isToday && "border-t-[3px] border-t-[#0d9488]"
                      )}
                    >
                      <p className="text-[11px] text-gray-400">{date.toLocaleDateString([], { month: "short" })}</p>
                      <div className="mt-0.5 flex justify-center">
                        <span
                          className={cn(
                            "text-sm font-semibold h-7 w-7 grid place-items-center rounded-full",
                            isToday ? "bg-[#0d9488] text-white" : "text-slate-700 dark:text-slate-200"
                          )}
                        >
                          {date.getDate()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-[70px_repeat(7,minmax(120px,1fr))] min-h-[72px] border-b border-white/10">
                  <div className="px-2 pt-2 text-[11px] text-gray-400">{formatHour(hour)}</div>
                  {weekDays.map((day) => {
                    const dayKey = formatDateKey(day);
                    const dayEvents = getEventAt(dayKey, hour);
                    return (
                      <div key={`${dayKey}-${hour}`} className="border-l border-white/10 p-1.5 space-y-1">
                        {dayEvents.map((event) => (
                          <div key={event.id} className={cn("rounded-lg border p-1.5", event.color)}>
                            <p className="text-[11px] font-semibold truncate text-slate-800 dark:text-slate-100">{event.title}</p>
                            <Badge className="mt-1 rounded-full px-2 py-0.5 text-[10px] bg-teal-50 text-teal-700 border-transparent dark:bg-teal-900/40 dark:text-teal-200">
                              {event.pageName}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#081328] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Add New Schedule</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Job title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                />
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={newEvent.pageKey}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, pageKey: e.target.value as Exclude<SchedulerPageKey, "all"> }))}
                >
                  {pageMeta.map((page) => (
                    <option key={page.key} value={page.key}>
                      {page.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))} />
                  <Input type="number" min={8} max={19} value={newEvent.hour} onChange={(e) => setNewEvent((prev) => ({ ...prev, hour: e.target.value }))} placeholder="Hour" />
                  <Input type="number" min={0} max={59} value={newEvent.minute} onChange={(e) => setNewEvent((prev) => ({ ...prev, minute: e.target.value }))} placeholder="Minute" />
                </div>
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, type: e.target.value as SchedulerEvent["type"] }))}
                >
                  <option value="Queue">Queue</option>
                  <option value="Automation">Automation</option>
                  <option value="Publish">Publish</option>
                </select>
                <Button className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white" onClick={saveNewSchedule}>
                  Save Schedule
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ModulePlaceholder({ title }: { title: string }) {
  return (
    <Card className="p-10 rounded-2xl border border-white/10 bg-white/90 dark:bg-[#081328]/90 text-center">
      <h2 className="text-4xl font-black tracking-tight mb-2">{title}</h2>
      <p className="text-muted-foreground">This section is ready for your next module.</p>
    </Card>
  );
}

const EmailMarketingDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);
  const [activeView, setActiveView] = React.useState<ViewKey>("Dashboard");
  const [composeTemplateSeed, setComposeTemplateSeed] = React.useState<TemplateName | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const { syncStatus, lastSyncedAt, failedAttempts, syncNow } = useSync();

  React.useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", updateFullscreenState);
    updateFullscreenState();

    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore if fullscreen is blocked by browser policies.
    }
  };
  const { lastSynced } = useContentQueue();

  const openComposeWithTemplate = (template: TemplateName) => {
    setComposeTemplateSeed(template);
    setActiveView("Compose Post");
  };

  function timeSince(date: Date | null): string {
    if (!date) return "Never";
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }

  const [, forceUpdate] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderPage = () => {
    switch (activeView) {
      case "Dashboard":
        return <DashboardOverview />;
      case "Post Monitor":
        return <PostMonitorPage />;
      case "Content Queue":
        return <ContentQueuePage />;
      case "Compose Post":
        return <ComposePostPage initialTemplate={composeTemplateSeed} />;
      case "Templates":
        return <TemplatesPage onUseTemplate={openComposeWithTemplate} />;
      case "Schedulers":
        return <SchedulersPage />;
      case "My Pages":
        return <MyPagesPage />;
      case "Automations":
        return <AutomationsPage />;
      case "Workflows":
        return <WorkflowsPage />;
      case "Comment Moderation":
        return <CommentModerationPage />;
      case "Page Analytics":
        return <PageAnalyticsPage />;
      case "Connections":
        return <ConnectionsPage />;
      default:
        return <ModulePlaceholder title={activeView} />;
    }
  };

  return (
    <div className={cn("min-h-screen", darkMode && "dark")}>
      <div className="grid-overlay pointer-events-none" />
      <div className="flex h-screen bg-slate-100 dark:bg-[#02091d] text-foreground">
        <aside
          className={cn(
            "bg-background/95 backdrop-blur-md border-r transition-all duration-300 overflow-y-auto",
            sidebarOpen ? "w-64" : "w-0 md:w-20"
          )}
        >
          <div className="p-6">
            <h1 className={cn("text-2xl font-black text-[#0d9488] tracking-tight", !sidebarOpen && "md:text-lg")}>{sidebarOpen ? "Outreachly" : "O"}</h1>
          </div>

          <nav className="px-3 space-y-6 pb-6">
            {menuSections.map((section) => (
              <div key={section.title}>
                {sidebarOpen && <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-2">{section.title}</h3>}
                {section.items.map((item) => {
                  const isActive = activeView === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveView(item.label)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors", isActive ? "bg-[#0d9488] text-white" : "hover:bg-muted text-muted-foreground")}
                    >
                      <item.icon className="h-5 w-5" />
                      {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-background/95 backdrop-blur-md border-b px-4 md:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search posts, pages, workflows..." className="pl-10" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCcw className={cn("h-3.5 w-3.5", syncStatus === "syncing" && "animate-spin", syncStatus === "error" && "text-rose-400")} />
                  <span>{syncStatus === "error" ? "Sync failed" : `Synced ${timeSince(lastSynced)}`}</span>
                  {syncStatus === "error" && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                </div>
                <Button variant="ghost" size="icon" onClick={() => void syncNow()}>
                  <RefreshCcw className={cn("h-5 w-5", syncStatus === "syncing" && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDarkMode((prev) => !prev)} aria-label="Toggle color theme">
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => void toggleFullscreen()} aria-label="Toggle fullscreen">
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {failedAttempts >= 3 && (
            <div className="px-4 md:px-6 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-sm">
              Connection to n8n lost - showing cached data.
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto animate-floatIn">{renderPage()}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const AUTH_LOCAL_STORAGE_KEY = "dashboard-auth-local";
  const AUTH_SESSION_STORAGE_KEY = "dashboard-auth-session";

  const getInitialAuthState = () => {
    const sessionValue = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (sessionValue === "1") {
      return true;
    }

    const rawLocal = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY);
    if (!rawLocal) {
      return false;
    }

    try {
      const parsed = JSON.parse(rawLocal) as { expiresAt?: number };
      if (typeof parsed.expiresAt === "number" && Date.now() < parsed.expiresAt) {
        return true;
      }
    } catch {
      // Clear malformed auth storage.
    }

    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
    return false;
  };

  const [isAuthenticated, setIsAuthenticated] = React.useState(getInitialAuthState);

  const handleLoginSuccess = (rememberFor14Days: boolean) => {
    setIsAuthenticated(true);

    if (rememberFor14Days) {
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        AUTH_LOCAL_STORAGE_KEY,
        JSON.stringify({
          expiresAt: Date.now() + fourteenDaysMs,
        }),
      );
      sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, "1");
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
  };

  if (!isAuthenticated) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <SyncProvider>
      <EmailMarketingDashboard />
    </SyncProvider>
  );
}
