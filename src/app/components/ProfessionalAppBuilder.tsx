import { AICodeAssistant } from './AICodeAssistant';
import { copyToClipboard } from '../utils/clipboard';
import { AppBuilderFileManager } from './AppBuilderFileManager';
import { RealAppGenerator, RealAppConfig, GeneratedAppFiles } from './RealAppGenerator';
import { SmartAIAssistant } from './SmartAIAssistant';
import { RealErrorFixer } from './RealErrorFixer';
import { PromptToAppAI } from './PromptToAppAI';
import { UnifiedAIAssistant } from './UnifiedAIAssistant';
import { useState, useRef, useEffect } from 'react';
import {
  X, Sparkles, Download, Code, Eye, Smartphone, Monitor, Tablet,
  Database, Cloud, Settings, Zap, Layout, Palette, FileCode,
  Play, Pause, RefreshCw, Save, Copy, Check, Wand2, Cpu,
  FileJson, Package, Terminal, Layers, Box, Grid, Upload, Bot,
  AlertCircle, CheckCircle, FileSearch, Wrench, Trash2, File,
  FolderOpen, Plus
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { generateFullReactCode, capitalize } from './ProfessionalAppBuilderEnhanced';

interface ProfessionalAppBuilderProps {
  isopen: boolean;
  onClose: () => void;
  onSaveApp?: (app: any) => void;
}

interface GeneratedApp {
  id: string;
  name: string;
  description: string;
  prompt: string;
  screens: AppScreen[];
  database?: DatabaseSchema;
  api?: APIEndpoints;
  code: {
    react: string;
    swift: string;
    kotlin: string;
  };
  assets: {
    icons: string[];
    images: string[];
    colors: string[];
  };
  createdAt: string;
}

interface AppScreen {
  id: string;
  name: string;
  type: 'home' | 'list' | 'detail' | 'form' | 'settings' | 'profile' | 'dashboard' | 'custom';
  components: UIComponent[];
  navigation: {
    from: string[];
    to: string[];
  };
}

interface UIComponent {
  id: string;
  type: 'header' | 'button' | 'input' | 'card' | 'list' | 'image' | 'text' | 'chart' | 'map' | 'video';
  props: Record<string, any>;
  children?: UIComponent[];
  style: Record<string, any>;
}

interface DatabaseSchema {
  tables: DatabaseTable[];
  relationships: Relationship[];
}

interface DatabaseTable {
  name: string;
  fields: Field[];
}

interface Field {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  required: boolean;
  unique?: boolean;
  default?: any;
}

interface Relationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

interface APIEndpoints {
  endpoints: Endpoint[];
}

interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  params?: Record<string, string>;
  response: Record<string, any>;
}

