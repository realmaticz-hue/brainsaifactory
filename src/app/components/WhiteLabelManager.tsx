// =============================================================================
// WHITE-LABEL MANAGER — Custom Branding & Client Administration
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Palette, Globe, Settings, Users, Plus, Eye, Download, Upload, CheckCircle } from 'lucide-react';
import {
  getWhiteLabelConfig,
  getClients,
  createClient,
  updateClient,
  deleteClient,
  updateBranding,
  updateDomain,
  updateFeatures,
  getClientStats,
  exportConfig,
  applyWhiteLabelTheme,
  type WhiteLabelConfig,
  type Client,
  type BrandingSettings
} from '../utils/whiteLabel';
import { toast } from 'sonner';

interface WhiteLabelManagerProps {
  isopen: boolean;
  onClose: () => void;
}

type ViewMode = 'clients' | 'branding' | 'domain' | 'features';

export function WhiteLabelManager({ isopen, onClose }: WhiteLabelManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [stats, setStats] = useState(getClientStats());

  // Form states
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPlan, setNewClientPlan] = useState<Client['plan']>('professional');

  useEffect(() => {
    if (isopen) {
      refreshData();
    }
  }, [isopen]);

  useEffect(() => {
    if (selectedClient) {
      const clientConfig = getWhiteLabelConfig(selectedClient.id);
      setConfig(clientConfig);
    }
  }, [selectedClient]);

  const refreshData = () => {
    const clientsList = getClients();
    setClients(clientsList);
    setStats(getClientStats());

    if (clientsList.length > 0 && !selectedClient) {
      setSelectedClient(clientsList[0]);
    }
  };

  if (!isopen) return null;

  const handleCreateClient = () => {
    if (!newClientName || !newClientEmail || !newClientCompany) {
      toast.error('All fields are required');
      return;
    }

    const client = createClient(newClientName, newClientEmail, newClientCompany, newClientPlan);
    toast.success('Client created successfully!');
    setShowCreateClient(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    refreshData();
    setSelectedClient(client);
  };

  const handleDeleteClient = (clientId: string) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;

    deleteClient(clientId);
    toast.success('Client deleted');
    refreshData();
    setSelectedClient(null);
  };

  const handleUpdateBranding = (updates: Partial<BrandingSettings>) => {
    if (!config) return;

    updateBranding(config.id, updates);
    const updated = getWhiteLabelConfig(selectedClient?.id);
    setConfig(updated);
    toast.success('Branding updated');
  };

  const handlePreviewTheme = () => {
    if (!config) return;

    applyWhiteLabelTheme(config);
    toast.success('Theme preview applied! Refresh to revert.');
  };

  const handleExportConfig = () => {
    if (!config) return;

    const json = exportConfig(config.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.branding.companyName}-config.json`;
    a.click();
    toast.success('Configuration exported');
  };

  const renderClientsView = () => (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Client List */}
      <div className="md:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Clients ({clients.length})</h3>
          <button
            onClick={() => setShowCreateClient(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.activeClients}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">${stats.totalRevenue}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">MRR</div>
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {clients.map(client => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedClient?.id === client.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                {client.company}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {client.name} · {client.plan}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${client.status === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                  {client.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Details */}
      {selectedClient && (
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {selectedClient.company}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedClient.name} · {selectedClient.email}
                </div>
              </div>
              <button
                onClick={() => handleDeleteClient(selectedClient.id)}
                className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-semibold text-sm"
              >
                Delete Client
              </button>
            </div>

            {/* Subscription Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {selectedClient.plan}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Revenue</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ${selectedClient.subscription.amount}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next Billing</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedClient.subscription.nextBillingDate.toLocaleDateString()}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold capitalize ${selectedClient.status === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                  {selectedClient.status}
                </span>
              </div>
            </div>

            {/* Usage Stats */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Current Usage</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Users', value: selectedClient.usage.users },
                  { label: 'Posts', value: selectedClient.usage.posts },
                  { label: 'AI Generations', value: selectedClient.usage.aiGenerations },
                  { label: 'Storage (GB)', value: selectedClient.usage.storage },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBrandingView = () => {
    if (!config || !selectedClient) {
      return (
        <div className="text-center py-16">
          <Palette className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No client selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a client to customize their branding
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl space-y-6">
        {/* Company Name */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company Information</h4>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={config.branding.companyName}
              onChange={(e) => handleUpdateBranding({ companyName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Brand Colors</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(config.branding.colors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
                  {key} Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleUpdateBranding({
                      colors: { ...config.branding.colors, [key]: e.target.value }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateBranding({
                      colors: { ...config.branding.colors, [key]: e.target.value }
                    })}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Typography</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Heading Font
              </label>
              <input
                type="text"
                value={config.branding.fonts.heading}
                onChange={(e) => handleUpdateBranding({
                  fonts: { ...config.branding.fonts, heading: e.target.value }
                })}
                placeholder="e.g., Inter, sans-serif"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Body Font
              </label>
              <input
                type="text"
                value={config.branding.fonts.body}
                onChange={(e) => handleUpdateBranding({
                  fonts: { ...config.branding.fonts, body: e.target.value }
                })}
                placeholder="e.g., Inter, sans-serif"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePreviewTheme}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            <Eye className="w-4 h-4" />
            Preview Theme
          </button>
          <button
            onClick={handleExportConfig}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
          >
            <Download className="w-4 h-4" />
            Export Config
          </button>
        </div>
      </div>
    );
  };

  const renderDomainView = () => {
    if (!config || !selectedClient) {
      return (
        <div className="text-center py-16">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No client selected
          </h3>
        </div>
      );
    }

    return (
      <div className="max-w-2xl space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Domain Settings</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Custom Domain
              </label>
              <input
                type="text"
                value={config.domain.customDomain || ''}
                onChange={(e) => updateDomain(config.id, { customDomain: e.target.value })}
                placeholder="e.g., app.yourcompany.com"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Subdomain
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.domain.subdomain || ''}
                  onChange={(e) => updateDomain(config.id, { subdomain: e.target.value })}
                  placeholder="company"
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600 dark:text-gray-400">.yourapp.com</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                checked={config.domain.ssl}
                onChange={(e) => updateDomain(config.id, { ssl: e.target.checked })}
                className="rounded"
              />
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Enable SSL</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Secure connection with HTTPS</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.domain.redirectToCustomDomain}
                onChange={(e) => updateDomain(config.id, { redirectToCustomDomain: e.target.checked })}
                className="rounded"
              />
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Redirect to Custom Domain</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Auto-redirect from subdomain to custom domain</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-semibold mb-1">DNS Configuration</div>
              <div>Point your domain's CNAME record to: <code className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">app.yourplatform.com</code></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFeaturesView = () => {
    if (!config || !selectedClient) {
      return (
        <div className="text-center py-16">
          <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No client selected
          </h3>
        </div>
      );
    }

    return (
      <div className="max-w-2xl space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Feature Toggles</h4>

          <div className="space-y-3">
            {Object.entries(config.features).map(([feature, enabled]) => (
              <label key={feature} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateFeatures(config.id, { [feature]: e.target.checked })}
                  className="rounded"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Usage Limits</h4>

          <div className="space-y-4">
            {Object.entries(config.limits).map(([limit, value]) => (
              <div key={limit}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
                  {limit.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => {
                    const limits = { ...config.limits, [limit]: parseInt(e.target.value) };
                    const updated = { ...config, limits };
                    updateFeatures(config.id, {}); // Trigger save
                  }}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">White-Label Manager</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Custom branding & client administration
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
                { mode: 'clients', label: 'Clients', icon: Users },
                { mode: 'branding', label: 'Branding', icon: Palette },
                { mode: 'domain', label: 'Domain', icon: Globe },
                { mode: 'features', label: 'Features', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => setViewMode(tab.mode as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${viewMode === tab.mode
                    ? 'bg-orange-600 text-white'
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
            {viewMode === 'clients' && renderClientsView()}
            {viewMode === 'branding' && renderBrandingView()}
            {viewMode === 'domain' && renderDomainView()}
            {viewMode === 'features' && renderFeaturesView()}
          </div>
        </div>
      </div>

      {/* Create Client Modal */}
      {showCreateClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create New Client</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="john@company.com"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  placeholder="ACME Corp"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Plan
                </label>
                <select
                  value={newClientPlan}
                  onChange={(e) => setNewClientPlan(e.target.value as Client['plan'])}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="starter">Starter ($49/mo)</option>
                  <option value="professional">Professional ($99/mo)</option>
                  <option value="enterprise">Enterprise ($299/mo)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateClient}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateClient(false)}
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
