import React, { useState, useEffect } from 'react';
import { Brain, Database, TrendingUp, Activity, Download } from 'lucide-react';
import { serverFetch } from '../utils/serverFetch';

interface KnowledgeStats {
  totalErrors: number;
  totalRepairs: number;
  avgConfidence: number;
  topCategories: Array<{ category: string; count: number }>;
}

export function KnowledgeGraphDashboard() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await serverFetch('/git-repair/knowledge-stats');

      if (!response.ok) {
        throw new Error('Failed to load knowledge graph stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error loading knowledge graph stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportKnowledgeGraph = async () => {
    try {
      const response = await serverFetch('/git-repair/knowledge-export');

      if (!response.ok) {
        throw new Error('Failed to export knowledge graph');
      }

      const data = await response.json();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-graph-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting knowledge graph:', err);
      alert('Failed to export knowledge graph: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>Error loading stats: {error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const totalErrors = stats?.totalErrors || 0;
  const totalRepairs = stats?.totalRepairs || 0;
  const avgConfidence = stats?.avgConfidence || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Knowledge Graph</h2>
            <p className="text-sm text-gray-400">Self-learning error repair intelligence</p>
          </div>
        </div>

        <button
          onClick={exportKnowledgeGraph}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-medium text-gray-300">Total Errors</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalErrors}</p>
          <p className="text-xs text-gray-400 mt-1">Patterns learned</p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-gray-300">Total Repairs</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalRepairs}</p>
          <p className="text-xs text-gray-400 mt-1">Successful fixes</p>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-gray-300">Avg Confidence</h3>
          </div>
          <p className="text-3xl font-bold text-white">{(avgConfidence * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-400 mt-1">Success rate</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🧬 How Knowledge Graph Works</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold">1.</span>
            <p><span className="font-semibold">Error Fingerprinting:</span> Each error is analyzed and given a unique fingerprint based on pattern, category, and framework context.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold">2.</span>
            <p><span className="font-semibold">Pattern Learning:</span> Every successful repair (pattern-based or AI) is stored with confidence scores and transformation rules.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold">3.</span>
            <p><span className="font-semibold">Continuous Improvement:</span> The system learns from each repair, increasing confidence for proven patterns and adapting to new error types.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold">4.</span>
            <p><span className="font-semibold">Multi-Layer Analysis:</span> Errors are categorized across layers (syntax, language, framework, dependency, build, runtime) for targeted repairs.</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-5">
          <h4 className="font-semibold text-white mb-3">✨ Key Features</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Deterministic pattern-based repairs (no AI credits needed)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Project-aware repairs using framework detection
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Confidence scoring for repair strategies
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Learns from both pattern and AI fixes
            </li>
          </ul>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-5">
          <h4 className="font-semibold text-white mb-3">🎯 Supported Error Types</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              React router (react-router-dom → react-router)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Broken imports and missing modules
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Code quality issues (commented console, TODOs)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Missing React imports and hooks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
