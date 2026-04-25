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
  ChevronLeft,
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
  Upload,
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
  | "Automations"
  | "Schedulers"
  | "Workflows"
  | "My Pages"
  | "Comment Moderation"
  | "Page Analytics"
  | "Connections"
  | "Notifications"
  | "Media Upload";

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
  apiError?: string;
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
  html?: string;
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
  baseWebhookUrl: string;
  syncWebhook: string;
  formsWebhookUrl: string;
  mediaWebhookUrl: string;
  n8nApiBaseUrl: string;
  n8nApiKey: string;
  sheetDeploymentId: string;
  sheetWebAppUrl: string;
  composeScriptUrl: string;
  pagesScriptUrl: string;
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
  { title: "Content", items: [{ icon: Plus, label: "Compose Post" }, { icon: Upload, label: "Media Upload" }, { icon: FileText, label: "Templates" }, { icon: Calendar, label: "Schedulers" }] },
  { title: "Automation", items: [{ icon: GitBranch, label: "Automations" }, { icon: Blocks, label: "Workflows" }] },
  { title: "Pages", items: [{ icon: Users, label: "My Pages" }, { icon: MessageSquare, label: "Comment Moderation" }, { icon: TrendingUp, label: "Page Analytics" }] },
  { title: "Settings", items: [{ icon: Settings, label: "Connections" }, { icon: Bell, label: "Notifications" }] },
];

