import { useState, useEffect } from 'react';
import {
  Activity, TrendingDown, Zap, DollarSign, BarChart3, AlertTriangle,
  CheckCircle, Clock, Database, Layers, Target, Cpu, Workflow,
} from 'lucide-react';
import { tokenTracker, type TokenStats } from '../utils/tokenEfficiency/tokenTracker';
import { projectionState } from '../utils/tokenEfficiency/projectionState';
import { semanticRetriever, microAgentOrchestrator, workflowEngine } from '../utils/tokenEfficiency/enterpriseAI';

export function TokenEfficiencyDashboard() {
  const [stats, setStats] = useState<TokenStats>(() => tokenTracker.getStats());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [memoryStats, setMemoryStats] = useState(() => projectionState.getMemoryStats());
  const [retrieverStats, setRetrieverStats] = useState(() => semanticRetriever.getStats());

  useEffect(() => {
    // Subscribe to token tracker updates
    const unsubscribe = tokenTracker.subscribe(setStats);

    // Load suggestions
    setSuggestions(tokenTracker.getOptimizationSuggestions());

    // Refresh stats every 5 seconds
    const interval = setInterval(() => {
      setMemoryStats(projectionState.getMemoryStats());
      setRetrieverStats(semanticRetriever.getStats());
      setSuggestions(tokenTracker.getOptimizationSuggestions());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const efficiencyColor = stats.efficiency >= 80 ? 'text-green-600 bg-green-50 border-green-200'
    : stats.efficiency >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200';

  const agents = microAgentOrchestrator.listAgents();
  const workflows = workflowEngine.listWorkflows();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-purple-600" />
            Token Efficiency Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enterprise-scale AI architecture — Monitor token usage, cost, and efficiency
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border-2 ${efficiencyColor}`}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Efficiency Score</div>
          <div className="text-3xl font-black">{stats.efficiency}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tokens */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Tokens</span>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalTokens.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">
            Avg: {Math.round(stats.averageTokensPerOp).toLocaleString()} per op
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Cost</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">
            Avg: ${stats.averageCostPerOp.toFixed(4)} per op
          </div>
        </div>

        {/* Hourly Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Hourly Usage</span>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.hourlyUsage.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.operationCount} operations total
          </div>
        </div>

        {/* Daily Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Daily Usage</span>
            <TrendingDown className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.dailyUsage.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">
            Last 24 hours
          </div>
        </div>
      </div>

      {/* System Components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Projection State */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Projection State</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Entities Stored:</span>
              <span className="font-semibold text-blue-900">{memoryStats.entityCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Cached Projections:</span>
              <span className="font-semibold text-blue-900">{memoryStats.projectionCacheSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Memory Footprint:</span>
              <span className="font-semibold text-blue-900">
                {(memoryStats.estimatedBytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="text-xs text-blue-600 font-semibold">
              ✓ 90% token reduction through on-demand computation
            </div>
          </div>
        </div>

        {/* Semantic Retriever */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900">Semantic Retrieval</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Indexed Chunks:</span>
              <span className="font-semibold text-green-900">{retrieverStats.chunkCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Total Tokens:</span>
              <span className="font-semibold text-green-900">
                {retrieverStats.totalTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Avg per Chunk:</span>
              <span className="font-semibold text-green-900">
                {Math.round(retrieverStats.totalTokens / Math.max(retrieverStats.chunkCount, 1))}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="text-xs text-green-600 font-semibold">
              ✓ Only fetch relevant context, never load everything
            </div>
          </div>
        </div>

        {/* Micro-Agents */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-900">Micro-Agents</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-700">Registered Agents:</span>
              <span className="font-semibold text-purple-900">{agents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Workflows:</span>
              <span className="font-semibold text-purple-900">{workflows.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Status:</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <div className="text-xs text-purple-600 font-semibold">
              ✓ Single-purpose agents with tiny context windows
            </div>
          </div>
        </div>
      </div>

      {/* Top Consumers */}
      {stats.topConsumers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">Top Token Consumers</h3>
          </div>
          <div className="space-y-3">
            {stats.topConsumers.slice(0, 5).map((consumer, idx) => {
              const percentage = (consumer.tokens / stats.totalTokens) * 100;
              return (
                <div key={consumer.operation} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {idx + 1}. {consumer.operation}
                    </span>
                    <span className="text-xs text-gray-500">
                      {consumer.tokens.toLocaleString()} tokens (${consumer.cost.toFixed(3)})
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">Optimization Suggestions</h3>
          </div>
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => {
              const isWarning = suggestion.includes('🔴') || suggestion.includes('⚠️') || suggestion.includes('🚨');
              const isSuccess = suggestion.includes('✅');

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    isWarning
                      ? 'bg-red-50 border-red-200'
                      : isSuccess
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : isSuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-sm ${
                        isWarning
                          ? 'text-red-800'
                          : isSuccess
                          ? 'text-green-800'
                          : 'text-blue-800'
                      }`}
                    >
                      {suggestion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Registered Agents */}
      {agents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">Registered Micro-Agents</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map(agent => (
              <div key={agent.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="font-semibold text-gray-900 text-sm mb-1">{agent.name}</div>
                <div className="text-xs text-gray-600 mb-2">{agent.description}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>In: {agent.maxInputTokens}</span>
                  <span>·</span>
                  <span>Out: {agent.maxOutputTokens}</span>
                  <span>·</span>
                  <span className="font-mono">{agent.model || 'default'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflows */}
      {workflows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">Registered Workflows</h3>
          </div>
          <div className="space-y-3">
            {workflows.map(workflow => (
              <div key={workflow.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">{workflow.name}</div>
                  <div className="text-xs text-gray-500">{workflow.steps.length} steps</div>
                </div>
                <div className="text-sm text-gray-600 mb-3">{workflow.description}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {workflow.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-1">
                      <div className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                        {step.agentId}
                      </div>
                      {idx < workflow.steps.length - 1 && (
                        <span className="text-gray-400">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
