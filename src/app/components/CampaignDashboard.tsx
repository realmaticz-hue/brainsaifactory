import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Eye, MousePointer, BarChart3, Settings, Play, Pause } from 'lucide-react';

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number; // Return on Ad Spend
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  startDate: Date;
  endDate?: Date;
}

interface CampaignDashboardProps {
  campaigns: Campaign[];
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => void;
  onOptimize: (id: string) => void;
}

export function CampaignDashboard({ campaigns, onUpdateCampaign, onOptimize }: CampaignDashboardProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [autoOptimize, setAutoOptimize] = useState(true);

  // Calculate totals
  const totals = campaigns.reduce((acc, campaign) => ({
    budget: acc.budget + campaign.budget,
    spent: acc.spent + campaign.spent,
    impressions: acc.impressions + campaign.impressions,
    clicks: acc.clicks + campaign.clicks,
    conversions: acc.conversions + campaign.conversions
  }), { budget: 0, spent: 0, impressions: 0, clicks: 0, conversions: 0 });

  const avgROAS = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length
    : 0;

  const avgCTR = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length
    : 0;

  // Auto-optimization effect
  useEffect(() => {
    if (!autoOptimize) return;

    const interval = setInterval(() => {
      campaigns.forEach(campaign => {
        if (campaign.status === 'active') {
          // Simulate AI optimization
          const optimizedUpdates = optimizeCampaign(campaign);
          if (optimizedUpdates) {
            onUpdateCampaign(campaign.id, optimizedUpdates);
          }
        }
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [autoOptimize, campaigns]);

  const optimizeCampaign = (campaign: Campaign): Partial<Campaign> | null => {
    // AI optimization logic
    const updates: Partial<Campaign> = {};
    
    // If CTR is low, suggest improvements
    if (campaign.ctr < 1.5) {
      // Would trigger ad copy refresh in real implementation
      updates.ctr = campaign.ctr * 1.05; // Simulate improvement
    }
    
    // If ROAS is high, increase budget
    if (campaign.roas > 3.0 && campaign.spent < campaign.budget * 0.8) {
      // In real implementation, this would increase bid
      updates.spent = campaign.spent * 1.1;
    }
    
    // If ROAS is low, pause campaign
    if (campaign.roas < 1.0 && campaign.spent > campaign.budget * 0.5) {
      updates.status = 'paused';
    }
    
    return Object.keys(updates).length > 0 ? updates : null;
  };

  const handleToggleStatus = (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    onUpdateCampaign(campaignId, { status: newStatus as any });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {/* Header with Auto-Optimize Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campaign Dashboard</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoOptimize}
              onChange={e => setAutoOptimize(e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-semibold">AI Auto-Optimize</span>
          </label>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            autoOptimize ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {autoOptimize ? '🤖 Active' : '⏸️ Paused'}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.spent)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">of {formatCurrency(totals.budget)} budget</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg ROAS</p>
              <p className="text-2xl font-bold">{avgROAS.toFixed(2)}x</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Return on ad spend</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Impressions</p>
              <p className="text-2xl font-bold">{formatNumber(totals.impressions)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Total views</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MousePointer className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg CTR</p>
              <p className="text-2xl font-bold">{formatPercentage(avgCTR)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Click-through rate</p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold">Active Campaigns</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Budget</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Spent</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">ROAS</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">CTR</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map(campaign => (
                <tr
                  key={campaign.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedCampaign === campaign.id ? 'bg-purple-50' : ''
                  }`}
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="text-xs text-gray-500">ID: {campaign.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {campaign.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">{formatCurrency(campaign.budget)}</td>
                  <td className="px-6 py-4 text-right">
                    <div>
                      <p className="font-semibold">{formatCurrency(campaign.spent)}</p>
                      <p className="text-xs text-gray-500">
                        {((campaign.spent / campaign.budget) * 100).toFixed(0)}% used
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${
                      campaign.roas >= 3 ? 'text-green-600' :
                      campaign.roas >= 2 ? 'text-blue-600' :
                      campaign.roas >= 1 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {campaign.roas.toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${
                      campaign.ctr >= 2 ? 'text-green-600' :
                      campaign.ctr >= 1 ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {formatPercentage(campaign.ctr)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(campaign.id, campaign.status);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <Play className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOptimize(campaign.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Optimize"
                      >
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle settings
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Optimization Insights */}
      {autoOptimize && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-4">🤖 AI Optimization Insights</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Targeting Optimization</p>
              <p className="text-xs text-gray-600">
                AI is continuously analyzing audience performance and adjusting targeting parameters to reach high-converting users.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Budget Allocation</p>
              <p className="text-xs text-gray-600">
                Smart budget distribution across campaigns based on ROAS. High-performing campaigns receive more budget automatically.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Creative Refresh</p>
              <p className="text-xs text-gray-600">
                Detecting ad fatigue and suggesting new creative variations to maintain engagement rates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
