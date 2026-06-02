// =============================================================================
// THEME TOGGLE — Dark Mode Toggle Component
// =============================================================================

import React, { useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

type Theme = 'light' | 'dark' | 'system';

const THEMES: Array<{
  id: Theme;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
    {
      id: 'light',
      name: 'Light',
      icon: Sun,
      description: 'Always use light theme',
    },
    {
      id: 'dark',
      name: 'Dark',
      icon: Moon,
      description: 'Always use dark theme',
    },
    {
      id: 'system',
      name: 'System',
      icon: Monitor,
      description: 'Use system preference',
    },
  ];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isopen, setisopen] = useState(false);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[2];

  return (
    <div className="relative">
      <button
        onClick={() => setisopen(!isopen)}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title={`Theme: ${currentTheme.name}`}
      >
        <currentTheme.icon className="w-5 h-5" />
      </button>

      {isopen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setisopen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Theme Preference
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Choose your display theme
              </p>
            </div>

            <div className="p-2">
              {THEMES.map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setTheme(themeOption.id);
                    setisopen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${theme === themeOption.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${theme === themeOption.id
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <themeOption.icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{themeOption.name}</p>
                    <p className="text-xs opacity-75">{themeOption.description}</p>
                  </div>

                  {theme === themeOption.id && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
