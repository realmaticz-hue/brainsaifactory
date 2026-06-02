// =============================================================================
// BLOG POST FILTER — Search & Filter Controls
// =============================================================================

import React from 'react';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

export type SortBy = 'timestamp' | 'qualityScore' | 'wordCount' | 'duration';
export type SortOrder = 'asc' | 'desc';

interface BlogPostFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDuration: 'all' | 7 | 30;
  onDurationChange: (duration: 'all' | 7 | 30) => void;
  minQualityScore: number;
  onMinQualityScoreChange: (score: number) => void;
  sortBy: SortBy;
  onSortByChange: (sort: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  totalPosts: number;
  filteredPosts: number;
  onClearFilters?: () => void;
}

export function BlogPostFilter({
  searchQuery,
  onSearchChange,
  selectedDuration,
  onDurationChange,
  minQualityScore,
  onMinQualityScoreChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  totalPosts,
  filteredPosts,
  onClearFilters,
}: BlogPostFilterProps) {
  const hasActiveFilters = searchQuery || selectedDuration !== 'all' || minQualityScore > 0;

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search blog posts by content, title, keywords..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Duration Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Duration:</span>
          <div className="flex gap-1">
            {(['all', 7, 30] as const).map((duration) => (
              <button
                key={duration}
                onClick={() => onDurationChange(duration)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedDuration === duration
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {duration === 'all' ? 'All' : `${duration}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Score Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Min Quality:</span>
          <select
            value={minQualityScore}
            onChange={(e) => onMinQualityScoreChange(Number(e.target.value))}
            className="px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={0}>Any</option>
            <option value={50}>50+</option>
            <option value={70}>70+</option>
            <option value={85}>85+</option>
            <option value={90}>90+</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-600 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortBy)}
            className="px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="timestamp">Date</option>
            <option value="qualityScore">Quality</option>
            <option value="wordCount">Word Count</option>
            <option value="duration">Duration</option>
          </select>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>
          Showing {filteredPosts} of {totalPosts} posts
        </span>
        {hasActiveFilters && filteredPosts < totalPosts && (
          <span className="text-purple-600 font-medium">
            ({totalPosts - filteredPosts} filtered out)
          </span>
        )}
      </div>
    </div>
  );
}
