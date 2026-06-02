import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Zap, Settings, Bell, Search, Filter,
  LayoutDashboard, Activity, Brain, Wifi, WifiOff,
  ChevronRight, Sparkles, Plus, Globe, RefreshCw,
  Facebook, Instagram, Linkedin, Twitter, Youtube, PlayCircle,
  TrendingUp, Users, BarChart3, Clock, CheckCircle2,
  AlertTriangle, Loader2, X as XIcon, Rocket, Send, MessageSquare
} from 'lucide-react';
import type { SocialProfile, QueuedPost, BrainCommandState, PlatformId } from '../components/social/types';
import { autopilotEngine } from '../components/social/AutopilotEngine';
import { ProfileCard } from '../components/social/ProfileCard';
import { LiveControlPanel } from '../components/social/LiveControlPanel';
import { toast } from 'sonner';
import { serverFetch } from '../utils/serverFetch';

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO DATA — Seed profiles for immediate operation
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO_PROFILES: SocialProfile[] = [
  {
    id: 'prof-fb-001',
    userId: 'user-001',
    name: 'Sarah Marketing Pro',
    username: 'sarah.marketing',
    provider: 'facebook',
    avatarUrl: 'https://images.unsplash.com/photo-1696960181436-1b6d9576354e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHNvY2lhbCUyMG1lZGlhJTIwbWFuYWdlcnxlbnwxfHx8fDE3NzM0MTUyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    autopilotEnabled: true,
    status: 'active',
    followers: 45200,
    engagement: 4.8,
    lastPostAt: Date.now() - 3600000,
    connectedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'prof-ig-001',
    userId: 'user-001',
    name: 'Visual Stories Studio',
    username: 'visualstories',
    provider: 'instagram',
    avatarUrl: 'https://images.unsplash.com/photo-1758273705996-bdeefbdbce5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHdvbWFuJTIwZGlnaXRhbCUyMG1hcmtldGluZ3xlbnwxfHx8fDE3NzM0NDU5Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    autopilotEnabled: true,
    status: 'active',
    followers: 128500,
    engagement: 6.2,
    lastPostAt: Date.now() - 7200000,
    connectedAt: Date.now() - 86400000 * 45,
  },
  {
    id: 'prof-tw-001',
    userId: 'user-001',
    name: 'Tech Pulse Daily',
    username: 'techpulsedaily',
    provider: 'twitter',
    avatarUrl: 'https://images.unsplash.com/photo-1686543971025-15aa01b5f7c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHRlY2glMjBlbnRyZXByZW5ldXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM0NDU5ODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    autopilotEnabled: false,
    status: 'active',
    followers: 32100,
    engagement: 3.1,
    lastPostAt: Date.now() - 14400000,
    connectedAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'prof-tt-001',
    userId: 'user-001',
    name: 'Viral Content Lab',
    username: 'viralcontentlab',
    provider: 'tiktok',
    avatarUrl: 'https://images.unsplash.com/photo-1723537742563-15c3d351dbf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzM4NzA4MXww&ixlib=rb-4.1.0&q=80&w=1080',
    autopilotEnabled: true,
    status: 'active',
    followers: 256000,
    engagement: 8.5,
    lastPostAt: Date.now() - 1800000,
    connectedAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'prof-li-001',
    userId: 'user-001',
    name: 'Enterprise Growth Hub',
    username: 'enterprisegrowth',
    provider: 'linkedin',
    avatarUrl: 'https://images.unsplash.com/photo-1696960181436-1b6d9576354e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHNvY2lhbCUyMG1lZGlhJTIwbWFuYWdlcnxlbnwxfHx8fDE3NzM0MTUyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    autopilotEnabled: false,
    status: 'active',
    followers: 18700,
    engagement: 2.9,
    lastPostAt: Date.now() - 86400000,
    connectedAt: Date.now() - 86400000 * 90,
  },
  {
    id: 'prof-yt-001',
    userId: 'user-001',
    name: 'Shorts Factory',
    username: 'shortsfactory',
    provider: 'youtube',
    avatarUrl: 'https://images.unsplash.com/photo-1758273705996-bdeefbdbce5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHdvbWFuJTIwZGlnaXRhbCUyMG1hcmtldGluZ3xlbnwxfHx8fDE3NzM0NDU5Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    autopilotEnabled: true,
    status: 'active',
    followers: 89400,
    engagement: 5.1,
    lastPostAt: Date.now() - 10800000,
    connectedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'prof-pin-001',
    userId: 'user-001',
    name: 'Design Inspiration Board',
    username: 'designinspo',
    provider: 'pinterest',
    avatarUrl: 'https://images.unsplash.com/photo-1723537742563-15c3d351dbf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzM4NzA4MXww&ixlib=rb-4.1.0&q=80&w=1080',
    autopilotEnabled: false,
    status: 'paused',
    followers: 12300,
    engagement: 7.2,
    lastPostAt: null,
    connectedAt: Date.now() - 86400000 * 10,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TABS
// ═══════════════════════════════════════════════════════════════════════════════

type DashboardTab = 'dashboard' | 'control' | 'settings';

const platformIcons: Record<PlatformId, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: PlayCircle,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  pinterest: TrendingUp,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SocialAccountsDashboardProps {
  onBack: () => void;
}

export function SocialAccountsDashboard({ onBack }: SocialAccountsDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [profiles, setProfiles] = useState<SocialProfile[]>(DEMO_PROFILES);
  const [engineState, setEngineState] = useState<BrainCommandState>(autopilotEngine.state);
  const [generatingProfile, setGeneratingProfile] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [queuedPosts, setQueuedPosts] = useState<QueuedPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');
  const [showOnboarding, setShowOnboarding] = useState(true);
  // ── Connected Accounts (real, from server) ──────────────────────────────
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  // ── Quick Compose ───────────────────────────────────────────────────────
  const [composeContent, setComposeContent] = useState('');
  const [composeSelectedAccounts, setComposeSelectedAccounts] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  // ── Fetch real connected accounts from Social Accounts Hub ──────────────
  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const res = await serverFetch('/social-accounts');
      if (res.ok) {
        const data = await res.json();
        const accounts = data.accounts || [];
        setConnectedAccounts(accounts);
        console.log(`[SocialDashboard] Loaded ${accounts.length} connected account(s)`);

        // Convert connected accounts to SocialProfile format and merge with demos
        if (accounts.length > 0) {
          const realProfiles: SocialProfile[] = accounts.map((acc: any) => ({
            id: acc.id,
            userId: 'connected',
            name: acc.username || `${acc.platform} Account`,
            username: acc.username || acc.platform,
            provider: acc.platform as PlatformId,
            avatarUrl: acc.profileImage || '',
            autopilotEnabled: false,
            status: acc.status === 'active' ? 'active' as const : 'expired' as const,
            followers: acc.metadata?.followers || 0,
            engagement: acc.metadata?.engagement || 0,
            lastPostAt: acc.lastSynced || null,
            connectedAt: acc.lastSynced || Date.now(),
            metadata: { connectedAccountId: acc.id, isReal: true },
          }));

          // Replace demo profiles for platforms that have real accounts
          const realPlatforms = new Set(realProfiles.map(p => p.provider));
          const remainingDemos = DEMO_PROFILES.filter(d => !realPlatforms.has(d.provider));
          const merged = [...realProfiles, ...remainingDemos];
          setProfiles(merged);
          autopilotEngine.initProfiles(merged);
          toast.success(`${accounts.length} connected account(s) loaded from Social Accounts Hub`);
        }
      }
    } catch (error) {
      console.error('[SocialDashboard] Failed to fetch connected accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // ── Publish to connected accounts ────────────────────────────────────────
  const handlePublishToAccounts = useCallback(async () => {
    if (!composeContent.trim() || composeSelectedAccounts.length === 0) {
      toast.error('Write some content and select at least one account');
      return;
    }

    setPublishing(true);
    try {
      const res = await serverFetch('/social-accounts/publish-multi', {
        method: 'POST',
        body: JSON.stringify({
          accountIds: composeSelectedAccounts,
          content: composeContent,
        }),
      });

      const data = await res.json();
      if (data.results) {
        const results = data.results;
        const successCount = Object.values(results).filter((r: any) => r.success).length;
        const failCount = Object.values(results).filter((r: any) => !r.success).length;

        if (successCount > 0) {
          toast.success(`Published to ${successCount} account(s)!`);
          setComposeContent('');
          setComposeSelectedAccounts([]);
        }
        if (failCount > 0) {
          const failures = Object.entries(results)
            .filter(([_, r]: [string, any]) => !r.success)
            .map(([id, r]: [string, any]) => `${r.platform}: ${r.error}`)
            .join('; ');
          toast.error(`${failCount} failed: ${failures}`);
        }
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error: any) {
      console.error('[Publish] Error:', error);
      toast.error(`Publish failed: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  }, [composeContent, composeSelectedAccounts]);

  // ── Initialize engine with profiles ──────────────────────────────────────

  useEffect(() => {
    autopilotEngine.initProfiles(DEMO_PROFILES);
    autopilotEngine.startDailyAutopilot();
    // Fetch real connected accounts from server
    fetchConnectedAccounts();

    const unsub = autopilotEngine.subscribe((state) => {
      setEngineState(state);
      // Only update profiles from engine if no real accounts have loaded
      if (connectedAccounts.length === 0) {
        setProfiles([...autopilotEngine.getProfiles()]);
      }
      setQueuedPosts([...autopilotEngine.getQueuedPosts()]);
    });

    return () => {
      unsub();
      autopilotEngine.stopDailyAutopilot();
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleAutopilot = useCallback(async (profileId: string) => {
    try {
      const enabled = await autopilotEngine.toggle(profileId);
      setProfiles([...autopilotEngine.getProfiles()]);
      toast.success(enabled ? 'Autopilot enabled!' : 'Autopilot disabled');
    } catch (err) {
      toast.error('Failed to toggle autopilot');
    }
  }, []);

  const handleGeneratePost = useCallback(async (profileId: string) => {
    setGeneratingProfile(profileId);
    try {
      const posts = await autopilotEngine.run(profileId);
      setQueuedPosts([...autopilotEngine.getQueuedPosts()]);
      setProfiles([...autopilotEngine.getProfiles()]);
      toast.success(`Generated ${posts.length} posts!`);
    } catch (err) {
      toast.error('Failed to generate posts');
    }
    setGeneratingProfile(null);
  }, []);

  const handleReschedulePost = useCallback(async (postId: string) => {
    try {
      await autopilotEngine.reschedule(postId);
      setQueuedPosts([...autopilotEngine.getQueuedPosts()]);
      toast.success('Post rescheduled');
    } catch {
      toast.error('Failed to reschedule');
    }
  }, []);

  const handleCancelPost = useCallback(async (postId: string) => {
    try {
      await autopilotEngine.cancelPost(postId);
      setQueuedPosts([...autopilotEngine.getQueuedPosts()]);
      toast.success('Post cancelled');
    } catch {
      toast.error('Failed to cancel post');
    }
  }, []);

  const handleRunAll = useCallback(async () => {
    setIsRunningAll(true);
    try {
      await autopilotEngine.runAll();
      setQueuedPosts([...autopilotEngine.getQueuedPosts()]);
      setProfiles([...autopilotEngine.getProfiles()]);
      toast.success('All autopilots completed!');
    } catch {
      toast.error('Some autopilots failed');
    }
    setIsRunningAll(false);
  }, []);

  const handleClearLogs = useCallback(() => {
    engineState.logs = [];
    setEngineState({ ...engineState });
  }, [engineState]);

  // ── Filtered profiles ────────────────────────────────────────────────────

  const filteredProfiles = profiles.filter((p) => {
    if (platformFilter !== 'all' && p.provider !== platformFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Computed stats ───────────────────────────────────────────────────────

  const totalFollowers = profiles.reduce((s, p) => s + p.followers, 0);
  const avgEngagement = profiles.length
    ? (profiles.reduce((s, p) => s + p.engagement, 0) / profiles.length).toFixed(1)
    : '0';
  const autopilotCount = profiles.filter((p) => p.autopilotEnabled).length;
  const activeConnected = connectedAccounts.filter(a => a.status === 'active');

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e2f] overflow-hidden flex flex-col">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-[#1e1e2f] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-[#00f6ff] font-bold text-lg flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Social Command Center
              </h1>
              <p className="text-gray-500 text-[11px]">
                {activeConnected.length > 0
                  ? `${activeConnected.length} live account(s) connected`
                  : 'Brain Command Autopilot Engine v1.0'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global stats badges */}
            <div className="hidden sm:flex items-center gap-2">
              {activeConnected.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-lg text-[11px] text-emerald-400 border border-emerald-500/20 font-bold">
                  <Wifi className="w-3 h-3" />
                  {activeConnected.length} LIVE
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-[11px] text-gray-300 border border-white/5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                {(totalFollowers / 1000).toFixed(0)}K total
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 rounded-lg text-[11px] text-cyan-400 border border-cyan-500/20 font-bold">
                <Zap className="w-3.5 h-3.5" />
                {autopilotCount}/{profiles.length} auto
              </span>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
              {([
                { id: 'dashboard' as DashboardTab, icon: LayoutDashboard, label: 'Dashboard' },
                { id: 'control' as DashboardTab, icon: Activity, label: 'Control' },
                { id: 'settings' as DashboardTab, icon: Settings, label: 'Settings' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/20'
                      : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* DASHBOARD TAB */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Connected Accounts Status Banner */}
              {loadingAccounts ? (
                <div className="flex items-center gap-2 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-gray-400 text-xs">Loading connected accounts from Social Accounts Hub...</span>
                </div>
              ) : connectedAccounts.length === 0 ? (
                <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-amber-300 text-xs font-bold">No Connected Accounts</p>
                    <p className="text-gray-500 text-[10px]">
                      Open the Social Accounts Hub (Settings tab) to connect your real social media accounts. Demo profiles are shown below.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-6 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 text-xs font-medium">
                    {activeConnected.length} live account(s) connected &mdash; real profiles replace demo data
                  </span>
                  <button
                    onClick={fetchConnectedAccounts}
                    className="ml-auto text-gray-500 hover:text-cyan-400 transition-colors"
                    title="Refresh accounts"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ── Quick Compose Panel (real connected accounts) ───────── */}
              {activeConnected.length > 0 && (
                <div className="bg-[#292946] rounded-2xl border border-white/5 p-5 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">Quick Compose</h3>
                      <p className="text-gray-500 text-[10px]">Publish directly to your real connected accounts</p>
                    </div>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      LIVE
                    </span>
                  </div>

                  {/* Account selector */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activeConnected.map((acc: any) => {
                      const isSelected = composeSelectedAccounts.includes(acc.id);
                      const Icon = platformIcons[acc.platform as PlatformId] || Globe;
                      return (
                        <button
                          key={acc.id}
                          onClick={() =>
                            setComposeSelectedAccounts(prev =>
                              isSelected ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                            )
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-gray-300'
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>@{acc.username}</span>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Content textarea */}
                  <textarea
                    value={composeContent}
                    onChange={e => setComposeContent(e.target.value)}
                    placeholder="Write your post... This will publish to your real connected social accounts via their stored API tokens."
                    className="w-full h-24 p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all mb-3"
                  />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-600">{composeContent.length} chars</span>
                      {composeSelectedAccounts.length > 0 && (
                        <span className="text-cyan-400 font-medium">
                          &rarr; {composeSelectedAccounts.length} account(s)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handlePublishToAccounts}
                      disabled={publishing || !composeContent.trim() || composeSelectedAccounts.length === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${publishing || !composeContent.trim() || composeSelectedAccounts.length === 0
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                        }`}
                    >
                      {publishing ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...</>
                      ) : (
                        <><Send className="w-3.5 h-3.5" /> Publish Now</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                  <button
                    onClick={() => setPlatformFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${platformFilter === 'all'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                        : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    All
                  </button>
                  {(['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'youtube', 'pinterest'] as PlatformId[]).map((p) => {
                    const Icon = platformIcons[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setPlatformFilter(platformFilter === p ? 'all' : p)}
                        className={`p-1.5 rounded-lg transition-all ${platformFilter === p
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-gray-600 hover:text-gray-300'
                          }`}
                        title={p.charAt(0).toUpperCase() + p.slice(1)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onToggleAutopilot={handleToggleAutopilot}
                    onGeneratePost={handleGeneratePost}
                    onReschedulePost={handleReschedulePost}
                    onCancelPost={handleCancelPost}
                    isGenerating={generatingProfile === profile.id}
                    queuedPosts={queuedPosts.filter((p) => p.profileId === profile.id)}
                  />
                ))}

                {/* Add New Profile Card */}
                <button
                  className="bg-white/[0.02] rounded-2xl border border-dashed border-white/10 p-8 flex flex-col items-center justify-center gap-3 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group min-h-[200px]"
                  onClick={() => toast.info('Connect a new social account via the Social Accounts Hub (Settings tab)')}
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition-all">
                    <Plus className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <span className="text-gray-600 text-xs font-medium group-hover:text-gray-400 transition-colors">
                    Connect New Account
                  </span>
                </button>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <QuickStatCard icon={Zap} label="Posts Generated" value={engineState.stats.totalPostsGenerated} color="text-cyan-400" bg="bg-cyan-500/5 border-cyan-500/10" />
                <QuickStatCard icon={Clock} label="In Queue" value={queuedPosts.filter(p => p.status === 'scheduled').length} color="text-blue-400" bg="bg-blue-500/5 border-blue-500/10" />
                <QuickStatCard icon={CheckCircle2} label="Published" value={engineState.stats.totalPostsPublished} color="text-emerald-400" bg="bg-emerald-500/5 border-emerald-500/10" />
                <QuickStatCard icon={AlertTriangle} label="Errors Today" value={engineState.stats.errorsToday} color="text-red-400" bg="bg-red-500/5 border-red-500/10" />
              </div>

              {/* Live Control Panel (inline on dashboard) */}
              <LiveControlPanel
                state={engineState}
                onRunAll={handleRunAll}
                onClearLogs={handleClearLogs}
                isRunningAll={isRunningAll}
              />
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CONTROL TAB */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'control' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Brain Command System</h3>
                    <p className="text-gray-400 text-[11px]">Full autopilot control for all connected social profiles</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Autopilot Profiles */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-gray-300 text-xs font-semibold mb-3">Autopilot Profiles</h4>
                    <div className="space-y-2">
                      {profiles.map((p) => {
                        const Icon = platformIcons[p.provider];
                        const isReal = (p as any).metadata?.isReal;
                        return (
                          <div key={p.id} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-300 text-[11px] font-medium truncate max-w-[120px]">{p.name}</span>
                              {isReal && (
                                <span className="px-1 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] rounded font-bold">LIVE</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleToggleAutopilot(p.id)}
                              className={`w-8 h-4 rounded-full transition-all relative ${p.autopilotEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
                            >
                              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${p.autopilotEnabled ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Queue Summary */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-gray-300 text-xs font-semibold mb-3">Queue Summary</h4>
                    {queuedPosts.length === 0 ? (
                      <div className="text-center py-4">
                        <Clock className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-600 text-[11px]">No posts in queue</p>
                        <button onClick={handleRunAll} className="mt-2 text-cyan-400 text-[11px] font-medium hover:underline">Generate posts now</button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {queuedPosts.filter(p => p.status === 'scheduled').slice(0, 8).map((post) => {
                          const Icon = platformIcons[post.platform];
                          return (
                            <div key={post.id} className="flex items-center gap-2 py-1">
                              <Icon className="w-3 h-3 text-gray-500 shrink-0" />
                              <span className="text-gray-400 text-[10px] truncate flex-1">{post.content.slice(0, 40)}...</span>
                              <span className="text-gray-600 text-[9px] shrink-0">
                                {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Service Status */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-gray-300 text-xs font-semibold mb-3">Service Status</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Connected Accounts', status: activeConnected.length > 0 ? 'active' : 'placeholder', desc: activeConnected.length > 0 ? `${activeConnected.length} live account(s)` : 'No accounts connected' },
                        { name: 'Publish API', status: activeConnected.length > 0 ? 'active' : 'placeholder', desc: 'Server-side token-based posting' },
                        { name: 'Autopilot Scheduler', status: 'active', desc: 'Running (24h interval)' },
                      ].map((svc) => (
                        <div key={svc.name} className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-300 text-[11px] font-medium">{svc.name}</span>
                            <span className="text-gray-600 text-[9px] block">{svc.desc}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${svc.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                            {svc.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <LiveControlPanel state={engineState} onRunAll={handleRunAll} onClearLogs={handleClearLogs} isRunningAll={isRunningAll} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SETTINGS TAB */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-[#292946] rounded-2xl border border-white/5 p-6">
                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Autopilot Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-gray-300 text-xs font-semibold mb-3">Schedule Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-500 text-[11px] block mb-1">Run Interval</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500/50">
                          <option value="24">Every 24 hours</option>
                          <option value="12">Every 12 hours</option>
                          <option value="6">Every 6 hours</option>
                          <option value="1">Every hour (testing)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500 text-[11px] block mb-1">Posts per Run</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500/50">
                          <option value="3">3 posts per profile</option>
                          <option value="5">5 posts per profile</option>
                          <option value="10">10 posts per profile</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500 text-[11px] block mb-1">Optimal Post Time</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500/50">
                          <option value="ai">AI-optimized</option>
                          <option value="morning">Morning (8-10 AM)</option>
                          <option value="afternoon">Afternoon (12-2 PM)</option>
                          <option value="evening">Evening (6-8 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-gray-300 text-xs font-semibold mb-3">AI Configuration</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-500 text-[11px] block mb-1">Content Style</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500/50">
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="humorous">Humorous</option>
                          <option value="educational">Educational</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500 text-[11px] block mb-1">Language</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500/50">
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="auto">Auto-detect (140+)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500 text-[11px] block mb-1">Variations per Topic</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500/50">
                          <option value="3">3 variations</option>
                          <option value="5">5 variations</option>
                          <option value="10">10 variations</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected Accounts summary */}
                <div className="mt-6">
                  <h4 className="text-gray-300 text-xs font-semibold mb-3 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    Connected Accounts
                  </h4>
                  {activeConnected.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeConnected.map((acc: any) => {
                        const Icon = platformIcons[acc.platform as PlatformId] || Globe;
                        return (
                          <div key={acc.id} className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20 flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-200 text-xs font-bold truncate">@{acc.username}</p>
                              <p className="text-gray-500 text-[10px] capitalize">{acc.platform} &bull; {acc.accountType}</p>
                            </div>
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] rounded-full font-bold border border-emerald-500/20">LIVE</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl p-6 text-center border border-white/5">
                      <WifiOff className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs mb-2">No accounts connected yet</p>
                      <p className="text-gray-600 text-[10px]">Use the Social Accounts Hub to add your social media accounts via token or OAuth</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function QuickStatCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-gray-500 text-[11px]">{label}</span>
      </div>
      <span className="text-white text-xl font-bold">{value}</span>
    </div>
  );
}

export default SocialAccountsDashboard;