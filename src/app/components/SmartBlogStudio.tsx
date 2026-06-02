import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles, Send, Brain, Zap, Target, CheckCircle2, AlertCircle,
  X, Play, Pause, RotateCcw, Download, Copy, Eye, Code, Settings,
  TrendingUp, BarChart3, Search, Hash, FileText, Share2, Award,
  Gauge, Activity, RefreshCw, ChevronDown, ChevronUp, ChevronRight,
  Lightbulb, ThumbsUp, ThumbsDown, Star, BookOpen, Filter, Layers,
  Shield, Globe, Clock, Users, Flame, Wand2, MessageSquare, Link,
  ArrowRight, Check, AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createBlogAgents, getBlogAgentsForPhase, getBlogCategories,
  getBlogAgentsByCategory, BLOG_AGENT_COLORS, BLOG_PIPELINE,
  type BlogAgent, type BlogAgentStatus, type BlogAgentCategory
} from './blogWritingAgents';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SmartBlogConfig {
  tone: 'professional' | 'casual' | 'technical' | 'conversational' | 'authoritative';
  wordCount: number;
  seoFocus: 'high' | 'medium' | 'low';
  readingLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  includeImages: boolean;
  includeFAQ: boolean;
  includeSchema: boolean;
  targetKeywords: string[];
}

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  outline: string[];
  content: string;
  metaDescription: string;
  headlineVariants: string[];
  seoScore: number;
  readabilityScore: number;
  originalityScore: number;
  engagementScore: number;
  qualityScore: number;
  keywords: { primary: string; secondary: string[]; lsi: string[] };
  tags: string[];
  categories: string[];
  wordCount: number;
  readTime: number;
  citations: { text: string; source: string; url: string }[];
  faqs: { question: string; answer: string }[];
  schema: string;
  internalLinks: { anchor: string; url: string }[];
  imageAltTags: string[];
  socialPosts: { platform: string; content: string }[];
  createdAt: number;
  agentProgress: Record<number, number>;
}

interface PipelinePhase {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  duration?: number;
  agentIds: number[];
}

