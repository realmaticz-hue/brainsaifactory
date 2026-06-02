// =============================================================================
// TEMPLATES LIBRARY — Pre-Built Blog Structures
// =============================================================================

import React, { useState } from 'react';
import { X, Search, FileText, Copy, Check } from 'lucide-react';
import { BLOG_TEMPLATES, getTemplatesByCategory, getTemplateCategories, type BlogTemplate } from '../utils/blogTemplates';
import { toast } from 'sonner';

interface TemplatesLibraryProps {
  isopen: boolean;
  onClose: () => void;
  onUseTemplate: (template: BlogTemplate) => void;
}

export function TemplatesLibrary({ isopen, onClose, onUseTemplate }: TemplatesLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<BlogTemplate['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<BlogTemplate | null>(null);

  if (!isopen) return null;

  const categories = getTemplateCategories();

  const filteredTemplates = BLOG_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: BlogTemplate) => {
    onUseTemplate(template);
    toast.success(`Applied "${template.name}" template`);
    onClose();
  };

  const handleCopyStructure = (template: BlogTemplate) => {
    navigator.clipboard.writeText(template.structure);
    toast.success('Template structure copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${selectedCategory === 'all'
              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <span>📚</span>
              <span>All Templates</span>
              <span className="ml-auto text-xs">{BLOG_TEMPLATES.length}</span>
            </div>
          </button>

          {categories.map(category => {
            const count = getTemplatesByCategory(category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${selectedCategory === category.id
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                  <span className="ml-auto text-xs">{count}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Templates Library</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose from {BLOG_TEMPLATES.length} pre-built blog structures
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer group"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {template.name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {template.duration} sec read
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                        className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Use Template
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyStructure(template);
                        }}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Copy structure"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{previewTemplate.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {previewTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {previewTemplate.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Structure Preview</h4>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {previewTemplate.structure}
                  </pre>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">SEO Templates</h4>
                  <div className="space-y-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Title</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">{previewTemplate.seoTitleTemplate}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-xs font-medium text-green-900 dark:text-green-300 mb-1">Meta Description</p>
                      <p className="text-sm text-green-700 dark:text-green-400">{previewTemplate.metaDescriptionTemplate}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.keywords.map(keyword => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => {
                    handleUseTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Use This Template
                </button>
                <button
                  onClick={() => handleCopyStructure(previewTemplate)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