const defaultConnections: ConnectionsConfig = {
  baseWebhookUrl: "",
  syncWebhook: "",
  formsWebhookUrl: "",
  mediaWebhookUrl: "",
  n8nApiBaseUrl: "",
  n8nApiKey: "",
  sheetDeploymentId: "",
  sheetWebAppUrl: "",
  composeScriptUrl: "",
  pagesScriptUrl: "",
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
  // Saved connections page value takes priority over .env so users can override from the UI
  const apiKey = String(
    savedConfig.n8nApiKey ||
    import.meta.env.VITE_N8N_API_KEY ||
    import.meta.env.VITE_N8N_PUBLIC_API_KEY ||
    ""
  ).trim();

  const savedBase = String(savedConfig.n8nApiBaseUrl ?? "").trim();
  const envBase = String(import.meta.env.VITE_N8N_BASE_URL ?? "").trim();

  const directBaseCandidates = [savedBase, envBase, DEFAULT_N8N_API_BASE_URL]
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)
    .map((value) => value.replace(/\/$/, ""));

  const proxyBase = "/api/n8n";

  const apiBaseUrls = import.meta.env.DEV
    ? [proxyBase, "/n8n-api", ...directBaseCandidates]
    : [...directBaseCandidates, proxyBase];

  return { apiBaseUrls, apiKey };
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

  // Always-current refs so async callbacks never read stale closure values
  const pagesRef = React.useRef<ManagedPage[]>([]);
  pagesRef.current = pages;
  const queueRef = React.useRef<QueueItem[]>([]);
  queueRef.current = queue;
  const automationsRef = React.useRef<AutomationItem[]>([]);
  automationsRef.current = automations;

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

  const syncPagesFromGoogleSheet = React.useCallback(async (): Promise<ManagedPage[] | null> => {
    const endpoints = ["https://script.google.com/macros/s/AKfycbz5HtEOSeVhzjnPXEVistZ6jcrXogHL7V1jLk_zGKo5CCDMl5aVcGyIGhRCviVNfEI/exec?action=getAll"];

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
          pagesRef.current = [];
          setPages([]);
          return [];
        }

        const palette = ["bg-rose-500", "bg-blue-500", "bg-orange-500", "bg-purple-500", "bg-amber-500", "bg-teal-500"];

        // Compute merged pages synchronously using the ref so we can return them
        // immediately (React batches setPages asynchronously).
        const prev = pagesRef.current;
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

        pagesRef.current = next;
        setPages(next);
        return next;
      } catch {
        // Try next endpoint variant.
      }
    }

    return null;
  }, [parseGoogleSheetPages]);

  const formatCompactNumber = React.useCallback((value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
  }, []);

  const syncPageMetricsFromFacebook = React.useCallback(async (freshPages?: ManagedPage[]) => {
    const candidates = (freshPages ?? pagesRef.current).filter((page) => page.pageId && page.accessToken);
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

    type PageMetricResult = { id: number; pageId: string; followers: string; reach: string; postsToday: number; followersNum: number; reachNum: number; apiError?: string };

    const fetchPageNode = async (pid: string, tok: string): Promise<{ followers_count?: number; fan_count?: number; posts?: { data?: Array<{ created_time?: string }> }; error?: { message?: string } } | null> => {
      const base = `https://graph.facebook.com/v19.0`;
      // Try 1: standard page node with posts field
      try {
        const res = await fetch(`${base}/${pid}?fields=followers_count,fan_count,posts.limit(25){created_time}&access_token=${tok}`, { cache: "no-store" });
        const json = (await res.json()) as { followers_count?: number; fan_count?: number; posts?: { data?: Array<{ created_time?: string }> }; error?: { message?: string } };
        if (res.ok && !json.error) return json;
      } catch { /* try next */ }
      // Try 2: page node without posts field (metrics only)
      try {
        const res = await fetch(`${base}/${pid}?fields=followers_count,fan_count&access_token=${tok}`, { cache: "no-store" });
        const json = (await res.json()) as { followers_count?: number; fan_count?: number; error?: { message?: string } };
        if (res.ok && !json.error) return json;
      } catch { /* failed */ }
      return null;
    };

    const updated = await Promise.all(
      candidates.map(async (page) => {
        try {
          const pid = encodeURIComponent(page.pageId ?? "");
          const tok = encodeURIComponent(page.accessToken ?? "");
          // Validate token first — catch expired/wrong token early
          const validateRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${tok}`, { cache: "no-store" });
          const validateJson = (await validateRes.json()) as { error?: { message?: string; type?: string } };
          if (!validateRes.ok || validateJson.error) {
            const errMsg = validateJson.error?.message ?? "Invalid or expired access token";
            return { id: page.id, pageId: page.pageId ?? "", followers: page.followers, reach: page.reach, postsToday: page.postsToday, followersNum: 0, reachNum: 0, apiError: errMsg } as PageMetricResult;
          }
          const json = await fetchPageNode(pid, tok);
          if (!json) return { id: page.id, pageId: page.pageId ?? "", followers: page.followers, reach: page.reach, postsToday: page.postsToday, followersNum: 0, reachNum: 0, apiError: "Could not fetch page metrics" } as PageMetricResult;

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
            pageId: page.pageId ?? "",
            followers: formatCompactNumber(followersNum),
            reach: formatCompactNumber(reachNum),
            postsToday,
            followersNum,
            reachNum,
            apiError: undefined,
          } as PageMetricResult;
        } catch {
          return { id: page.id, pageId: page.pageId ?? "", followers: page.followers, reach: page.reach, postsToday: page.postsToday, followersNum: 0, reachNum: 0, apiError: "Network error fetching metrics" } as PageMetricResult;
        }
      })
    );

    const mapped = updated.filter((entry): entry is PageMetricResult => entry !== null);
    if (mapped.length === 0) return false;

    const metricMap = new Map(mapped.map((entry) => [entry.pageId, entry]));
    setPages((prev) =>
      prev.map((page) => {
        const next = metricMap.get(page.pageId ?? "");
        if (!next) return page;
        return {
          ...page,
          followers: next.apiError ? page.followers : next.followers,
          reach: next.apiError ? page.reach : next.reach,
          postsToday: next.apiError ? page.postsToday : next.postsToday,
          apiError: next.apiError,
        };
      })
    );

    const successMapped = mapped.filter((item) => !item.apiError);
    const totalFollowers = successMapped.reduce((sum, item) => sum + item.followersNum, 0);
    const totalReach = successMapped.reduce((sum, item) => sum + item.reachNum, 0);
    const postsToday = successMapped.reduce((sum, item) => sum + item.postsToday, 0);
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
  }, [failedAttempts, formatCompactNumber]);

  const syncRecentPostsFromFacebook = React.useCallback(async (freshPages?: ManagedPage[]) => {
    const candidates = (freshPages ?? pagesRef.current).filter((page) => page.pageId && page.accessToken);
    if (candidates.length === 0) return false;
    const recentPostFetchLimit = 100;
    const recentPostStoreLimit = 200;

    type RawPost = { id?: string; message?: string; story?: string; created_time?: string; permalink_url?: string };

    const toItems = (posts: RawPost[], pageId: number, pageName: string): LivePostItem[] =>
      posts.map((post, index) => ({
        id: `${pageId}-${post.id ?? post.created_time ?? index}`,
        pageName,
        headline: (post.message ?? post.story ?? "Untitled post").slice(0, 120),
        template: "Live",
        status: "Posted" as QueueStatus,
        time: post.created_time ? new Date(post.created_time).toLocaleString() : "Unknown",
        permalink: post.permalink_url,
        createdAt: post.created_time,
        graphPostId: post.id,
      }));

    const fetchPostsFromUrl = async (url: string): Promise<RawPost[] | null> => {
      try {
        const res = await fetch(url, { method: "GET", cache: "no-store" });
        const json = (await res.json()) as {
          data?: RawPost[];
          posts?: { data?: RawPost[] };
          published_posts?: { data?: RawPost[] };
          error?: { message?: string };
        };
        if (!res.ok || json.error) return null;
        return json.data ?? json.posts?.data ?? json.published_posts?.data ?? null;
      } catch {
        return null;
      }
    };

    const fetched = await Promise.all(
      candidates.map(async (page) => {
        const pid = encodeURIComponent(page.pageId ?? "");
        const tok = encodeURIComponent(page.accessToken ?? "");
        const base = `https://graph.facebook.com/v19.0`;
        const postFields = `id,message,story,created_time,permalink_url`;
        const limit = recentPostFetchLimit;

        // Try 1: page node with `posts` field
        let posts = await fetchPostsFromUrl(
          `${base}/${pid}?fields=posts.limit(${limit}){${postFields}}&access_token=${tok}`
        );

        // Try 2: /posts edge endpoint
        if (!posts?.length) {
          posts = await fetchPostsFromUrl(
            `${base}/${pid}/posts?limit=${limit}&fields=${postFields}&access_token=${tok}`
          );
        }

        // Try 3: /published_posts edge endpoint
        if (!posts?.length) {
          posts = await fetchPostsFromUrl(
            `${base}/${pid}/published_posts?limit=${limit}&fields=${postFields}&access_token=${tok}`
          );
        }

        // Try 4: /feed edge endpoint
        if (!posts?.length) {
          posts = await fetchPostsFromUrl(
            `${base}/${pid}/feed?limit=${limit}&fields=${postFields}&access_token=${tok}`
          );
        }

        return toItems(posts ?? [], page.id, page.name);
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
  }, []);

  const syncRecentCommentsFromFacebook = React.useCallback(async (freshPages?: ManagedPage[]) => {
    const candidates = (freshPages ?? pagesRef.current).filter((page) => page.pageId && page.accessToken);
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
  }, []);

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
          queue: Array.isArray(data.queue) ? (data.queue as QueueItem[]) : queueRef.current,
          pages: Array.isArray(data.pages) ? (data.pages as ManagedPage[]) : pagesRef.current,
          automations: Array.isArray(data.automations) ? (data.automations as AutomationItem[]) : automationsRef.current,
          lastUpdated: typeof data.lastUpdated === "string" ? data.lastUpdated : new Date().toISOString(),
        };
        localStorage.setItem("sync-cache", JSON.stringify(newState));
        webhookSuccess = true;
      } catch {
        webhookSuccess = false;
      }
    }

    const freshPages = await syncPagesFromGoogleSheet();
    sheetSuccess = freshPages !== null;
    const pagesToSync = freshPages ?? pagesRef.current;
    facebookMetricsSuccess = await syncPageMetricsFromFacebook(pagesToSync);
    recentPostsSuccess = await syncRecentPostsFromFacebook(pagesToSync);
    await syncRecentCommentsFromFacebook(pagesToSync);

    if (webhookSuccess || sheetSuccess || facebookMetricsSuccess || recentPostsSuccess) {
      setLastUpdated(new Date().toISOString());
      setLastSyncedAt(Date.now());
      setFailedAttempts(0);
      setSyncStatus("success");
      return;
    }

    setSyncStatus("error");
    setFailedAttempts((prev) => prev + 1);
  }, [syncPageMetricsFromFacebook, syncPagesFromGoogleSheet, syncRecentCommentsFromFacebook, syncRecentPostsFromFacebook, webhook]);

  const syncNowRef = React.useRef(syncNow);
  React.useEffect(() => { syncNowRef.current = syncNow; });

  // Stable interval — empty deps prevents re-triggering on every pages/syncNow change
  React.useEffect(() => {
    void syncNowRef.current();
    const timer = setInterval(() => void syncNowRef.current(), 30_000);
    return () => clearInterval(timer);
  }, []);

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

  const parseMetricStr = React.useCallback((value: string): number => {
    const s = String(value || "0").trim().toUpperCase();
    if (s.endsWith("M")) return parseFloat(s) * 1_000_000;
    if (s.endsWith("K")) return parseFloat(s) * 1_000;
    return parseFloat(s) || 0;
  }, []);

  // Posts in last 7 days from all pages (from recentPosts)
  const postsLast7d = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return recentPosts.filter((p) => {
      const ts = p.createdAt ? Date.parse(p.createdAt) : 0;
      return ts >= cutoff;
    }).length;
  }, [recentPosts]);

  // Total followers from all pages (from FB API)
  const totalFollowers = React.useMemo(() => {
    const fromPages = syncData.pages.reduce((sum, p) => sum + parseMetricStr(p.followers), 0);
    return fromPages || dashboardRealtimeData.totalFollowers;
  }, [syncData.pages, dashboardRealtimeData.totalFollowers, parseMetricStr]);

  // Total reach: sum from pages, fall back to chart accumulated reach
  const totalReach = React.useMemo(() => {
    const fromPages = syncData.pages.reduce((sum, p) => sum + parseMetricStr(p.reach), 0);
    if (fromPages > 0) return fromPages;
    const fromChart = dashboardRealtimeData.chart.reduce((sum, day) => sum + day.reached, 0);
    return fromChart || dashboardRealtimeData.totalReach;
  }, [syncData.pages, dashboardRealtimeData.chart, dashboardRealtimeData.totalReach, parseMetricStr]);

  const dynamicProgressStats = React.useMemo(() => ([
    { title: "Posts (7 days)", value: String(postsLast7d), growth: "+0%", progress: Math.min(100, postsLast7d * 5), icon: Send },
    { title: "Total Reach", value: formatCompact(totalReach), growth: "+0%", progress: Math.min(100, Math.round(totalReach / 10)), icon: TrendingUp },
    { title: "Total Followers", value: formatCompact(totalFollowers), growth: "+0%", progress: Math.min(100, Math.round(totalFollowers / 100)), icon: Users },
    { title: "Failed Posts", value: String(dashboardRealtimeData.failedPosts), growth: dashboardRealtimeData.failedPosts > 0 ? "+0%" : "-100%", progress: Math.min(100, dashboardRealtimeData.failedPosts * 10), icon: AlertCircle },
  ]), [dashboardRealtimeData.failedPosts, postsLast7d, totalFollowers, totalReach, formatCompact]);

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

  const pageOptions = React.useMemo(() => {
    const fromPosts = visibleSourcePosts.map((post) => post.pageName);
    const fromPages = syncData.pages.map((p) => p.name);
    return ["All", ...Array.from(new Set([...fromPages, ...fromPosts]))];
  }, [visibleSourcePosts, syncData.pages]);

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

