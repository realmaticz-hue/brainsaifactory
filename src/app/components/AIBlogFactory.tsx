import { useState, useCallback, useRef, useEffect } from 'react';
import {
  X, Globe, Plus, Trash2, RefreshCw, ChevronRight, ChevronDown,
  BookOpen, Layers, PenTool, Share2, Search, Upload, Clock,
  CheckCircle, AlertCircle, Sparkles, Download, Copy, Eye,
  BarChart2, TrendingUp, Zap, FileText, Video, Mail, Hash,
  Star, ArrowRight, Play, Pause, Settings, ExternalLink,
  MessageSquare, Calendar, Target, Award, ChevronLeft,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';
import { copyToClipboard } from '../utils/clipboard';
import {
  generateTopicClusters, generateFullArticle, generateRepurposedContent, analyzeSEO,
  type TopicCluster, type SupportingTopic, type FullArticle, type RepurposedContent, type SEOAnalysis,
} from '../utils/fullBlogGenerator';

// ─── Types ────────────────────────────────────────────────────

type Tab = 'sources' | 'topics' | 'write' | 'repurpose' | 'seo' | 'publish';

interface SourceSite {
  id: string;
  url: string;
  status: 'idle' | 'scraping' | 'ready' | 'error';
  data?: any;
  error?: string;
  articleCount: number;
}

interface GeneratedArticleEntry {
  article: FullArticle;
  repurposed?: RepurposedContent;
  seo?: SEOAnalysis;
  topicId: string;
  clusterId: string;
}

// ─── Sub-components ───────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  );
}

