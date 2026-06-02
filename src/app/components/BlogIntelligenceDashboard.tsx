import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  X, Search, Globe, TrendingUp, TrendingDown, Minus,
  BarChart3, Brain, MessageSquare, HelpCircle, Layers,
  Zap, Target, AlertCircle, ChevronRight, RefreshCw,
  Download, Filter, Star, ThumbsDown, ThumbsUp, ArrowUpRight,
  ArrowDownRight, Activity, Hash, Flame,
} from 'lucide-react';
import {
  buildIntelligenceReport, generateDemoReport,
  NICHE_SITES, AVAILABLE_NICHES,
  type IntelligenceReport, type TopicFrequency,
  type KeywordCluster, type SentimentResult,
  type FAQItem, type Prediction, type TopicHeatmapCell,
} from '../utils/blogIntelligence';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';

interface BlogIntelligenceDashboardProps {
  onClose: () => void;
}

type DashboardTab = 'overview' | 'topics' | 'keywords' | 'sentiment' | 'faqs' | 'trends' | 'patterns';

const TAB_CONFIG: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'topics', label: 'Topic Intelligence', icon: <Flame className="w-4 h-4" /> },
  { id: 'keywords', label: 'Keyword Clusters', icon: <Hash className="w-4 h-4" /> },
  { id: 'sentiment', label: 'Sentiment & Reviews', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'faqs', label: 'FAQ Intelligence', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'trends', label: 'Trend Prediction', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'patterns', label: 'Content Patterns', icon: <Layers className="w-4 h-4" /> },
];

const TREND_COLORS = { rising: '#10b981', stable: '#6366f1', declining: '#ef4444' };
const EMOTION_COLORS: Record<string, string> = {
  excitement: '#10b981', satisfaction: '#6366f1', neutral: '#94a3b8',
  frustration: '#ef4444', concern: '#f59e0b',
};

function HeatmapCell({ intensity }: { intensity: number }) {
  const alpha = intensity / 100;
  const bg = `rgba(99, 102, 241, ${Math.max(0.05, alpha)})`;
  const textColor = intensity > 60 ? 'white' : '#374151';
  return (
    <div
      className="w-full h-8 flex items-center justify-center text-xs font-medium rounded transition-all cursor-default"
      style={{ background: bg, color: textColor }}
      title={`Intensity: ${intensity}%`}
    >
      {intensity}
    </div>
  );
}

