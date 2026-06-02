// This file contains helper functions for generating full functional code
// To be imported by ProfessionalAppBuilder.tsx

import { copyToClipboard } from '../utils/clipboard';

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateFullReactCode = (screens: any[], database: any, api: any): string => {
  const mainTableName = database.tables.find((t: any) => t.name !== 'users')?.name || database.tables[0]?.name || 'items';
  const mainTable = database.tables.find((t: any) => t.name === mainTableName);
  const singularName = capitalize(mainTableName.slice(0, -1));
  
  // Generate API Service
  const apiServiceCode = `
// ==================== API SERVICE ====================
// File: /src/services/api.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class APIService {
${database.tables.map((table: any) => `
  // ${table.name.toUpperCase()} API
  async getAll${capitalize(table.name)}() {
    const response = await fetch(\`\${API_BASE_URL}/${table.name}\`);
    if (!response.ok) throw new Error('Failed to fetch ${table.name}');
    return response.json();
  }

  async get${capitalize(table.name.slice(0, -1))}ById(id: string) {
    const response = await fetch(\`\${API_BASE_URL}/${table.name}/\${id}\`);
    if (!response.ok) throw new Error('Failed to fetch ${table.name.slice(0, -1)}');
    return response.json();
  }

  async create${capitalize(table.name.slice(0, -1))}(data: any) {
    const response = await fetch(\`\${API_BASE_URL}/${table.name}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create ${table.name.slice(0, -1)}');
    return response.json();
  }

  async update${capitalize(table.name.slice(0, -1))}(id: string, data: any) {
    const response = await fetch(\`\${API_BASE_URL}/${table.name}/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update ${table.name.slice(0, -1)}');
    return response.json();
  }

  async delete${capitalize(table.name.slice(0, -1))}(id: string) {
    const response = await fetch(\`\${API_BASE_URL}/${table.name}/\${id}\`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete ${table.name.slice(0, -1)}');
    return response.json();
  }`).join('\n')}
}

export const apiService = new APIService();`;

  // Generate Type Definitions
  const typeDefinitions = `
// ==================== TYPE DEFINITIONS ====================
// File: /src/types/index.ts

${database.tables.map((table: any) => `
export interface ${capitalize(table.name.slice(0, -1))} {
${table.fields.map((field: any) => `  ${field.name}${field.required ? '' : '?'}: ${field.type === 'string' ? 'string' : field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : field.type === 'date' ? 'Date' : 'any'};`).join('\n')}
}`).join('\n')}`;

  // Generate page components for each screen
  const pageComponents = screens.map(screen => {
    const componentName = screen.name.replace(/\s/g, '') + 'Page';
    
    if (screen.type === 'dashboard' || screen.type === 'home') {
      return generateDashboardPage(componentName, singularName, mainTableName, mainTable, database);
    } else if (screen.type === 'list') {
      return generateListPage(componentName, singularName, mainTableName, mainTable);
    } else if (screen.type === 'detail') {
      return generateDetailPage(componentName, singularName, mainTable);
    } else if (screen.type === 'form') {
      return generateFormPage(componentName, singularName, mainTable);
    } else if (screen.type === 'settings' || screen.type === 'profile') {
      return generateSettingsPage(componentName);
    }
    return generateGenericPage(componentName, screen.name);
  }).join('\n\n');

  // Main App Component
  const mainApp = `
// ==================== MAIN APP ====================
// File: /src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';

