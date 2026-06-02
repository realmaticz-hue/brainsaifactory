import { useState, useMemo } from 'react';
import { X, Search, Globe, Check, Filter } from 'lucide-react';
import { SUPPORTED_LANGUAGES, Language, groupLanguagesByRegion, getPopularLanguages } from '../utils/languageSupport';

interface LanguageSelectorProps {
  isopen: boolean;
  onClose: () => void;
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  maxSelection?: number;
}

export function LanguageSelector({
  isopen,
  onClose,
  selectedLanguages,
  onLanguagesChange,
  maxSelection = 10
}: LanguageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'popular' | 'all' | 'byRegion'>('popular');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const popularLanguages = useMemo(() => getPopularLanguages(), []);
  const languagesByRegion = useMemo(() => groupLanguagesByRegion(), []);

  const filteredLanguages = useMemo(() => {
    let languages: Language[] = [];

    if (viewMode === 'popular') {
      languages = popularLanguages;
    } else if (viewMode === 'byRegion' && selectedRegion) {
      languages = languagesByRegion[selectedRegion] || [];
    } else {
      languages = SUPPORTED_LANGUAGES;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      languages = languages.filter(lang =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
      );
    }

    return languages;
  }, [viewMode, selectedRegion, searchQuery, popularLanguages, languagesByRegion]);

  const handleToggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      onLanguagesChange(selectedLanguages.filter(lang => lang !== code));
    } else if (selectedLanguages.length < maxSelection) {
      onLanguagesChange([...selectedLanguages, code]);
    }
  };

  const handleSelectAll = () => {
    const codes = filteredLanguages.map(lang => lang.code);
    const newSelection = [...new Set([...selectedLanguages, ...codes])].slice(0, maxSelection);
    onLanguagesChange(newSelection);
  };

  const handleClearAll = () => {
    onLanguagesChange([]);
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Select Languages</h2>
                <p className="text-blue-100 text-sm">
                  {selectedLanguages.length} of {maxSelection} selected • 140+ languages available
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search languages..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => { setViewMode('popular'); setSelectedRegion(null); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === 'popular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              🌟 Popular (12)
            </button>
            <button
              onClick={() => { setViewMode('all'); setSelectedRegion(null); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              🌍 All Languages (140+)
            </button>
            <button
              onClick={() => setViewMode('byRegion')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === 'byRegion'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              By Region
            </button>
          </div>

          {viewMode === 'byRegion' && (
            <div className="flex flex-wrap gap-2">
              {Object.keys(languagesByRegion).map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${selectedRegion === region
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {region} ({languagesByRegion[region].length})
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSelectAll}
              disabled={selectedLanguages.length >= maxSelection}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              Select Visible
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Language Grid */}
        <div className="overflow-y-auto max-h-[500px] p-6">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No languages found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLanguages.map((language) => {
                const isSelected = selectedLanguages.includes(language.code);
                const isDisabled = !isSelected && selectedLanguages.length >= maxSelection;

                return (
                  <button
                    key={language.code}
                    onClick={() => handleToggleLanguage(language.code)}
                    disabled={isDisabled}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : isDisabled
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                          : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{language.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {language.name}
                            </div>
                            <div className="text-sm text-gray-600 truncate" dir={language.rtl ? 'rtl' : 'ltr'}>
                              {language.nativeName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-mono">
                            {language.code}
                          </span>
                          {language.rtl && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              RTL
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{selectedLanguages.length}</span> language
              {selectedLanguages.length !== 1 ? 's' : ''} selected
              {selectedLanguages.length >= maxSelection && (
                <span className="ml-2 text-orange-600 font-semibold">
                  (Maximum reached)
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