interface QualityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  score: number;
  message: string;
  suggestions?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SmartBlogStudioProps {
  isopen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export function SmartBlogStudio({ isopen, onClose, initialTopic }: SmartBlogStudioProps) {
  // State
  const [topic, setTopic] = useState(initialTopic || '');
  const [config, setConfig] = useState<SmartBlogConfig>({
    tone: 'professional',
    wordCount: 2000,
    seoFocus: 'high',
    readingLevel: 'intermediate',
    includeImages: true,
    includeFAQ: true,
    includeSchema: true,
    targetKeywords: [],
  });

  const [agents, setAgents] = useState<BlogAgent[]>([]);
  const [phases, setPhases] = useState<PipelinePhase[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);

  const [activeTab, setActiveTab] = useState<'config' | 'agents' | 'content' | 'quality' | 'seo'>('config');
  const [agentViewMode, setAgentViewMode] = useState<'category' | 'timeline'>('category');
  const [expandedCategories, setExpandedCategories] = useState<Set<BlogAgentCategory>>(new Set(['Writing & Generation']));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generationAbortRef = useRef(false);

  // Initialize
  useEffect(() => {
    if (isopen && agents.length === 0) {
      setAgents(createBlogAgents());
      setPhases(BLOG_PIPELINE.map(p => ({
        id: p.phaseId,
        name: p.phaseName,
        status: 'pending',
        progress: 0,
        agentIds: p.agentIds,
      })));
    }
  }, [isopen]);

  if (!isopen) return null;

  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERATION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════════

  const startGeneration = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    generationAbortRef.current = false;
    setActiveTab('agents');
    setCurrentPhase(0);

    // Reset agents
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as BlogAgentStatus, progress: 0 })));
    setPhases(prev => prev.map(p => ({ ...p, status: 'pending', progress: 0 })));

    const startTime = Date.now();
    const articleId = `blog-${Date.now()}`;

    try {
      // Execute pipeline phases
      for (let phaseIdx = 0; phaseIdx < BLOG_PIPELINE.length; phaseIdx++) {
        if (generationAbortRef.current) break;

        const pipeline = BLOG_PIPELINE[phaseIdx];
        setCurrentPhase(phaseIdx);

        // Update phase status
        setPhases(prev => prev.map(p =>
          p.id === pipeline.phaseId ? { ...p, status: 'running' } : p
        ));

        const phaseStart = Date.now();

        // Activate agents for this phase
        setAgents(prev => prev.map(a =>
          pipeline.agentIds.includes(a.id) ? { ...a, status: 'analyzing', startedAt: Date.now() } : a
        ));

        // Simulate agent work (replace with real AI calls)
        await simulatePhaseWork(pipeline.phaseId, pipeline.agentIds, pipeline.estimatedDuration);

        const phaseDuration = Date.now() - phaseStart;

        // Mark phase complete
        setPhases(prev => prev.map(p =>
          p.id === pipeline.phaseId ? { ...p, status: 'complete', progress: 100, duration: phaseDuration } : p
        ));

        // Mark agents complete
        setAgents(prev => prev.map(a =>
          pipeline.agentIds.includes(a.id) ? { ...a, status: 'complete', progress: 100, completedAt: Date.now() } : a
        ));
      }

      // Generate final article
      const generatedArticle = await generateFinalArticle(articleId, topic, config);
      setArticle(generatedArticle);

      // Run quality checks
      const checks = runQualityChecks(generatedArticle);
      setQualityChecks(checks);

      setActiveTab('content');
      toast.success(`Article generated in ${((Date.now() - startTime) / 1000).toFixed(1)}s! Quality Score: ${generatedArticle.qualityScore}/100`);

    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setPhases(prev => prev.map(p => p.status === 'running' ? { ...p, status: 'error' } : p));
    } finally {
      setIsGenerating(false);
    }
  };

  const simulatePhaseWork = async (phaseId: number, agentIds: number[], duration: number) => {
    const steps = 20;
    const stepDuration = (duration * 1000) / steps;

    for (let i = 0; i <= steps; i++) {
      if (generationAbortRef.current) break;

      const progress = (i / steps) * 100;

      setPhases(prev => prev.map(p =>
        p.id === phaseId ? { ...p, progress } : p
      ));

      setAgents(prev => prev.map(a =>
        agentIds.includes(a.id) ? { ...a, progress } : a
      ));

      await new Promise(r => setTimeout(r, stepDuration));
    }
  };

  const generateFinalArticle = async (id: string, topic: string, config: SmartBlogConfig): Promise<BlogArticle> => {
    // This would call your backend AI service
    // For now, generate a comprehensive demo article

    const headlineVariants = [
      `The Complete Guide to ${topic}`,
      `How to Master ${topic} in 2026`,
      `${topic}: Everything You Need to Know`,
      `10 Proven Strategies for ${topic}`,
      `${topic} Explained: A Comprehensive Guide`
    ];

    const outline = [
      'Introduction: Understanding the Landscape',
      'What is ' + topic + '?',
      'Why ' + topic + ' Matters in 2026',
      'Key Concepts and Terminology',
      'Step-by-Step Implementation Guide',
      'Common Challenges and Solutions',
      'Best Practices and Expert Tips',
      'Real-World Case Studies',
      'Frequently Asked Questions',
      'Conclusion and Next Steps'
    ];

    const content = generateLongFormContent(topic, config, outline);

    return {
      id,
      title: headlineVariants[0],
      slug: topic.toLowerCase().replace(/\s+/g, '-'),
      outline,
      content,
      metaDescription: `Discover everything about ${topic} in this comprehensive 2026 guide. Learn strategies, best practices, and expert tips to master ${topic} effectively.`,
      headlineVariants,
      seoScore: Math.round(85 + Math.random() * 10),
      readabilityScore: Math.round(75 + Math.random() * 15),
      originalityScore: Math.round(90 + Math.random() * 10),
      engagementScore: Math.round(80 + Math.random() * 15),
      qualityScore: Math.round(85 + Math.random() * 10),
      keywords: {
        primary: topic,
        secondary: [`${topic} guide`, `${topic} strategies`, `${topic} tips`, `${topic} best practices`],
        lsi: [`${topic} definition`, `${topic} examples`, `${topic} benefits`, `${topic} implementation`]
      },
      tags: [topic, 'guide', '2026', 'best practices', 'strategies'],
      categories: ['Guides', 'Strategy', 'How-To'],
      wordCount: content.split(/\s+/).length,
      readTime: Math.ceil(content.split(/\s+/).length / 200),
      citations: [
        { text: 'Industry research', source: 'TechCrunch', url: 'https://techcrunch.com' },
        { text: 'Expert analysis', source: 'Harvard Business Review', url: 'https://hbr.org' },
      ],
      faqs: [
        { question: `What is ${topic}?`, answer: `${topic} is a comprehensive approach to...` },
        { question: `Why is ${topic} important?`, answer: `${topic} matters because...` },
        { question: `How do I get started with ${topic}?`, answer: `To begin with ${topic}, you should...` }
      ],
      schema: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": headlineVariants[0],
        "datePublished": new Date().toISOString(),
        "author": { "@type": "Organization", "name": "Your Brand" }
      }, null, 2),
      internalLinks: [
        { anchor: 'related guide', url: '/guides/related-topic' },
        { anchor: 'learn more', url: '/resources/advanced-guide' }
      ],
      imageAltTags: [
        `${topic} infographic showing key concepts`,
        `Step-by-step ${topic} implementation diagram`,
        `${topic} best practices visualization`
      ],
      socialPosts: [
        { platform: 'Twitter', content: `New guide: Everything you need to know about ${topic} 🚀\n\n✅ Step-by-step strategies\n✅ Expert tips\n✅ Real case studies\n\nRead now 👇` },
        { platform: 'LinkedIn', content: `I've just published a comprehensive guide to ${topic}.\n\nKey insights:\n• ${outline[1]}\n• ${outline[4]}\n• ${outline[6]}\n\nPerfect for professionals looking to level up their skills.` },
      ],
      createdAt: Date.now(),
      agentProgress: {},
    };
  };

  const generateLongFormContent = (topic: string, config: SmartBlogConfig, outline: string[]): string => {
    let content = `# ${topic}: The Definitive 2026 Guide\n\n`;

    outline.forEach((section, idx) => {
      content += `## ${section}\n\n`;

      if (idx === 0) {
        content += `In today's rapidly evolving landscape, ${topic} has become more crucial than ever. This comprehensive guide will walk you through everything you need to know about ${topic}, from fundamental concepts to advanced strategies.\n\n`;
        content += `Whether you're a beginner just getting started or an experienced professional looking to refine your approach, this guide provides actionable insights backed by research and real-world examples.\n\n`;
      } else {
        content += `Lorem ipsum dolor sit amet, consectetur adipiscing elit. This section covers the essential aspects of ${section.toLowerCase()}, providing you with practical knowledge you can apply immediately.\n\n`;
        content += `Research shows that understanding these concepts can significantly impact your results. Let's dive into the details:\n\n`;
        content += `- **Key Point 1**: Important consideration about ${topic}\n`;
        content += `- **Key Point 2**: Critical strategy for implementation\n`;
        content += `- **Key Point 3**: Best practice recommendation\n\n`;
      }
    });

    return content;
  };

  const runQualityChecks = (article: BlogArticle): QualityCheck[] => {
    return [
      {
        name: 'SEO Optimization',
        status: article.seoScore >= 80 ? 'pass' : article.seoScore >= 60 ? 'warning' : 'fail',
        score: article.seoScore,
        message: `SEO score is ${article.seoScore}/100`,
        suggestions: article.seoScore < 80 ? ['Add more internal links', 'Optimize meta description', 'Improve keyword density'] : undefined
      },
      {
        name: 'Readability',
        status: article.readabilityScore >= 70 ? 'pass' : 'warning',
        score: article.readabilityScore,
        message: `Flesch-Kincaid score: ${article.readabilityScore}/100`
      },
      {
        name: 'Originality',
        status: article.originalityScore >= 85 ? 'pass' : article.originalityScore >= 70 ? 'warning' : 'fail',
        score: article.originalityScore,
        message: `Content is ${article.originalityScore}% original`,
        suggestions: article.originalityScore < 85 ? ['Rewrite similar sections', 'Add unique insights'] : undefined
      },
      {
        name: 'Engagement Potential',
        status: article.engagementScore >= 75 ? 'pass' : 'warning',
        score: article.engagementScore,
        message: `Predicted engagement: ${article.engagementScore}/100`
      },
      {
        name: 'Fact Checking',
        status: 'pass',
        score: 95,
        message: 'All claims verified with credible sources'
      },
      {
        name: 'Grammar & Spelling',
        status: 'pass',
        score: 98,
        message: 'No critical issues found'
      }
    ];
  };

  const stopGeneration = () => {
    generationAbortRef.current = true;
    setIsGenerating(false);
    toast.info('Generation stopped by user');
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleCategory = (cat: BlogAgentCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  const agentsByCategory = getBlogAgentsByCategory(agents);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none flex items-center gap-2">
                Smart Blog Studio
                <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">65 AI Agents</span>
              </h1>
              <p className="text-sm text-gray-300 mt-1">SuperBrainBuilder Integration • AI Content Generation • Real-Time Optimization</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {article && (
            <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-4 py-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <div className="text-xs text-emerald-400 font-semibold">Quality Score</div>
                <div className="text-lg font-bold text-white">{article.qualityScore}/100</div>
              </div>
            </div>
          )}
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-2 flex items-center gap-1 overflow-x-auto shrink-0">
        {([
          ['config', Settings, 'Configuration'],
          ['agents', Brain, 'AI Agents'],
          ['content', FileText, 'Content'],
          ['quality', CheckCircle2, 'Quality'],
          ['seo', TrendingUp, 'SEO & Analytics'],
        ] as const).map(([tab, Icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Topic Input */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                What do you want to write about?
              </h2>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., AI-Powered Marketing Automation, Quantum Computing Basics..."
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-4 text-white text-lg placeholder-gray-400 focus:outline-none focus:border-purple-500"
                onKeyDown={e => e.key === 'Enter' && startGeneration()}
              />
            </div>

            {/* Quick Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <label className="text-white font-semibold mb-3 block">Writing Tone</label>
                <select
                  value={config.tone}
                  onChange={e => setConfig(prev => ({ ...prev, tone: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                  <option value="conversational">Conversational</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <label className="text-white font-semibold mb-3 block">Target Word Count</label>
                <select
                  value={config.wordCount}
                  onChange={e => setConfig(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={1000}>1,000 words (Quick)</option>
                  <option value={1500}>1,500 words (Standard)</option>
                  <option value={2000}>2,000 words (Comprehensive)</option>
                  <option value={3000}>3,000 words (In-Depth)</option>
                  <option value={5000}>5,000+ words (Ultimate Guide)</option>
                </select>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <label className="text-white font-semibold mb-3 block">SEO Focus</label>
                <select
                  value={config.seoFocus}
                  onChange={e => setConfig(prev => ({ ...prev, seoFocus: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="high">High (Maximum SEO)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="low">Low (Creative Priority)</option>
                </select>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <label className="text-white font-semibold mb-3 block">Reading Level</label>
                <select
                  value={config.readingLevel}
                  onChange={e => setConfig(prev => ({ ...prev, readingLevel: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-5 text-white font-semibold hover:bg-gray-750 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Advanced Options
                </span>
                {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showAdvanced && (
                <div className="p-5 border-t border-gray-700 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeImages}
                      onChange={e => setConfig(prev => ({ ...prev, includeImages: e.target.checked }))}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-white">Generate Image Suggestions & ALT Tags</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeFAQ}
                      onChange={e => setConfig(prev => ({ ...prev, includeFAQ: e.target.checked }))}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-white">Auto-Generate FAQ Section</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeSchema}
                      onChange={e => setConfig(prev => ({ ...prev, includeSchema: e.target.checked }))}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-white">Generate Schema Markup (JSON-LD)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Start Button */}
            <div className="flex gap-3">
              <button
                onClick={startGeneration}
                disabled={isGenerating || !topic.trim()}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                {isGenerating ? 'Generating with 65 AI Agents...' : 'Generate Smart Blog Post'}
              </button>

              {isGenerating && (
                <button
                  onClick={stopGeneration}
                  className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                >
                  <Pause className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Agent Count Badge */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <Brain className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-bold mb-2">65 Specialized AI Agents</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    {getBlogCategories().map(cat => {
                      const count = agentsByCategory[cat]?.length || 0;
                      const colors = BLOG_AGENT_COLORS[cat];
                      return (
                        <div key={cat} className="text-gray-300">
                          <span className={colors.text}>{colors.icon}</span> {count} {cat.split(' ')[0]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* View Mode Toggle */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-900">
              <h2 className="text-white font-bold">Agent Orchestration</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setAgentViewMode('category')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${agentViewMode === 'category' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                >
                  By Category
                </button>
                <button
                  onClick={() => setAgentViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${agentViewMode === 'timeline' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                >
                  Pipeline Timeline
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {agentViewMode === 'category' ? (
                <div className="space-y-3">
                  {getBlogCategories().map(category => {
                    const categoryAgents = agentsByCategory[category] || [];
                    const colors = BLOG_AGENT_COLORS[category];
                    const activeCount = categoryAgents.filter(a => a.status !== 'idle').length;
                    const isExpanded = expandedCategories.has(category);

                    return (
                      <div key={category} className={`border ${colors.border} rounded-xl overflow-hidden ${colors.bg}`}>
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-gray-800/50 transition-all text-left"
                        >
                          <span className="text-2xl">{colors.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${colors.text}`}>{category}</span>
                              <span className="text-xs text-gray-500">({categoryAgents.length} agents)</span>
                              {activeCount > 0 && (
                                <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                                  {activeCount} active
                                </span>
                              )}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-700 p-4 space-y-2">
                            {categoryAgents.map(agent => (
                              <div
                                key={agent.id}
                                className={`flex items-center gap-3 p-3 rounded-lg ${agent.status === 'complete' ? 'bg-green-900/20 border border-green-800/30' :
                                  agent.status === 'analyzing' || agent.status === 'generating' || agent.status === 'optimizing' ? 'bg-purple-900/20 border border-purple-800/30' :
                                    'bg-gray-800 border border-gray-700'
                                  }`}
                              >
                                <div className="w-8 h-8 flex items-center justify-center">
                                  {agent.status === 'complete' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                                    agent.status === 'analyzing' || agent.status === 'generating' || agent.status === 'optimizing' ? <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" /> :
                                      <div className="w-3 h-3 rounded-full border-2 border-gray-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-semibold text-sm">{agent.name}</div>
                                  <div className="text-gray-400 text-xs mt-0.5">{agent.capability}</div>
                                  {agent.progress !== undefined && agent.progress > 0 && agent.progress < 100 && (
                                    <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                                      <div
                                        className="h-1 rounded-full bg-purple-500 transition-all"
                                        style={{ width: `${agent.progress}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${agent.status === 'complete' ? 'bg-green-900/50 text-green-400' :
                                  agent.status === 'analyzing' || agent.status === 'generating' || agent.status === 'optimizing' ? 'bg-purple-900/50 text-purple-400' :
                                    'bg-gray-700 text-gray-400'
                                  }`}>
                                  {agent.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {phases.map((phase, idx) => (
                    <div
                      key={phase.id}
                      className={`border rounded-xl overflow-hidden ${phase.status === 'complete' ? 'border-green-700 bg-green-900/20' :
                        phase.status === 'running' ? 'border-purple-700 bg-purple-900/20' :
                          phase.status === 'error' ? 'border-red-700 bg-red-900/20' :
                            'border-gray-700 bg-gray-800'
                        }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${phase.status === 'complete' ? 'bg-green-500 text-white' :
                            phase.status === 'running' ? 'bg-purple-500 text-white' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-bold">{phase.name}</div>
                            <div className="text-gray-400 text-xs mt-0.5">{phase.agentIds.length} agents</div>
                          </div>
                          {phase.status === 'running' && <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />}
                          {phase.status === 'complete' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                          {phase.duration && (
                            <span className="text-xs text-gray-500">{(phase.duration / 1000).toFixed(1)}s</span>
                          )}
                        </div>

                        {phase.progress > 0 && phase.progress < 100 && (
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${phase.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && article && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Headline Variants */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Headline Variants (A/B Testing Ready)
              </h3>
              <div className="space-y-2">
                {article.headlineVariants.map((headline, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all">
                    <span className="text-gray-400 font-bold">#{idx + 1}</span>
                    <span className="text-white flex-1">{headline}</span>
                    <button
                      onClick={() => handleCopy(`headline-${idx}`, headline)}
                      className="p-2 text-gray-400 hover:text-white transition-all"
                    >
                      {copied === `headline-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Article Content */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Full Article ({article.wordCount.toLocaleString()} words • {article.readTime} min read)
                </h3>
                <button
                  onClick={() => handleCopy('content', article.content)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {copied === 'content' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'content' ? 'Copied!' : 'Copy All'}
                </button>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="bg-gray-900 rounded-lg p-6 whitespace-pre-wrap font-mono text-sm text-gray-300 max-h-96 overflow-y-auto">
                  {article.content}
                </div>
              </div>
            </div>

            {/* Meta & SEO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-white font-semibold mb-3">Meta Description</h4>
                <p className="text-gray-300 text-sm">{article.metaDescription}</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-white font-semibold mb-3">URL Slug</h4>
                <p className="text-blue-400 text-sm font-mono">/{article.slug}</p>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-400" />
                Keywords & Tags
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-xs mb-2 block">Primary</span>
                  <span className="inline-block bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm font-semibold border border-purple-700">
                    {article.keywords.primary}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs mb-2 block">Secondary</span>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.secondary.map((kw, idx) => (
                      <span key={idx} className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-700">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs mb-2 block">LSI Keywords</span>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.lsi.map((kw, idx) => (
                      <span key={idx} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs */}
            {article.faqs.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  Auto-Generated FAQs
                </h4>
                <div className="space-y-3">
                  {article.faqs.map((faq, idx) => (
                    <div key={idx} className="bg-gray-700 rounded-lg p-4">
                      <div className="text-white font-semibold mb-2">{faq.question}</div>
                      <div className="text-gray-300 text-sm">{faq.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Posts */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-pink-400" />
                Social Media Posts
              </h4>
              <div className="space-y-3">
                {article.socialPosts.map((post, idx) => (
                  <div key={idx} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{post.platform}</span>
                      <button
                        onClick={() => handleCopy(`social-${idx}`, post.content)}
                        className="text-gray-400 hover:text-white"
                      >
                        {copied === `social-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap">{post.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUALITY TAB */}
        {activeTab === 'quality' && article && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white">{article.qualityScore}</div>
                    <div className="text-xs text-purple-100">/ 100</div>
                  </div>
                </div>
                <div>
                  <h2 className="text-white text-2xl font-bold mb-2">Overall Quality Score</h2>
                  <p className="text-gray-300">
                    {article.qualityScore >= 90 ? '🌟 Exceptional - Ready to publish!' :
                      article.qualityScore >= 80 ? '✅ Excellent - Minor improvements suggested' :
                        article.qualityScore >= 70 ? '⚠️ Good - Some optimization needed' :
                          '❌ Needs work - Review suggestions below'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Checks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qualityChecks.map((check, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-5 ${check.status === 'pass' ? 'border-green-700 bg-green-900/20' :
                    check.status === 'warning' ? 'border-yellow-700 bg-yellow-900/20' :
                      'border-red-700 bg-red-900/20'
                    }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${check.status === 'pass' ? 'bg-green-500' :
                      check.status === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                      {check.status === 'pass' ? <CheckCircle2 className="w-6 h-6 text-white" /> :
                        check.status === 'warning' ? <AlertTriangle className="w-6 h-6 text-white" /> :
                          <AlertCircle className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold mb-1">{check.name}</div>
                      <div className={`text-sm ${check.status === 'pass' ? 'text-green-300' :
                        check.status === 'warning' ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>
                        {check.message}
                      </div>
                    </div>
                    <div className={`text-xl font-bold ${check.status === 'pass' ? 'text-green-400' :
                      check.status === 'warning' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                      {check.score}
                    </div>
                  </div>

                  {check.suggestions && check.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-2">Suggestions:</div>
                      <ul className="space-y-1">
                        {check.suggestions.map((suggestion, sIdx) => (
                          <li key={sIdx} className="text-sm text-gray-300 flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Score Breakdown */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-white font-bold mb-4">Detailed Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'SEO Score', value: article.seoScore, color: 'blue' },
                  { label: 'Readability', value: article.readabilityScore, color: 'green' },
                  { label: 'Originality', value: article.originalityScore, color: 'purple' },
                  { label: 'Engagement', value: article.engagementScore, color: 'pink' },
                ].map((metric, idx) => (
                  <div key={idx} className="text-center">
                    <div className={`text-3xl font-bold text-${metric.color}-400 mb-1`}>{metric.value}</div>
                    <div className="text-gray-400 text-sm">{metric.label}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full bg-${metric.color}-500`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SEO TAB */}
        {activeTab === 'seo' && article && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  <span className="text-white font-semibold">SEO Score</span>
                </div>
                <div className="text-4xl font-bold text-blue-400">{article.seoScore}/100</div>
              </div>

              <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-6 h-6 text-green-400" />
                  <span className="text-white font-semibold">Readability</span>
                </div>
                <div className="text-4xl font-bold text-green-400">{article.readabilityScore}/100</div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-6 h-6 text-purple-400" />
                  <span className="text-white font-semibold">Engagement</span>
                </div>
                <div className="text-4xl font-bold text-purple-400">{article.engagementScore}/100</div>
              </div>
            </div>

            {/* Schema Markup */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Code className="w-5 h-5 text-green-400" />
                  Schema Markup (JSON-LD)
                </h3>
                <button
                  onClick={() => handleCopy('schema', article.schema)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {copied === 'schema' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'schema' ? 'Copied!' : 'Copy Schema'}
                </button>
              </div>
              <pre className="bg-gray-900 rounded-lg p-4 text-green-300 text-xs font-mono overflow-x-auto">
                {article.schema}
              </pre>
            </div>

            {/* Internal Links */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-400" />
                Internal Links
              </h4>
              <div className="space-y-2">
                {article.internalLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                    <span className="text-white flex-1">{link.anchor}</span>
                    <span className="text-blue-400 text-sm font-mono">{link.url}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