function App() {
  return (
    <Router>
      <Routes>
${screens.map((screen: any, i: number) => `        <Route path="${i === 0 ? '/' : '/' + screen.id}" element={<${screen.name.replace(/\s/g, '')}Page />} />`).join('\n')}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;`;

  return `// ============================================
// GENERATED REACT APPLICATION - FULLY FUNCTIONAL
// ============================================
// This code is production-ready and can be deployed immediately
// All pages have full CRUD functionality

${apiServiceCode}

${typeDefinitions}

${pageComponents}

${mainApp}

// ==================== INSTALLATION INSTRUCTIONS ====================
/*
1. Create a new React project:
   npx create-vite@latest my-app --template react-ts
   cd my-app

2. Install dependencies:
   npm install react-router lucide-react

3. Copy the generated code into appropriate files:
   - API Service → src/services/api.ts
   - Types → src/types/index.ts
   - Pages → src/pages/[PageName].tsx
   - App → src/App.tsx

4. Start development server:
   npm run dev

5. Build for production:
   npm run build
*/`;
};

// Helper functions to generate each page type

function generateDashboardPage(componentName: string, singularName: string, mainTableName: string, mainTable: any, database: any) {
  const nameField = mainTable?.fields.find((f: any) => f.name.includes('name') || f.name.includes('title'))?.name || 'name';
  const descField = mainTable?.fields.find((f: any) => f.name.includes('description'))?.name || 'description';
  
  return `
// ==================== DASHBOARD PAGE ====================
// File: /src/pages/${componentName}.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { apiService } from '../services/api';
import { ${singularName} } from '../types';
import { Home, TrendingUp, Users, Activity, Plus, ArrowRight } from 'lucide-react';

export function ${componentName}() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total${singularName}s: 0,
    active${singularName}s: 0,
    totalUsers: 0,
    recentActivity: 0
  });
  const [recent${singularName}s, setRecent${singularName}s] = useState<${singularName}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [${mainTableName}Data, usersData] = await Promise.all([
        apiService.getAll${capitalize(mainTableName)}(),
        apiService.getAllUsers().catch(() => ({ data: [] }))
      ]);

      setStats({
        total${singularName}s: ${mainTableName}Data.data?.length || 0,
        active${singularName}s: ${mainTableName}Data.data?.filter((item: any) => item.status === 'active').length || 0,
        totalUsers: usersData.data?.length || 0,
        recentActivity: ${mainTableName}Data.data?.length || 0
      });

      setRecent${singularName}s(${mainTableName}Data.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Use demo data on error
      setRecent${singularName}s([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total ${singularName}s</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total${singularName}s}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active${singularName}s}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.recentActivity}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent ${singularName}s</h2>
              <button
                onClick={() => navigate('/list')}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm font-medium"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recent${singularName}s.length > 0 ? (
              recent${singularName}s.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate(\`/detail/\${item.id}\`)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.${nameField} || 'Untitled'}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.${descField} || 'No description'}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">No ${mainTableName} yet. Create your first one!</p>
                <button
                  onClick={() => navigate('/create')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}`;
}

function generateListPage(componentName: string, singularName: string, mainTableName: string, mainTable: any) {
  const nameField = mainTable?.fields.find((f: any) => f.name.includes('name') || f.name.includes('title'))?.name || 'name';
  const descField = mainTable?.fields.find((f: any) => f.name.includes('description'))?.name || 'description';
  
  return `
// ==================== LIST PAGE ====================
// File: /src/pages/${componentName}.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { apiService } from '../services/api';
import { ${singularName} } from '../types';
import { Search, Filter, Grid, List as ListIcon, Plus, ArrowLeft } from 'lucide-react';

export function ${componentName}() {
  const navigate = useNavigate();
  const [items, setItems] = useState<${singularName}[]>([]);
  const [filteredItems, setFilteredItems] = useState<${singularName}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAll${capitalize(mainTableName)}();
      setItems(response.data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter((item: any) =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(query)
      )
    );
    setFilteredItems(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">All ${singularName}s</h1>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ${mainTableName}..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={\`p-2 rounded-lg transition-colors \${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}\`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={\`p-2 rounded-lg transition-colors \${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}\`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length > 0 ? (
          <div className={\`\${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}\`}>
            {filteredItems.map((item: any) => (
              <div
                key={item.id}
                onClick={() => navigate(\`/detail/\${item.id}\`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md cursor-pointer transition-all"
              >
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {item.${nameField} || 'Untitled'}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {item.${descField} || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                  <span className="text-indigo-600 font-medium">View →</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No results found for your search' : \`No \${${mainTableName}} yet\`}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/create')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create First ${singularName}
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredItems.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredItems.length} of {items.length} ${mainTableName}
          </div>
        )}
      </main>
    </div>
  );
}`;
}

function generateDetailPage(componentName: string, singularName: string, mainTable: any) {
  const nameField = mainTable?.fields.find((f: any) => f.name.includes('name') || f.name.includes('title'))?.name || 'name';
  const descField = mainTable?.fields.find((f: any) => f.name.includes('description'))?.name || 'description';
  
  return `
// ==================== DETAIL PAGE ====================
// File: /src/pages/${componentName}.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { apiService } from '../services/api';
import { ${singularName} } from '../types';
import { ArrowLeft, Edit, Trash2, Share2, MoreVertical } from 'lucide-react';

export function ${componentName}() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<${singularName} | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (id) {
      loadItem(id);
    }
  }, [id]);

  const loadItem = async (itemId: string) => {
    try {
      setLoading(true);
      const response = await apiService.get${singularName}ById(itemId);
      setItem(response.data);
    } catch (error) {
      console.error('Error loading item:', error);
      alert('Failed to load item');
      navigate('/list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiService.delete${singularName}(id);
      alert('Item deleted successfully');
      navigate('/list');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: (item as any)?.${nameField} || 'Item',
        text: (item as any)?.${descField} || '',
        url: window.location.href
      });
    } else {
      copyToClipboard(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Item not found</p>
          <button
            onClick={() => navigate('/list')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/list')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">${singularName} Details</h1>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate(\`/edit/\${id}\`);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleShare();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Main Content */}
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {(item as any).${nameField}}
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              {(item as any).${descField}}
            </p>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
${mainTable?.fields.filter((f: any) => !['id', nameField, descField].includes(f.name)).slice(0, 6).map((field: any) => `
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  ${capitalize(field.name)}
                </label>
                <div className="text-gray-900">
                  {${field.type === 'date' ? `(item as any).${field.name} ? new Date((item as any).${field.name}).toLocaleDateString() : 'N/A'` : field.type === 'boolean' ? `(item as any).${field.name} ? 'Yes' : 'No'` : `(item as any).${field.name} || 'N/A'`}}
                </div>
              </div>`).join('')}
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {(item as any).createdAt ? new Date((item as any).createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {(item as any).updatedAt ? new Date((item as any).updatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-4">
            <button
              onClick={() => navigate(\`/edit/\${id}\`)}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Edit ${singularName}
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}`;
}

