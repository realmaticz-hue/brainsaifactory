// =============================================================================
// API MANAGER — Public API Keys & Documentation
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Copy, Trash2, Eye, EyeOff, Code, BarChart3, Webhook, AlertCircle, CheckCircle } from 'lucide-react';
import {
  generateAPIKey,
  getAPIKeys,
  revokeAPIKey,
  getAPIStats,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  type APIKey,
  type APIPermission,
  type WebhookEndpoint,
  type WebhookEvent
} from '../utils/publicAPI';
import { toast } from 'sonner';

interface APIManagerProps {
  isopen: boolean;
  onClose: () => void;
}

type ViewMode = 'keys' | 'docs' | 'webhooks' | 'analytics';

export function APIManager({ isopen, onClose }: APIManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('keys');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<APIPermission[]>([]);
  const [webhookURL, setWebhookURL] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);

  useEffect(() => {
    if (isopen) {
      refreshData();
    }
  }, [isopen]);

  const refreshData = () => {
    setApiKeys(getAPIKeys());
    setWebhooks(getWebhooks());
  };

  if (!isopen) return null;

  const handleCreateKey = () => {
    if (!newKeyName || selectedPermissions.length === 0) {
      toast.error('Name and at least one permission required');
      return;
    }

    const key = generateAPIKey(newKeyName, selectedPermissions);
    toast.success('API key created! Copy it now - you won\'t see it again.');
    setShowSecret(key.id);
    setShowCreateKey(false);
    setNewKeyName('');
    setSelectedPermissions([]);
    refreshData();
  };

  const handleRevokeKey = (keyId: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;

    revokeAPIKey(keyId);
    toast.success('API key revoked');
    refreshData();
  };

  const handleCreateWebhook = () => {
    if (!webhookURL || webhookEvents.length === 0) {
      toast.error('URL and at least one event required');
      return;
    }

    createWebhook(webhookURL, webhookEvents);
    toast.success('Webhook created!');
    setShowCreateWebhook(false);
    setWebhookURL('');
    setWebhookEvents([]);
    refreshData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const allPermissions: APIPermission[] = [
    'posts:read',
    'posts:write',
    'posts:delete',
    'analytics:read',
    'media:upload',
    'publish:execute',
    'users:read',
    'webhooks:manage',
  ];

  const allEvents: WebhookEvent[] = [
    'post.created',
    'post.updated',
    'post.published',
    'post.deleted',
    'analytics.generated',
    'media.uploaded',
  ];

  const renderKeysView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">API Keys</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your API keys for programmatic access
          </p>
        </div>
        <button
          onClick={() => setShowCreateKey(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="text-center py-16">
          <Key className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No API keys yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Create your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map(key => (
            <div key={key.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{key.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${key.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                      {key.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Created {key.createdAt.toLocaleDateString()}
                    {key.lastUsed && ` · Last used ${key.lastUsed.toLocaleDateString()}`}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    disabled={key.status !== 'active'}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {/* Public Key */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Public Key</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded font-mono text-sm text-gray-900 dark:text-gray-100">
                      {key.key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Secret Key */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Secret Key</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded font-mono text-sm text-gray-900 dark:text-gray-100">
                      {showSecret === key.id ? key.secret : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowSecret(showSecret === key.id ? null : key.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {showSecret === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {showSecret === key.id && (
                      <button
                        onClick={() => copyToClipboard(key.secret)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Permissions</div>
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.map(perm => (
                      <span
                        key={perm}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rate Limits */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {key.rateLimit.requestsPerHour.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Requests/Hour</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {key.rateLimit.requestsPerDay.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Requests/Day</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {key.rateLimit.burstLimit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Burst Limit</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDocsView = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">API Documentation</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete guide to using the Content Creator API
        </p>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Quick Start</h4>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">1. Install the SDK</div>
            <code className="block px-4 py-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
              npm install @yourapp/content-creator-sdk
            </code>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">2. Initialize the client</div>
            <code className="block px-4 py-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm whitespace-pre">
              {`import { ContentCreatorSDK } from '@yourapp/sdk';

const sdk = new ContentCreatorSDK('your-api-key');`}
            </code>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">3. Create a post</div>
            <code className="block px-4 py-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm whitespace-pre">
              {`const post = await sdk.posts.create({
  title: 'My Blog Post',
  content: 'Content here...',
  tags: ['tech', 'ai']
});`}
            </code>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">API Endpoints</h4>

        <div className="space-y-4">
          {[
            { method: 'GET', path: '/posts', desc: 'List all posts' },
            { method: 'POST', path: '/posts', desc: 'Create a new post' },
            { method: 'GET', path: '/posts/:id', desc: 'Get post by ID' },
            { method: 'PATCH', path: '/posts/:id', desc: 'Update a post' },
            { method: 'DELETE', path: '/posts/:id', desc: 'Delete a post' },
            { method: 'POST', path: '/posts/:id/publish', desc: 'Publish to platforms' },
            { method: 'GET', path: '/analytics/posts/:id', desc: 'Get post analytics' },
            { method: 'POST', path: '/media', desc: 'Upload media file' },
          ].map((endpoint, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className={`px-2 py-1 rounded text-xs font-bold ${endpoint.method === 'GET'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : endpoint.method === 'POST'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : endpoint.method === 'PATCH'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                {endpoint.method}
              </span>
              <div className="flex-1">
                <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{endpoint.path}</code>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{endpoint.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Authentication</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Include your API key in the Authorization header:
        </p>
        <code className="block px-4 py-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm">
          Authorization: Bearer YOUR_API_KEY
        </code>
      </div>
    </div>
  );

  const renderWebhooksView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Webhooks</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Receive real-time notifications for events
          </p>
        </div>
        <button
          onClick={() => setShowCreateWebhook(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-16">
          <Webhook className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No webhooks configured</h3>
          <p className="text-gray-500 dark:text-gray-400">Create a webhook to receive event notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="font-mono text-sm text-gray-900 dark:text-gray-100">{webhook.url}</code>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${webhook.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                      {webhook.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Created {webhook.createdAt.toLocaleDateString()}
                    {webhook.lastTriggered && ` · Last triggered ${webhook.lastTriggered.toLocaleDateString()}`}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Delete this webhook?')) {
                      deleteWebhook(webhook.id);
                      refreshData();
                      toast.success('Webhook deleted');
                    }
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Events</div>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map(event => (
                    <span
                      key={event}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsView = () => {
    const stats = getAPIStats();

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">API Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor your API usage and performance
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Requests', value: stats.totalRequests, color: 'blue' },
            { label: 'Successful', value: stats.successfulRequests, color: 'green' },
            { label: 'Failed', value: stats.failedRequests, color: 'red' },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl p-4 border border-${stat.color}-200 dark:border-${stat.color}-800`}>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Requests by Endpoint</h4>
          <div className="space-y-2">
            {Object.entries(stats.requestsByEndpoint).map(([endpoint, count]) => (
              <div key={endpoint} className="flex items-center justify-between">
                <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{endpoint}</code>
                <span className="font-bold text-gray-900 dark:text-gray-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Public API</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Programmatic access to your content
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1 p-2">
              {[
                { mode: 'keys', label: 'API Keys', icon: Key },
                { mode: 'docs', label: 'Documentation', icon: Code },
                { mode: 'webhooks', label: 'Webhooks', icon: Webhook },
                { mode: 'analytics', label: 'Analytics', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => setViewMode(tab.mode as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${viewMode === tab.mode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === 'keys' && renderKeysView()}
            {viewMode === 'docs' && renderDocsView()}
            {viewMode === 'webhooks' && renderWebhooksView()}
            {viewMode === 'analytics' && renderAnalyticsView()}
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create API Key</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allPermissions.map(perm => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateKey}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateKey(false)}
                className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateWebhook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create Webhook</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookURL}
                  onChange={(e) => setWebhookURL(e.target.value)}
                  placeholder="https://your-app.com/webhook"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Events
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allEvents.map(event => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, event]);
                          } else {
                            setWebhookEvents(webhookEvents.filter(ev => ev !== event));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateWebhook}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateWebhook(false)}
                className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
