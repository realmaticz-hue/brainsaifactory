import React, { useState, useEffect } from 'react';
import { AICodeAssistant } from './components/AICodeAssistant';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageSelector } from './components/LanguageSelector';
import { CharacterSelector } from './components/CharacterSelector';
import { BlogPostCard } from './components/BlogPostCard';
import { UrlInput, type BlogGenerationOptions } from './components/UrlInput';
import { CustomAvatarCreator } from './components/CustomAvatarCreator';
import { VideoScriptCreator } from './components/VideoScriptCreator';
import { SocialAccountsHub } from './components/SocialAccountsHub';
import { SocialAccountsDashboard } from './pages/SocialAccountsDashboard';
import { XCodeGeneratorModal } from './components/XCodeGeneratorModal';
import { EliteAppBuilder } from './components/EliteAppBuilder';
import { CampaignDashboard, type Campaign } from './components/CampaignDashboard';
import { SmartCampaignScheduler } from './components/SmartCampaignScheduler';
import type { ScheduledPost } from './components/SmartCampaignScheduler';
import { BlogIntelligenceDashboard } from './components/BlogIntelligenceDashboard';
import { AIBlogFactory } from './components/AIBlogFactory';
import { SmartBlogStudio } from './components/SmartBlogStudio';
import { AIConfiguration } from './components/AIConfiguration';
import { TokenEfficiencyDashboard } from './components/TokenEfficiencyDashboard';
import { WordPressConfig } from './components/WordPressConfig';
import { WordPressPublishModal } from './components/WordPressPublishModal';
import { IntegrationStatusBar } from './components/IntegrationStatusBar';
import { AuthModal } from './components/AuthModal';
import { GitRepair } from './pages/GitRepair';
import { AutonomousAgent } from './pages/AutonomousAgent';
import { BrainCommandCenter } from './pages/BrainCommandCenter';
import { AgentStatusBadge } from './components/AgentStatusBadge';
import { buildDomainStub } from './utils/types/domainStub';
import { generateTrendingBlogPosts } from './utils/trendingBlogEnhancer';
import type { CustomAvatar } from './utils/avatarGenerator';
import type { BlogPost } from './utils/blogGenerator';
import { Sparkles, User, Share2, CalendarRange, Globe, Brain, BarChart3, ShieldCheck, Settings, Download, Trash2, Copy, Zap, FileText, Moon, Sun } from 'lucide-react';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { serverFetch, resolveServerUrl } from './utils/serverFetch';
import type { DurationFilter } from './utils/blogGenerator';
import type { VoiceProfile } from './utils/voiceLibrary';
import { VOICE_LIBRARY } from './utils/voiceLibrary';
import type { VideoResolution } from './utils/videoResolutions';
import { checkAllPosts } from './utils/contentQualityChecker';
import type { QualityReport } from './utils/contentQualityChecker';
import { ServerHealthCheck } from './components/ServerHealthCheck';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BlogPostCardSkeleton } from './components/LoadingSkeleton';
import { BlogPostFilter, type SortBy, type SortOrder } from './components/BlogPostFilter';
import { BulkActionsBar } from './components/BulkActionsBar';
import { ExportModal } from './components/ExportModal';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { CommandPalette, useCommandPalette, createCommand } from './components/CommandPalette';
import { TemplatesLibrary } from './components/TemplatesLibrary';
import { OnboardingFlow, useOnboarding } from './components/OnboardingFlow';
import { ContentCalendar } from './components/ContentCalendar';
import { SEOAnalyzerDashboard } from './components/SEOAnalyzerDashboard';
import { OAuthSetupGuide } from './components/OAuthSetupGuide';
import { useTheme } from './hooks/useTheme';
import type { BlogTemplate } from './utils/blogTemplates';
import { trackAIGenerate } from './utils/analytics/analyticsTracker';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

export type Character = {
  id: string;
  name: string;
  avatar: string;
  voiceType: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE oauth CALLBACK HANDLER
//
// Facebook redirects to /oauth-callback?code=...&state=...
// The SPA catch-all serves index.html → React boots → this runs.
// This bypasses any CDN-cached static file entirely.
//
// Sends the oauth result via 4 strategies with retry on the critical relay path.
// ═══════════════════════════════════════════════════════════════════════════════

/** Clean state: strip trailing path artifacts like /oauth/consent */
function cleanoauthState(raw: string | null): string | null {
  if (!raw) return raw;
  if (raw.includes('/')) {
    const parts = raw.split('_');
    if (parts.length >= 3) {
      const cleaned = raw.replace(/\/.*$/, '');
      if (cleaned !== raw) {
        console.log(`[InlineoauthCallback] Cleaned state: '${raw}' -> '${cleaned}'`);
        return cleaned;
      }
    }
  }
  return raw;
}

/** POST to relay-store with retry (critical path for Figma iframe). */
async function relayStoreWithRetry(
  relayUrl: string,
  anonKey: string,
  body: Record<string, any>,
  maxAttempts = 5
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[InlineoauthCallback] Relay POST attempt ${attempt}/${maxAttempts}`);
      const res = await fetch(relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(anonKey ? { 'Authorization': `Bearer ${anonKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        console.log(`[InlineoauthCallback] Relay POST succeeded (attempt ${attempt})`);
        return true;
      }
      const errText = await res.text().catch(() => '');
      console.log(`[InlineoauthCallback] Relay POST returned ${res.status} (attempt ${attempt}): ${errText}`);
    } catch (e) {
      console.log(`[InlineoauthCallback] Relay POST error (attempt ${attempt}):`, e);
    }
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, attempt * 1000));
  }
  console.error(`[InlineoauthCallback] Relay POST FAILED after ${maxAttempts} attempts`);
  return false;
}