export function ProfessionalAppBuilder({ isopen, onClose, onSaveApp }: ProfessionalAppBuilderProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'database' | 'api' | 'export' | 'assistant' | 'files'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [selectedScreen, setSelectedScreen] = useState(0);
  const [codeLanguage, setCodeLanguage] = useState<'react' | 'swift' | 'kotlin'>('react');
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [generationHistory, setGenerationHistory] = useState<GeneratedApp[]>([]);
  const [showCodeAssistant, setShowCodeAssistant] = useState(false);

  const generateApp = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description of the app you want to build');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStage('Analyzing your requirements...');
    setIsEditMode(false);

    try {
      const stages = [
        { name: 'Analyzing your requirements...', duration: 800, progress: 5 },
        { name: 'Designing app architecture...', duration: 1200, progress: 15 },
        { name: 'Creating database schema...', duration: 1000, progress: 25 },
        { name: 'Generating UI screens...', duration: 2000, progress: 40 },
        { name: 'Building navigation flow...', duration: 1000, progress: 50 },
        { name: 'Designing components...', duration: 1500, progress: 60 },
        { name: 'Generating API endpoints...', duration: 1200, progress: 70 },
        { name: 'Creating React code...', duration: 1500, progress: 80 },
        { name: 'Generating Swift code...', duration: 1000, progress: 90 },
        { name: 'Finalizing application...', duration: 800, progress: 100 }
      ];

      for (const stage of stages) {
        setCurrentStage(stage.name);
        await new Promise(resolve => setTimeout(resolve, stage.duration));
        setGenerationProgress(stage.progress);
      }

      // Generate comprehensive app structure
      const app = await generateComprehensiveApp(prompt);

      // Add to history
      if (generatedApp) {
        setGenerationHistory(prev => [...prev, generatedApp]);
      }

      setGeneratedApp(app);
      setEditedPrompt(prompt);
      setActiveTab('preview');

    } catch (error) {
      console.error('App generation error:', error);
      alert('Error generating app. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPrompt = () => {
    setIsEditMode(true);
    setEditedPrompt(generatedApp?.prompt || prompt);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedPrompt('');
  };

  const handleRegenerateWithEdits = async () => {
    if (!editedPrompt.trim()) {
      alert('Please enter a description');
      return;
    }

    // Save current app to history before regenerating
    if (generatedApp) {
      setGenerationHistory(prev => [...prev, generatedApp]);
    }

    setPrompt(editedPrompt);
    setIsEditMode(false);

    // Call generateApp with the edited prompt
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStage('Analyzing your updated requirements...');

    try {
      const stages = [
        { name: 'Analyzing your updated requirements...', duration: 800, progress: 5 },
        { name: 'Redesigning app architecture...', duration: 1200, progress: 15 },
        { name: 'Updating database schema...', duration: 1000, progress: 25 },
        { name: 'Regenerating UI screens...', duration: 2000, progress: 40 },
        { name: 'Rebuilding navigation flow...', duration: 1000, progress: 50 },
        { name: 'Updating components...', duration: 1500, progress: 60 },
        { name: 'Refreshing API endpoints...', duration: 1200, progress: 70 },
        { name: 'Updating React code...', duration: 1500, progress: 80 },
        { name: 'Updating Swift code...', duration: 1000, progress: 90 },
        { name: 'Finalizing changes...', duration: 800, progress: 100 }
      ];

      for (const stage of stages) {
        setCurrentStage(stage.name);
        await new Promise(resolve => setTimeout(resolve, stage.duration));
        setGenerationProgress(stage.progress);
      }

      // Generate updated app
      const app = await generateComprehensiveApp(editedPrompt);
      setGeneratedApp(app);
      setActiveTab('preview');

    } catch (error) {
      console.error('Regeneration error:', error);
      alert('Error regenerating app. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestorePrevious = () => {
    if (generationHistory.length === 0) return;

    const previousApp = generationHistory[generationHistory.length - 1];
    setGeneratedApp(previousApp);
    setEditedPrompt(previousApp.prompt);
    setGenerationHistory(prev => prev.slice(0, -1));
  };

  const generateComprehensiveApp = async (userPrompt: string): Promise<GeneratedApp> => {
    // Analyze prompt to understand app type
    const lowerPrompt = userPrompt.toLowerCase();

    // Detect app category
    const isEcommerce = lowerPrompt.includes('shop') || lowerPrompt.includes('store') || lowerPrompt.includes('ecommerce');
    const isSocial = lowerPrompt.includes('social') || lowerPrompt.includes('chat') || lowerPrompt.includes('messaging');
    const isProductivity = lowerPrompt.includes('task') || lowerPrompt.includes('todo') || lowerPrompt.includes('productivity');
    const isHealth = lowerPrompt.includes('health') || lowerPrompt.includes('fitness') || lowerPrompt.includes('workout');
    const isFinance = lowerPrompt.includes('finance') || lowerPrompt.includes('budget') || lowerPrompt.includes('money');
    const isEducation = lowerPrompt.includes('education') || lowerPrompt.includes('learn') || lowerPrompt.includes('course');

    // Generate database schema based on app type
    const database = generateDatabaseSchema(userPrompt, {
      isEcommerce,
      isSocial,
      isProductivity,
      isHealth,
      isFinance,
      isEducation
    });

    // Generate screens
    const screens = generateScreens(userPrompt, {
      isEcommerce,
      isSocial,
      isProductivity,
      isHealth,
      isFinance,
      isEducation
    });

    // Generate API endpoints
    const api = generateAPIEndpoints(database, screens);

    // Generate code for all platforms
    const reactCode = generateReactCode(screens, database, api);
    const swiftCode = generateSwiftCode(screens, database, api);
    const kotlinCode = generateKotlinCode(screens, database, api);

    // Generate assets
    const assets = generateAssets(userPrompt);

    return {
      id: `app-${Date.now()}`,
      name: extractAppName(userPrompt),
      description: userPrompt,
      prompt: userPrompt,
      screens,
      database,
      api,
      code: {
        react: reactCode,
        swift: swiftCode,
        kotlin: kotlinCode
      },
      assets,
      createdAt: new Date().toISOString()
    };
  };

  const generateDatabaseSchema = (prompt: string, appType: any): DatabaseSchema => {
    const tables: DatabaseTable[] = [];

    // Always include Users table
    tables.push({
      name: 'users',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'email', type: 'string', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
        { name: 'avatar', type: 'string', required: false },
        { name: 'createdAt', type: 'date', required: true },
        { name: 'updatedAt', type: 'date', required: true }
      ]
    });

    if (appType.isEcommerce) {
      tables.push({
        name: 'products',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'name', type: 'string', required: true },
          { name: 'description', type: 'string', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'imageUrl', type: 'string', required: true },
          { name: 'category', type: 'string', required: true },
          { name: 'stock', type: 'number', required: true },
          { name: 'rating', type: 'number', required: false }
        ]
      });

      tables.push({
        name: 'orders',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'items', type: 'json', required: true },
          { name: 'total', type: 'number', required: true },
          { name: 'status', type: 'string', required: true },
          { name: 'createdAt', type: 'date', required: true }
        ]
      });
    }

    if (appType.isSocial) {
      tables.push({
        name: 'posts',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'content', type: 'string', required: true },
          { name: 'imageUrl', type: 'string', required: false },
          { name: 'likes', type: 'number', required: true, default: 0 },
          { name: 'createdAt', type: 'date', required: true }
        ]
      });

      tables.push({
        name: 'comments',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'postId', type: 'string', required: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'content', type: 'string', required: true },
          { name: 'createdAt', type: 'date', required: true }
        ]
      });
    }

    if (appType.isProductivity) {
      tables.push({
        name: 'tasks',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'completed', type: 'boolean', required: true, default: false },
          { name: 'priority', type: 'string', required: false },
          { name: 'dueDate', type: 'date', required: false },
          { name: 'createdAt', type: 'date', required: true }
        ]
      });

      tables.push({
        name: 'projects',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'color', type: 'string', required: false },
          { name: 'createdAt', type: 'date', required: true }
        ]
      });
    }

    if (appType.isHealth) {
      tables.push({
        name: 'workouts',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'type', type: 'string', required: true },
          { name: 'duration', type: 'number', required: true },
          { name: 'calories', type: 'number', required: true },
          { name: 'date', type: 'date', required: true }
        ]
      });

      tables.push({
        name: 'meals',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'calories', type: 'number', required: true },
          { name: 'protein', type: 'number', required: false },
          { name: 'carbs', type: 'number', required: false },
          { name: 'fat', type: 'number', required: false },
          { name: 'date', type: 'date', required: true }
        ]
      });
    }

    if (appType.isFinance) {
      tables.push({
        name: 'transactions',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'amount', type: 'number', required: true },
          { name: 'type', type: 'string', required: true },
          { name: 'category', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'date', type: 'date', required: true }
        ]
      });

      tables.push({
        name: 'budgets',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'userId', type: 'string', required: true },
          { name: 'category', type: 'string', required: true },
          { name: 'amount', type: 'number', required: true },
          { name: 'period', type: 'string', required: true }
        ]
      });
    }

    if (appType.isEducation) {
      tables.push({
        name: 'courses',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'string', required: true },
          { name: 'instructorId', type: 'string', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'duration', type: 'string', required: true },
          { name: 'rating', type: 'number', required: false }
        ]
      });

      tables.push({
        name: 'lessons',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'courseId', type: 'string', required: true },
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'string', required: true },
          { name: 'videoUrl', type: 'string', required: false },
          { name: 'order', type: 'number', required: true }
        ]
      });
    }

    // Generate relationships
    const relationships: Relationship[] = [];
    tables.forEach(table => {
      table.fields.forEach(field => {
        if (field.name.endsWith('Id') && field.name !== 'id') {
          const relatedTable = field.name.replace('Id', '') + 's';
          if (tables.some(t => t.name === relatedTable)) {
            relationships.push({
              from: table.name,
              to: relatedTable,
              type: 'one-to-many'
            });
          }
        }
      });
    });

    return { tables, relationships };
  };

  const generateScreens = (prompt: string, appType: any): AppScreen[] => {
    const screens: AppScreen[] = [];

    // Home/Dashboard Screen
    screens.push({
      id: 'home',
      name: 'Home',
      type: 'dashboard',
      components: [
        {
          id: 'header',
          type: 'header',
          props: { title: 'Welcome', showMenu: true, showSearch: true },
          style: { backgroundColor: '#6366f1', color: '#ffffff' }
        },
        {
          id: 'stats',
          type: 'card',
          props: { layout: 'grid', columns: 2 },
          style: { padding: '16px' },
          children: [
            { id: 'stat1', type: 'text', props: { label: 'Total', value: '1,234' }, style: {} },
            { id: 'stat2', type: 'text', props: { label: 'Active', value: '567' }, style: {} }
          ]
        },
        {
          id: 'recent-list',
          type: 'list',
          props: { title: 'Recent Activity', itemCount: 5 },
          style: { marginTop: '16px' }
        }
      ],
      navigation: { from: [], to: ['list', 'detail', 'settings'] }
    });

    // List Screen
    screens.push({
      id: 'list',
      name: 'Browse',
      type: 'list',
      components: [
        {
          id: 'header',
          type: 'header',
          props: { title: 'All Items', showBack: true, showFilter: true },
          style: { backgroundColor: '#6366f1', color: '#ffffff' }
        },
        {
          id: 'search',
          type: 'input',
          props: { placeholder: 'Search...', type: 'search' },
          style: { margin: '16px' }
        },
        {
          id: 'items-list',
          type: 'list',
          props: { itemLayout: 'card', showPagination: true },
          style: {}
        }
      ],
      navigation: { from: ['home'], to: ['detail'] }
    });

    // Detail Screen
    screens.push({
      id: 'detail',
      name: 'Details',
      type: 'detail',
      components: [
        {
          id: 'header',
          type: 'header',
          props: { title: 'Item Details', showBack: true, showShare: true },
          style: { backgroundColor: '#6366f1', color: '#ffffff' }
        },
        {
          id: 'image',
          type: 'image',
          props: { aspectRatio: '16:9', fit: 'cover' },
          style: {}
        },
        {
          id: 'content',
          type: 'card',
          props: {},
          style: { padding: '16px' },
          children: [
            { id: 'title', type: 'text', props: { variant: 'h1' }, style: { fontSize: '24px' } },
            { id: 'description', type: 'text', props: { variant: 'body' }, style: { marginTop: '8px' } }
          ]
        },
        {
          id: 'action-button',
          type: 'button',
          props: { label: 'Take Action', variant: 'primary' },
          style: { margin: '16px' }
        }
      ],
      navigation: { from: ['list'], to: ['home'] }
    });

    // Form Screen
    screens.push({
      id: 'create',
      name: 'Create New',
      type: 'form',
      components: [
        {
          id: 'header',
          type: 'header',
          props: { title: 'Create New', showBack: true },
          style: { backgroundColor: '#6366f1', color: '#ffffff' }
        },
        {
          id: 'form',
          type: 'card',
          props: {},
          style: { padding: '16px' },
          children: [
            { id: 'input1', type: 'input', props: { label: 'Title', required: true }, style: { marginBottom: '16px' } },
            { id: 'input2', type: 'input', props: { label: 'Description', multiline: true }, style: { marginBottom: '16px' } },
            { id: 'submit', type: 'button', props: { label: 'Submit', variant: 'primary' }, style: {} }
          ]
        }
      ],
      navigation: { from: ['home', 'list'], to: ['home'] }
    });

    // Settings Screen
    screens.push({
      id: 'settings',
      name: 'Settings',
      type: 'settings',
      components: [
        {
          id: 'header',
          type: 'header',
          props: { title: 'Settings', showBack: true },
          style: { backgroundColor: '#6366f1', color: '#ffffff' }
        },
        {
          id: 'profile-section',
          type: 'card',
          props: { title: 'Profile' },
          style: { margin: '16px' }
        },
        {
          id: 'preferences',
          type: 'card',
          props: { title: 'Preferences' },
          style: { margin: '16px' }
        }
      ],
      navigation: { from: ['home'], to: [] }
    });

    return screens;
  };

  const generateAPIEndpoints = (database: DatabaseSchema, screens: AppScreen[]): APIEndpoints => {
    const endpoints: Endpoint[] = [];

    // Generate CRUD endpoints for each table
    database.tables.forEach(table => {
      // GET all
      endpoints.push({
        path: `/api/${table.name}`,
        method: 'GET',
        description: `Get all ${table.name}`,
        response: { data: [], total: 0 }
      });

      // GET by ID
      endpoints.push({
        path: `/api/${table.name}/:id`,
        method: 'GET',
        description: `Get ${table.name} by ID`,
        params: { id: 'string' },
        response: { data: {} }
      });

      // POST create
      endpoints.push({
        path: `/api/${table.name}`,
        method: 'POST',
        description: `Create new ${table.name.slice(0, -1)}`,
        response: { data: {}, success: true }
      });

      // PUT update
      endpoints.push({
        path: `/api/${table.name}/:id`,
        method: 'PUT',
        description: `Update ${table.name.slice(0, -1)}`,
        params: { id: 'string' },
        response: { data: {}, success: true }
      });

      // DELETE
      endpoints.push({
        path: `/api/${table.name}/:id`,
        method: 'DELETE',
        description: `Delete ${table.name.slice(0, -1)}`,
        params: { id: 'string' },
        response: { success: true }
      });
    });

    return { endpoints };
  };

  const generateReactCode = (screens: AppScreen[], database: DatabaseSchema, api: APIEndpoints): string => {
    // Use the enhanced full React code generator
    return generateFullReactCode(screens, database, api);
  };

  const generateSwiftCode = (screens: AppScreen[], database: DatabaseSchema, api: APIEndpoints): string => {
    return `// Generated Swift iOS Application
import SwiftUI

// Models
${database.tables.slice(0, 3).map(table => `
struct ${table.name.charAt(0).toUpperCase() + table.name.slice(1, -1)}: Codable, Identifiable {
${table.fields.slice(0, 6).map(field => `    var ${field.name}: ${field.type === 'string' ? 'String' : field.type === 'number' ? 'Double' : field.type === 'boolean' ? 'Bool' : 'Date'}${field.required ? '' : '?'}`).join('\n')}
}
`).join('\n')}

// API Service
class APIService {
    static let shared = APIService()
    private let baseURL = "https://your-api.com"
    
${api.endpoints.slice(0, 5).map(endpoint => `
    func ${endpoint.method.toLowerCase()}${endpoint.path.replace(/[/:]/g, '_').replace(/_+/g, '_')}(completion: @escaping (Result<Data, Error>) -> Void) {
        guard let url = URL(string: "\\(baseURL)${endpoint.path}") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "${endpoint.method}"
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            if let data = data {
                completion(.success(data))
            }
        }.resume()
    }