function ScanProgress({ current, total, siteName }: { current: number; total: number; siteName: string }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Scanning {siteName}…</span>
        <span>{current}/{total} sites ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BlogIntelligenceDashboard({ onClose }: BlogIntelligenceDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedNiche, setSelectedNiche] = useState('AI & Machine Learning');
  const [customUrls, setCustomUrls] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTotal, setScanTotal] = useState(0);
  const [currentSite, setCurrentSite] = useState('');
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [topicFilter, setTopicFilter] = useState<'all' | 'rising' | 'stable' | 'declining'>('all');
  const [heatmapTopics, setHeatmapTopics] = useState<string[]>([]);
  const scanRef = useRef(false);

  // On mount, load demo data immediately
  useEffect(() => {
    const demo = generateDemoReport(selectedNiche);
    setReport(demo);
    setHeatmapTopics(demo.topTopics.slice(0, 8).map(t => t.topic));
  }, []);

  const handleNicheChange = (niche: string) => {
    setSelectedNiche(niche);
    const demo = generateDemoReport(niche);
    setReport(demo);
    setHeatmapTopics(demo.topTopics.slice(0, 8).map(t => t.topic));
    setScanError(null);
  };

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    setScanProgress(0);
    scanRef.current = true;

    const urlsToScan = customUrls.trim()
      ? customUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'))
      : (NICHE_SITES[selectedNiche] || []);

    setScanTotal(urlsToScan.length);

    try {
      // Simulate progress while backend scans
      let progressInterval: ReturnType<typeof setInterval>;
      let siteIdx = 0;

      progressInterval = setInterval(() => {
        if (!scanRef.current) { clearInterval(progressInterval); return; }
        siteIdx = Math.min(siteIdx + 1, urlsToScan.length);
        setScanProgress(siteIdx);
        try {
          setCurrentSite(new URL(urlsToScan[siteIdx - 1] || urlsToScan[0]).hostname);
        } catch { setCurrentSite('scanning...'); }
      }, 800);

      const response = await serverFetch('/blog-intelligence/scan', {
        method: 'POST',
        body: JSON.stringify({ urls: urlsToScan, niche: selectedNiche }),
      });

      clearInterval(progressInterval);
      setScanProgress(urlsToScan.length);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.results || data.results.length === 0) {
        throw new Error('No data returned from scan — using demo data');
      }

      const built = buildIntelligenceReport(selectedNiche, data.results);
      setReport(built);
      setHeatmapTopics(built.topTopics.slice(0, 8).map(t => t.topic));
      setUseDemoMode(false);
    } catch (err) {
      console.error('[BlogIntelligence] Scan error:', err);
      setScanError(`Live scan unavailable: ${err instanceof Error ? err.message : 'Unknown error'}. Showing demo intelligence data.`);
      const demo = generateDemoReport(selectedNiche);
      setReport(demo);
      setHeatmapTopics(demo.topTopics.slice(0, 8).map(t => t.topic));
      setUseDemoMode(true);
    } finally {
      scanRef.current = false;
      setIsScanning(false);
    }
  }, [selectedNiche, customUrls]);

  const filteredTopics = report?.topTopics.filter(t =>
    topicFilter === 'all' || t.trend === topicFilter
  ) || [];

  // ── Render helpers ─────────────────────────────────────────

  function renderOverview() {
    if (!report) return null;
    const avgSentiment = report.sentimentData.length
      ? Math.round(report.sentimentData.reduce((s, r) => s + r.positive, 0) / report.sentimentData.length)
      : 0;
    const topCluster = report.keywordClusters[0];

    return (
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sites Scanned', value: report.sitesScanned, icon: <Globe className="w-5 h-5" />, color: 'from-indigo-500 to-purple-600' },
            { label: 'Headlines Analyzed', value: report.totalHeadlines, icon: <Hash className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600' },
            { label: 'Avg Sentiment', value: `${avgSentiment}% Positive`, icon: <ThumbsUp className="w-5 h-5" />, color: 'from-amber-500 to-orange-600' },
            { label: 'Top Keyword Cluster', value: topCluster?.label || '—', icon: <Layers className="w-5 h-5" />, color: 'from-pink-500 to-rose-600' },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white`}>
              <div className="flex items-center gap-2 mb-2 opacity-90">{stat.icon}<span className="text-xs font-medium">{stat.label}</span></div>
              <div className="text-xl font-bold leading-tight">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Top Topics Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Most Popular Topics in {selectedNiche} Blogging
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={report.topTopics.slice(0, 10)} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="topic" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v: number) => [v, 'Frequency']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {report.topTopics.slice(0, 10).map((entry, i) => (
                  <Cell key={`topic-overview-bar-${entry.topic}-${i}`} fill={TREND_COLORS[entry.trend]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs justify-center">
            {[['rising', '#10b981', 'Rising'], ['stable', '#6366f1', 'Stable'], ['declining', '#ef4444', 'Declining']].map(([key, color, label]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two columns: Content Patterns + Competitor Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Content Patterns */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Content Patterns Driving Traffic
            </h3>
            <div className="space-y-3">
              {report.contentPatterns.slice(0, 5).map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{p.type}</span>
                    <span className="text-indigo-600 font-semibold">{p.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${p.percentage}%` }} />
                  </div>
                  {p.examples.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 truncate">e.g. "{p.examples[0]}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What Tech Companies Are Writing About */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              What Companies Are Writing About
            </h3>
            <div className="space-y-3">
              {report.competitorInsights.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">{c.domain[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.domain}</p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{c.contentFrequency}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.topTopics.slice(0, 3).map((t, j) => (
                        <span key={j} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-emerald-600">{c.sentiment}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Demand Overview */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-500" />
            Feature Demand Analysis
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={report.featureDemands.slice(0, 8)} layout="vertical" margin={{ left: 120, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, 'Demand']} />
              <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
                {report.featureDemands.slice(0, 8).map((demand, i) => (
                  <Cell key={`feature-demand-bar-${demand.feature}-${i}`} fill={`hsl(${240 + i * 20}, 70%, ${55 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  function renderTopics() {
    if (!report) return null;
    const filtered = filteredTopics;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Filter by trend:</span>
          {(['all', 'rising', 'stable', 'declining'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTopicFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${topicFilter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f === 'rising' && <TrendingUp className="inline w-3 h-3 mr-1" />}
              {f === 'declining' && <TrendingDown className="inline w-3 h-3 mr-1" />}
              {f === 'stable' && <Minus className="inline w-3 h-3 mr-1" />}
              {f}
            </button>
          ))}
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.slice(0, 12).map((topic, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800">{topic.topic}</h4>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${topic.trend === 'rising' ? 'bg-emerald-100 text-emerald-700' :
                        topic.trend === 'declining' ? 'bg-red-100 text-red-700' :
                          'bg-indigo-100 text-indigo-700'
                      }`}>
                      {topic.trend === 'rising' ? <ArrowUpRight className="w-3 h-3" /> :
                        topic.trend === 'declining' ? <ArrowDownRight className="w-3 h-3" /> :
                          <Minus className="w-3 h-3" />}
                      {topic.trend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{topic.count} mentions · {topic.percentage}% share</p>
                </div>
                <div className="text-2xl font-bold text-gray-200">#{i + 1}</div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${topic.percentage * 8}%`,
                    background: TREND_COLORS[topic.trend],
                  }}
                />
              </div>

              {topic.relatedTopics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-400">Related:</span>
                  {topic.relatedTopics.map((rt, j) => (
                    <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rt}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm overflow-x-auto">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            Topic Heatmap — Monthly Volume
          </h3>
          <div className="min-w-max">
            {/* Month headers */}
            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `140px repeat(12, 48px)` }}>
              <div />
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                <div key={m} className="text-xs text-center text-gray-400 font-medium">{m}</div>
              ))}
            </div>
            {/* Rows */}
            {report.topicHeatmap.slice(0, 8).map((row, rowIdx) => (
              <div key={rowIdx} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `140px repeat(12, 48px)` }}>
                <div className="text-xs text-gray-600 font-medium truncate flex items-center pr-2">
                  {row[0]?.topic || `Topic ${rowIdx + 1}`}
                </div>
                {row.map((cell, colIdx) => (
                  <HeatmapCell key={colIdx} intensity={cell.intensity} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-400">Intensity:</span>
            <div className="flex gap-1">
              {[10, 30, 50, 70, 90].map(v => (
                <div key={v} className="w-6 h-4 rounded text-xs" style={{ background: `rgba(99,102,241,${v / 100})` }} />
              ))}
            </div>
            <span className="text-xs text-gray-400">Low → High</span>
          </div>
        </div>
      </div>
    );
  }

  function renderKeywords() {
    if (!report) return null;
    return (
      <div className="space-y-6">
        {/* Bubble Chart (Scatter as proxy) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-500" />
            Keyword Frequency Analysis
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="frequency" name="Frequency" tick={{ fontSize: 11 }} label={{ value: 'Frequency', position: 'insideBottom', offset: -10, fontSize: 11 }} />
              <YAxis dataKey="size" name="Relevance" tick={{ fontSize: 11 }} label={{ value: 'Relevance', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <ZAxis dataKey="size" range={[40, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v: any, name: string) => [v, name]}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
                      <p className="font-semibold text-gray-800">{d?.label}</p>
                      <p className="text-gray-500">Frequency: {d?.frequency}</p>
                      <p className="text-gray-500">Keywords: {d?.keywords?.slice(0, 3).join(', ')}</p>
                    </div>
                  );
                }}
              />
              <Scatter data={report.keywordClusters} fill="#6366f1">
                {report.keywordClusters.map((entry, i) => (
                  <Cell key={`cluster-scatter-${i}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Cluster Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.keywordClusters.map((cluster, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: cluster.color }}
                />
                <h4 className="font-semibold text-gray-800">{cluster.label}</h4>
                <span className="ml-auto text-sm text-gray-400">{cluster.frequency} hits</span>
              </div>

              {/* Mini frequency bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (cluster.frequency / (report.keywordClusters[0]?.frequency || 1)) * 100)}%`,
                    background: cluster.color,
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {cluster.keywords.slice(0, 8).map((kw, j) => (
                  <span
                    key={j}
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background: cluster.color + '20',
                      color: cluster.color,
                      border: `1px solid ${cluster.color}40`,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSentiment() {
    if (!report) return null;
    const avgPositive = Math.round(report.sentimentData.reduce((s, r) => s + r.positive, 0) / (report.sentimentData.length || 1));
    const avgNegative = Math.round(report.sentimentData.reduce((s, r) => s + r.negative, 0) / (report.sentimentData.length || 1));

    // Collect all complaints and praises
    const allComplaints = report.sentimentData.flatMap(r => r.complaints);
    const complaintFreq = new Map<string, number>();
    allComplaints.forEach(c => complaintFreq.set(c, (complaintFreq.get(c) || 0) + 1));
    const topComplaints = Array.from(complaintFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const emotionData = report.sentimentData.reduce((acc, r) => {
      acc[r.dominantEmotion] = (acc[r.dominantEmotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(emotionData).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: EMOTION_COLORS[name] || '#94a3b8',
    }));

    return (
      <div className="space-y-6">
        {/* Overall Sentiment Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">Positive Sentiment</span>
            </div>
            <div className="text-4xl font-bold text-emerald-600">{avgPositive}%</div>
            <div className="w-full bg-emerald-200 rounded-full h-2 mt-3">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${avgPositive}%` }} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Negative Sentiment</span>
            </div>
            <div className="text-4xl font-bold text-red-600">{avgNegative}%</div>
            <div className="w-full bg-red-200 rounded-full h-2 mt-3">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${avgNegative}%` }} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-indigo-800">Dominant Emotions</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={`emotion-pie-${i}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number, n: string) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Source Sentiment */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            Sentiment by Source
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={report.sentimentData.slice(0, 8)} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="source" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar key="positive" dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
              <Bar key="neutral" dataKey="neutral" stackId="a" fill="#94a3b8" name="Neutral" />
              <Bar key="negative" dataKey="negative" stackId="a" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recurring Complaint Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Recurring Complaint Patterns
            </h3>
            <div className="space-y-3">
              {topComplaints.map(([complaint, count], i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-red-500 flex-shrink-0 text-sm">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{complaint}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(count / (topComplaints[0]?.[1] || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{count}x</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-500" />
              What Users Love
            </h3>
            <div className="space-y-3">
              {report.sentimentData.flatMap(r => r.praises).slice(0, 6).map((praise, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-emerald-500 flex-shrink-0 text-sm">✓</span>
                  <p className="text-sm text-gray-700">{praise}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFAQs() {
    if (!report) return null;
    const categories = [...new Set(report.faqItems.map(f => f.category))] as string[];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat, i) => {
            const catFAQs = report.faqItems.filter(f => f.category === cat);
            const colors = ['from-indigo-50 to-blue-50 border-indigo-100', 'from-emerald-50 to-teal-50 border-emerald-100', 'from-amber-50 to-orange-50 border-amber-100', 'from-rose-50 to-pink-50 border-rose-100', 'from-purple-50 to-violet-50 border-purple-100', 'from-cyan-50 to-sky-50 border-cyan-100'];
            return (
              <div key={i} className={`bg-gradient-to-br ${colors[i % colors.length]} border rounded-xl p-4`}>
                <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  {cat}
                  <span className="ml-auto text-xs bg-white px-2 py-0.5 rounded-full text-gray-600">{catFAQs.length} FAQs</span>
                </div>
                <div className="space-y-1">
                  {catFAQs.slice(0, 3).map((faq, j) => (
                    <p key={j} className="text-xs text-gray-600 truncate">· {faq.question}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {report.faqItems.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  Q
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800">{faq.question}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{faq.category}</span>
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{faq.frequency} searches/mo</span>
                  </div>
                  {faq.suggestedAnswer && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{faq.suggestedAnswer}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {faq.sources.map((src, j) => (
                      <span key={j} className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{src}</span>
                    ))}
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-100 flex-shrink-0">#{i + 1}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderTrends() {
    if (!report) return null;
    return (
      <div className="space-y-6">
        {/* Trend Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            12-Month Content Volume & Sentiment Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={report.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area key="volume" type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2} fill="url(#volumeGrad)" name="Content Volume" />
              <Area key="sentiment" type="monotone" dataKey="sentiment" stroke="#10b981" strokeWidth={2} fill="url(#sentimentGrad)" name="Sentiment Score" />
              <Line key="newTopics" type="monotone" dataKey="newTopics" stroke="#f59e0b" strokeWidth={2} dot={false} name="New Topics" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Predictions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            AI-Predicted Topic Growth (Next 6 Months)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.predictions.map((pred, i) => (
              <div key={i} className={`rounded-xl border p-4 ${pred.predictedGrowth > 50 ? 'bg-emerald-50 border-emerald-100' :
                  pred.predictedGrowth > 10 ? 'bg-indigo-50 border-indigo-100' :
                    pred.predictedGrowth < 0 ? 'bg-red-50 border-red-100' :
                      'bg-gray-50 border-gray-100'
                }`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{pred.topic}</h4>
                  <span className={`text-lg font-bold ${pred.predictedGrowth > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {pred.predictedGrowth > 0 ? '+' : ''}{pred.predictedGrowth}%
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pred.predictedGrowth > 0 ? 'bg-emerald-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, Math.abs(pred.predictedGrowth) / 1.2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">Conf: {pred.confidence}%</span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{pred.reasoning}</p>
                <p className="text-xs text-gray-400 mt-1">Timeframe: {pred.timeframe}</p>
              </div>
            ))}
          </div>
        </div>

        {/* New Topics Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            New Topic Emergence by Month
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={report.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [v, 'New Topics']} />
              <Bar dataKey="newTopics" radius={[4, 4, 0, 0]}>
                {report.trendData.map((_, i) => (
                  <Cell key={`trend-bar-${i}`} fill={`hsl(${200 + i * 15}, 70%, 55%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  function renderPatterns() {
    if (!report) return null;
    const radarData = report.contentPatterns.map(p => ({
      subject: p.type.split(' ')[0],
      value: p.percentage,
    }));

    return (
      <div className="space-y-6">
        {/* Radar Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            Content Pattern Distribution
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Pattern %" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, 'Prevalence']} />
              </RadarChart>
            </ResponsiveContainer>

            <div className="space-y-2 min-w-48">
              {report.contentPatterns.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `hsl(${240 + i * 30}, 70%, 55%)` }} />
                  <span className="text-gray-700 flex-1">{p.type}</span>
                  <span className="font-semibold text-gray-800">{p.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pattern Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.contentPatterns.map((p, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{p.type}</h4>
                <span className="text-xl font-bold text-indigo-600">{p.percentage}%</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{p.description}</p>
              {p.examples.length > 0 && (
                <div className="space-y-1">
                  {p.examples.map((ex, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-400 leading-snug">{ex}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${p.percentage}%`, background: `hsl(${240 + i * 30}, 70%, 55%)` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Structural Pattern Extractor */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            Structural Pattern Intelligence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              { title: 'Optimal Headline Formula', desc: 'Number + Adjective + Keyword + Promise (e.g. "7 Proven AI Strategies That Drive Growth")' },
              { title: 'Content Length Pattern', desc: 'High-traffic posts average 1,847 words with clear H2/H3 structure and embedded data points' },
              { title: 'Publication Timing', desc: 'Peak engagement: Tuesday–Thursday 9–11am. Long-form content performs best on Mondays' },
              { title: 'CTA Placement', desc: 'Content with mid-article CTAs converts 37% better than end-only CTAs in this niche' },
              { title: 'Image-to-Text Ratio', desc: 'Top posts include 1 visual per 300 words. Infographics drive 3x more shares' },
              { title: 'Internal Link Depth', desc: 'High-authority posts average 8-12 internal links and 3-5 external authority citations' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="font-semibold text-indigo-800 mb-1 text-xs uppercase tracking-wide">{item.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Blog Intelligence Dashboard
              </h2>
              <p className="text-indigo-100 text-sm mt-0.5">
                Scan 50+ sites · Keyword clustering · Sentiment scoring · Trend prediction
              </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Niche Selector + Scan Controls */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <select
                value={selectedNiche}
                onChange={e => handleNicheChange(e.target.value)}
                disabled={isScanning}
                className="w-full bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
              >
                {AVAILABLE_NICHES.map(n => (
                  <option key={n} value={n} className="text-gray-800 bg-white">{n}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-2 bg-white text-indigo-700 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-60"
            >
              {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isScanning ? 'Scanning...' : `Scan ${(NICHE_SITES[selectedNiche] || []).length} Sites Live`}
            </button>
          </div>

          {/* Progress */}
          {isScanning && (
            <div className="mt-3">
              <ScanProgress current={scanProgress} total={scanTotal} siteName={currentSite} />
            </div>
          )}

          {/* Status badges */}
          {!isScanning && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {useDemoMode ? (
                <span className="text-xs bg-amber-400/30 text-amber-100 px-3 py-1 rounded-full border border-amber-300/30">
                  ⚡ Demo Intelligence Data — Click "Scan Live" for real data
                </span>
              ) : report ? (
                <span className="text-xs bg-emerald-400/30 text-emerald-100 px-3 py-1 rounded-full border border-emerald-300/30">
                  ✅ {report.sitesScanned} sites scanned · {report.totalHeadlines} headlines analyzed
                </span>
              ) : null}
              {scanError && (
                <span className="text-xs bg-red-400/20 text-red-200 px-3 py-1 rounded-full border border-red-300/20 max-w-sm truncate">
                  ⚠ {scanError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {!report ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a niche and click "Scan Sites" to begin analysis</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'topics' && renderTopics()}
              {activeTab === 'keywords' && renderKeywords()}
              {activeTab === 'sentiment' && renderSentiment()}
              {activeTab === 'faqs' && renderFAQs()}
              {activeTab === 'trends' && renderTrends()}
              {activeTab === 'patterns' && renderPatterns()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-400">
            {report && `Last scanned: ${new Date(report.scannedAt).toLocaleString()} · ${report.sitesScanned} sites · ${report.keywordClusters.length} clusters`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (report) {
                  const json = JSON.stringify(report, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `blog-intelligence-${selectedNiche.toLowerCase().replace(/\s+/g, '-')}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
            <button onClick={onClose} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}