function InlineoauthCallback() {
  const hasRun = React.useRef(false);

  React.useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    console.log('[InlineoauthCallback] oauth callback started');

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = cleanoauthState(params.get('state'));
    const error = params.get('error');
    const errorDesc = params.get('error_description');

    const payload = {
      type: 'oauth_success' as const,
      code,
      state,
      error,
      errorDescription: errorDesc,
    };

    console.log('[InlineoauthCallback] code:', code ? `present (${code.substring(0, 10)}...)` : 'MISSING');
    console.log('[InlineoauthCallback] state:', state || 'MISSING');
    console.log('[InlineoauthCallback] error:', error || 'none');
    console.log('[InlineoauthCallback] opener:', !!window.opener);
    console.log('[InlineoauthCallback] origin:', window.location.origin);

    // Strategy 1: postMessage to opener (fast path)
    if (window.opener) {
      try {
        window.opener.postMessage(payload, '*');
        console.log('[InlineoauthCallback] Strategy 1: postMessage sent to opener');
      } catch (e) {
        console.log('[InlineoauthCallback] Strategy 1: postMessage failed:', e);
      }
    } else {
      console.log('[InlineoauthCallback] Strategy 1: No opener (iframe sandbox strips it)');
    }

    // Strategy 2: BroadcastChannel (works without opener, same-origin)
    try {
      const bc = new BroadcastChannel('oauth_result_channel');
      bc.postMessage(payload);
      console.log('[InlineoauthCallback] Strategy 2: BroadcastChannel sent');
      setTimeout(() => { try { bc.close(); } catch (_) { } }, 500);
    } catch (e) {
      console.log('[InlineoauthCallback] Strategy 2: BroadcastChannel not available:', e);
    }

    // Strategy 3: localStorage (parent polls this)
    try {
      localStorage.setItem('oauth_result', JSON.stringify(payload));
      console.log('[InlineoauthCallback] Strategy 3: localStorage set');
    } catch (e) {
      console.log('[InlineoauthCallback] Strategy 3: localStorage not available:', e);
    }

    // Strategy 4: Server relay with RETRY (MOST RELIABLE for iframe sandboxes)
    // Store under BOTH the cleaned state AND the raw state for maximum compatibility
    if (code || error) {
      const relayUrl = resolveServerUrl('/social-accounts/oauth/relay-store');
      const rawState = params.get('state');

      // Primary relay POST (cleaned state)
      relayStoreWithRetry(relayUrl, publicAnonKey, { code, state, error, errorDescription: errorDesc }).then(ok => {
        if (ok) console.log('[InlineoauthCallback] Strategy 4: Relay stored (cleaned state)');
      });

      // Also store under raw state if it differs (best-effort)
      if (rawState && rawState !== state) {
        relayStoreWithRetry(relayUrl, publicAnonKey, { code, state: rawState, error, errorDescription: errorDesc }, 2).then(ok => {
          if (ok) console.log('[InlineoauthCallback] Strategy 4: Relay also stored (raw state)');
        });
      }
    }

    // Auto-close this popup after a delay (parent will pick up the result via relay)
    if (code && !error) {
      setTimeout(() => {
        try { window.close(); } catch (_) { /* ignore */ }
      }, 3000);
    }

    // Parent's oauthEngine closes this popup after reading the result.
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">oauth Success</h2>
        <p className="text-sm text-gray-500">You can close this window.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// oauth ROUTE GUARD
//
// Detects oauth callback routes and renders the inline handler BEFORE
// AppContent mounts. This avoids violating React's Rules of Hooks
// (hooks must not be called after conditional returns).
// ═══════════════════════════════════════════════════════════════════════════════

function OAuthRouteGuard() {
  const pathname = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;

  const isoauthCallbackPath =
    pathname === '/oauth-callback.html' ||
    pathname === '/oauth-callback' ||
    hash === '#/oauth-callback' ||
    hash.startsWith('#/oauth-callback?');

  const hasoauthParams = search.includes('code=') || search.includes('error=');

  // Strategy 5 fallback: static HTML redirects to /?oauth=success&code=...
  const isoauthFallbackRedirect = pathname === '/' && search.includes('oauth=success') && search.includes('code=');

  // Catch-all: oauth params on ANY path (including root /) with a state that
  // matches our format (platform_timestamp_random). This handles cases where
  // Figma hosting serves the SPA for any path, or when the redirect_uri is
  // the root URL, or when the popup lands on an unexpected path.
  const isDirectoauthRedirect = hasoauthParams && search.includes('state=') && !isoauthCallbackPath &&
    /[?&]state=(facebook|instagram|twitter|linkedin|tiktok|pinterest|youtube|demo)_/.test(search);

  console.log('[App] pathname:', pathname, '| hash:', hash, '| isCallback:', isoauthCallbackPath,
    '| hasParams:', hasoauthParams, '| fallbackRedirect:', isoauthFallbackRedirect,
    '| directRedirect:', isDirectoauthRedirect);

  // If on any oauth callback route WITH params → handle inline
  if ((isoauthCallbackPath && hasoauthParams) || isoauthFallbackRedirect || isDirectoauthRedirect) {
    return <InlineoauthCallback />;
  }

  // If on callback route WITHOUT params → redirect home
  if (isoauthCallbackPath) {
    console.log('[App] oauth callback route without params, redirecting home');
    window.location.href = '/';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting…</p>
      </div>
    );
  }

  // Normal app — all hooks are safely inside AppContent (no conditional returns before hooks)
  return <AppContent />;
}