function TabBtn({ tab, active, label, icon, color, onClick }: {
  tab: Tab; active: boolean; label: string; icon: React.ReactNode; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${active ? `${color} text-white shadow-lg` : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────

interface AIBlogFactoryProps {
  isopen: boolean;
  onClose: () => void;
  preloadedData?: any;
  preloadedUrl?: string;
}

export function AIBlogFactory({ isopen, onClose, preloadedData, preloadedUrl }: AIBlogFactoryProps) {
  const [activeTab, setActiveTab] = useState<Tab>('sources');
  const [sources, setSources] = useState<SourceSite[]>([]);
  const [urlInput, setUrlInput] = useState(preloadedUrl || '');
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set(['cluster-1']));
  const [generatedArticles, setGeneratedArticles] = useState<GeneratedArticleEntry[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<GeneratedArticleEntry | null>(null);
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);
  const [repurposeTab, setRepurposeTab] = useState<'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'video' | 'newsletter' | 'quotes'>('linkedin');
  const [seoView, setSeoView] = useState<'overview' | 'schema'>('overview');
  const [publishTab, setPublishTab] = useState<'queue' | 'calendar' | 'settings'>('queue');
  const [copied, setCopied] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('all');
  const [previewMode, setPreviewMode] = useState<'markdown' | 'preview'>('preview');

  // Pre-load data if passed in
  useEffect(() => {
    if (preloadedData && preloadedUrl && sources.length === 0) {
      const newSource: SourceSite = {
        id: `src-${Date.now()}`,
        url: preloadedUrl,
        status: 'ready',
        data: preloadedData,
        articleCount: 0,
      };
      setSources([newSource]);
      const newClusters = generateTopicClusters(preloadedData);
      setClusters(newClusters);
    }
  }, [preloadedData, preloadedUrl]);

  if (!isopen) return null;

  // ── Handlers ────────────────────────────────────────────────

  const handleAddSource = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try { new URL(trimmed); } catch { return; }

    const newSrc: SourceSite = { id: `src-${Date.now()}`, url: trimmed, status: 'scraping', articleCount: 0 };
    setSources(prev => [...prev, newSrc]);
    setUrlInput('');

    try {
      const res = await serverFetch('/scrape', {
        method: 'POST',
        body: JSON.stringify({ url: trimmed }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setSources(prev => prev.map(s => s.id === newSrc.id ? { ...s, status: 'ready', data: result.data } : s));
        const newClusters = generateTopicClusters(result.data);
        setClusters(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          return [...prev, ...newClusters.filter(c => !existingIds.has(c.id))];
        });
      } else {
        setSources(prev => prev.map(s => s.id === newSrc.id ? { ...s, status: 'error', error: result.error || 'Scraping failed' } : s));
      }
    } catch (err: any) {
      setSources(prev => prev.map(s => s.id === newSrc.id ? { ...s, status: 'error', error: err.message } : s));
    }
  };

  const handleRemoveSource = (id: string) => setSources(prev => prev.filter(s => s.id !== id));

  const handleGenerateArticle = useCallback(async (topic: SupportingTopic, cluster: TopicCluster) => {
    const source = sources.find(s => s.status === 'ready');
    if (!source?.data) return;

    setGeneratingTopicId(topic.id);

    // Update topic status
    setClusters(prev => prev.map(c => c.id === cluster.id ? {
      ...c,
      supportingTopics: c.supportingTopics.map(t => t.id === topic.id ? { ...t, status: 'generating' } : t),
    } : c));

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400)); // Simulate AI generation

    const article = generateFullArticle(topic, cluster, source.data);
    const repurposed = generateRepurposedContent(article, source.data);
    const seo = analyzeSEO(article);

    const entry: GeneratedArticleEntry = { article, repurposed, seo, topicId: topic.id, clusterId: cluster.id };
    setGeneratedArticles(prev => {
      const existing = prev.findIndex(e => e.topicId === topic.id);
      if (existing >= 0) { const next = [...prev]; next[existing] = entry; return next; }
      return [...prev, entry];
    });

    setClusters(prev => prev.map(c => c.id === cluster.id ? {
      ...c,
      supportingTopics: c.supportingTopics.map(t => t.id === topic.id ? { ...t, status: 'ready' } : t),
    } : c));

    setSources(prev => prev.map(s => s.id === source.id ? { ...s, articleCount: s.articleCount + 1 } : s));
    setSelectedArticle(entry);
    setActiveTab('write');
    setGeneratingTopicId(null);
  }, [sources]);

  const handleBulkGenerate = async (cluster: TopicCluster) => {
    const source = sources.find(s => s.status === 'ready');
    if (!source?.data) return;
    setBulkGenerating(true);
    setBulkProgress(0);
    const topics = cluster.supportingTopics.filter(t => t.status === 'pending');
    for (let i = 0; i < topics.length; i++) {
      await handleGenerateArticle(topics[i], cluster);
      setBulkProgress(Math.round(((i + 1) / topics.length) * 100));
      await new Promise(r => setTimeout(r, 200));
    }
    setBulkGenerating(false);
    setBulkProgress(0);
  };

  const handleCopy = (key: string, text: string) => {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleCluster = (id: string) =>
    setExpandedClusters(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const totalTopics = clusters.reduce((acc, c) => acc + c.supportingTopics.length, 0);
  const totalWords = generatedArticles.reduce((acc, e) => acc + e.article.wordCount, 0);

  const filteredTopics = clusters.flatMap(c => c.supportingTopics.map(t => ({ topic: t, cluster: c })))
    .filter(({ topic, cluster }) => {
      const matchSearch = !searchQuery || topic.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCluster = selectedClusterFilter === 'all' || cluster.id === selectedClusterFilter;
      return matchSearch && matchCluster;
    });

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">AI Blog Factory</h1>
              <p className="text-xs text-gray-400 mt-0.5">Topical Authority Engine • Full Long-Form Article Generator</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-4">
            <StatCard icon={<Globe className="w-4 h-4 text-orange-400" />} label="Sources" value={sources.filter(s => s.status === 'ready').length} color="bg-orange-900/40" />
            <StatCard icon={<Layers className="w-4 h-4 text-purple-400" />} label="Topics" value={totalTopics} color="bg-purple-900/40" />
            <StatCard icon={<FileText className="w-4 h-4 text-blue-400" />} label="Articles" value={generatedArticles.length} color="bg-blue-900/40" />
            <StatCard icon={<Hash className="w-4 h-4 text-green-400" />} label="Total Words" value={totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords} color="bg-green-900/40" />
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-2 flex items-center gap-1 overflow-x-auto shrink-0">
        <TabBtn tab="sources" active={activeTab === 'sources'} label="Sources" icon={<Globe className="w-4 h-4" />} color="bg-orange-600" onClick={() => setActiveTab('sources')} />
        <TabBtn tab="topics" active={activeTab === 'topics'} label="Topic Map" icon={<Layers className="w-4 h-4" />} color="bg-purple-600" onClick={() => setActiveTab('topics')} />
        <TabBtn tab="write" active={activeTab === 'write'} label="Write" icon={<PenTool className="w-4 h-4" />} color="bg-blue-600" onClick={() => setActiveTab('write')} />
        <TabBtn tab="repurpose" active={activeTab === 'repurpose'} label="Repurpose" icon={<Share2 className="w-4 h-4" />} color="bg-green-600" onClick={() => setActiveTab('repurpose')} />
        <TabBtn tab="seo" active={activeTab === 'seo'} label="SEO" icon={<Search className="w-4 h-4" />} color="bg-cyan-600" onClick={() => setActiveTab('seo')} />
        <TabBtn tab="publish" active={activeTab === 'publish'} label="Publish" icon={<Upload className="w-4 h-4" />} color="bg-indigo-600" onClick={() => setActiveTab('publish')} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">

        {/* ── SOURCES TAB ── */}
        {activeTab === 'sources' && (
          <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto">
            <div>
              <h2 className="text-white text-xl font-bold mb-1">Source Websites</h2>
              <p className="text-gray-400 text-sm">Add website URLs to crawl. The factory will extract content and build your knowledge base automatically.</p>
            </div>

            {/* URL Input */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-orange-400" />Add Source URL</h3>
              <div className="flex gap-3">
                <input
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm"
                  placeholder="https://your-website.com or any business website..."
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSource()}
                />
                <button
                  onClick={handleAddSource}
                  disabled={!urlInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Crawl & Extract
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Supports any website. Extracts: headings, content, products, FAQs, keywords, and business type.</p>
            </div>

            {/* Source Cards */}
            {sources.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-gray-700">
                  <Globe className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">No sources added yet</h3>
                <p className="text-gray-400 text-sm max-w-md">Enter any business website URL above. The AI will crawl the site, extract all relevant content, and build a topic map automatically.</p>
                <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg text-left">
                  {[['📄', 'Content Extraction', 'Pages, posts, products, FAQs'], ['🔍', 'SEO Keywords', 'Primary + semantic keyword clusters'], ['🗺️', 'Topic Map', '40+ article topics generated instantly']].map(([icon, t, d]) => (
                    <div key={t} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="text-white text-sm font-semibold">{t}</div>
                      <div className="text-gray-400 text-xs mt-1">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map(src => (
                  <div key={src.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {src.status === 'scraping' && <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />}
                          {src.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {src.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${src.status === 'ready' ? 'bg-green-900/50 text-green-400' : src.status === 'scraping' ? 'bg-orange-900/50 text-orange-400' : 'bg-red-900/50 text-red-400'}`}>
                            {src.status === 'scraping' ? 'Crawling...' : src.status === 'ready' ? 'Ready' : 'Error'}
                          </span>
                        </div>
                        <p className="text-white text-sm font-medium truncate">{src.url}</p>
                      </div>
                      <button onClick={() => handleRemoveSource(src.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-all ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {src.status === 'ready' && src.data && (
                      <div className="space-y-2">
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <div className="text-white text-sm font-semibold">{src.data.title}</div>
                          <div className="text-gray-400 text-xs mt-1">{src.data.businessType} • {src.data.description?.slice(0, 80)}...</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-700/40 rounded-lg py-2"><div className="text-white text-sm font-bold">{src.data.headings?.length || 0}</div><div className="text-gray-500 text-xs">Sections</div></div>
                          <div className="bg-gray-700/40 rounded-lg py-2"><div className="text-white text-sm font-bold">{src.data.products?.length || 0}</div><div className="text-gray-500 text-xs">Products</div></div>
                          <div className="bg-gray-700/40 rounded-lg py-2"><div className="text-white text-sm font-bold">{src.data.keywords?.length || 0}</div><div className="text-gray-500 text-xs">Keywords</div></div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setActiveTab('topics')} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1">
                            <Layers className="w-3 h-3" /> View Topics ({clusters.reduce((acc, c) => acc + c.supportingTopics.length, 0)})
                          </button>
                          <div className="flex items-center gap-1 text-gray-400 text-xs bg-gray-700/40 rounded-lg px-3">
                            <FileText className="w-3 h-3" />
                            {src.articleCount} articles
                          </div>
                        </div>
                      </div>
                    )}
                    {src.status === 'error' && <p className="text-red-400 text-xs mt-2">{src.error}</p>}
                    {src.status === 'scraping' && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full animate-pulse w-3/4" /></div>
                        <p className="text-gray-400 text-xs mt-2">Crawling pages, extracting content, analyzing keywords...</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Guide callout */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-2xl p-5">
              <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" />AI Blog Factory Methodology</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[['🕷️', '1. Crawl & Extract', 'Scrape all pages, posts, products, FAQs'], ['🧠', '2. Knowledge Base', 'Chunk + cluster content semantically'], ['🗺️', '3. Topic Map', '40–60 articles per site, 4 pillar clusters'], ['✍️', '4. Generate', '1,500–2,500 word SEO-optimized articles']].map(([icon, t, d]) => (
                  <div key={t} className="text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-white text-xs font-semibold">{t}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TOPICS TAB ── */}
        {activeTab === 'topics' && (
          <div className="h-full flex flex-col overflow-hidden">
            {clusters.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Layers className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">No topics generated yet</h3>
                <p className="text-gray-400 text-sm mb-4">Add a source website on the Sources tab first. Topics are generated automatically from the crawled content.</p>
                <button onClick={() => setActiveTab('sources')} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Go to Sources
                </button>
              </div>
            ) : (
              <div className="flex h-full">
                {/* Left: cluster tree */}
                <div className="w-80 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-bold text-sm">Topic Clusters</h3>
                      <span className="text-xs text-gray-400">{totalTopics} articles</span>
                    </div>
                    <input
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-purple-500"
                      placeholder="Search topics..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {clusters.map(cluster => {
                      const ready = cluster.supportingTopics.filter(t => t.status === 'ready').length;
                      const total = cluster.supportingTopics.length;
                      return (
                        <div key={cluster.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                          <button
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-750 transition-all text-left"
                            onClick={() => toggleCluster(cluster.id)}
                          >
                            <span className="text-xl">{cluster.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-semibold truncate">{cluster.pillar}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${(ready / total) * 100}%`, backgroundColor: cluster.color }} />
                                </div>
                                <span className="text-gray-400 text-xs shrink-0">{ready}/{total}</span>
                              </div>
                            </div>
                            {expandedClusters.has(cluster.id) ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                          </button>
                          {expandedClusters.has(cluster.id) && (
                            <div className="border-t border-gray-700">
                              {cluster.supportingTopics
                                .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(topic => {
                                  const entry = generatedArticles.find(e => e.topicId === topic.id);
                                  const isGenerating = generatingTopicId === topic.id;
                                  return (
                                    <button
                                      key={topic.id}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-700 transition-all border-b border-gray-700/50 last:border-0 ${selectedArticle?.topicId === topic.id ? 'bg-gray-700' : ''}`}
                                      onClick={() => {
                                        if (entry) { setSelectedArticle(entry); setActiveTab('write'); }
                                        else handleGenerateArticle(topic, cluster);
                                      }}
                                    >
                                      <div className="w-4 h-4 shrink-0">
                                        {isGenerating ? <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" /> :
                                          entry ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                                            <div className="w-3 h-3 border border-gray-600 rounded-full" />}
                                      </div>
                                      <span className="flex-1 text-gray-300 truncate leading-tight">{topic.title}</span>
                                      <span className="text-gray-500 shrink-0">{(topic.estimatedWords / 1000).toFixed(1)}k</span>
                                    </button>
                                  );
                                })}
                              <div className="p-2">
                                <button
                                  onClick={() => handleBulkGenerate(cluster)}
                                  disabled={bulkGenerating}
                                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                                >
                                  {bulkGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                  Generate All {cluster.supportingTopics.filter(t => t.status === 'pending').length} Pending
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: topic detail grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-white font-bold text-lg">Topic Map Overview</h2>
                      <p className="text-gray-400 text-sm">{filteredTopics.length} topics • {generatedArticles.length} generated • {totalWords.toLocaleString()} words</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedClusterFilter}
                        onChange={e => setSelectedClusterFilter(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      >
                        <option value="all">All Clusters</option>
                        {clusters.map(c => <option key={c.id} value={c.id}>{c.pillar.slice(0, 35)}...</option>)}
                      </select>
                    </div>
                  </div>

                  {bulkGenerating && (
                    <div className="mb-4 bg-purple-900/30 border border-purple-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-300 text-sm font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Bulk generating articles...</span>
                        <span className="text-purple-400 text-sm">{bulkProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${bulkProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredTopics.map(({ topic, cluster }) => {
                      const entry = generatedArticles.find(e => e.topicId === topic.id);
                      const isGenerating = generatingTopicId === topic.id;
                      const priorityColor = topic.priority === 'High' ? 'text-red-400' : topic.priority === 'Medium' ? 'text-yellow-400' : 'text-gray-400';
                      return (
                        <div key={topic.id} className={`bg-gray-800 rounded-xl border p-4 hover:border-gray-500 transition-all ${entry ? 'border-green-700/50' : 'border-gray-700'}`}>
                          <div className="flex items-start gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cluster.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium leading-tight">{topic.title}</p>
                              <p className="text-gray-500 text-xs mt-1 truncate">{cluster.pillar}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`text-xs font-semibold ${priorityColor}`}>{topic.priority}</span>
                            <span className="text-gray-600 text-xs">•</span>
                            <span className="text-gray-400 text-xs">{(topic.estimatedWords / 1000).toFixed(1)}k words</span>
                            <span className="text-gray-600 text-xs">•</span>
                            <span className="text-gray-500 text-xs bg-gray-700 px-2 py-0.5 rounded-full">{topic.angle.replace(/-/g, ' ')}</span>
                          </div>
                          {entry ? (
                            <button
                              onClick={() => { setSelectedArticle(entry); setActiveTab('write'); }}
                              className="w-full py-2 bg-green-800/50 hover:bg-green-700/50 text-green-400 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 border border-green-700/50"
                            >
                              <Eye className="w-3 h-3" /> View Article ({entry.article.wordCount.toLocaleString()} words)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenerateArticle(topic, cluster)}
                              disabled={isGenerating || !sources.some(s => s.status === 'ready')}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white disabled:text-gray-500 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                            >
                              {isGenerating ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3" /> Generate Article</>}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WRITE TAB ── */}
        {activeTab === 'write' && (
          <div className="h-full flex overflow-hidden">
            {/* Article list sidebar */}
            <div className="w-72 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-sm">Generated Articles</h3>
                  <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">{generatedArticles.length}</span>
                </div>
                <button onClick={() => setActiveTab('topics')} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Generate New Article
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {generatedArticles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No articles yet.<br />Generate from Topics tab.</div>
                ) : (
                  generatedArticles.map(entry => (
                    <button
                      key={entry.article.id}
                      onClick={() => setSelectedArticle(entry)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${selectedArticle?.article.id === entry.article.id ? 'bg-blue-900/30 border-blue-700/50' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
                    >
                      <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{entry.article.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-500 text-xs">{entry.article.wordCount.toLocaleString()} words</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 text-xs">{entry.article.readingTime} min read</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${entry.article.status === 'ready' ? 'bg-green-400' : entry.article.status === 'published' ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                        <span className="text-gray-500 text-xs capitalize">{entry.article.status}</span>
                        {entry.seo && <span className={`ml-auto text-xs font-bold ${entry.seo.score >= 80 ? 'text-green-400' : entry.seo.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>SEO {entry.seo.score}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Article content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedArticle ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <PenTool className="w-16 h-16 text-gray-600 mb-4" />
                  <h3 className="text-white font-semibold text-lg mb-2">No article selected</h3>
                  <p className="text-gray-400 text-sm">Select an article from the sidebar or generate a new one from the Topics tab.</p>
                </div>
              ) : (
                <>
                  {/* Article header */}
                  <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-white font-bold text-lg leading-tight">{selectedArticle.article.title}</h2>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-gray-400 text-sm">{selectedArticle.article.wordCount.toLocaleString()} words</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400 text-sm">{selectedArticle.article.readingTime} min read</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-blue-400 text-sm">/{selectedArticle.article.slug}</span>
                          {selectedArticle.seo && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className={`text-sm font-bold ${selectedArticle.seo.score >= 80 ? 'text-green-400' : selectedArticle.seo.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                SEO Score: {selectedArticle.seo.score}/100
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setPreviewMode(previewMode === 'markdown' ? 'preview' : 'markdown')}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-all flex items-center gap-2"
                        >
                          {previewMode === 'markdown' ? <Eye className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          {previewMode === 'markdown' ? 'Preview' : 'Markdown'}
                        </button>
                        <button
                          onClick={() => handleCopy(`article-${selectedArticle.article.id}`, selectedArticle.article.content)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                        >
                          {copied === `article-${selectedArticle.article.id}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied === `article-${selectedArticle.article.id}` ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => { const blob = new Blob([selectedArticle.article.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${selectedArticle.article.slug}.md`; a.click(); }}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Export
                        </button>
                      </div>
                    </div>
                    {/* Meta */}
                    <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 text-xs font-semibold shrink-0 mt-0.5">META:</span>
                        <span className="text-gray-300 text-xs">{selectedArticle.article.metaDescription}</span>
                      </div>
                    </div>
                  </div>

                  {/* Article body */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {previewMode === 'preview' ? (
                      <div className="max-w-3xl mx-auto">
                        {/* Keywords */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="px-3 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full border border-purple-700/50 font-semibold">{selectedArticle.article.primaryKeyword}</span>
                          {selectedArticle.article.secondaryKeywords.map(kw => (
                            <span key={kw} className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">{kw}</span>
                          ))}
                        </div>
                        {/* Introduction */}
                        <div className="mb-8">
                          {selectedArticle.article.introduction.split('\n\n').map((para, i) => (
                            <p key={i} className="text-gray-300 text-base leading-relaxed mb-4">{para}</p>
                          ))}
                        </div>
                        {/* Sections */}
                        {selectedArticle.article.sections.map((section, i) => (
                          <div key={i} className="mb-8">
                            <h2 className="text-white text-xl font-bold mb-4 pb-2 border-b border-gray-700">{section.heading}</h2>
                            {section.content.split('\n\n').map((para, j) => {
                              if (para.startsWith('**Step')) {
                                return <div key={j} className="space-y-3 mb-4">{para.split('\n\n').map((step, k) => <p key={k} className="text-gray-300 text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />)}</div>;
                              }
                              if (para.includes('\n- ')) {
                                const [intro2, ...items] = para.split('\n');
                                return <div key={j} className="mb-4"><p className="text-gray-300 text-base leading-relaxed mb-2">{intro2}</p><ul className="space-y-2">{items.filter(i2 => i2.startsWith('- ')).map((item, k) => <li key={k} className="text-gray-300 text-base flex items-start gap-2"><span className="text-purple-400 mt-1">•</span><span dangerouslySetInnerHTML={{ __html: item.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} /></li>)}</ul></div>;
                              }
                              return <p key={j} className="text-gray-300 text-base leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />;
                            })}
                          </div>
                        ))}
                        {/* FAQs */}
                        <div className="mb-8">
                          <h2 className="text-white text-xl font-bold mb-4 pb-2 border-b border-gray-700">Frequently Asked Questions</h2>
                          <div className="space-y-4">
                            {selectedArticle.article.faqs.map((faq, i) => (
                              <div key={i} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                                <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Conclusion */}
                        <div className="mb-8">
                          <h2 className="text-white text-xl font-bold mb-4 pb-2 border-b border-gray-700">Conclusion</h2>
                          {selectedArticle.article.conclusion.split('\n\n').map((para, i) => (
                            <p key={i} className="text-gray-300 text-base leading-relaxed mb-4">{para}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-3xl mx-auto">
                        <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-gray-800 rounded-xl p-6 border border-gray-700">
                          {selectedArticle.article.content}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── REPURPOSE TAB ── */}
        {activeTab === 'repurpose' && (
          <div className="h-full flex flex-col overflow-hidden">
            {!selectedArticle?.repurposed ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Share2 className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">No article selected for repurposing</h3>
                <p className="text-gray-400 text-sm mb-4">Generate an article first, then come back here to repurpose it into 6+ content formats.</p>
                <button onClick={() => setActiveTab('topics')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all">Generate an Article</button>
              </div>
            ) : (
              <div className="flex h-full">
                {/* Format tabs */}
                <div className="w-52 shrink-0 bg-gray-900 border-r border-gray-700 p-4 space-y-1">
                  <h3 className="text-white font-bold text-sm mb-3">Content Formats</h3>
                  {([
                    ['linkedin', '💼', 'LinkedIn Post'],
                    ['twitter', '𝕏', 'Twitter/X Post'],
                    ['facebook', '📘', 'Facebook Post'],
                    ['instagram', '📸', 'Instagram'],
                    ['video', '🎬', 'Video Script'],
                    ['newsletter', '📧', 'Newsletter'],
                    ['quotes', '💬', 'Quote Cards'],
                  ] as const).map(([key, icon, label]) => (
                    <button
                      key={key}
                      onClick={() => setRepurposeTab(key as any)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${repurposeTab === key ? 'bg-green-600 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-gray-500 text-xs">1 article → {7} content pieces</p>
                    <p className="text-gray-500 text-xs mt-1">500–800 posts/month at scale</p>
                  </div>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-white font-bold text-lg capitalize">{repurposeTab.replace('-', ' ')} Content</h2>
                        <p className="text-gray-400 text-sm mt-1">From: {selectedArticle.article.title}</p>
                      </div>
                      <button
                        onClick={() => {
                          const r = selectedArticle.repurposed!;
                          const content = repurposeTab === 'linkedin' ? r.linkedin : repurposeTab === 'twitter' ? r.twitter : repurposeTab === 'facebook' ? r.facebook : repurposeTab === 'instagram' ? r.instagram : repurposeTab === 'video' ? r.videoScript : repurposeTab === 'newsletter' ? r.newsletter : r.quotes.join('\n\n');
                          handleCopy(`repurpose-${repurposeTab}`, content);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                      >
                        {copied === `repurpose-${repurposeTab}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied === `repurpose-${repurposeTab}` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    {repurposeTab === 'quotes' ? (
                      <div className="space-y-4">
                        {selectedArticle.repurposed.quotes.map((quote, i) => (
                          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <div className="text-3xl text-green-500 mb-2 font-serif">"</div>
                            <p className="text-white text-lg font-semibold leading-relaxed italic">{quote}</p>
                            <button onClick={() => handleCopy(`quote-${i}`, quote)} className="mt-3 text-gray-400 hover:text-white text-xs flex items-center gap-1">
                              {copied === `quote-${i}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copied === `quote-${i}` ? 'Copied' : 'Copy quote'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        {repurposeTab === 'video' && (
                          <div className="mb-4 flex items-center gap-2 text-sm text-purple-300 bg-purple-900/30 border border-purple-700/50 rounded-lg px-4 py-2">
                            <Video className="w-4 h-4" /> 60–90 second video script • Hook + 2 main points + CTA structure
                          </div>
                        )}
                        {repurposeTab === 'newsletter' && (
                          <div className="mb-4">
                            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-4 py-2 mb-3">
                              <span className="text-blue-300 text-sm">Subject line: </span>
                              <span className="text-white text-sm font-semibold">{selectedArticle.repurposed.emailSubjectLine}</span>
                            </div>
                          </div>
                        )}
                        <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                          {repurposeTab === 'linkedin' ? selectedArticle.repurposed.linkedin :
                            repurposeTab === 'twitter' ? selectedArticle.repurposed.twitter :
                              repurposeTab === 'facebook' ? selectedArticle.repurposed.facebook :
                                repurposeTab === 'instagram' ? selectedArticle.repurposed.instagram :
                                  repurposeTab === 'video' ? selectedArticle.repurposed.videoScript :
                                    selectedArticle.repurposed.newsletter}
                        </pre>
                      </div>
                    )}
                    <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">📊 At scale: 1 article generates 7+ pieces of content. At 2–10 articles/day, that's <span className="text-white font-semibold">500–800 social posts/month</span> + <span className="text-white font-semibold">30–50 newsletters</span>.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SEO TAB ── */}
        {activeTab === 'seo' && (
          <div className="h-full flex overflow-hidden">
            {/* Article selector */}
            <div className="w-72 shrink-0 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto">
              <h3 className="text-white font-bold text-sm mb-3">Articles</h3>
              <div className="space-y-2">
                {generatedArticles.map(entry => (
                  <button
                    key={entry.article.id}
                    onClick={() => setSelectedArticle(entry)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedArticle?.article.id === entry.article.id ? 'bg-cyan-900/30 border-cyan-700/50' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
                  >
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{entry.article.title}</p>
                    {entry.seo && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5"><div className={`h-full rounded-full ${entry.seo.score >= 80 ? 'bg-green-500' : entry.seo.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${entry.seo.score}%` }} /></div>
                        <span className={`text-xs font-bold ${entry.seo.score >= 80 ? 'text-green-400' : entry.seo.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{entry.seo.score}</span>
                      </div>
                    )}
                  </button>
                ))}
                {generatedArticles.length === 0 && <p className="text-gray-500 text-xs text-center py-4">No articles yet</p>}
              </div>
            </div>

            {/* SEO analysis */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedArticle?.seo ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                  <Search className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">Select an article to view SEO analysis</p>
                </div>
              ) : (
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black ${selectedArticle.seo.score >= 80 ? 'bg-green-900/50 text-green-400' : selectedArticle.seo.score >= 60 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
                      {selectedArticle.seo.score}
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-xl">SEO Score</h2>
                      <p className="text-gray-400 text-sm">{selectedArticle.seo.score >= 80 ? '🟢 Excellent — ready to publish' : selectedArticle.seo.score >= 60 ? '🟡 Good — minor improvements recommended' : '🔴 Needs work — review issues below'}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => setSeoView('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${seoView === 'overview' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Overview</button>
                      <button onClick={() => setSeoView('schema')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${seoView === 'schema' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Schema</button>
                    </div>
                  </div>

                  {seoView === 'overview' && (
                    <>
                      {/* Score breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        {[
                          { label: 'Title', score: selectedArticle.seo.titleScore },
                          { label: 'Meta', score: selectedArticle.seo.metaScore },
                          { label: 'Keyword', score: Math.round(Math.min(selectedArticle.seo.keywordDensity / 2.5 * 100, 100)) },
                          { label: 'Readability', score: selectedArticle.seo.readabilityScore },
                          { label: 'Structure', score: selectedArticle.seo.structureScore },
                        ].map(({ label, score }) => (
                          <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                            <div className={`text-2xl font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{score}</div>
                            <div className="text-gray-400 text-xs mt-1">{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                          <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400" />Keywords</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-xs">Primary keyword</span>
                              <span className="text-white text-xs font-semibold">{selectedArticle.article.primaryKeyword}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-xs">Keyword density</span>
                              <span className={`text-xs font-bold ${selectedArticle.seo.keywordDensity >= 0.5 && selectedArticle.seo.keywordDensity <= 2.5 ? 'text-green-400' : 'text-yellow-400'}`}>{selectedArticle.seo.keywordDensity}%</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedArticle.article.secondaryKeywords.map(kw => (
                                <span key={kw} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{kw}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                          <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2"><ExternalLink className="w-4 h-4 text-blue-400" />Internal Links</h4>
                          <div className="space-y-2">
                            {selectedArticle.article.internalLinks.map(link => (
                              <div key={link} className="text-blue-400 text-xs bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-800/40">{link}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Issues */}
                      {selectedArticle.seo.issues.length > 0 && (
                        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-5 mb-4">
                          <h4 className="text-red-400 font-semibold mb-3 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />Issues to Fix</h4>
                          <div className="space-y-2">
                            {selectedArticle.seo.issues.map((issue, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-red-300"><span className="text-red-500 mt-0.5">✗</span>{issue}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-5">
                        <h4 className="text-blue-400 font-semibold mb-3 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" />Optimization Suggestions</h4>
                        <div className="space-y-2">
                          {selectedArticle.seo.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-blue-300"><span className="text-blue-500 mt-0.5">→</span>{s}</div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {seoView === 'schema' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold">JSON-LD Schema Markup</h3>
                        <button onClick={() => handleCopy('schema', selectedArticle.seo!.schemaData)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-all flex items-center gap-1">
                          {copied === 'schema' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === 'schema' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-green-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                        {selectedArticle.seo.schemaData}
                      </pre>
                      <p className="text-gray-400 text-xs mt-3">Add this JSON-LD to the &lt;head&gt; section of your article page for rich snippet eligibility.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PUBLISH TAB ── */}
        {activeTab === 'publish' && (
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-white text-xl font-bold">Publishing Queue</h2>
              <span className="bg-indigo-900/50 text-indigo-400 text-xs px-3 py-1 rounded-full border border-indigo-700/50">{generatedArticles.filter(e => e.article.status === 'ready').length} ready to publish</span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {(['queue', 'calendar', 'settings'] as const).map(t => (
                <button key={t} onClick={() => setPublishTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${publishTab === t ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{t}</button>
              ))}
            </div>

            {publishTab === 'queue' && (
              <div>
                {generatedArticles.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No articles in queue. Generate articles first.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {generatedArticles.map(entry => (
                      <div key={entry.article.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${entry.article.status === 'published' ? 'bg-green-400' : entry.article.status === 'scheduled' ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{entry.article.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-gray-400 text-xs">{entry.article.wordCount.toLocaleString()} words</span>
                            <span className="text-gray-600 text-xs">•</span>
                            <span className="text-gray-400 text-xs">/{entry.article.slug}</span>
                            {entry.seo && <span className={`text-xs font-bold ${entry.seo.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>SEO {entry.seo.score}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { setSelectedArticle(entry); setActiveTab('write'); }}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setGeneratedArticles(prev => prev.map(e => e.article.id === entry.article.id ? { ...e, article: { ...e.article, status: 'published' } } : e))}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${entry.article.status === 'published' ? 'bg-green-800/50 text-green-400 border border-green-700/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                          >
                            {entry.article.status === 'published' ? '✓ Published' : 'Mark Published'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {publishTab === 'calendar' && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400" />Publishing Schedule</h3>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-gray-500 text-xs font-semibold py-2">{d}</div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => {
                    const day = i + 1;
                    const hasArticle = generatedArticles.some((_, idx) => (idx % 7) + 1 === (day % 7) + 1);
                    return (
                      <div key={day} className={`text-center py-2 rounded-lg text-sm ${hasArticle && day <= 14 ? 'bg-indigo-600 text-white font-semibold' : day === 15 ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>
                        {day}
                        {hasArticle && day <= 14 && <div className="w-1 h-1 bg-white rounded-full mx-auto mt-1" />}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 text-sm">
                  <p className="text-white font-semibold mb-2">Recommended Publishing Cadence</p>
                  <div className="space-y-1 text-gray-400 text-xs">
                    <p>• 2–10 blog posts per day automatically</p>
                    <p>• 1–2 social posts per platform per day</p>
                    <p>• 1 newsletter per week</p>
                    <p>• Scale: 120–200 blog posts/month from 1–2 websites</p>
                  </div>
                </div>
              </div>
            )}

            {publishTab === 'settings' && (
              <div className="space-y-4 max-w-2xl">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-400" />CMS Integrations</h3>
                  <div className="space-y-3">
                    {[['WordPress', '🔷', 'Connect via REST API + App Password'], ['Ghost', '👻', 'Connect via Ghost Admin API'], ['Webflow', '🌀', 'Connect via Webflow CMS API']].map(([name, icon, desc]) => (
                      <div key={name as string} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                        <div className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><p className="text-white text-sm font-semibold">{name}</p><p className="text-gray-400 text-xs">{desc}</p></div></div>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all">Connect</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-indigo-400" />Projected Output</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[['📝', `${Math.max(generatedArticles.length, 0) * 30}`, 'Blog Posts/Month'], ['📱', `${Math.max(generatedArticles.length, 0) * 120}`, 'Social Posts/Month'], ['🎬', `${Math.max(generatedArticles.length, 0) * 8}`, 'Video Scripts/Month'], ['📧', `${Math.max(generatedArticles.length, 0) * 4}`, 'Newsletters/Month']].map(([icon, val, label]) => (
                      <div key={label as string} className="bg-gray-700/50 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-1">{icon}</div>
                        <div className="text-white text-xl font-bold">{val}</div>
                        <div className="text-gray-400 text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