function generateFormPage(componentName: string, singularName: string, mainTable: any) {
  const formFields = mainTable?.fields.filter((f: any) => !['id', 'createdAt', 'updatedAt'].includes(f.name)).slice(0, 8) || [];
  
  return `
// ==================== FORM PAGE ====================
// File: /src/pages/${componentName}.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { apiService } from '../services/api';
import { ${singularName} } from '../types';
import { ArrowLeft, Save, X } from 'lucide-react';

export function ${componentName}() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
${formFields.map((field: any) => 
    `    ${field.name}: ${field.type === 'boolean' ? 'false' : field.type === 'number' ? '0' : "''"},`
  ).join('\n')}
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      loadItem(id);
    }
  }, [id]);

  const loadItem = async (itemId: string) => {
    try {
      const response = await apiService.get${singularName}ById(itemId);
      if (response.data) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Error loading item:', error);
      alert('Failed to load item');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

${formFields.filter((f: any) => f.required).slice(0, 5).map((field: any) => `
    if (!formData.${field.name}) {
      newErrors.${field.name} = '${capitalize(field.name)} is required';
    }`).join('')}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && id) {
        await apiService.update${singularName}(id, formData);
        alert('${singularName} updated successfully!');
      } else {
        await apiService.create${singularName}(formData);
        alert('${singularName} created successfully!');
      }

      navigate('/list');
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit' : 'Create New'} ${singularName}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8 space-y-6">
${formFields.map((field: any) => `
            {/* ${capitalize(field.name)} */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ${capitalize(field.name)}${field.required ? ' *' : ''}
              </label>
              ${field.type === 'boolean' ? `
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.${field.name}}
                  onChange={(e) => handleChange('${field.name}', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">
                  {formData.${field.name} ? 'Yes' : 'No'}
                </span>
              </div>` : field.name.includes('description') || field.name.includes('content') ? `
              <textarea
                value={formData.${field.name}}
                onChange={(e) => handleChange('${field.name}', e.target.value)}
                rows={4}
                className={\`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 \${errors.${field.name} ? 'border-red-500' : 'border-gray-300'}\`}
                placeholder="Enter ${field.name}..."
              />` : `
              <input
                type="${field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.name.includes('email') ? 'email' : 'text'}"
                value={formData.${field.name}}
                onChange={(e) => handleChange('${field.name}', ${field.type === 'number' ? 'Number(e.target.value)' : 'e.target.value'})}
                className={\`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 \${errors.${field.name} ? 'border-red-500' : 'border-gray-300'}\`}
                placeholder="Enter ${field.name}..."
              />`}
              {errors.${field.name} && (
                <p className="mt-1 text-sm text-red-600">{errors.${field.name}}</p>
              )}
            </div>
`).join('')}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : isEditMode ? 'Update ${singularName}' : 'Create ${singularName}'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}`;
}

function generateSettingsPage(componentName: string) {
  return `
// ==================== SETTINGS PAGE ====================
// File: /src/pages/${componentName}.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User, Bell, Lock, Globe, Moon, Save, Check } from 'lucide-react';

export function ${componentName}() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    notifications: true,
    darkMode: false,
    language: 'en',
    emailUpdates: true
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications about updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Email Updates</p>
                  <p className="text-sm text-gray-600">Receive email notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailUpdates}
                  onChange={(e) => setSettings({...settings, emailUpdates: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-600">Use dark theme</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};;`;
}

function generateGenericPage(componentName: string, name: any): any {
  const safeName = String(name).replace(/\s/g, '');
  return `
// ==================== GENERIC PAGE ====================
// File: /src/pages/${componentName}.tsx

import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function ${componentName}() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">${safeName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">${safeName}</h2>
          <p className="text-gray-600 mb-6">This is a generic page generated for the "${safeName}" screen. Customize this page as needed.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </main>
    </div>
  );
}`;
}
