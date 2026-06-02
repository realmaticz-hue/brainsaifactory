import { useState, useRef } from 'react';
import { Link, Plus, Trash2, Sparkles, Globe, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface UrlInputProps {
  onGenerate: (urls: string[]) => void;
  onClear: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const EXAMPLE_URLS = [
  { url: 'https://www.nike.com', label: 'Nike' },
  { url: 'https://www.starbucks.com', label: 'Starbucks' },
  { url: 'https://www.tesla.com', label: 'Tesla' },
  { url: 'https://www.airbnb.com', label: 'Airbnb' },
  { url: 'https://www.rei.com', label: 'REI' },
  { url: 'https://www.shopify.com', label: 'Shopify' },
];

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function UrlInput({ onGenerate, onClear, isGenerating, disabled }: UrlInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [inputError, setInputError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addUrl = (raw?: string) => {
    const rawVal = raw ?? inputValue;
    const normalized = normalizeUrl(rawVal);
    if (!normalized) return;

    if (!isValidUrl(normalized)) {
      setInputError('Invalid URL — please include a valid domain (e.g. example.com)');
      return;
    }
    if (urls.includes(normalized)) {
      setInputError('This URL is already in your list');
      return;
    }
    if (urls.length >= 8) {
      setInputError('Maximum 8 URLs allowed per generation');
      return;
    }
    setUrls(prev => [...prev, normalized]);
    setInputValue('');
    setInputError('');
    inputRef.current?.focus();
  };

  const removeUrl = (url: string) => {
    setUrls(prev => prev.filter(u => u !== url));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUrl();
    }
  };

  const handleExampleClick = (url: string) => {
    if (!urls.includes(url) && urls.length < 8) {
      setUrls(prev => [...prev, url]);
      setInputError('');
    }
  };

  const handleGenerate = () => {
    const allUrls = [...urls];
    // Also include current input if not empty
    if (inputValue.trim()) {
      const normalized = normalizeUrl(inputValue);
      if (isValidUrl(normalized) && !allUrls.includes(normalized)) {
        allUrls.push(normalized);
      }
    }
    if (allUrls.length === 0) {
      setInputError('Add at least one URL to generate content');
      return;
    }
    setUrls(allUrls);
    setInputValue('');
    setInputError('');
    onGenerate(allUrls);
  };

  const handleClear = () => {
    setUrls([]);
    setInputValue('');
    setInputError('');
    onClear();
  };

  const totalUrls = urls.length + (inputValue.trim() ? 1 : 0);
  const canGenerate = totalUrls > 0 && !disabled && !isGenerating;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-white" />
          <div>
            <h3 className="text-white font-bold text-sm">Multi-URL Blog Generator</h3>
            <p className="text-purple-200 text-xs">
              Add up to 8 URLs — AI combines all content into pro 7s &amp; 30s posts
            </p>
          </div>
          {urls.length > 0 && (
            <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {urls.length} URL{urls.length !== 1 ? 's' : ''} added
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* URL Input Row */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Link className="w-4 h-4 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setInputError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter website URL (e.g. nike.com or https://example.com)"
                disabled={isGenerating || disabled || urls.length >= 8}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => addUrl()}
              disabled={!inputValue.trim() || isGenerating || disabled || urls.length >= 8}
              className="px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add URL
            </button>
          </div>

          {/* Validation error */}
          {inputError && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {inputError}
            </div>
          )}

          {/* URL hint */}
          {!inputError && (
            <p className="text-xs text-gray-400">
              Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">Enter</kbd> or click Add URL. Mix any websites — AI will cross-synthesize the content.
            </p>
          )}
        </div>

        {/* Added URLs list */}
        {urls.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Sources queued for generation
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {urls.map((url, index) => {
                let domain = url;
                try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}
                return (
                  <div
                    key={url}
                    className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl px-3 py-2.5 group"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{domain}</p>
                      <p className="text-xs text-gray-400 truncate">{url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUrl(url)}
                      disabled={isGenerating}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Example URLs */}
        {!disabled && urls.length < 8 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">
              {urls.length === 0 ? '✨ Quick start — click to add example sites:' : '➕ Add more examples:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_URLS.filter(ex => !urls.includes(ex.url)).map(({ url, label }) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => handleExampleClick(url)}
                  disabled={isGenerating || urls.length >= 8}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1.5 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Character gate */}
        {disabled && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Please select an AI character above before generating content
          </div>
        )}

        {/* Action row */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-purple-200 disabled:shadow-none"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating{urls.length > 1 ? ` from ${urls.length} sources` : ''}…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {urls.length > 1
                  ? `Generate Combined Blog (${urls.length} sources)`
                  : urls.length === 1
                  ? 'Generate Blog Posts'
                  : 'Generate Blog Posts'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          {(urls.length > 0 || inputValue) && !isGenerating && (
            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Multi-source insight banner */}
        {urls.length > 1 && (
          <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-emerald-600 text-lg">🧠</span>
            <div>
              <p className="text-xs font-bold text-emerald-800">
                Multi-source synthesis active — {urls.length} sites will be combined
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                AI will cross-reference content, unify themes, eliminate overlap, and generate {urls.length > 2 ? 'richer' : 'deeper'} 7s &amp; 30s posts that no single source could produce alone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
