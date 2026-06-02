import { useState, useEffect } from 'react';
import { Sparkles, Database, Globe, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { isAIConfigured } from '../utils/ai/aiProvider';
import { isWordPressConfigured } from '../utils/wordpress/wordpressClient';
import { getCurrentUser } from '../utils/database/auth';

interface StatusItem {
  name: string;
  configured: boolean;
  icon: typeof Sparkles;
  color: string;
  onClick?: () => void;
}

interface IntegrationStatusBarProps {
  onOpenAIConfig?: () => void;
  onOpenWordPressConfig?: () => void;
  onOpenAuth?: () => void;
}

export function IntegrationStatusBar({
  onOpenAIConfig,
  onOpenWordPressConfig,
  onOpenAuth,
}: IntegrationStatusBarProps) {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);

  useEffect(() => {
    const updateStatuses = () => {
      const aiConfigured = isAIConfigured();
      const wpConfigured = isWordPressConfigured();
      const user = getCurrentUser();
      const authenticated = !!user;

      setStatuses([
        {
          name: 'AI',
          configured: aiConfigured,
          icon: Sparkles,
          color: aiConfigured ? 'green' : 'gray',
          onClick: onOpenAIConfig,
        },
        {
          name: 'Database',
          configured: authenticated,
          icon: Database,
          color: authenticated ? 'green' : 'gray',
          onClick: onOpenAuth,
        },
        {
          name: 'WordPress',
          configured: wpConfigured,
          icon: Globe,
          color: wpConfigured ? 'green' : 'gray',
          onClick: onOpenWordPressConfig,
        },
      ]);
    };

    updateStatuses();

    // Update on storage changes (when configs are saved)
    const handleStorageChange = () => updateStatuses();
    window.addEventListener('storage', handleStorageChange);

    // Check every 5 seconds for changes
    const interval = setInterval(updateStatuses, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [onOpenAIConfig, onOpenWordPressConfig, onOpenAuth]);

  if (statuses.length === 0) return null;

  const allConfigured = statuses.every(s => s.configured);
  const noneConfigured = statuses.every(s => !s.configured);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Status Items */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Integrations:
            </span>
            {statuses.map((status) => {
              const StatusIcon = status.configured ? CheckCircle : XCircle;
              const colorClass =
                status.color === 'green'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500';

              return (
                <button
                  key={status.name}
                  onClick={status.onClick}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${colorClass} ${
                    status.onClick ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
                  }`}
                  title={
                    status.configured
                      ? `${status.name} configured${status.onClick ? ' - Click to manage' : ''}`
                      : `${status.name} not configured${status.onClick ? ' - Click to set up' : ''}`
                  }
                >
                  <status.icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{status.name}</span>
                  <StatusIcon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          {/* Overall Status */}
          <div className="flex items-center gap-2">
            {allConfigured ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-semibold text-green-700">All Systems Ready</span>
              </div>
            ) : noneConfigured ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-700">
                  Configure integrations for full features
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">
                  {statuses.filter(s => s.configured).length}/{statuses.length} integrations active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