// Main App Component — all hooks at the top level, no early returns before hooks
function AppContent() {
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [extractedContent, setExtractedContent] = useState('');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const [customAvatar, setCustomAvatar] = useState<CustomAvatar | null>(null);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [showScriptCreator, setShowScriptCreator] = useState(false);
  const [showSocialSettings, setShowSocialSettings] = useState(false);
  const [showXCodeGenerator, setShowXCodeGenerator] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(VOICE_LIBRARY[0]);
  const [currentScript, setCurrentScript] = useState('');
  const [videoResolution, setVideoResolution] = useState<VideoResolution>('1080p');
  const [socialMediaSettings, setSocialMediaSettings] = useState<any>(null);
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(false);
  const [xCodeGeneratorOpen, setXCodeGeneratorOpen] = useState(false);
  const [showAppBuilder, setShowAppBuilder] = useState(false);
  const [showCodeAssistant, setShowCodeAssistant] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCampaignManager, setShowCampaignManager] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);
  const [qualityReports, setQualityReports] = useState<QualityReport[]>([]);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [qualityPanelTab, setQualityPanelTab] = useState<'all' | 'errors' | 'warnings'>('all');
  const [showBlogIntelligence, setShowBlogIntelligence] = useState(false);
  const [showBlogFactory, setShowBlogFactory] = useState(false);
  const [showSmartBlogStudio, setShowSmartBlogStudio] = useState(false);
  const [showGitRepair, setShowGitRepair] = useState(false);
  const [showAgentCockpit, setShowAgentCockpit] = useState(false);
  const [showoauthGuide, setShowoauthGuide] = useState(false);
  const [showBrainCommandCenter, setShowBrainCommandCenter] = useState(false);
  const [showSocialDashboard, setShowSocialDashboard] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showTokenDashboard, setShowTokenDashboard] = useState(false);
  const [showWordPressConfig, setShowWordPressConfig] = useState(false);
  const [showWordPressPublish, setShowWordPressPublish] = useState(false);
  const [postsToPublish, setPostsToPublish] = useState<BlogPost[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [postsToExport, setPostsToExport] = useState<BlogPost[]>([]);
  const [showTemplatesLibrary, setShowTemplatesLibrary] = useState(false);
  const [showContentCalendar, setShowContentCalendar] = useState(false);
  const [showSEOAnalyzer, setShowSEOAnalyzer] = useState(false);
  // Multi-URL source tracking
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [sourceCount, setSourceCount] = useState(0);
  // Allow opening scheduler directly (without post selection)
  const [showSchedulerDirect, setShowSchedulerDirect] = useState(false);
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [minQualityScore, setMinQualityScore] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Command Palette
  const commandPalette = useCommandPalette();
  const { setTheme } = useTheme();

  // Onboarding
  const { showOnboarding, setShowOnboarding, resetOnboarding } = useOnboarding();

  // Listen for openSocialSettings event dispatched from child components (e.g. scheduler reconnect button)
  useEffect(() => {
    const handler = () => setShowSocialSettings(true);
    window.addEventListener('openSocialSettings', handler);
    return () => window.removeEventListener('openSocialSettings', handler);
  }, []);

  // Listen for openTemplatesLibrary event from onboarding
  useEffect(() => {
    const handler = () => setShowTemplatesLibrary(true);
    window.addEventListener('openTemplatesLibrary', handler);
    return () => window.removeEventListener('openTemplatesLibrary', handler);
  }, []);

  const handleGenerate = async (
    inputUrls: string | string[],
    options: BlogGenerationOptions = { duration: 7, count: 5 },
  ) => {
    setIsGenerating(true);
    setError(null);

    // Normalise input — always work with an array
    const rawList: string[] = Array.isArray(inputUrls) ? inputUrls : [inputUrls];

    // Per-URL normalisation (prepend https:// when no protocol)
    const normalizedUrls = rawList.map(u =>
      /^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`
    );

    // Keep track of URLs for display
    setSourceUrls(normalizedUrls);
    setUrl(normalizedUrls[0] || '');

    try {
      let scrapedData: any;

      if (normalizedUrls.length === 1) {
        // ── Single URL — use the original /scrape endpoint ──────────────────
        console.log('Calling backend scraper for:', normalizedUrls[0]);
        const response = await serverFetch('/scrape', {
          method: 'POST',
          body: JSON.stringify({ url: normalizedUrls[0] }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success || !result.data) throw new Error('Invalid response from server');
        scrapedData = result.data;
        setSourceCount(1);
      } else {
        // ── Multiple URLs — use the new /scrape-multi endpoint ──────────────
        console.log(`Calling multi-scrape for ${normalizedUrls.length} URLs:`, normalizedUrls);
        const response = await serverFetch('/scrape-multi', {
          method: 'POST',
          body: JSON.stringify({ urls: normalizedUrls }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success || !result.data) throw new Error('Invalid response from multi-scrape server');
        scrapedData = result.data;
        setSourceCount(result.sourceCount || normalizedUrls.length);

        // Log any partial errors (some URLs may have failed)
        if (result.errors?.length > 0) {
          console.warn('[ScrapeMulti] Partial errors:', result.errors);
        }
      }

      // Save business data for ad generation
      setBusinessData(scrapedData);

      // Build a rich guide-based content summary (Step 1 + Step 2 of the pipeline)
      let contentSummary = '';

      // Multi-source header
      if (normalizedUrls.length > 1) {
        contentSummary += `🔗 COMBINED FROM ${normalizedUrls.length} SOURCES\n`;
        normalizedUrls.forEach((u, i) => {
          let domain = u;
          try { domain = new URL(u).hostname.replace(/^www\./, ''); } catch { }
          contentSummary += `  ${i + 1}. ${domain}\n`;
        });
        contentSummary += '\n';
      }

      contentSummary += `📌 CORE TOPIC\n${scrapedData.coreTopic || scrapedData.title}\n\n`;
      contentSummary += `📋 BUSINESS TYPE: ${scrapedData.businessType}\n`;
      contentSummary += `🔍 DESCRIPTION: ${scrapedData.description || '—'}\n`;

      if (scrapedData.headings?.length > 0) {
        contentSummary += `\n📑 KEY SECTIONS (${scrapedData.headings.length})\n`;
        scrapedData.headings.slice(0, 5).forEach((h: string) => {
          contentSummary += `  • ${h}\n`;
        });
      }

      if (scrapedData.keyPoints?.length > 0) {
        contentSummary += `\n💡 CORE IDEAS\n`;
        scrapedData.keyPoints.slice(0, 3).forEach((kp: string) => {
          contentSummary += `  → ${kp.slice(0, 120)}\n`;
        });
      }

      if (scrapedData.dataPoints?.length > 0) {
        contentSummary += `\n📊 DATA POINTS\n`;
        scrapedData.dataPoints.slice(0, 3).forEach((dp: string) => {
          contentSummary += `  # ${dp.slice(0, 120)}\n`;
        });
      }

      if (scrapedData.missingAngles?.length > 0) {
        contentSummary += `\n🔎 IDENTIFIED GAPS (angles to explore)\n`;
        scrapedData.missingAngles.forEach((angle: string) => {
          contentSummary += `  ? ${angle}\n`;
        });
      }

      if (scrapedData.products?.length > 0) {
        contentSummary += `\n🛒 PRODUCTS / SERVICES (${scrapedData.products.length})\n`;
        scrapedData.products.slice(0, 5).forEach((product: any, idx: number) => {
          contentSummary += `  ${idx + 1}. ${product.name}${product.price ? ` — ${product.price}` : ''}\n`;
        });
        if (scrapedData.products.length > 5) {
          contentSummary += `  ... and ${scrapedData.products.length - 5} more\n`;
        }
      }

      setExtractedContent(contentSummary.trim());

      // ── Step 2: AI Blog Generation via Elite Micro-Blog Writer prompt ─────
      if (selectedCharacter) {
        let aiPosts7: any[] = [];
        let aiPosts30: any[] = [];
        let usedAI = false;

        try {
          console.log('[BlogGen] Calling /generate-blogs with AI prompt framework…');
          const genResponse = await serverFetch('/generate-blogs', {
            method: 'POST',
            body: JSON.stringify({
              scrapedData,
              count7: options.duration === 7 ? options.count : 0,
              count30: options.duration === 30 ? options.count : 0,
            }),
          });

          if (genResponse.ok) {
            const genResult = await genResponse.json();
            if (genResult.success && (genResult.posts7sec?.length > 0 || genResult.posts30sec?.length > 0)) {
              aiPosts7 = genResult.posts7sec || [];
              aiPosts30 = genResult.posts30sec || [];
              usedAI = true;
              console.log(`[BlogGen] ✅ AI generated ${aiPosts7.length} 7s + ${aiPosts30.length} 30s posts via ${genResult.model}`);
              if (genResult.parseErrors?.length > 0) {
                console.warn('[BlogGen] Parse warnings:', genResult.parseErrors);
              }
            } else {
              console.warn('[BlogGen] AI returned empty posts, falling back to template generator. Error:', genResult.error);
            }
          } else {
            const errData = await genResponse.json().catch(() => ({}));
            console.warn('[BlogGen] AI generation endpoint failed, falling back to template generator:', errData.error);
          }
        } catch (aiErr) {
          console.warn('[BlogGen] AI generation network error, falling back:', aiErr);
        }

        // ── Fallback: template-based generator with TRENDING ENHANCEMENTS ──
        if (!usedAI) {
          const blogPostsData = generateTrendingBlogPosts(scrapedData);
          aiPosts7 = options.duration === 7 ? blogPostsData.posts7sec.slice(0, options.count) : [];
          aiPosts30 = options.duration === 30 ? blogPostsData.posts30sec.slice(0, options.count) : [];
          console.log('[BlogGen] Using TRENDING template with viral headlines & buyer psychology');
        }

        if (usedAI) {
          aiPosts7 = options.duration === 7 ? aiPosts7.slice(0, options.count) : [];
          aiPosts30 = options.duration === 30 ? aiPosts30.slice(0, options.count) : [];
        }

        const newPosts: BlogPost[] = [];

        aiPosts7.forEach((gpost: any, index: number) => {
          newPosts.push({
            id: `${Date.now()}-7-${index}`,
            duration: 7,
            content: gpost.content,
            character: selectedCharacter,
            timestamp: new Date(),
            angle: gpost.angle,
            angleLabel: gpost.angleLabel,
            seoTitle: gpost.seoTitle,
            metaDescription: gpost.metaDescription,
            slug: gpost.slug,
            primaryKeyword: gpost.primaryKeyword,
            secondaryKeywords: gpost.secondaryKeywords,
            wordCount: gpost.wordCount,
            qualityScore: gpost.qualityScore,
          });
        });

        aiPosts30.forEach((gpost: any, index: number) => {
          newPosts.push({
            id: `${Date.now()}-30-${index}`,
            duration: 30,
            content: gpost.content,
            character: selectedCharacter,
            timestamp: new Date(),
            angle: gpost.angle,
            angleLabel: gpost.angleLabel,
            seoTitle: gpost.seoTitle,
            metaDescription: gpost.metaDescription,
            slug: gpost.slug,
            primaryKeyword: gpost.primaryKeyword,
            secondaryKeywords: gpost.secondaryKeywords,
            wordCount: gpost.wordCount,
            qualityScore: gpost.qualityScore,
          });
        });

        setBlogPosts(newPosts);

        // Track AI generation event
        trackAIGenerate(newPosts.length, usedAI ? 'ai' : 'template', {
          count7: aiPosts7.length,
          count30: aiPosts30.length,
          totalPosts: newPosts.length,
        });

        // ── Quality check pass ─────────────────────────────────────────────
        const reports = checkAllPosts(newPosts.map(p => ({ id: p.id, content: p.content })));
        const reportsWithIssues = reports.filter(r => r.issues.length > 0);
        setQualityReports(reportsWithIssues);
        if (reportsWithIssues.length > 0) setShowQualityPanel(true);
      }
    } catch (err) {
      console.error('Error generating blog posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate blog posts');

      // Fallback to demo mode if backend fails
      console.log('Falling back to demo mode');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const firstUrl = normalizedUrls[0] || '';
      const businessDataFallback = buildDomainStub(firstUrl);
      setExtractedContent(`Demo Mode: ${businessDataFallback.description}\n\nThis is a fallback content summary based on the URL domain. The AI blog generation failed, but you can still explore the features using this demo data.`);
      setBusinessData(businessDataFallback);
      return {
        source: 'domain-fallback',
        generatedFromUrl: url,
      };
      if (selectedCharacter) {
        const newPosts: BlogPost[] = [];

        businessDataFallback.posts7sec.forEach((content: string, index: number) => {
          newPosts.push({
            id: `${Date.now()}-7-${index}`,
            duration: 7,
            content,
            character: selectedCharacter,
            timestamp: new Date()
          });
        });

        businessDataFallback.posts30sec.forEach((content: string, index: number) => {
          newPosts.push({
            id: `${Date.now()}-30-${index}`,
            duration: 30,
            content,
            character: selectedCharacter,
            timestamp: new Date()
          });
        });

        setBlogPosts(newPosts);
      }
    }

    setIsGenerating(false);
  };

  const handleClear = () => {
    setUrl('');
    setSourceUrls([]);
    setSourceCount(0);
    setBlogPosts([]);
    setExtractedContent('');
    setDurationFilter('all');
    setError(null);
    setBusinessData(null);
    setCustomAvatar(null);
    setVideoResolution('1080p');
    setShowAvatarCreator(false);
    setShowScriptCreator(false);
    setSelectedVoice(VOICE_LIBRARY[0]);
    setCurrentScript('');
    setSocialMediaSettings(null);
    setWorkflowPanelOpen(false);
    setXCodeGeneratorOpen(false);
    setShowAppBuilder(false);
    setShowCodeAssistant(false);
    setShowLanguageSelector(false);
    setSelectedLanguages(['en']);
    setSelectedPostIds([]);
    setQualityReports([]);
    setShowQualityPanel(false);
    setQualityPanelTab('all');
    setShowBlogIntelligence(false);
    setShowBlogFactory(false);
    setShowGitRepair(false);
    setShowAgentCockpit(false);
    setShowoauthGuide(false);
    setShowBrainCommandCenter(false);
    setShowSocialDashboard(false);
    setShowAIConfig(false);
    setShowTokenDashboard(false);
    setShowWordPressConfig(false);
    setShowWordPressPublish(false);
    setPostsToPublish([]);
    setShowTemplatesLibrary(false);
    setShowContentCalendar(false);
    setShowSEOAnalyzer(false);
  };

  const filteredPosts = blogPosts
    .filter(post => {
      // Duration filter
      if (durationFilter !== 'all' && post.duration !== durationFilter) return false;

      // Quality score filter
      if (minQualityScore > 0 && (post.qualityScore || 0) < minQualityScore) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          post.content,
          post.seoTitle,
          post.metaDescription,
          post.primaryKeyword,
          ...(post.secondaryKeywords || []),
          post.angleLabel,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'qualityScore':
          comparison = (a.qualityScore || 0) - (b.qualityScore || 0);
          break;
        case 'wordCount':
          comparison = (a.wordCount || 0) - (b.wordCount || 0);
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const count7sec = blogPosts.filter(p => p.duration === 7).length;
  const count30sec = blogPosts.filter(p => p.duration === 30).length;

  // Campaign management handlers
  const handleUpdateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(campaign =>
      campaign.id === id ? { ...campaign, ...updates } : campaign
    ));
  };

  const handleOptimizeCampaign = (id: string) => {
    console.log('Optimizing campaign:', id);
    // AI optimization logic would go here
  };

  const handlePostSelect = (id: string, selected: boolean) => {
    setSelectedPostIds(prev =>
      selected ? [...prev, id] : prev.filter(pid => pid !== id)
    );
  };

  const handlePostContentChange = (id: string, newContent: string) => {
    setBlogPosts(prev =>
      prev.map(p => p.id === id ? { ...p, content: newContent } : p)
    );
  };

  // Bulk actions
  const handleSelectAll = () => {
    setSelectedPostIds(filteredPosts.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPostIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedPostIds.length} selected post${selectedPostIds.length !== 1 ? 's' : ''}?`)) {
      setBlogPosts(prev => prev.filter(p => !selectedPostIds.includes(p.id)));
      setSelectedPostIds([]);
      toast.success(`Deleted ${selectedPostIds.length} post${selectedPostIds.length !== 1 ? 's' : ''}`);
    }
  };

  const handleBulkExport = () => {
    const selectedPosts = blogPosts.filter(p => selectedPostIds.includes(p.id));
    setPostsToExport(selectedPosts);
    setShowExportModal(true);
  };

  const handleBulkPublish = () => {
    const selectedPosts = blogPosts.filter(p => selectedPostIds.includes(p.id));
    handlePublishToWordPress(selectedPosts);
  };

  const handleBulkDuplicate = () => {
    const selectedPosts = blogPosts.filter(p => selectedPostIds.includes(p.id));
    const duplicated = selectedPosts.map(post => ({
      ...post,
      id: `${Date.now()}-dup-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }));

    setBlogPosts(prev => [...prev, ...duplicated]);
    setSelectedPostIds([]);
    toast.success(`Duplicated ${selectedPosts.length} post${selectedPosts.length !== 1 ? 's' : ''}`);
  };

  const handleSmartScheduleCreate = (schedule: ScheduledPost[]) => {
    // Convert schedule into campaign entries
    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: `Smart 30-Day Campaign`,
      platform: 'Multi-Platform',
      status: 'active',
      budget: 0,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      roas: 0,
      ctr: 0,
      cpc: 0,
      startDate: new Date(),
    };
    setCampaigns(prev => [...prev, newCampaign]);
    setSelectedPostIds([]);
    setShowSmartScheduler(false);
  };

  const selectedPosts = blogPosts.filter(p => selectedPostIds.includes(p.id));
  // When opened directly from nav, pass all posts; otherwise pass only selected
  const schedulerPosts = showSchedulerDirect ? blogPosts : selectedPosts;
  const schedulerOpen = showSmartScheduler || showSchedulerDirect;
  const handleSchedulerClose = () => { setShowSmartScheduler(false); setShowSchedulerDirect(false); };
  const handleSchedulerCreate = (schedule: any[]) => {
    handleSmartScheduleCreate(schedule);
    setShowSchedulerDirect(false);
  };

  // WordPress publish handlers
  const handlePublishToWordPress = (posts: BlogPost[]) => {
    setPostsToPublish(posts);
    setShowWordPressPublish(true);
  };

  const handleWordPressPublished = (postIds: string[], urls: string[]) => {
    console.log(`[WordPress] Published ${postIds.length} posts:`, urls);
    // Could update blog posts with WordPress URLs here
  };

  // Templates Library handler
  const handleUseTemplate = (template: BlogTemplate) => {
    if (!selectedCharacter) {
      toast.error('Please select a character first');
      return;
    }

    const newPost: BlogPost = {
      id: `${Date.now()}-template-${template.id}`,
      duration: template.duration,
      content: template.structure,
      character: selectedCharacter,
      timestamp: new Date(),
      angle: 'template',
      angleLabel: template.category,
      seoTitle: template.seoTitleTemplate,
      metaDescription: template.metaDescriptionTemplate,
      slug: template.name.toLowerCase().replace(/\s+/g, '-'),
      primaryKeyword: template.keywords[0] || '',
      secondaryKeywords: template.keywords.slice(1),
      wordCount: template.structure.split(/\s+/).length,
      qualityScore: 85,
    };

    setBlogPosts(prev => [newPost, ...prev]);
    toast.success(`Created new post from "${template.name}" template`);
    setShowTemplatesLibrary(false);
  };

  // Content Calendar handlers
  const handleSchedulePost = (postId: string, date: Date) => {
    setBlogPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, timestamp: date } : p))
    );
    toast.success(`Post scheduled for ${date.toLocaleDateString()}`);
  };

  const handleDeleteSchedule = (postId: string) => {
    setBlogPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, timestamp: new Date() } : p))
    );
  };

  // Command Palette Commands
  const commands = [
    // Navigation
    createCommand('app-builder', 'Open App Builder', () => setShowAppBuilder(true), {
      description: 'Build applications from text',
      icon: Sparkles,
      shortcut: '⌘B',
      category: 'navigation',
    }),
    createCommand('scheduler', 'Open Scheduler', () => setShowSchedulerDirect(true), {
      description: 'Schedule and manage posts',
      icon: CalendarRange,
      shortcut: '⌘S',
      category: 'navigation',
    }),
    createCommand('analytics', 'Open Analytics', () => setShowAnalytics(true), {
      description: 'View analytics and insights',
      icon: BarChart3,
      shortcut: '⌘A',
      category: 'navigation',
    }),
    createCommand('git-repair', 'Open Git Repair', () => setShowGitRepair(true), {
      description: 'Fix git issues',
      icon: Brain,
      category: 'navigation',
    }),
    createCommand('social-accounts', 'Manage Social Accounts', () => setShowSocialSettings(true), {
      description: 'Configure social media connections',
      icon: Share2,
      category: 'navigation',
    }),
    createCommand('templates-library', 'Browse Templates', () => setShowTemplatesLibrary(true), {
      description: 'Use pre-built blog templates',
      icon: FileText,
      shortcut: '⌘T',
      category: 'navigation',
    }),
    createCommand('content-calendar', 'Content Calendar', () => setShowContentCalendar(true), {
      description: 'View and schedule posts on calendar',
      icon: CalendarRange,
      shortcut: '⌘C',
      category: 'navigation',
    }),
    createCommand('seo-analyzer', 'SEO Analyzer', () => setShowSEOAnalyzer(true), {
      description: 'Analyze and optimize SEO',
      icon: BarChart3,
      shortcut: '⌘E',
      category: 'navigation',
    }),

    // Settings
    createCommand('ai-config', 'AI Configuration', () => setShowAIConfig(true), {
      description: 'Configure AI providers',
      icon: Settings,
      category: 'settings',
    }),
    createCommand('wordpress-config', 'WordPress Settings', () => setShowWordPressConfig(true), {
      description: 'Configure WordPress connection',
      icon: Globe,
      category: 'settings',
    }),
    createCommand('token-dashboard', 'Token Efficiency', () => setShowTokenDashboard(true), {
      description: 'View token usage and costs',
      icon: Zap,
      category: 'settings',
    }),

    // Theme
    createCommand('theme-light', 'Light Theme', () => setTheme('light'), {
      description: 'Switch to light theme',
      icon: Sun,
      category: 'theme',
    }),
    createCommand('theme-dark', 'Dark Theme', () => setTheme('dark'), {
      description: 'Switch to dark theme',
      icon: Moon,
      category: 'theme',
    }),
    createCommand('restart-onboarding', 'Restart Tutorial', resetOnboarding, {
      description: 'Show the onboarding tutorial again',
      icon: Sparkles,
      category: 'settings',
    }),

    // Actions
    ...(selectedPostIds.length > 0
      ? [
        createCommand('bulk-export', 'Export Selected Posts', handleBulkExport, {
          description: `Export ${selectedPostIds.length} selected posts`,
          icon: Download,
          category: 'actions',
        }),
        createCommand('bulk-delete', 'Delete Selected Posts', handleBulkDelete, {
          description: `Delete ${selectedPostIds.length} selected posts`,
          icon: Trash2,
          category: 'actions',
        }),
        createCommand('bulk-duplicate', 'Duplicate Selected Posts', handleBulkDuplicate, {
          description: `Duplicate ${selectedPostIds.length} selected posts`,
          icon: Copy,
          category: 'actions',
        }),
      ]
      : []),
    ...(blogPosts.length > 0
      ? [
        createCommand('select-all', 'Select All Posts', handleSelectAll, {
          description: 'Select all visible posts',
          icon: FileText,
          category: 'actions',
        }),
      ]
      : []),
  ];

  // ── Handle oauth redirect fallback ──
  // When the popup couldn't close, oauth-callback.html redirects here with:
  //   ?oauth=success&code=...&state=...  (needs token exchange)
  //   ?oauth=error&reason=...            (show error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');

    if (!oauthStatus) return;

    console.log(`[App] oauth redirect received: status=${oauthStatus}`);

    if (oauthStatus === 'success') {
      const code = params.get('code');
      const state = params.get('state');

      if (code && state) {
        // Full-page fallback: popup didn't close, so we need to exchange the token here
        const platformMatch = state.match(/^([\w]+)_/);
        const platform = platformMatch ? platformMatch[1] : 'unknown';
        const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

        console.log(`[App] Fallback token exchange for ${platform}`);
        toast(`Connecting ${platformLabel}…`);

        // Auto-open Social Accounts Hub
        setShowSocialSettings(true);

        // Exchange token
        (async () => {
          try {
            const redirectUri = `${window.location.origin}/oauth-callback.html`;
            const res = await serverFetch('/social-accounts/oauth/callback', {
              method: 'POST',
              body: JSON.stringify({ platform, code, state, redirectUri }),
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({ error: 'Token exchange failed' }));
              throw new Error(errData.error || `HTTP ${res.status}`);
            }
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            const accountName = result.account?.username || result.account?.name || platformLabel;
            toast.success(`Successfully connected ${accountName}!`, { duration: 5000 });
          } catch (err: any) {
            console.error('[App] Fallback token exchange failed:', err);
            toast.error(`${platformLabel} connection failed: ${err.message}`, { duration: 8000 });
          }
        })();
      } else {
        // code/state already exchanged by parent, just show success
        toast.success('Account connected!', { duration: 5000 });
        setShowSocialSettings(true);
      }
    } else if (oauthStatus === 'error') {
      const reason = params.get('reason') || 'Unknown error';
      toast.error(`oauth failed: ${reason}`, { duration: 8000 });
    }

    // Clean up the URL so refreshing doesn't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      {/* Server Health Check - Always visible when there are issues */}
      <ServerHealthCheck />

      {/* ── Agent Cockpit (full-page overlay, hidden unless opened) ── */}
      {showAgentCockpit && (
        <AutonomousAgent
          onBack={() => setShowAgentCockpit(false)}
          onOpenEliteBuilder={() => { setShowAgentCockpit(false); setShowAppBuilder(true); }}
          onOpenGitRepair={() => { setShowAgentCockpit(false); setShowGitRepair(true); }}
          onOpenCodeAssistant={() => { setShowAgentCockpit(false); setShowCodeAssistant(true); }}
          onOpenBlogFactory={() => { setShowAgentCockpit(false); setShowBlogFactory(true); }}
          onOpenBlogIntelligence={() => { setShowAgentCockpit(false); setShowBlogIntelligence(true); }}
          onOpenCampaignManager={() => { setShowAgentCockpit(false); setShowCampaignManager(true); }}
        />
      )}

      {/* ── Git Repair (full-page overlay) ── */}
      {showGitRepair && (
        <GitRepair onBack={() => setShowGitRepair(false)} />
      )}

      {/* ── Brain Command Center (full-page overlay) ── */}
      {showBrainCommandCenter && (
        <BrainCommandCenter onBack={() => setShowBrainCommandCenter(false)} />
      )}

      {/* ── Social Accounts Dashboard (full-page overlay) ── */}
      {showSocialDashboard && (
        <SocialAccountsDashboard onBack={() => setShowSocialDashboard(false)} />
      )}

      {/* ── oauth Setup Guide modal ── */}
      <OAuthSetupGuide
        isopen={showoauthGuide}
        onClose={() => setShowoauthGuide(true)}
      />

      {/* Top Navigation — CLEAN & MINIMAL */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🚀</span>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">AI Ad Generator</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight hidden sm:block">🔥 Master of Blog Writing & Advertising · Trending · Viral · Buyer-Focused</p>
            </div>
          </div>

          {/* User-facing essential buttons only */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* ── Build App from text — prominently surfaced ── */}
            <button
              onClick={() => setShowAppBuilder(true)}
              className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Build App
            </button>

            {/* ── Social Scheduler ── */}
            <button
              onClick={() => setShowSchedulerDirect(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shadow-sm"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Scheduler
            </button>

            {/* ── Git Repair / Token entry ── */}
            <button
              onClick={() => setShowGitRepair(true)}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shadow-sm"
            >
              <Brain className="w-3.5 h-3.5" />
              Git Repair
            </button>

            <button
              onClick={() => setShowLanguageSelector(true)}
              className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5" />
              {selectedLanguages.length > 1 ? `${selectedLanguages.length} Languages` : '🌍 Languages'}
            </button>

            <button
              onClick={() => setShowSocialSettings(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              Social Accounts
            </button>

            {/* ── oauth Setup Guide ── */}
            <button
              onClick={() => setShowoauthGuide(true)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              oauth Guide
            </button>

            {/* Agent Status Badge — minimal background indicator */}
            <AgentStatusBadge onOpen={() => setShowAgentCockpit(true)} />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* ── Integration Status Bar — shows AI, Database, WordPress status ── */}
        <IntegrationStatusBar
          onOpenAIConfig={() => setShowAIConfig(true)}
          onOpenWordPressConfig={() => setShowWordPressConfig(true)}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        {/* ── Quick-access developer tool bar — always visible below nav ── */}
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium shrink-0">Dev Tools:</span>
            {[
              { label: '⚡ Build from Prompt', onClick: () => setShowAppBuilder(true), cls: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
              { label: '🔧 Git Repair + Token', onClick: () => setShowGitRepair(true), cls: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' },
              { label: '💬 AI Code Assistant', onClick: () => setShowCodeAssistant(true), cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
              { label: '✍️ Blog Factory', onClick: () => setShowBlogFactory(true), cls: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' },
              { label: '🧠 Smart Blog Studio', onClick: () => setShowSmartBlogStudio(true), cls: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
              { label: '📚 Templates Library', onClick: () => setShowTemplatesLibrary(true), cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
              { label: '📅 Content Calendar', onClick: () => setShowContentCalendar(true), cls: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
              { label: '🎯 SEO Analyzer', onClick: () => setShowSEOAnalyzer(true), cls: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
              { label: '📊 Blog Intelligence', onClick: () => setShowBlogIntelligence(true), cls: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
              { label: '📈 Campaign Manager', onClick: () => setShowCampaignManager(true), cls: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
              { label: '🔐 oauth Setup Guide', onClick: () => setShowoauthGuide(true), cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
              { label: '🧠 Brain Command Center', onClick: () => setShowBrainCommandCenter(true), cls: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
              { label: '📱 Social Dashboard', onClick: () => setShowSocialDashboard(true), cls: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
              { label: '🤖 AI Configuration', onClick: () => setShowAIConfig(true), cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
              { label: '⚡ Token Efficiency', onClick: () => setShowTokenDashboard(true), cls: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
              { label: '📊 Analytics & Insights', onClick: () => setShowAnalytics(true), cls: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' },
              { label: '📝 WordPress Settings', onClick: () => setShowWordPressConfig(true), cls: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all whitespace-nowrap ${btn.cls}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-purple-600 mb-2">🚀 AI-Powered Ad Campaign Generator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm font-semibold">Master of Blog Writing & Advertising — Trending Content That Attracts Buyers</p>
          <p className="text-gray-500 max-w-2xl mx-auto text-xs mt-1">Transform any website into viral blog posts with 65-agent AI system, buyer psychology triggers, and multi-platform optimization</p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 px-3 py-2 rounded-lg text-xs border-2 border-orange-300 flex items-center gap-1.5 font-bold shadow-md">
              <span>🔥</span> <span>TRENDING Blog Master</span>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-3 py-2 rounded-lg text-xs border border-green-200 flex items-center gap-1.5 font-semibold">
              <span>💰</span> <span>Buyer Psychology Triggers</span>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-3 py-2 rounded-lg text-xs border border-purple-200 flex items-center gap-1.5 font-semibold">
              <span>🧠</span> <span>65-Agent AI System</span>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-2 rounded-lg text-xs border border-blue-200 flex items-center gap-1.5 font-semibold">
              <span>📱</span> <span>Multi-Platform Viral</span>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-3 py-2 rounded-lg text-xs border border-red-200 flex items-center gap-1.5 font-semibold">
              <span>📊</span> <span>CTR & Conversion Optimized</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
              ⚠️ {error} — Using demo mode
            </div>
          )}
        </div>

        {/* Character Selection */}
        <div className="mb-8">
          <CharacterSelector
            selectedCharacter={selectedCharacter}
            onSelectCharacter={setSelectedCharacter}
          />
        </div>

        {/* URL Input */}
        <div className="mb-8">
          <UrlInput
            onGenerate={handleGenerate}
            onClear={handleClear}
            isGenerating={isGenerating}
            disabled={!selectedCharacter}
          />
        </div>

        {/* Extracted Content Preview */}
        {extractedContent && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-gray-900">Extracted Content &amp; Products</h2>
              {sourceUrls.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {sourceUrls.map((u, i) => {
                    let domain = u;
                    try { domain = new URL(u).hostname.replace(/^www\./, ''); } catch { }
                    return (
                      <span key={u} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <span className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {domain}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-3">
              <p className="text-sm text-green-800">
                {sourceUrls.length > 1
                  ? `🔗 ${sourceCount} source${sourceCount !== 1 ? 's' : ''} successfully merged — content synthesized across all sites into unified blog posts`
                  : '✨ Product information has been extracted and integrated into the blog posts below'}
              </p>
            </div>
            <pre className="text-gray-600 italic whitespace-pre-wrap text-xs leading-relaxed">{extractedContent}</pre>
          </div>
        )}

        {/* Generated Blog Posts */}
        {blogPosts.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-4">Generated Blog Posts</h2>
              {sourceUrls.length > 1 && (
                <p className="text-xs text-purple-600 font-semibold mb-4">
                  🔗 Combined from {sourceCount} source{sourceCount !== 1 ? 's' : ''} · Cross-synthesized content
                </p>
              )}

              {/* Search & Filter Controls */}
              <BlogPostFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedDuration={durationFilter}
                onDurationChange={setDurationFilter}
                minQualityScore={minQualityScore}
                onMinQualityScoreChange={setMinQualityScore}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                totalPosts={blogPosts.length}
                filteredPosts={filteredPosts.length}
                onClearFilters={() => {
                  setSearchQuery('');
                  setDurationFilter('all');
                  setMinQualityScore(0);
                  setSortBy('timestamp');
                  setSortOrder('desc');
                }}
              />
            </div>

            {/* Bulk Actions Bar */}
            <BulkActionsBar
              selectedCount={selectedPostIds.length}
              totalCount={filteredPosts.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onDelete={handleBulkDelete}
              onExport={handleBulkExport}
              onPublish={handleBulkPublish}
              onDuplicate={handleBulkDuplicate}
            />

            {/* ── Quality Check Banner ── */}
            {qualityReports.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <p className="font-bold text-amber-900 text-sm">
                      AI Quality Check Complete — {qualityReports.reduce((a, r) => a + r.issues.length, 0)} issues found across {qualityReports.length} post{qualityReports.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {qualityReports.reduce((a, r) => a + r.issues.filter(i => i.severity === 'error').length, 0)} spelling/duplicate errors ·{' '}
                      {qualityReports.reduce((a, r) => a + r.issues.filter(i => i.severity === 'warning').length, 0)} warnings · Auto-fix available
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQualityPanel(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
                  >
                    View & Fix Issues →
                  </button>
                  <button
                    onClick={() => {
                      // Apply all auto-fixes
                      qualityReports.forEach(report => {
                        if (report.fixedContent) {
                          handlePostContentChange(report.postId, report.fixedContent);
                        }
                      });
                      setQualityReports([]);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                  >
                    ✨ Auto-Fix All
                  </button>
                  <button
                    onClick={() => setQualityReports([])}
                    className="p-2 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  businessData={businessData}
                  isSelected={selectedPostIds.includes(post.id)}
                  onSelect={handlePostSelect}
                  onContentChange={handlePostContentChange}
                  onPublishToWordPress={(post) => handlePublishToWordPress([post])}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {isGenerating && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <BlogPostCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && blogPosts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-400">Select a character and enter a website URL to generate blog posts</p>
          </div>
        )}

        {/* New Features Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <button
            onClick={() => setShowAvatarCreator(true)}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full shadow-2xl hover:from-pink-700 hover:to-purple-700 transition-all flex items-center gap-2 font-semibold"
          >
            <User className="w-5 h-5" />
            Custom Avatar
          </button>

          <button
            onClick={() => setShowScriptCreator(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full shadow-2xl hover:from-indigo-700 hover:to-blue-700 transition-all flex items-center gap-2 font-semibold"
          >
            <Sparkles className="w-5 h-5" />
            Create from Script
          </button>

          {customAvatar && (
            <div className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg flex items-center gap-2">
              <Brain className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-semibold">AI Learning Active</span>
            </div>
          )}
        </div>

        {/* Modals */}
        <CustomAvatarCreator
          isopen={showAvatarCreator}
          onClose={() => setShowAvatarCreator(false)}
          onAvatarCreated={(avatar) => {
            setCustomAvatar(avatar);
            setShowAvatarCreator(false);
          }}
        />

        <VideoScriptCreator
          isopen={showScriptCreator}
          onClose={() => setShowScriptCreator(false)}
          onCreateVideo={(script, resolution, avatar) => {
            console.log('Creating video:', { script, resolution, avatar });
            setShowScriptCreator(false);
          }}
          avatar={customAvatar}
        />

        <SocialAccountsHub
          isopen={showSocialSettings}
          onClose={() => setShowSocialSettings(false)}
        />

        <XCodeGeneratorModal
          isopen={showXCodeGenerator}
          onClose={() => setShowXCodeGenerator(false)}
        />

        <EliteAppBuilder
          isopen={showAppBuilder}
          onClose={() => setShowAppBuilder(false)}
          onOpenGitRepair={() => setShowGitRepair(true)}
        />

        <AICodeAssistant
          isopen={showCodeAssistant}
          onClose={() => setShowCodeAssistant(false)}
        />

        <LanguageSelector
          isopen={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
          selectedLanguages={selectedLanguages}
          onLanguagesChange={setSelectedLanguages}
        />

        {/* Campaign Manager Modal */}
        {showCampaignManager && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-900">Campaign Manager</h2>
                </div>
                <button
                  onClick={() => setShowCampaignManager(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {campaigns.length > 0 ? (
                  <CampaignDashboard
                    campaigns={campaigns}
                    onUpdateCampaign={handleUpdateCampaign}
                    onOptimize={handleOptimizeCampaign}
                  />
                ) : (
                  <div className="text-center py-16">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first campaign by generating ads and exporting them to your preferred platforms.
                    </p>
                    <button
                      onClick={() => setShowCampaignManager(false)}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all font-semibold"
                    >
                      Start Creating Ads
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Smart Campaign Selection Bar */}
        {selectedPostIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-700 to-blue-700 text-white shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedPostIds.length}
                </div>
                <span className="font-semibold text-sm">
                  {selectedPostIds.length} post{selectedPostIds.length !== 1 ? 's' : ''} selected for campaign
                </span>
                <span className="text-white/60 text-xs hidden sm:block">
                  • AI will sort them into the smartest 30-day release order
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPostIds([])}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowSmartScheduler(true)}
                  className="px-4 py-2 bg-white text-purple-700 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <CalendarRange className="w-4 h-4" />
                  Smart Schedule →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Smart Campaign Scheduler Modal */}
        <SmartCampaignScheduler
          posts={schedulerPosts}
          isopen={schedulerOpen}
          onClose={handleSchedulerClose}
          onCreateCampaign={handleSchedulerCreate}
        />

        {/* ─ Quality Report Modal ── */}
        {showQualityPanel && qualityReports.length > 0 && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowQualityPanel(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">🔍 AI Content Quality Report</h2>
                    <p className="text-sm opacity-90 mt-0.5">
                      {qualityReports.reduce((a, r) => a + r.issues.length, 0)} issues detected · Auto-fix applies all safe corrections
                    </p>
                  </div>
                  <button onClick={() => setShowQualityPanel(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">✕</button>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 mt-3">
                  {(['all', 'errors', 'warnings'] as const).map(tab => (
                    <button key={tab} onClick={() => setQualityPanelTab(tab)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${qualityPanelTab === tab ? 'bg-white text-amber-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                      {tab === 'all' ? `All Issues (${qualityReports.reduce((a, r) => a + r.issues.length, 0)})` :
                        tab === 'errors' ? `❌ Errors (${qualityReports.reduce((a, r) => a + r.issues.filter(i => i.severity === 'error').length, 0)})` :
                          `⚠️ Warnings (${qualityReports.reduce((a, r) => a + r.issues.filter(i => i.severity === 'warning').length, 0)})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Issues list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {qualityReports.flatMap(report =>
                  report.issues
                    .filter(issue =>
                      qualityPanelTab === 'all' ||
                      (qualityPanelTab === 'errors' && issue.severity === 'error') ||
                      (qualityPanelTab === 'warnings' && issue.severity === 'warning')
                    )
                    .map(issue => (
                      <div key={issue.id} className={`rounded-xl p-4 border ${issue.severity === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                        }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{
                                background: issue.severity === 'error' ? '#fee2e2' : '#fef3c7',
                                color: issue.severity === 'error' ? '#dc2626' : '#d97706',
                              }}>
                                {issue.severity === 'error' ? '❌ Error' : '⚠️ Warning'}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">{issue.type.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">{issue.label}</p>
                            {issue.context && (
                              <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 rounded px-2 py-1 break-all">
                                …{issue.context}…
                              </p>
                            )}
                            <p className="text-xs text-gray-600 mt-1.5">💡 {issue.suggestion}</p>
                          </div>
                          {issue.original && issue.replacement !== issue.original && issue.type !== 'repeated_phrase' && issue.type !== 'incomplete_sentence' && (
                            <button
                              onClick={() => {
                                const reportForPost = qualityReports.find(r => r.issues.some(i => i.id === issue.id));
                                if (reportForPost) {
                                  const currentPost = blogPosts.find(p => p.id === reportForPost.postId);
                                  if (currentPost) {
                                    handlePostContentChange(reportForPost.postId, currentPost.content.replace(issue.original, issue.replacement));
                                  }
                                  setQualityReports(prev => prev.map(r =>
                                    r.postId === reportForPost.postId
                                      ? { ...r, issues: r.issues.filter(i => i.id !== issue.id) }
                                      : r
                                  ).filter(r => r.issues.length > 0));
                                }
                              }}
                              className="flex-shrink-0 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                              Fix →
                            </button>
                          )}
                        </div>
                        {issue.original && issue.replacement && issue.original !== issue.replacement && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="line-through text-red-500 bg-red-100 px-1.5 rounded">{issue.original.trim()}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-700 bg-green-100 px-1.5 rounded">{issue.replacement.trim()}</span>
                          </div>
                        )}
                      </div>
                    ))
                )}
                {qualityReports.flatMap(r => r.issues).filter(i =>
                  qualityPanelTab === 'all' ||
                  (qualityPanelTab === 'errors' && i.severity === 'error') ||
                  (qualityPanelTab === 'warnings' && i.severity === 'warning')
                ).length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                      <span className="text-4xl block mb-2">✅</span>
                      <p className="font-semibold">No {qualityPanelTab === 'all' ? '' : qualityPanelTab} issues found</p>
                    </div>
                  )}
              </div>

              {/* Footer actions */}
              <div className="p-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    qualityReports.forEach(report => {
                      if (report.fixedContent) handlePostContentChange(report.postId, report.fixedContent);
                    });
                    setQualityReports([]);
                    setShowQualityPanel(false);
                  }}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
                >
                  ✨ Auto-Fix All {qualityReports.reduce((a, r) => a + r.issues.filter(i => i.type !== 'repeated_phrase' && i.type !== 'incomplete_sentence').length, 0)} Fixable Issues
                </button>
                <button
                  onClick={() => { setShowQualityPanel(false); setQualityReports([]); }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blog Intelligence Dashboard */}
        {showBlogIntelligence && (
          <BlogIntelligenceDashboard
            onClose={() => setShowBlogIntelligence(false)}
          />
        )}

        {/* AI Blog Factory — hidden, opened via Agent cockpit */}
        {showBlogFactory && (
          <AIBlogFactory
            isopen={showBlogFactory}
            onClose={() => setShowBlogFactory(false)}
            preloadedData={businessData}
            preloadedUrl={url}
          />
        )}

        {/* Smart Blog Studio — 65 AI Agents for intelligent content creation */}
        {showSmartBlogStudio && (
          <SmartBlogStudio
            isopen={showSmartBlogStudio}
            onClose={() => setShowSmartBlogStudio(false)}
          />
        )}

        {/* AI Configuration Modal */}
        {showAIConfig && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">🤖 AI Configuration</h2>
                <button
                  onClick={() => setShowAIConfig(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <AIConfiguration />
              </div>
            </div>
          </div>
        )}

        {/* Token Efficiency Dashboard Modal */}
        {showTokenDashboard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">⚡ Token Efficiency Dashboard</h2>
                <button
                  onClick={() => setShowTokenDashboard(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TokenEfficiencyDashboard />
              </div>
            </div>
          </div>
        )}

        {/* WordPress Configuration Modal */}
        {showWordPressConfig && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">📝 WordPress Settings</h2>
                <button
                  onClick={() => setShowWordPressConfig(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <WordPressConfig onConfigured={() => {
                  // Optionally close modal after configuration
                  // setShowWordPressConfig(false);
                }} />
              </div>
            </div>
          </div>
        )}

        {/* WordPress Publish Modal */}
        <WordPressPublishModal
          isopen={showWordPressPublish}
          onClose={() => {
            setShowWordPressPublish(false);
            setPostsToPublish([]);
          }}
          posts={postsToPublish}
          onPublished={handleWordPressPublished}
        />

        {/* Authentication Modal */}
        <AuthModal
          isopen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            // Optionally show success message or redirect
            toast.success('Welcome! You are now signed in.');
          }}
        />

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
        )}

        {/* Export Modal */}
        <ExportModal
          isopen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setPostsToExport([]);
          }}
          posts={postsToExport}
        />

        {/* Command Palette (Cmd+K) */}
        <CommandPalette
          isopen={commandPalette.isopen}
          onClose={commandPalette.close}
          commands={commands}
        />

        {/* Templates Library Modal */}
        <TemplatesLibrary
          isopen={showTemplatesLibrary}
          onClose={() => setShowTemplatesLibrary(false)}
          onUseTemplate={handleUseTemplate}
        />

        {/* Onboarding Flow */}
        <OnboardingFlow
          isopen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            toast.success('Welcome aboard! Ready to create amazing content? 🚀');
          }}
        />

        {/* Content Calendar */}
        <ContentCalendar
          isopen={showContentCalendar}
          onClose={() => setShowContentCalendar(false)}
          posts={blogPosts}
          onSchedulePost={handleSchedulePost}
          onDeleteSchedule={handleDeleteSchedule}
        />

        {/* SEO Analyzer Dashboard */}
        <SEOAnalyzerDashboard
          isopen={showSEOAnalyzer}
          onClose={() => setShowSEOAnalyzer(false)}
          posts={blogPosts}
        />
      </div>
    </div>
  );
}

export default function App() {
  // EMERGENCY DEBUG: Log on every render
  console.log('🚀🚀🚀 [App ROOT] Rendering, pathname:', window.location.pathname);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OAuthRouteGuard />
        <Toaster richColors position="top-right" theme="dark" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}