function MediaUploadPage() {
  const connConfig = useConnectionsConfig();
  const { syncData } = useSync();

  const MEDIA_WEBHOOK = connConfig.mediaWebhookUrl?.trim() || "https://n8n.kasunmadhuwantha.cv/webhook-test/646cd2d7-b6a7-462e-ba68-4f321a94a513";

  const pages = React.useMemo(() => {
    const dynamic = syncData.pages.map((p) => p.name.trim()).filter((n, i, a) => n && a.indexOf(n) === i);
    return dynamic.length > 0 ? dynamic : ["TrendWire Daily", "Civic Pulse", "Science Snap"];
  }, [syncData.pages]);

  const [selectedPage, setSelectedPage] = React.useState("");
  const [imageUrls, setImageUrls] = React.useState<string[]>(Array(7).fill(""));
  const [audioFile, setAudioFile] = React.useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });
  const [videoResult, setVideoResult] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (pages.length > 0 && !selectedPage) setSelectedPage(pages[0]);
  }, [pages, selectedPage]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setAudioFile({ file: null, preview: null }); return; }
    setAudioFile({ file, preview: URL.createObjectURL(file) });
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!selectedPage) { setToast({ type: "error", message: "Please select a page." }); return; }
    const hasImage = imageUrls.some((u) => u.trim());
    if (!hasImage && !audioFile.file) { setToast({ type: "error", message: "Please add at least one image URL or audio file." }); return; }
    setSubmitting(true);
    setVideoResult(null);
    try {
      const params = new URLSearchParams();
      params.append("type", "vedio");
      params.append("page", selectedPage);
      imageUrls.forEach((url, i) => { if (url.trim()) params.append(`image_${i + 1}`, url.trim()); });
      if (audioFile.file) {
        const b64 = await toBase64(audioFile.file);
        params.append("audio", b64);
        params.append("audio_name", audioFile.file.name);
      }
      await fetch(MEDIA_WEBHOOK, { method: "POST", mode: "no-cors", body: params });
      setToast({ type: "success", message: "Sent to n8n! Video will appear in preview when ready." });
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to reach n8n." });
    } finally {
      setSubmitting(false);
    }
  };

  const filledImages = imageUrls.map((u, i) => ({ url: u.trim(), index: i })).filter((x) => x.url);

  return (
    <>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className={cn("fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm shadow-xl backdrop-blur-sm",
            toast.type === "success" ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-200" : "bg-rose-500/20 border-rose-500/35 text-rose-200"
          )}>
          {toast.message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ══ LEFT — form ══ */}
        <div className="xl:col-span-3 space-y-4">

          {/* Header banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d9488]/20 via-[#0a7a6e]/10 to-transparent border border-[#0d9488]/20 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#0d9488_0%,_transparent_60%)] opacity-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-[#0d9488]/20 border border-[#0d9488]/30 flex items-center justify-center">
                <svg className="h-5 w-5 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Creative Media Studio</h2>
                <p className="text-xs text-muted-foreground">Add images + audio → n8n builds your video</p>
              </div>
            </div>
          </div>

          {/* Page selector */}
          <Card className="rounded-2xl border border-white/10 dark:bg-[#081328] p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Target Page</p>
            <div className="flex flex-wrap gap-2">
              {pages.map((page) => (
                <motion.button key={page} type="button" whileTap={{ scale: 0.96 }} onClick={() => setSelectedPage(page)}
                  className={cn("px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                    selectedPage === page
                      ? "border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10 shadow-[0_0_12px_#0d948820]"
                      : "border-border text-muted-foreground hover:border-[#0d9488]/40 hover:text-foreground"
                  )}>
                  {page}
                </motion.button>
              ))}
            </div>
          </Card>

          {/* Image URLs */}
          <Card className="rounded-2xl border border-white/10 dark:bg-[#081328] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Image URLs</p>
              <span className="text-xs text-[#0d9488] font-medium">{filledImages.length} / 7 added</span>
            </div>
            <div className="space-y-2">
              {imageUrls.map((url, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3">
                  <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg text-xs font-bold shrink-0 transition-colors",
                    url.trim() ? "bg-[#0d9488]/15 text-[#0d9488] border border-[#0d9488]/30" : "bg-muted/40 text-muted-foreground border border-border"
                  )}>
                    {i + 1}
                  </div>
                  <Input
                    value={url}
                    onChange={(e) => setImageUrls((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    placeholder={`Image ${i + 1} URL`}
                    className="h-9 text-sm bg-background/40 border-border/60 focus:border-[#0d9488]/60"
                  />
                  <div className={cn("h-9 w-9 rounded-lg border shrink-0 overflow-hidden transition-all",
                    url.trim() ? "border-[#0d9488]/30" : "border-dashed border-border/40 bg-muted/20"
                  )}>
                    {url.trim() ? (
                      <img src={url} alt="" className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                        onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Audio upload */}
          <Card className="rounded-2xl border border-white/10 dark:bg-[#081328] p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Audio Track</p>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
            {audioFile.preview ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#0d9488]/20 flex items-center justify-center">
                      <svg className="h-4 w-4 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                    </div>
                    <span className="text-sm font-medium truncate max-w-[160px]">{audioFile.file?.name}</span>
                  </div>
                  <button type="button" onClick={() => { setAudioFile({ file: null, preview: null }); if (audioInputRef.current) audioInputRef.current.value = ""; }}
                    className="h-7 w-7 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center hover:bg-rose-500/25 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <audio src={audioFile.preview} controls className="w-full" />
              </motion.div>
            ) : (
              <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => audioInputRef.current?.click()}
                className="w-full h-24 rounded-xl border-2 border-dashed border-[#0d9488]/20 hover:border-[#0d9488]/50 bg-[#0d9488]/5 hover:bg-[#0d9488]/10 transition-all flex flex-col items-center justify-center gap-2 group">
                <div className="h-10 w-10 rounded-full bg-[#0d9488]/15 group-hover:bg-[#0d9488]/25 transition-colors flex items-center justify-center">
                  <svg className="h-5 w-5 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Drop audio or click to browse</span>
              </motion.button>
            )}
          </Card>

          {/* Submit */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button onClick={handleSubmit} disabled={submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#0d9488] text-white font-semibold text-sm shadow-lg shadow-[#0d9488]/20 transition-all">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                  Sending to n8n...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Generate Video with n8n
                </span>
              )}
            </Button>
          </motion.div>
        </div>

        {/* ══ RIGHT — live preview ══ */}
        <div className="xl:col-span-2 sticky top-4 space-y-4">
          <Card className="rounded-2xl border border-white/10 dark:bg-[#081328] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-base">Live Preview</h3>
              {filledImages.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0d9488]/15 text-[#0d9488] border border-[#0d9488]/20 font-medium">
                  {filledImages.length} image{filledImages.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Video result */}
              {videoResult ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0d9488] animate-pulse" />
                    <p className="text-xs text-[#0d9488] font-semibold uppercase tracking-wide">Video Ready</p>
                  </div>
                  <video src={videoResult} controls className="w-full rounded-xl border border-[#0d9488]/20" />
                </motion.div>
              ) : filledImages.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Image Preview</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {filledImages.slice(0, 6).map(({ url, index }) => (
                      <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
                        className="aspect-square rounded-lg overflow-hidden border border-border/60">
                        <img src={url} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                      </motion.div>
                    ))}
                    {filledImages[6] && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="aspect-square rounded-lg overflow-hidden border border-border/60">
                        <img src={filledImages[6].url} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-muted/30 border border-dashed border-border flex items-center justify-center">
                    <svg className="h-7 w-7 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                  </div>
                  <p className="text-sm text-muted-foreground/60">Add image URLs to preview<br />Video appears here when n8n finishes</p>
                </div>
              )}

              {/* Audio preview */}
              {audioFile.preview && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Audio Track</p>
                  <div className="rounded-xl bg-[#0d9488]/5 border border-[#0d9488]/15 p-2">
                    <audio src={audioFile.preview} controls className="w-full" />
                  </div>
                </motion.div>
              )}
            </div>
          </Card>

        </div>

      </div>
    </>
  );
}