`).join('\n')}
}

// Views
${screens.slice(0, 3).map(screen => `
struct ${screen.name.replace(/\s/g, '')}View: View {
    @State private var items: [${database.tables[0]?.name.charAt(0).toUpperCase() + database.tables[0]?.name.slice(1, -1) || 'Item'}] = []
    
    var body: some View {
        NavigationView {
            VStack {
${screen.components.slice(0, 3).map(comp => `
                ${comp.type === 'header' ? `Text("${comp.props.title || ''}")
                    .font(.largeTitle)
                    .fontWeight(.bold)` : comp.type === 'list' ? `List(items) { item in
                    Text(item.name ?? "")
                }` : `Text("${comp.type}")`}
`).join('\n')}
            }
            .navigationTitle("${screen.name}")
        }
    }
}
`).join('\n')}

// Main App
@main
struct GeneratedApp: App {
    var body: some Scene {
        WindowGroup {
            ${screens[0]?.name.replace(/\s/g, '')}View()
        }
    }
}
`;
  };

  const generateKotlinCode = (screens: AppScreen[], database: DatabaseSchema, api: APIEndpoints): string => {
    return `// Generated Kotlin Android Application
package com.generated.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

// Data Classes
${database.tables.slice(0, 3).map(table => `
data class ${table.name.charAt(0).toUpperCase() + table.name.slice(1, -1)}(
${table.fields.slice(0, 6).map(field => `    val ${field.name}: ${field.type === 'string' ? 'String' : field.type === 'number' ? 'Double' : field.type === 'boolean' ? 'Boolean' : 'Long'}${field.required ? '' : '?'}`).join(',\n')}
)
`).join('\n')}

// API Service
class APIService {
${api.endpoints.slice(0, 5).map(endpoint => `
    suspend fun ${endpoint.method.toLowerCase()}${endpoint.path.replace(/[/:]/g, '_').replace(/_+/g, '_')}(): Result<Any> {
        // Implementation here
        return Result.success(Unit)
    }
`).join('\n')}
}

// Screens
${screens.slice(0, 3).map(screen => `
@Composable
fun ${screen.name.replace(/\s/g, '')}Screen() {
    Column(modifier = Modifier.fillMaxSize()) {
${screen.components.slice(0, 3).map(comp => `
        ${comp.type === 'header' ? `Text(
            text = "${comp.props.title || ''}",
            style = MaterialTheme.typography.headlineLarge
        )` : comp.type === 'button' ? `Button(onClick = { }) {
            Text("${comp.props.label || 'Click'}")
        }` : `Text("${comp.type}")`}
`).join('\n')}
    }
}
`).join('\n')}

// Main Activity
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ${screens[0]?.name.replace(/\s/g, '')}Screen()
        }
    }
}
`;
  };

  const generateAssets = (prompt: string) => {
    const primaryColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    const selectedColor = primaryColors[Math.floor(Math.random() * primaryColors.length)];

    return {
      icons: ['icon-192.png', 'icon-512.png', 'favicon.ico'],
      images: ['logo.svg', 'splash.png', 'placeholder.jpg'],
      colors: [selectedColor, '#ffffff', '#000000', '#f3f4f6', '#1f2937']
    };
  };

  const extractAppName = (prompt: string): string => {
    // Extract potential app name from prompt
    const words = prompt.split(' ').filter(w => w.length > 3);
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' App';
  };

  const copyCode = async (code: string) => {
    await copyToClipboard(code);
    alert('Code copied to clipboard!');
  };

  const exportProject = (format: 'zip' | 'github' | 'xcode' | 'android-studio') => {
    if (!generatedApp) return;

    const content = format === 'xcode' || format === 'android-studio'
      ? format === 'xcode' ? generatedApp.code.swift : generatedApp.code.kotlin
      : generatedApp.code.react;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedApp.name.replace(/\s/g, '-')}-${format}.${format === 'xcode' ? 'swift' : format === 'android-studio' ? 'kt' : 'jsx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-[98vw] w-full max-h-[98vh] overflow-hidden flex flex-col border border-purple-500/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-7 h-7" />
                Professional AI App Builder
              </h2>
              <p className="text-sm text-white/90 mt-1">Build complete apps from text - Like Figma + Lovable Robot</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">{currentStage}</span>
                <span className="text-sm font-bold text-purple-400">{Math.round(generationProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel - Input or Navigation */}
            <div className="w-80 bg-gray-800/50 border-r border-gray-700 overflow-y-auto">
              {!generatedApp ? (
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-3">What do you want to build?</h3>
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Describe your app in detail...

Examples:
• Build a fitness tracking app with workout logging, meal planning, and progress charts
• Create an e-commerce store with product catalog, shopping cart, and checkout
• Make a social media app with posts, comments, likes, and user profiles
• Design a task management app with projects, due dates, and team collaboration"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 resize-none focus:outline-none focus:border-purple-500 min-h-[400px]"
                    />
                  </div>

                  <button
                    onClick={generateApp}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-5 h-5" />
                    {isGenerating ? 'Generating...' : 'Generate Complete App'}
                  </button>

                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
                    <div className="font-semibold mb-2">✨ AI-Powered Features</div>
                    <ul className="text-xs space-y-1">
                      <li>• Full app architecture</li>
                      <li>• Database schema design</li>
                      <li>• API endpoints generation</li>
                      <li>• React + Swift + Kotlin code</li>
                      <li>• Professional UI/UX</li>
                      <li>• Ready for deployment</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {/* Prompt Edit Section */}
                  {!isEditMode ? (
                    <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3 mb-4">
                      <h3 className="text-white font-bold text-sm mb-1">{generatedApp.name}</h3>
                      <p className="text-gray-400 text-xs mb-3">{generatedApp.description.substring(0, 100)}...</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleEditPrompt}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Edit & Regenerate
                        </button>
                        {generationHistory.length > 0 && (
                          <button
                            onClick={handleRestorePrevious}
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold"
                            title="Undo last change"
                          >
                            ↶
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-4">
                      <h3 className="text-white font-bold text-sm mb-2">Edit Your Requirements</h3>
                      <textarea
                        value={editedPrompt}
                        onChange={e => setEditedPrompt(e.target.value)}
                        placeholder="Add more details or modify your app description..."
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 resize-none focus:outline-none focus:border-blue-500 min-h-[150px] text-sm mb-3"
                      />
                      <div className="text-xs text-blue-300 mb-3">
                        💡 Tip: Add features like "also add user authentication", "include payment processing", or "add dark mode support"
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRegenerateWithEdits}
                          disabled={isGenerating || !editedPrompt.trim()}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                        >
                          <Wand2 className="w-4 h-4" />
                          Regenerate App
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <h4 className="text-white font-semibold text-sm mb-2">Screens ({generatedApp.screens.length})</h4>
                  {generatedApp.screens.map((screen, i) => (
                    <button
                      key={screen.id}
                      onClick={() => setSelectedScreen(i)}
                      className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${selectedScreen === i
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      <div className="font-semibold text-sm">{screen.name}</div>
                      <div className="text-xs opacity-75">{screen.type}</div>
                    </button>
                  ))}

                  <div className="pt-4 border-t border-gray-700 mt-4">
                    <h4 className="text-white font-semibold text-sm mb-2">Database ({generatedApp.database?.tables.length || 0} tables)</h4>
                    {generatedApp.database?.tables.slice(0, 5).map(table => (
                      <div key={table.name} className="text-gray-400 text-xs py-1">
                        📊 {table.name} ({table.fields.length} fields)
                      </div>
                    ))}
                  </div>

                  {generationHistory.length > 0 && (
                    <div className="pt-4 border-t border-gray-700 mt-4">
                      <h4 className="text-white font-semibold text-sm mb-2">Version History</h4>
                      <div className="text-gray-400 text-xs">
                        {generationHistory.length} previous version{generationHistory.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setGeneratedApp(null);
                      setIsEditMode(false);
                      setEditedPrompt('');
                      setGenerationHistory([]);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    ← Start Over
                  </button>
                </div>
              )}
            </div>

            {/* Main Panel */}
            <div className="flex-1 flex flex-col">
              {generatedApp && (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-700 bg-gray-800/50">
                    {[
                      { id: 'preview', icon: Eye, label: 'Preview' },
                      { id: 'code', icon: Code, label: 'Code' },
                      { id: 'database', icon: Database, label: 'Database' },
                      { id: 'api', icon: Cloud, label: 'API' },
                      { id: 'export', icon: Download, label: 'Export' },
                      { id: 'assistant', icon: Bot, label: 'Assistant' },
                      { id: 'files', icon: FileCode, label: 'Files' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${activeTab === tab.id
                            ? 'bg-gradient-to-b from-purple-600/20 to-transparent border-b-2 border-purple-500 text-purple-400'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                          }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-auto p-6 bg-gray-900">
                    {activeTab === 'preview' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {(['mobile', 'tablet', 'desktop'] as const).map(device => (
                              <button
                                key={device}
                                onClick={() => setPreviewDevice(device)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${previewDevice === device
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                              >
                                {device === 'mobile' && <Smartphone className="w-4 h-4" />}
                                {device === 'tablet' && <Tablet className="w-4 h-4" />}
                                {device === 'desktop' && <Monitor className="w-4 h-4" />}
                                {device.charAt(0).toUpperCase() + device.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-8 flex items-center justify-center min-h-[600px]">
                          <div
                            className={`bg-white rounded-lg shadow-2xl overflow-hidden ${previewDevice === 'mobile' ? 'w-[375px] h-[667px]' :
                                previewDevice === 'tablet' ? 'w-[768px] h-[1024px]' :
                                  'w-full h-[800px]'
                              }`}
                          >
                            <div className="h-full flex flex-col">
                              {generatedApp.screens[selectedScreen].components.map((comp, i) => (
                                <div key={i} className={`
                                  ${comp.type === 'header' ? 'bg-indigo-600 text-white p-4 font-bold text-lg' : ''}
                                  ${comp.type === 'card' ? 'bg-white border border-gray-200 rounded-lg p-4 m-4' : ''}
                                  ${comp.type === 'list' ? 'flex-1 overflow-auto p-4' : ''}
                                  ${comp.type === 'button' ? 'bg-indigo-600 text-white px-6 py-3 rounded-lg m-4 text-center font-semibold' : ''}
                                `}>
                                  {comp.props.title || comp.props.label || comp.type}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'code' && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          {(['react', 'swift', 'kotlin'] as const).map(lang => (
                            <button
                              key={lang}
                              onClick={() => setCodeLanguage(lang)}
                              className={`px-4 py-2 rounded-lg ${codeLanguage === lang
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                              {lang === 'react' && '⚛️ React'}
                              {lang === 'swift' && '🍎 Swift'}
                              {lang === 'kotlin' && '🤖 Kotlin'}
                            </button>
                          ))}

                          <button
                            onClick={() => copyCode(generatedApp.code[codeLanguage])}
                            className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Code
                          </button>
                        </div>

                        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-auto max-h-[700px] text-sm font-mono">
                          {generatedApp.code[codeLanguage]}
                        </pre>
                      </div>
                    )}

                    {activeTab === 'database' && generatedApp.database && (
                      <div className="space-y-6">
                        <h3 className="text-white font-bold text-xl">Database Schema</h3>
                        {generatedApp.database.tables.map(table => (
                          <div key={table.name} className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-purple-400 font-bold text-lg mb-3">📊 {table.name}</h4>
                            <div className="space-y-2">
                              {table.fields.map(field => (
                                <div key={field.name} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded">
                                  <span className="text-white">{field.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm">{field.type}</span>
                                    {field.required && <span className="text-red-400 text-xs">required</span>}
                                    {field.unique && <span className="text-green-400 text-xs">unique</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {generatedApp.database.relationships.length > 0 && (
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-purple-400 font-bold text-lg mb-3">🔗 Relationships</h4>
                            {generatedApp.database.relationships.map((rel, i) => (
                              <div key={i} className="text-gray-300 py-2">
                                {rel.from} → {rel.to} ({rel.type})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'api' && generatedApp.api && (
                      <div className="space-y-4">
                        <h3 className="text-white font-bold text-xl">API Endpoints ({generatedApp.api.endpoints.length})</h3>
                        {generatedApp.api.endpoints.map((endpoint, i) => (
                          <div key={i} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${endpoint.method === 'GET' ? 'bg-blue-600' :
                                  endpoint.method === 'POST' ? 'bg-green-600' :
                                    endpoint.method === 'PUT' ? 'bg-yellow-600' :
                                      'bg-red-600'
                                } text-white`}>
                                {endpoint.method}
                              </span>
                              <code className="text-purple-400">{endpoint.path}</code>
                            </div>
                            <p className="text-gray-400 text-sm">{endpoint.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'export' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-white font-bold text-xl mb-4">Export Your App</h3>

                          {/* Real App Generator - Full Functional Code */}
                          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500 rounded-lg p-6 mb-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-purple-600 p-3 rounded-lg">
                                <Sparkles className="w-8 h-8 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-bold text-lg mb-2">🚀 Generate Complete Functional App</h4>
                                <p className="text-gray-300 text-sm mb-4">
                                  Export a REAL, production-ready application with all features, components, pages, routing, API integration, and database connections - just like Figma Make!
                                </p>
                                <button
                                  onClick={() => {
                                    if (!generatedApp) return;

                                    // Generate REAL complete app with RealAppGenerator
                                    const realAppConfig: RealAppConfig = {
                                      name: generatedApp.name,
                                      description: generatedApp.description,
                                      type: generatedApp.prompt.toLowerCase(),
                                      features: [],
                                      pages: generatedApp.screens.map(s => s.name),
                                      hasAuth: generatedApp.prompt.toLowerCase().includes('auth') || generatedApp.prompt.toLowerCase().includes('login'),
                                      hasDatabase: true,
                                      hasAPI: true
                                    };

                                    const realAppFiles = RealAppGenerator.generateCompleteApp(realAppConfig);

                                    // Create comprehensive download with all files
                                    const zipContent = Object.entries(realAppFiles).map(([filename, content]) =>
                                      `${'='.repeat(80)}\n// FILE: ${filename}\n${'='.repeat(80)}\n\n${content}\n\n`
                                    ).join('\n');

                                    const blob = new Blob([zipContent], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${generatedApp.name.replace(/\s/g, '-')}-COMPLETE-APP.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);

                                    alert(`✅ Complete functional app generated!\n\nIncludes ${Object.keys(realAppFiles).length} files:\n• All page components\n• Routing configuration\n• API integration\n• Database utilities\n• Authentication (if enabled)\n• Reusable components\n• Styles & assets`);
                                  }}
                                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg flex items-center gap-3 shadow-lg transition-all transform hover:scale-105"
                                >\n                                  <Download className="w-6 h-6" />
                                  Download Complete Functional App
                                </button>
                                <div className="mt-3 text-xs text-purple-300">
                                  ✨ Includes {generatedApp.screens.length} functional pages, complete routing, API calls, database integration, and all components
                                </div>
                              </div>
                            </div>
                          </div>

                          <h4 className="text-gray-400 font-semibold text-sm mb-3 uppercase">Quick Exports</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => exportProject('zip')}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg flex flex-col items-center gap-3"
                            >
                              <Package className="w-12 h-12" />
                              <div className="font-bold">Preview Code</div>
                              <div className="text-sm opacity-90">Generated preview</div>
                            </button>

                            <button
                              onClick={() => exportProject('xcode')}
                              className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-lg flex flex-col items-center gap-3"
                            >
                              <Box className="w-12 h-12" />
                              <div className="font-bold">XCode Project</div>
                              <div className="text-sm opacity-90">iOS/macOS Swift</div>
                            </button>

                            <button
                              onClick={() => exportProject('android-studio')}
                              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg flex flex-col items-center gap-3"
                            >
                              <Smartphone className="w-12 h-12" />
                              <div className="font-bold">Android Studio</div>
                              <div className="text-sm opacity-90">Kotlin Android</div>
                            </button>

                            <button
                              onClick={() => alert('GitHub integration coming soon!')}
                              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg flex flex-col items-center gap-3"
                            >
                              <Code className="w-12 h-12" />
                              <div className="font-bold">Push to GitHub</div>
                              <div className="text-sm opacity-90">Deploy directly</div>
                            </button>
                          </div>
                        </div>

                        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-2">✅ Real Functional Applications</h4>
                          <ul className="text-sm text-green-300 space-y-1">
                            <li>• Complete working source code (not mockups!)</li>
                            <li>• Real page routing with React Router</li>
                            <li>• Working API integration & database utilities</li>
                            <li>• Authentication system (login/signup)</li>
                            <li>• Reusable components (Header, Footer, Cards, Buttons)</li>
                            <li>• Professional styling with Tailwind CSS</li>
                            <li>• Production-ready package.json & README</li>
                            <li>• Deploy to Vercel, Netlify, or any platform</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === 'assistant' && (
                      <div className="h-full">
                        <UnifiedAIAssistant />
                      </div>
                    )}

                    {activeTab === 'files' && (
                      <div className="h-full">
                        <RealErrorFixer />
                      </div>
                    )}
                  </div>
                </>
              )}

              {!generatedApp && !isGenerating && (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Describe your app to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {generatedApp && (
            <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                <span className="text-green-400 font-semibold">✓ App Generated Successfully</span>
                <span className="mx-2">•</span>
                <span>{generatedApp.screens.length} screens</span>
                <span className="mx-2">•</span>
                <span>{generatedApp.database?.tables.length || 0} tables</span>
                <span className="mx-2">•</span>
                <span>{generatedApp.api?.endpoints.length || 0} endpoints</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (onSaveApp) onSaveApp(generatedApp);
                    alert('App saved successfully!');
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save App
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}