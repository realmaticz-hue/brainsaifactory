// =============================================================================
// BULK ACTIONS BAR — Multi-Select Actions
// =============================================================================

import React from 'react';
import { Trash2, Download, Send, Copy, X, CheckSquare } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onExport: () => void;
  onPublish?: () => void;
  onDuplicate?: () => void;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  onPublish,
  onDuplicate,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="sticky top-4 z-40 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            <CheckSquare className="w-5 h-5" />
          </button>
          <div>
            <p className="font-semibold">
              {selectedCount} post{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-purple-200">
              {allSelected ? 'All posts selected' : `${totalCount - selectedCount} remaining`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              title="Duplicate selected posts"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
          )}

          <button
            onClick={onExport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            title="Export selected posts"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {onPublish && (
            <button
              onClick={onPublish}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              title="Publish selected posts"
            >
              <Send className="w-4 h-4" />
              Publish
            </button>
          )}

          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            title="Delete selected posts"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <button
            onClick={onDeselectAll}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-2"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