function MediaUploadSlot({
  label, accept, icon, preview, onChange,
}: {
  label: string;
  accept: string;
  icon: React.ReactNode;
  preview: string | null;
  onChange: (file: File | null, preview: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isImage = accept.startsWith("image");
  const isAudio = accept.startsWith("audio");
  const isVideo = accept.startsWith("video");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) { onChange(null, null); return; }
    const url = URL.createObjectURL(file);
    onChange(file, url);
  };

  return (
    <div
      className="relative rounded-xl border-2 border-dashed border-border hover:border-[#0d9488]/60 transition-colors cursor-pointer overflow-hidden bg-background/40"
      style={{ aspectRatio: isVideo ? "16/9" : isAudio ? undefined : "1/1" }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />

      {preview && isImage && (
        <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {preview && isVideo && (
        <video src={preview} className="absolute inset-0 w-full h-full object-cover" muted />
      )}
      {preview && isAudio && (
        <div className="p-3">
          <audio src={preview} controls className="w-full" />
        </div>
      )}

      {!preview && (
        <div className="flex flex-col items-center justify-center gap-2 p-4 h-full min-h-[80px] text-muted-foreground">
          {icon}
          <span className="text-xs font-medium text-center">{label}</span>
        </div>
      )}

      {preview && !isAudio && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(null, null); if (inputRef.current) inputRef.current.value = ""; }}
          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ComposePostPage({ initialTemplate }: { initialTemplate?: TemplateName }) {
  const connConfig = useConnectionsConfig();

  const [selectedPage, setSelectedPage] = React.useState("");
  const [selectedTemplateObj, setSelectedTemplateObj] = React.useState<{ name: string; html: string } | null>(null);
  const [sheetTemplates, setSheetTemplates] = React.useState<Array<{ name: string; html: string }>>([]);
  const [headline, setHeadline] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">("portrait");
  const [postImageUrl, setPostImageUrl] = React.useState("");
  const [postImageFile, setPostImageFile] = React.useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });
  const postImageInputRef = React.useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const { setQueue, syncData } = useSync();
  const previousPagesRef = React.useRef<string[]>([]);
  const SCRIPT_URL = connConfig.composeScriptUrl?.trim() || "https://script.google.com/macros/s/AKfycbwuZP1ETiVjr0_LCirp-sY1vLVXJ8p4P-3_z1grHxULRN-k2PuwqLlSxDpgqglo6Qf7Hw/exec";
  const FORMS_WEBHOOK = connConfig.formsWebhookUrl?.trim() || (import.meta.env.VITE_N8N_FORMS_WEBHOOK_URL as string | undefined) || "https://n8n.kasunmadhuwantha.cv/webhook/forms";

  const pages = React.useMemo(() => {
    const dynamicPages = syncData.pages
      .map((page) => page.name.trim())
      .filter((name, index, arr) => name.length > 0 && arr.indexOf(name) === index);
    return dynamicPages.length > 0 ? dynamicPages : ["TrendWire Daily", "Civic Pulse", "Science Snap"];
  }, [syncData.pages]);

  React.useEffect(() => {
    fetch(`${SCRIPT_URL}?action=getTemplates`, { cache: "no-store" })
      .then((r) => r.json())
      .then((rows: Array<Record<string, string>>) => {
        if (Array.isArray(rows)) {
          setSheetTemplates(rows.filter((r) => r["Template Name"]).map((r) => ({ name: r["Template Name"], html: r["Template_code"] || "" })));
        }
      })
      .catch(() => {});
  }, [SCRIPT_URL]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    if (pages.length === 0) { previousPagesRef.current = []; setSelectedPage(""); return; }
    const prev = previousPagesRef.current;
    const added = pages.filter((p) => !prev.includes(p));
    if (added.length > 0) setSelectedPage(added[0]);
    else if (!selectedPage || !pages.includes(selectedPage)) setSelectedPage(pages[0]);
    previousPagesRef.current = pages;
  }, [pages, selectedPage]);

  const submitPost = async () => {
    if (!selectedPage) { setToast({ type: "error", message: "Please select a page first." }); return; }
    if (!headline.trim()) { setToast({ type: "error", message: "Title is required." }); return; }
    setIsSubmitting(true);
    try {
      if (postImageFile.file) {
        // image_method = "file" — binary sent as multipart FormData
        const fd = new FormData();
        fd.append("type", "compose_post");
        fd.append("image_method", "file");
        fd.append("page", selectedPage);
        fd.append("template", selectedTemplateObj?.name ?? "");
        fd.append("title", headline.trim());
        fd.append("description", caption.trim());
        fd.append("orientation", orientation);
        fd.append("image_url", "");
        fd.append("image", postImageFile.file);
        await fetch(FORMS_WEBHOOK, { method: "POST", mode: "no-cors", body: fd });
      } else {
        // image_method = "url" or "none" — use URLSearchParams (form-encoded) so n8n parses fields
        const params = new URLSearchParams();
        params.append("type", "compose_post");
        params.append("image_method", postImageUrl.trim() ? "url" : "none");
        params.append("page", selectedPage);
        params.append("template", selectedTemplateObj?.name ?? "");
        params.append("title", headline.trim());
        params.append("description", caption.trim());
        params.append("orientation", orientation);
        params.append("image_url", postImageUrl.trim());
        await fetch(FORMS_WEBHOOK, { method: "POST", mode: "no-cors", body: params });
      }
      setQueue((prev) => [{
        id: Date.now(), page: selectedPage, headline: headline.trim(), caption: caption.trim(),
        template: "News", status: "Pending", scheduledTime: "Now",
        pageColor: selectedPage === "TrendWire Daily" ? "bg-cyan-400" : selectedPage === "Civic Pulse" ? "bg-violet-400" : "bg-emerald-400",
      }, ...prev]);
      setToast({ type: "success", message: "Post sent to queue." });
      setHeadline(""); setCaption(""); setPostImageUrl(""); setPostImageFile({ file: null, preview: null });
    } catch { setToast({ type: "error", message: "Failed to send post." }); }
    finally { setIsSubmitting(false); }
  };

  const imgIcon = <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

  return (
    <>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className={cn("fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm shadow-xl",
            toast.type === "success" ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-200" : "bg-rose-500/20 border-rose-500/35 text-rose-200"
          )}>
          {toast.message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Left column — tabbed card ── */}
        <Card className="xl:col-span-3 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b border-white/10">
            <div className="flex-1 py-3.5 text-sm font-semibold text-[#0d9488] border-b-2 border-[#0d9488] bg-[#0d9488]/5 text-center">
              Compose Post
            </div>
          </div>

          <div className="p-5">
            {/* ── Post form ── */}
            <div className="space-y-5">
                <div>
                  <Label className="mb-2 block">Select Page</Label>
                  <div className="flex flex-wrap gap-2">
                    {pages.map((page) => (
                      <button key={page} type="button" onClick={() => setSelectedPage(page)}
                        className={cn("px-3 py-1.5 rounded-full border text-sm transition-colors",
                          selectedPage === page ? "border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10" : "border-border text-muted-foreground"
                        )}>
                        {page}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Select Template</Label>
                  {sheetTemplates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No templates saved yet — create one in the Templates page.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sheetTemplates.map((t) => (
                        <button key={t.name} type="button"
                          onClick={() => setSelectedTemplateObj(selectedTemplateObj?.name === t.name ? null : t)}
                          className={cn("px-3 py-1.5 rounded-full border text-sm transition-colors",
                            selectedTemplateObj?.name === t.name ? "border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10" : "border-border text-muted-foreground"
                          )}>
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="headline">Title</Label>
                    <span className="text-xs text-muted-foreground">{headline.length}/80</span>
                  </div>
                  <Input id="headline" value={headline} maxLength={80} onChange={(e) => setHeadline(e.target.value)} placeholder="Enter a strong title" className="h-12" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="caption">Description</Label>
                    <span className="text-xs text-muted-foreground">{caption.length}/300</span>
                  </div>
                  <textarea id="caption" rows={4} maxLength={300} value={caption} onChange={(e) => setCaption(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="Write your description..." />
                </div>

                {/* Image — URL or file upload */}
                <div>
                  <Label className="mb-2 block">Image</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Paste image URL..."
                      value={postImageUrl}
                      onChange={(e) => { setPostImageUrl(e.target.value); setPostImageFile({ file: null, preview: null }); if (postImageInputRef.current) postImageInputRef.current.value = ""; }}
                      className="h-11"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex-1 h-px bg-border" />
                      <span>or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div
                      className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-[#0d9488]/60 transition-colors overflow-hidden"
                      style={{ minHeight: 80 }}
                      onClick={() => postImageInputRef.current?.click()}
                    >
                      <input ref={postImageInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file) { setPostImageFile({ file, preview: URL.createObjectURL(file) }); setPostImageUrl(""); }
                        }}
                      />
                      {postImageFile.preview ? (
                        <>
                          <img src={postImageFile.preview} alt="upload" className="max-h-40 object-contain" />
                          <button type="button" onClick={(ev) => { ev.stopPropagation(); setPostImageFile({ file: null, preview: null }); if (postImageInputRef.current) postImageInputRef.current.value = ""; }}
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 p-4 text-muted-foreground">
                          {imgIcon}
                          <span className="text-xs">Click to upload image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Image Orientation</Label>
                  <div className="flex gap-3">
                    {(["portrait", "landscape"] as const).map((opt) => (
                      <button key={opt} type="button" onClick={() => setOrientation(opt)}
                        className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                          orientation === opt ? "border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10" : "border-border text-muted-foreground hover:text-foreground"
                        )}>
                        <span className={cn("inline-block border-2 rounded-sm border-current", opt === "portrait" ? "w-4 h-6" : "w-6 h-4")} />
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={submitPost} disabled={isSubmitting} className="w-full h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">Send to Queue <ChevronRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </div>

          </div>
        </Card>

        {/* ── Right column — Live Preview ── */}
        <Card className="xl:col-span-2 p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] self-start sticky top-4">
          <h3 className="text-lg font-bold mb-4">Live Preview</h3>
          {selectedTemplateObj?.html ? (
            <TemplatePreview html={selectedTemplateObj.html} title={selectedTemplateObj.name} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0d9488]/20 text-[#0d9488] grid place-items-center font-bold text-sm">
                    {(selectedPage || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold leading-5">{selectedPage || "No page selected"}</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>
                {selectedTemplateObj && <Badge className="border border-[#0d9488]/40 bg-[#0d9488]/15 text-[#2dd4bf]">{selectedTemplateObj.name}</Badge>}
              </div>
              <p className="font-semibold text-base mb-2">{headline || "Your title will appear here"}</p>
              <p className="text-sm text-muted-foreground leading-6">{caption || "Your description preview updates in real time while you type."}</p>
              {orientation && <p className="text-xs text-[#0d9488] mt-2">Orientation: {orientation.charAt(0).toUpperCase() + orientation.slice(1)}</p>}
              <p className="text-xs text-muted-foreground mt-3 opacity-60">Select a template above to see the full HTML preview.</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function TemplatePreview({ html, title }: { html: string; title: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.25);

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setScale(w / 1080);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-white rounded-xl w-full"
      style={{ aspectRatio: "1080 / 1350" }}
    >
      <iframe
        srcDoc={html || `<body style="margin:0;height:100%;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#999;font-size:14px;">No preview</body>`}
        title={title}
        sandbox="allow-scripts"
        scrolling="no"
        style={{
          width: 1080,
          height: 1350,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
}

function TemplateEditor({
  name, html,
  onNameChange, onHtmlChange,
  onSave, onCancel, isNew, saving,
}: {
  name: string;
  html: string;
  onNameChange: (v: string) => void;
  onHtmlChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
  saving: boolean;
}) {

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 120px)" }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-black tracking-tight">{isNew ? "New Template" : "Edit Template"}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white" onClick={onSave} disabled={!name.trim() || saving}>
            {saving ? "Saving…" : "Save Template"}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Template Name</label>
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Template name…" className="max-w-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <label className="text-sm font-medium mb-2">
            HTML Template <span className="text-muted-foreground font-normal">(1080 × 1350 px canvas)</span>
          </label>
          <textarea
            value={html}
            onChange={(e) => onHtmlChange(e.target.value)}
            placeholder="Enter your HTML template here…"
            spellCheck={false}
            className="flex-1 w-full rounded-xl border border-border bg-background p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488] min-h-[300px]"
          />
        </div>
        <div className="flex flex-col min-h-0">
          <label className="text-sm font-medium mb-2">
            Live Preview <span className="text-muted-foreground font-normal">1080 × 1350</span>
          </label>
          <div className="flex-1 overflow-auto">
            <TemplatePreview html={html} title={name || "Preview"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatesPage({ onUseTemplate }: { onUseTemplate: (template: TemplateName) => void }) {
  const connConfig = useConnectionsConfig();
  const SCRIPT_URL = connConfig.composeScriptUrl?.trim() || "https://script.google.com/macros/s/AKfycbwuZP1ETiVjr0_LCirp-sY1vLVXJ8p4P-3_z1grHxULRN-k2PuwqLlSxDpgqglo6Qf7Hw/exec";

  const [templates, setTemplates] = React.useState<TemplateItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingName, setEditingName] = React.useState<string | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formHtml, setFormHtml] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const fetchTemplates = React.useCallback(async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getTemplates`, { cache: "no-store" });
      if (!res.ok) { setLoading(false); return; }
      const rows = await res.json() as Array<Record<string, string>>;
      if (Array.isArray(rows)) {
        setTemplates(
          rows
            .filter((r) => r["Template Name"])
            .map((r, i) => ({
              id: i + 1,
              name: r["Template Name"] || "",
              category: "News" as TemplateCategory,
              html: r["Template_code"] || "",
              usedCount: 0,
              accent: "#0d9488",
              bg: "from-teal-500/35 to-teal-800/20",
            }))
        );
      }
    } catch { /* keep empty */ }
    finally { setLoading(false); }
  }, [SCRIPT_URL]);

  React.useEffect(() => { void fetchTemplates(); }, [fetchTemplates]);

  const filteredTemplates = React.useMemo(() => {
    if (!query.trim()) return templates;
    return templates.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, templates]);

  const openNew = () => {
    setEditingName(null);
    setFormName("");
    setFormHtml(
      `<div style="width:1080px;height:1350px;background:#1a1a2e;display:flex;flex-direction:column;justify-content:flex-end;padding:60px;box-sizing:border-box;font-family:sans-serif;">\n  <h1 style="color:#fff;font-size:64px;font-weight:900;margin:0 0 24px;line-height:1.1;">Your Headline Here</h1>\n  <p style="color:rgba(255,255,255,0.75);font-size:32px;margin:0;line-height:1.5;">Your caption goes here.</p>\n</div>`
    );
    setEditorOpen(true);
  };

  const openEdit = (item: TemplateItem) => {
    setEditingName(item.name);
    setFormName(item.name);
    setFormHtml(item.html || "");
    setEditorOpen(true);
  };

  const saveTemplate = async () => {
    setSaving(true);
    const updated: TemplateItem = {
      id: editingName !== null ? (templates.find((t) => t.name === editingName)?.id ?? Date.now()) : Date.now(),
      name: formName,
      category: "News",
      html: formHtml,
      usedCount: 0,
      accent: "#0d9488",
      bg: "from-teal-500/35 to-teal-800/20",
    };

    if (editingName !== null) {
      setTemplates((prev) => prev.map((t) => (t.name === editingName ? updated : t)));
    } else {
      setTemplates((prev) => [...prev, updated]);
    }
    setEditorOpen(false);

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "saveTemplate",
          "Template Name": formName,
          "Template_code": formHtml,
        }),
      });
      await new Promise<void>((r) => setTimeout(r, 1200));
      await fetchTemplates();
    } catch { /* optimistic state stays */ }
    finally { setSaving(false); }
  };

  const deleteTemplate = async (item: TemplateItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setTemplates((prev) => prev.filter((t) => t.name !== item.name));
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "deleteTemplate", "Template Name": item.name }),
      });
      await new Promise<void>((r) => setTimeout(r, 1200));
      await fetchTemplates();
    } catch { /* optimistic delete stays */ }
  };

  if (editorOpen) {
    return (
      <TemplateEditor
        name={formName}
        html={formHtml}
        onNameChange={setFormName}
        onHtmlChange={setFormHtml}
        onSave={saveTemplate}
        onCancel={() => setEditorOpen(false)}
        isNew={editingName === null}
        saving={saving}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight">Post Templates</h2>
        <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="pl-10" />
      </div>

      {loading && (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading templates…</div>
      )}

      {!loading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0d9488]/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-[#0d9488]" />
          </div>
          <div>
            <p className="font-semibold text-lg">No templates yet</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first template to get started</p>
          </div>
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2 mt-2" onClick={openNew}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      )}

      {!loading && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((item) => (
            <motion.div key={item.name} whileHover={{ y: -2 }} className="group">
              <Card className="overflow-hidden rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328]">
                <div className="relative p-3 bg-gradient-to-br from-slate-900/80 to-slate-950/95">
                  <TemplatePreview html={item.html || ""} title={item.name} />
                  <div className="absolute inset-0 bg-[#020617]/70 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center p-4">
                    <div className="w-full max-w-[210px] space-y-2">
                      <Button
                        className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white"
                        onClick={() => onUseTemplate("News")}
                      >
                        Use Template
                      </Button>
                      <Button variant="outline" className="w-full border-white/40 text-white hover:bg-white/10" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="outline" className="w-full border-red-400/40 text-red-400 hover:bg-red-500/10" onClick={() => deleteTemplate(item)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-semibold text-base">{item.name}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
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

  const { syncData, setPages, syncNow, recentPosts } = useSync();
  const [showForm, setShowForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = React.useState({ displayName: "", handle: "", pageId: "", accessToken: "" });
  const [fetchedData, setFetchedData] = React.useState<{ name: string; username: string; followers: string; reach: string } | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submissionLog, setSubmissionLog] = React.useState<PageStorageSubmission[]>([]);

  const connConfig = useConnectionsConfig();
  const APPS_SCRIPT_URL = connConfig.pagesScriptUrl?.trim() || "https://script.google.com/macros/s/AKfycbz5HtEOSeVhzjnPXEVistZ6jcrXogHL7V1jLk_zGKo5CCDMl5aVcGyIGhRCviVNfEI/exec";

  const pushSubmissionLog = React.useCallback((entry: PageStorageSubmission) => {
    setSubmissionLog((prev) => {
      return [entry, ...prev].slice(0, 20);
    });
  }, []);

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
      await syncNow();
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
      await syncNow();
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
                {page.apiError && (
                  <p className="truncate text-rose-400 font-medium mt-1">⚠ Token error: {page.apiError}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 my-4">
                {(() => {
                  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
                  const pagePostsLast7 = recentPosts.filter((rp) => rp.pageName === page.name && (rp.createdAt ? Date.parse(rp.createdAt) >= cutoff : false)).length;
                  const displayPosts = pagePostsLast7 || page.postsToday;
                  return (
                    <>
                      <div className="rounded-lg border border-white/10 p-2"><p className="text-[11px] text-muted-foreground">Posts (7d)</p><p className="font-semibold mt-1">{displayPosts}</p></div>
                      <div className="rounded-lg border border-white/10 p-2"><p className="text-[11px] text-muted-foreground">Reach</p><p className="font-semibold mt-1">{page.reach}</p></div>
                      <div className="rounded-lg border border-white/10 p-2"><p className="text-[11px] text-muted-foreground">Followers</p><p className="font-semibold mt-1">{page.followers}</p></div>
                    </>
                  );
                })()}
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
  const { liveComments, syncData } = useSync();
  const [activeFilter, setActiveFilter] = React.useState<ModerationFilter>("All");
  const [pageFilter, setPageFilter] = React.useState<string>("All");
  const [comments, setComments] = React.useState<CommentItem[]>(liveComments);
  const [removingId, setRemovingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setComments(liveComments);
  }, [liveComments]);

  const pageOptions = React.useMemo(() => {
    const fromComments = liveComments.map((c) => c.pageName);
    const fromPages = syncData.pages.map((p) => p.name);
    return ["All", ...Array.from(new Set([...fromPages, ...fromComments]))];
  }, [liveComments, syncData.pages]);

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
  // Use recentPosts count, but fall back to postsToday from FB metrics API if recentPosts is empty
  const postsLast7 = inLastDays(7) || (selectedPagePosts.length === 0 ? 0 : 0);
  const postsLast30 = Math.max(inLastDays(30), selectedPagePosts.length === 0 ? (selectedPageMetrics?.postsToday ?? 0) : 0);

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

  const lastSyncedLabel = React.useMemo(() => {
    if (lastSyncedAt === null) return "Not synced yet";
    const secs = Math.max(0, Math.floor((Date.now() - lastSyncedAt) / 1000));
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  // re-compute every render (parent ticks every 1 s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSyncedAt, syncStatus]);

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

function ConnFieldRow({
  label, value, envVal, secret = false, testable = false,
  placeholder = "", onChange, onTest, testState = "idle",
}: {
  label: string;
  value: string;
  envVal: string;
  secret?: boolean;
  testable?: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
  onTest?: () => void;
  testState?: "idle" | "ok" | "fail" | "loading";
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [reveal, setReveal] = React.useState(false);

  const src: "env" | "custom" | "empty" = !value ? "empty" : (envVal && value === envVal ? "env" : "custom");
  const hasEnv = !!envVal;

  const startEdit = () => { setDraft(value); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setReveal(false); };
  const confirmEdit = () => { onChange(draft); setEditing(false); setReveal(false); };
  const resetEnv = () => { onChange(envVal); setEditing(false); setReveal(false); };

  const masked = (v: string) => (v ? "•".repeat(Math.min(v.length, 40)) : "");

  const Badge = () => {
    if (src === "env") return <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">ENV</span>;
    if (src === "custom") return <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/15 text-amber-400">CUSTOM</span>;
    return <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-500/40 bg-slate-500/10 text-slate-500">EMPTY</span>;
  };

  const StatusIcon = () => {
    if (testState === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
    if (testState === "fail") return <X className="h-4 w-4 text-rose-400 shrink-0" />;
    if (testState === "loading") return <RefreshCcw className="h-4 w-4 animate-spin text-sky-300 shrink-0" />;
    return null;
  };

  return (
    <div className={cn("rounded-xl border px-4 py-3 transition-all", editing ? "border-[#0d9488]/60 bg-[#0d9488]/5" : "border-white/8 hover:border-white/20")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold shrink-0">{label}</span>
          <Badge />
        </div>
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            {testable && value && onTest && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={onTest}>Test</Button>
                <StatusIcon />
              </>
            )}
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-sky-400 hover:text-sky-300 hover:bg-sky-400/10" onClick={startEdit}>
              <SlidersHorizontal className="h-3 w-3" /> Edit
            </Button>
          </div>
        )}
      </div>

      {!editing && (
        <div className="mt-1 flex items-center gap-2">
          {value ? (
            secret ? (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-foreground/55 tracking-wider">{reveal ? value : masked(value)}</span>
                <button type="button" onClick={() => setReveal((p) => !p)} className="text-muted-foreground hover:text-foreground">
                  {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : (
              <span className="font-mono text-xs text-foreground/55 break-all">{value}</span>
            )
          ) : (
            <span className="text-xs text-muted-foreground italic">{hasEnv ? "Loaded from .env" : "Not set"}</span>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                autoFocus
                type={secret && !reveal ? "password" : "text"}
                placeholder={placeholder || (hasEnv ? "Paste new value or leave blank to use .env" : "Enter value…")}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
                className="font-mono text-xs h-9 pr-8"
              />
              {secret && (
                <button type="button" onClick={() => setReveal((p) => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            <Button size="sm" className="h-9 px-3 bg-[#0d9488] hover:bg-[#0f766e] text-white shrink-0" onClick={confirmEdit}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 px-2 shrink-0 text-muted-foreground hover:text-foreground" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {hasEnv && src !== "env" && (
            <button type="button" onClick={resetEnv} className="text-[10px] text-sky-400 hover:underline">
              Reset to ENV value
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectionsPage() {
  const envVars: Partial<Record<keyof ConnectionsConfig, string>> = {
    n8nApiKey: String(import.meta.env.VITE_N8N_API_KEY ?? ""),
    formsWebhookUrl: String(import.meta.env.VITE_N8N_FORMS_WEBHOOK_URL ?? ""),
    syncWebhook: String(import.meta.env.VITE_N8N_PAGE_WEBHOOK_URL ?? ""),
    baseWebhookUrl: String(import.meta.env.VITE_VERIFY_WEBHOOK_URL ?? ""),
    sheetDeploymentId: String(import.meta.env.VITE_GSHEET_SCRIPT_ID ?? ""),
    sheetWebAppUrl: String(import.meta.env.VITE_GSHEET_WEB_APP_URL ?? ""),
    composeScriptUrl: String(import.meta.env.VITE_GSHEET_URL ?? ""),
  };

  const [config, setConfig] = React.useState<ConnectionsConfig>(() => {
    try {
      const raw = localStorage.getItem("connections-config");
      const saved: Partial<ConnectionsConfig> = raw ? JSON.parse(raw) : {};
      const merged = { ...defaultConnections };
      (Object.keys(defaultConnections) as Array<keyof ConnectionsConfig>).forEach((k) => {
        const savedVal = saved[k] as string | undefined;
        const envVal = (envVars[k] ?? "") as string;
        (merged as Record<string, unknown>)[k] = savedVal !== undefined && savedVal !== "" ? savedVal : envVal;
      });
      return merged;
    } catch {
      return { ...defaultConnections };
    }
  });

  const [testStates, setTestStates] = React.useState<Record<string, "idle" | "ok" | "fail" | "loading">>({});
  const [savedToast, setSavedToast] = React.useState(false);

  React.useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(false), 2200);
    return () => clearTimeout(t);
  }, [savedToast]);

  const setField = (field: keyof ConnectionsConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const ping = async (url: string, key: string) => {
    if (!url) { setTestStates((p) => ({ ...p, [key]: "fail" })); return; }
    setTestStates((p) => ({ ...p, [key]: "loading" }));
    try {
      await fetch(url, { method: "GET", mode: "no-cors" });
      setTestStates((p) => ({ ...p, [key]: "ok" }));
    } catch {
      setTestStates((p) => ({ ...p, [key]: "fail" }));
    }
  };

  const saveConfig = () => {
    const overrides: Partial<ConnectionsConfig> = {};
    (Object.keys(defaultConnections) as Array<keyof ConnectionsConfig>).forEach((k) => {
      const val = config[k] as string;
      const envVal = (envVars[k] ?? "") as string;
      if (val !== envVal && val !== "") (overrides as Record<string, unknown>)[k] = val;
    });
    localStorage.setItem("connections-config", JSON.stringify(overrides));
    window.dispatchEvent(new Event(CONNECTIONS_CONFIG_UPDATED_EVENT));
    setSavedToast(true);
  };

  const row = (field: keyof ConnectionsConfig, label: string, opts: { secret?: boolean; testable?: boolean; placeholder?: string } = {}) => (
    <ConnFieldRow
      key={field}
      label={label}
      value={config[field] as string}
      envVal={(envVars[field] ?? "") as string}
      secret={opts.secret}
      testable={opts.testable}
      placeholder={opts.placeholder}
      onChange={(v) => setField(field, v)}
      onTest={opts.testable ? () => ping(config[field] as string, field) : undefined}
      testState={testStates[field] ?? "idle"}
    />
  );

  return (
    <div className="space-y-5 pb-28">
      {savedToast && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 right-6 z-50 px-4 py-2 rounded-lg border border-emerald-500/35 bg-emerald-500/20 text-emerald-200 text-sm shadow-lg">
          Connections saved.
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">Connections</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> ENV = from .env file</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> CUSTOM = manually set</span>
        </div>
      </div>

      {/* n8n API */}
      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-white/10">
          <Zap className="h-4 w-4 text-[#0d9488]" />
          <h3 className="text-base font-bold">n8n API</h3>
        </div>
        {row("n8nApiKey", "API Key", { secret: true, placeholder: "Paste n8n Public API key" })}
        {row("n8nApiBaseUrl", "API Base URL", { testable: true, placeholder: "https://n8n.example.com/api/v1" })}
      </Card>

      {/* n8n Webhooks */}
      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-white/10">
          <GitBranch className="h-4 w-4 text-[#0d9488]" />
          <h3 className="text-base font-bold">n8n Webhooks</h3>
        </div>
        {row("formsWebhookUrl", "Forms Webhook URL", { testable: true })}
        {row("syncWebhook", "Page Data Webhook URL", { testable: true })}
        {row("baseWebhookUrl", "Verify Webhook URL", { testable: true })}
        {row("mediaWebhookUrl", "Media Upload Webhook URL", { testable: true })}
      </Card>

      {/* Google Sheets */}
      <Card className="p-5 rounded-2xl border border-white/10 bg-white/95 dark:bg-[#081328] space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-white/10">
          <FileText className="h-4 w-4 text-[#0d9488]" />
          <h3 className="text-base font-bold">Google Sheets</h3>
        </div>
        {row("sheetDeploymentId", "Script Deployment ID", { placeholder: "AKfyc…" })}
        {row("sheetWebAppUrl", "Web App URL", { testable: true, placeholder: "https://script.google.com/macros/s/…/exec" })}
        {row("composeScriptUrl", "Compose & Templates Script URL", { testable: true, placeholder: "https://script.google.com/macros/s/…/exec" })}
        {row("pagesScriptUrl", "Pages Script URL", { testable: true, placeholder: "https://script.google.com/macros/s/…/exec" })}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-white/10 z-40">
        <div className="max-w-7xl mx-auto">
          <Button onClick={saveConfig} className="w-full h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Save Connections</Button>
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
      case "Media Upload":
        return <MediaUploadPage />;
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
