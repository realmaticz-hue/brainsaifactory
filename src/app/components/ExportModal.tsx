// =============================================================================
// EXPORT MODAL — Multi-Format Export Dialog
// =============================================================================

import React, { useState } from 'react';
import { X, FileText, FileJson, File, Code, Table, Printer } from 'lucide-react';
import type { BlogPost } from '../utils/blogGenerator';
import {
  downloadMarkdown,
  downloadHTML,
  downloadText,
  downloadJSON,
  downloadCSV,
  exportToPDF,
} from '../utils/exportFormats';
import { toast } from 'sonner';

interface ExportModalProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
}

type ExportFormat = 'markdown' | 'html' | 'pdf' | 'text' | 'json' | 'csv';

const EXPORT_FORMATS: Array<{
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  extension: string;
}> = [
    {
      id: 'markdown',
      name: 'Markdown',
      description: 'Plain text with formatting (.md)',
      icon: FileText,
      extension: '.md',
    },
    {
      id: 'html',
      name: 'HTML',
      description: 'Web page format (.html)',
      icon: Code,
      extension: '.html',
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Portable document format',
      icon: Printer,
      extension: '.pdf',
    },
    {
      id: 'text',
      name: 'Plain Text',
      description: 'Simple text file (.txt)',
      icon: File,
      extension: '.txt',
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Structured data format (.json)',
      icon: FileJson,
      extension: '.json',
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Spreadsheet compatible (.csv)',
      icon: Table,
      extension: '.csv',
    },
  ];

export function ExportModal({ isopen, onClose, posts }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [customFilename, setCustomFilename] = useState('');

  if (!isopen) return null;

  const handleExport = () => {
    const filename = customFilename.trim()
      ? `${customFilename}${EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension}`
      : undefined;

    try {
      switch (selectedFormat) {
        case 'markdown':
          downloadMarkdown(posts, filename);
          break;
        case 'html':
          downloadHTML(posts, filename);
          break;
        case 'pdf':
          exportToPDF(posts);
          toast.info('Opening print dialog for PDF export...');
          onClose();
          return; // Don't show success toast for PDF
        case 'text':
          downloadText(posts, filename);
          break;
        case 'json':
          downloadJSON(posts, filename);
          break;
        case 'csv':
          downloadCSV(posts, filename);
          break;
      }

      toast.success(`Exported ${posts.length} post${posts.length !== 1 ? 's' : ''} as ${selectedFormat.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('[Export] Error:', error);
      toast.error('Failed to export posts');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Export Blog Posts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Exporting {posts.length} post{posts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Custom Filename */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Filename (optional)
            </label>
            <input
              type="text"
              placeholder="blog-posts"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              File extension will be added automatically
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${selectedFormat === format.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${selectedFormat === format.id
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      <format.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{format.name}</h3>
                        {selectedFormat === format.id && (
                          <div className="w-2 h-2 bg-purple-600 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format-specific info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              {selectedFormat === 'pdf' && (
                <>📄 Your browser's print dialog will open. Choose "Save as PDF" as the destination.</>
              )}
              {selectedFormat === 'markdown' && (
                <>📝 Includes frontmatter metadata and formatted content.</>
              )}
              {selectedFormat === 'html' && (
                <>🌐 Fully styled HTML page ready for viewing in any browser.</>
              )}
              {selectedFormat === 'text' && (
                <>📄 Plain text format with structured metadata sections.</>
              )}
              {selectedFormat === 'json' && (
                <>🔧 Machine-readable structured data for APIs and tools.</>
              )}
              {selectedFormat === 'csv' && (
                <>📊 Import into Excel, Google Sheets, or any spreadsheet app.</>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
