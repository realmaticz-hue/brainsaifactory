// Ultra App Generator - Template Designer + Code Writer + Enhancement Suggester
import { useState, useRef, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { 
  Sparkles, Wand2, Code, Layout, Palette, Zap, Crown,
  CheckCircle, ArrowRight, Loader, Play, Download, Copy,
  Lightbulb, TrendingUp, Award, Star, Rocket, Brain,
  FileCode, Settings, Database, Shield, Globe, Users,
  BarChart, MessageSquare, Bell, Search, Heart, ShoppingCart
} from 'lucide-react';
import JSZip from 'jszip';

interface AppTemplate {
  type: string;
  name: string;
  description: string;
  icon: JSX.Element;
  baseFeatures: string[];
  premiumFeatures: string[];
  techStack: string[];
  fileStructure: FileStructure[];
  colorScheme: ColorScheme;
  layout: LayoutType;
}

interface FileStructure {
  path: string;
  content: string;
  description: string;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface LayoutType {
  type: 'dashboard' | 'landing' | 'app' | 'social' | 'ecommerce';
  sections: string[];
}

interface EnhancementSuggestion {
  title: string;
  description: string;
  usedBy: string[];
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  code?: string;
  priority: number;
}

type GenerationPhase = 'analyzing' | 'designing' | 'coding' | 'enhancing' | 'complete';

export function UltraAppGenerator() {
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<GenerationPhase | null>(null);
  const [template, setTemplate] = useState<AppTemplate | null>(null);
  const [enhancements, setEnhancements] = useState<EnhancementSuggestion[]>([]);
  const [selectedEnhancements, setSelectedEnhancements] = useState<Set<number>>(new Set());
  const [generatedFiles, setGeneratedFiles] = useState<FileStructure[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showCode, setShowCode] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const appTypes = [
    {
      icon: <CheckCircle className="w-5 h-5" />,
      name: 'Todo/Task Manager',
      keywords: ['todo', 'task', 'checklist', 'planner'],
      example: 'Create a todo list app with priorities'
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      name: 'E-commerce',
      keywords: ['shop', 'store', 'ecommerce', 'cart', 'product'],
      example: 'Build an online clothing store'
    },
    {
      icon: <BarChart className="w-5 h-5" />,
      name: 'Dashboard/Analytics',
      keywords: ['dashboard', 'analytics', 'metrics', 'stats'],
      example: 'Create a sales analytics dashboard'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      name: 'Social/Chat',
      keywords: ['social', 'chat', 'messaging', 'community'],
      example: 'Build a team chat application'
    },
    {
      icon: <Layout className="w-5 h-5" />,
      name: 'Landing Page',
      keywords: ['landing', 'website', 'homepage', 'marketing'],
      example: 'Design a SaaS product landing page'
    },
    {
      icon: <Users className="w-5 h-5" />,
      name: 'CRM/Management',
      keywords: ['crm', 'management', 'customer', 'contacts'],
      example: 'Create a customer relationship manager'
    }
  ];

  const detectAppType = (userPrompt: string): string => {
    const lowerPrompt = userPrompt.toLowerCase();
    
    for (const type of appTypes) {
      if (type.keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return type.name;
      }
    }
    
    return 'Custom Application';
  };

  const generateTemplate = async (userPrompt: string): Promise<AppTemplate> => {
    const appType = detectAppType(userPrompt);
    
    // Simulate analysis
    setCurrentStep('Analyzing your requirements...');
    await delay(1000);
    setProgress(20);
    
    setCurrentStep('Designing template architecture...');
    await delay(1000);
    setProgress(40);

    switch (appType) {
      case 'Todo/Task Manager':
        return {
          type: 'todo',
          name: 'Advanced Task Manager',
          description: 'Full-featured task management application',
          icon: <CheckCircle className="w-6 h-6" />,
          baseFeatures: [
            'Add, edit, delete tasks',
            'Mark tasks as complete',
            'Task categories',
            'Search and filter',
            'Local storage persistence'
          ],
          premiumFeatures: [
            'Priority levels (High/Medium/Low)',
            'Due dates and reminders',
            'Subtasks and dependencies',
            'Tags and labels',
            'Drag-and-drop reordering',
            'Dark mode',
            'Task statistics and insights',
            'Export to PDF/CSV',
            'Collaboration and sharing',
            'Recurring tasks',
            'Time tracking',
            'Calendar view'
          ],
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Local Storage', 'Date-fns'],
          fileStructure: [],
          colorScheme: {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#10B981',
            background: '#F9FAFB',
            text: '#111827'
          },
          layout: {
            type: 'app',
            sections: ['Header', 'Sidebar', 'Main Content', 'Task List', 'Task Details']
          }
        };

      case 'E-commerce':
        return {
          type: 'ecommerce',
          name: 'Premium E-commerce Platform',
          description: 'Professional online shopping experience',
          icon: <ShoppingCart className="w-6 h-6" />,
          baseFeatures: [
            'Product catalog',
            'Shopping cart',
            'Product search',
            'Simple checkout',
            'Product details'
          ],
          premiumFeatures: [
            'Advanced filtering (price, category, rating)',
            'Product reviews and ratings',
            'Wishlist functionality',
            'Product recommendations',
            'Quick view modal',
            'Image zoom and gallery',
            'Size/color variants',
            'Stock availability',
            'Recently viewed items',
            'Compare products',
            'Guest checkout',
            'Order tracking',
            'Discount codes',
            'Multiple payment options',
            'Saved addresses'
          ],
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'React Query'],
          fileStructure: [],
          colorScheme: {
            primary: '#F59E0B',
            secondary: '#EF4444',
            accent: '#10B981',
            background: '#FFFFFF',
            text: '#1F2937'
          },
          layout: {
            type: 'ecommerce',
            sections: ['Header', 'Hero', 'Product Grid', 'Filters', 'Cart Sidebar']
          }
        };

      case 'Dashboard/Analytics':
        return {
          type: 'dashboard',
          name: 'Executive Dashboard',
          description: 'Data-driven analytics and insights',
          icon: <BarChart className="w-6 h-6" />,
          baseFeatures: [
            'Data visualization',
            'Basic charts',
            'Metrics display',
            'Simple tables',
            'Static data'
          ],
          premiumFeatures: [
            'Real-time data updates',
            'Interactive charts (hover, click, zoom)',
            'Custom date range selector',
            'Export to Excel/PDF',
            'Comparison views',
            'Predictive analytics',
            'Custom dashboards',
            'Drill-down capabilities',
            'Alert notifications',
            'KPI tracking',
            'Heat maps',
            'Funnel analysis',
            'Cohort analysis',
            'A/B test results',
            'Revenue forecasting'
          ],
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Recharts', 'Zustand'],
          fileStructure: [],
          colorScheme: {
            primary: '#6366F1',
            secondary: '#8B5CF6',
            accent: '#EC4899',
            background: '#F9FAFB',
            text: '#111827'
          },
          layout: {
            type: 'dashboard',
            sections: ['Sidebar', 'Header', 'Metrics Cards', 'Charts', 'Tables']
          }
        };

      case 'Social/Chat':
        return {
          type: 'social',
          name: 'Social Collaboration Platform',
          description: 'Real-time communication and networking',
          icon: <MessageSquare className="w-6 h-6" />,
          baseFeatures: [
            'Message sending',
            'User list',
            'Basic chat interface',
            'Simple notifications',
            'User profiles'
          ],
          premiumFeatures: [
            'Real-time typing indicators',
            'Read receipts',
            'File and image sharing',
            'Emoji reactions',
            'Threaded conversations',
            'Voice/video calling',
            'Group chats',
            'Channel organization',
            '@mentions and notifications',
            'Message search',
            'Pin important messages',
            'Message editing/deletion',
            'Rich text formatting',
            'Status indicators (online/away/busy)',
            'Custom emojis and GIFs'
          ],
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Socket.io', 'Zustand'],
          fileStructure: [],
          colorScheme: {
            primary: '#0EA5E9',
            secondary: '#8B5CF6',
            accent: '#10B981',
            background: '#FFFFFF',
            text: '#111827'
          },
          layout: {
            type: 'social',
            sections: ['Sidebar', 'Channel List', 'Chat Area', 'User Panel']
          }
        };

      case 'Landing Page':
        return {
          type: 'landing',
          name: 'Premium Landing Page',
          description: 'High-converting marketing website',
          icon: <Layout className="w-6 h-6" />,
          baseFeatures: [
            'Hero section',
            'Features list',
            'Contact form',
            'Footer',
            'Basic styling'
          ],
          premiumFeatures: [
            'Animated hero section',
            'Video background',
            'Interactive pricing tables',
            'Customer testimonials carousel',
            'Live chat widget',
            'Email signup with validation',
            'Social proof indicators',
            'FAQ accordion',
            'Trust badges and logos',
            'Sticky navigation',
            'Scroll animations',
            'A/B testing ready',
            'SEO optimized',
            'Multi-language support',
            'Performance optimized'
          ],
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Motion', 'React Hook Form'],
          fileStructure: [],
          colorScheme: {
            primary: '#7C3AED',
            secondary: '#EC4899',
            accent: '#F59E0B',
            background: '#FFFFFF',
            text: '#111827'
          },
          layout: {
            type: 'landing',
            sections: ['Hero', 'Features', 'Pricing', 'Testimonials', 'CTA', 'Footer']
          }
        };

      default:
        return {
          type: 'custom',
          name: 'Custom Application',
          description: 'Tailored to your specific needs',
          icon: <Rocket className="w-6 h-6" />,
          baseFeatures: [
            'Core functionality',
            'User interface',
            'Data management',
            'Basic interactions',
            'Responsive design'
          ],
          premiumFeatures: [
            'Advanced features',
            'Performance optimization',
            'Security enhancements',
            'Analytics integration',
            'Third-party integrations',
            'Advanced UI/UX',
            'Accessibility features',
            'Progressive Web App',
            'Offline support',
            'Push notifications'
          ],
          techStack: ['React', 'TypeScript', 'Tailwind CSS'],
          fileStructure: [],
          colorScheme: {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#10B981',
            background: '#F9FAFB',
            text: '#111827'
          },
          layout: {
            type: 'app',
            sections: ['Header', 'Main Content', 'Sidebar', 'Footer']
          }
        };
    }
  };

  const generateEnhancements = (template: AppTemplate): EnhancementSuggestion[] => {
    const baseEnhancements: EnhancementSuggestion[] = [
      {
        title: 'Dark Mode Support',
        description: 'Toggle between light and dark themes for better user experience',
        usedBy: ['Twitter', 'YouTube', 'Notion', 'GitHub'],
        impact: 'high',
        implementation: 'Add theme context with localStorage persistence',
        code: `const [theme, setTheme] = useState('light');
const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
};`,
        priority: 95
      },
      {
        title: 'Keyboard Shortcuts',
        description: 'Power user features with keyboard navigation',
        usedBy: ['Gmail', 'Notion', 'Linear', 'Figma'],
        impact: 'high',
        implementation: 'Implement global keyboard event listeners',
        code: `useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'k') {
      openCommandPalette();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);`,
        priority: 85
      },
      {
        title: 'Search & Command Palette',
        description: 'Quick access to all features via keyboard',
        usedBy: ['Notion', 'Linear', 'GitHub', 'VS Code'],
        impact: 'high',
        implementation: 'Modal with fuzzy search and command execution',
        priority: 90
      },
      {
        title: 'Undo/Redo Functionality',
        description: 'Let users reverse their actions',
        usedBy: ['Figma', 'Notion', 'Google Docs', 'Canva'],
        impact: 'high',
        implementation: 'State history management with action stack',
        priority: 80
      },
      {
        title: 'Real-time Collaboration',
        description: 'Multiple users working together live',
        usedBy: ['Figma', 'Google Docs', 'Notion', 'Miro'],
        impact: 'high',
        implementation: 'WebSocket connection with operational transforms',
        priority: 75
      },
      {
        title: 'Activity Feed & History',
        description: 'Track all changes and actions',
        usedBy: ['GitHub', 'Asana', 'Linear', 'Jira'],
        impact: 'medium',
        implementation: 'Event logging system with timestamps',
        priority: 70
      },
      {
        title: 'Smart Notifications',
        description: 'Contextual alerts and updates',
        usedBy: ['Slack', 'Gmail', 'Notion', 'Asana'],
        impact: 'high',
        implementation: 'Notification center with preferences',
        priority: 85
      },
      {
        title: 'Advanced Filtering',
        description: 'Multi-criteria search and filter',
        usedBy: ['Amazon', 'Airbnb', 'LinkedIn', 'GitHub'],
        impact: 'high',
        implementation: 'Filter builder with saved queries',
        priority: 80
      },
      {
        title: 'Bulk Actions',
        description: 'Perform operations on multiple items',
        usedBy: ['Gmail', 'Trello', 'Notion', 'Asana'],
        impact: 'medium',
        implementation: 'Multi-select with batch operations',
        priority: 75
      },
      {
        title: 'Templates & Presets',
        description: 'Quick start with pre-configured setups',
        usedBy: ['Notion', 'Canva', 'Figma', 'ClickUp'],
        impact: 'medium',
        implementation: 'Template library with customization',
        priority: 70
      },
      {
        title: 'Export & Import',
        description: 'Data portability in multiple formats',
        usedBy: ['Notion', 'Airtable', 'Trello', 'Excel'],
        impact: 'medium',
        implementation: 'Multi-format export (JSON, CSV, PDF)',
        priority: 65
      },
      {
        title: 'Offline Support',
        description: 'Work without internet connection',
        usedBy: ['Notion', 'Google Docs', 'Todoist', 'Evernote'],
        impact: 'high',
        implementation: 'Service Worker with IndexedDB sync',
        priority: 70
      },
      {
        title: 'Mobile-First Design',
        description: 'Optimized for mobile devices',
        usedBy: ['Instagram', 'TikTok', 'Twitter', 'WhatsApp'],
        impact: 'high',
        implementation: 'Responsive breakpoints with touch gestures',
        priority: 90
      },
      {
        title: 'Onboarding Tutorial',
        description: 'Interactive guide for new users',
        usedBy: ['Duolingo', 'Grammarly', 'Slack', 'Asana'],
        impact: 'medium',
        implementation: 'Step-by-step tour with highlights',
        priority: 60
      },
      {
        title: 'Analytics Dashboard',
        description: 'Track usage and performance metrics',
        usedBy: ['Google Analytics', 'Mixpanel', 'Amplitude', 'Hotjar'],
        impact: 'medium',
        implementation: 'Event tracking with visualization',
        priority: 65
      }
    ];

    // Add type-specific enhancements
    const typeSpecificEnhancements = getTypeSpecificEnhancements(template.type);
    
    return [...baseEnhancements, ...typeSpecificEnhancements].sort((a, b) => b.priority - a.priority);
  };

  const getTypeSpecificEnhancements = (type: string): EnhancementSuggestion[] => {
    switch (type) {
      case 'todo':
        return [
          {
            title: 'Drag & Drop',
            description: 'Reorder tasks with drag and drop',
            usedBy: ['Trello', 'Asana', 'Notion', 'ClickUp'],
            impact: 'high',
            implementation: 'React DnD with priority updates',
            priority: 92
          },
          {
            title: 'Subtasks',
            description: 'Break down tasks into smaller steps',
            usedBy: ['Asana', 'Todoist', 'ClickUp', 'Things'],
            impact: 'high',
            implementation: 'Nested task structure with progress tracking',
            priority: 88
          },
          {
            title: 'Time Tracking',
            description: 'Track time spent on each task',
            usedBy: ['Clockify', 'Toggl', 'Harvest', 'ClickUp'],
            impact: 'medium',
            implementation: 'Timer with start/stop and manual entry',
            priority: 75
          }
        ];
      
      case 'ecommerce':
        return [
          {
            title: 'Product Quick View',
            description: 'View product details without leaving the page',
            usedBy: ['Amazon', 'Shopify', 'Etsy', 'ASOS'],
            impact: 'high',
            implementation: 'Modal with full product info',
            priority: 90
          },
          {
            title: 'Wishlist',
            description: 'Save products for later',
            usedBy: ['Amazon', 'eBay', 'Etsy', 'Nike'],
            impact: 'high',
            implementation: 'Persistent wishlist with sharing',
            priority: 85
          },
          {
            title: 'Product Recommendations',
            description: 'AI-powered product suggestions',
            usedBy: ['Amazon', 'Netflix', 'Spotify', 'YouTube'],
            impact: 'high',
            implementation: 'Collaborative filtering algorithm',
            priority: 82
          }
        ];
      
      case 'dashboard':
        return [
          {
            title: 'Custom Widgets',
            description: 'User-configurable dashboard widgets',
            usedBy: ['Tableau', 'Power BI', 'Grafana', 'Datadog'],
            impact: 'high',
            implementation: 'Widget library with drag-drop layout',
            priority: 90
          },
          {
            title: 'Real-time Updates',
            description: 'Live data streaming',
            usedBy: ['Datadog', 'New Relic', 'Grafana', 'Kibana'],
            impact: 'high',
            implementation: 'WebSocket with automatic refresh',
            priority: 88
          },
          {
            title: 'Drill-down Analysis',
            description: 'Click to explore deeper insights',
            usedBy: ['Tableau', 'Power BI', 'Looker', 'Google Analytics'],
            impact: 'high',
            implementation: 'Hierarchical data navigation',
            priority: 85
          }
        ];
      
      default:
        return [];
    }
  };

  const generateCode = async (template: AppTemplate, enhancements: number[]): Promise<FileStructure[]> => {
    setCurrentStep('Writing component files...');
    await delay(800);
    setProgress(60);

    const files: FileStructure[] = [];
    
    // Main App component
    files.push({
      path: '/App.tsx',
      description: 'Main application component',
      content: generateAppComponent(template, enhancements)
    });

    setCurrentStep('Creating feature components...');
    await delay(800);
    setProgress(70);

    // Component files based on app type
    switch (template.type) {
      case 'todo':
        files.push(
          {
            path: '/components/TaskList.tsx',
            description: 'Task list component',
            content: generateTaskListComponent(enhancements)
          },
          {
            path: '/components/TaskItem.tsx',
            description: 'Individual task component',
            content: generateTaskItemComponent(enhancements)
          },
          {
            path: '/components/AddTask.tsx',
            description: 'Add task form',
            content: generateAddTaskComponent(enhancements)
          }
        );
        break;
      
      case 'ecommerce':
        files.push(
          {
            path: '/components/ProductGrid.tsx',
            description: 'Product grid layout',
            content: generateProductGridComponent(enhancements)
          },
          {
            path: '/components/ProductCard.tsx',
            description: 'Product card component',
            content: generateProductCardComponent(enhancements)
          },
          {
            path: '/components/ShoppingCart.tsx',
            description: 'Shopping cart component',
            content: generateShoppingCartComponent(enhancements)
          }
        );
        break;
      
      case 'dashboard':
        files.push(
          {
            path: '/components/MetricsCard.tsx',
            description: 'Metrics display card',
            content: generateMetricsCardComponent(enhancements)
          },
          {
            path: '/components/ChartWidget.tsx',
            description: 'Chart visualization',
            content: generateChartWidgetComponent(enhancements)
          },
          {
            path: '/components/DataTable.tsx',
            description: 'Data table component',
            content: generateDataTableComponent(enhancements)
          }
        );
        break;
    }

    setCurrentStep('Adding enhancement features...');
    await delay(800);
    setProgress(85);

    // Add enhancement-specific files
    if (enhancements.includes(0)) { // Dark mode
      files.push({
        path: '/contexts/ThemeContext.tsx',
        description: 'Theme management context',
        content: generateThemeContext()
      });
    }

    if (enhancements.includes(2)) { // Command palette
      files.push({
        path: '/components/CommandPalette.tsx',
        description: 'Keyboard command interface',
        content: generateCommandPalette()
      });
    }

    setCurrentStep('Finalizing code...');
    await delay(500);
    setProgress(95);

    // Styles
    files.push({
      path: '/styles/globals.css',
      description: 'Global styles',
      content: generateGlobalStyles(template.colorScheme)
    });

    return files;
  };

  const generateAppComponent = (template: AppTemplate, enhancements: number[]): string => {
    const hasDarkMode = enhancements.includes(0);
    const hasKeyboardShortcuts = enhancements.includes(1);
    const hasCommandPalette = enhancements.includes(2);

    return `import { useState, useEffect } from 'react';
${template.type === 'todo' ? `import { TaskList } from './components/TaskList';
import { AddTask } from './components/AddTask';` : ''}
${template.type === 'ecommerce' ? `import { ProductGrid } from './components/ProductGrid';
import { ShoppingCart } from './components/ShoppingCart';` : ''}
${template.type === 'dashboard' ? `import { MetricsCard } from './components/MetricsCard';
import { ChartWidget } from './components/ChartWidget';` : ''}
${hasDarkMode ? `import { ThemeProvider } from './contexts/ThemeContext';` : ''}
${hasCommandPalette ? `import { CommandPalette } from './components/CommandPalette';` : ''}

export default function App() {
  ${template.type === 'todo' ? `const [tasks, setTasks] = useState([]);
  
  const addTask = (task) => {
    setTasks([...tasks, { id: Date.now(), ...task }]);
  };
  
  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  
  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };` : ''}
  
  ${hasKeyboardShortcuts ? `useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Open command palette
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);` : ''}
  
  return (
    ${hasDarkMode ? '<ThemeProvider>' : ''}
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ${template.name}
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        ${template.type === 'todo' ? `<AddTask onAdd={addTask} />
        <TaskList 
          tasks={tasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />` : ''}
        ${template.type === 'ecommerce' ? `<ProductGrid />
        <ShoppingCart />` : ''}
        ${template.type === 'dashboard' ? `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricsCard title="Revenue" value="$45,231" change="+12.5%" />
          <MetricsCard title="Users" value="1,234" change="+5.2%" />
          <MetricsCard title="Orders" value="456" change="+8.1%" />
        </div>
        <ChartWidget />` : ''}
      </main>
      
      ${hasCommandPalette ? '<CommandPalette />' : ''}
    </div>
    ${hasDarkMode ? '</ThemeProvider>' : ''}
  );
}`;
  };

  const generateTaskListComponent = (enhancements: number[]): string => {
    const hasDragDrop = enhancements.some(e => e >= 15); // Check for drag-drop enhancement
    
    return `import { TaskItem } from './TaskItem';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority?: string;
  dueDate?: string;
}

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  return (
    <div className="mt-8 space-y-2">
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No tasks yet. Add one above!
        </div>
      ) : (
        tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}`;
  };

  const generateTaskItemComponent = (enhancements: number[]): string => {
    return `import { Trash2, Check } from 'lucide-react';

export function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
      <button
        onClick={() => onToggle(task.id)}
        className={\`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors \${
          task.completed
            ? 'bg-blue-500 border-blue-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
        }\`}
      >
        {task.completed && <Check className="w-4 h-4 text-white" />}
      </button>
      
      <span className={\`flex-1 \${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}\`}>
        {task.text}
      </span>
      
      {task.priority && (
        <span className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
          {task.priority}
        </span>
      )}
      
      <button
        onClick={() => onDelete(task.id)}
        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}`;
  };

  const generateAddTaskComponent = (enhancements: number[]): string => {
    return `import { useState } from 'react';
import { Plus } from 'lucide-react';

export function AddTask({ onAdd }) {
  const [text, setText] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd({ text, completed: false });
      setText('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new task..."
        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add
      </button>
    </form>
  );
}`;
  };

  const generateProductGridComponent = (enhancements: number[]): string => {
    return `import { ProductCard } from './ProductCard';

const products = [
  { id: 1, name: 'Product 1', price: 29.99, image: 'https://via.placeholder.com/300' },
  { id: 2, name: 'Product 2', price: 49.99, image: 'https://via.placeholder.com/300' },
  { id: 3, name: 'Product 3', price: 19.99, image: 'https://via.placeholder.com/300' },
];

export function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}`;
  };

  const generateProductCardComponent = (enhancements: number[]): string => {
    return `import { ShoppingCart, Heart } from 'lucide-react';

export function ProductCard({ product }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden">
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
        <p className="text-2xl font-bold text-blue-600 mt-2">\${product.price}</p>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
          <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}`;
  };

  const generateShoppingCartComponent = (enhancements: number[]): string => {
    return `import { X } from 'lucide-react';

export function ShoppingCart() {
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
      <div className="text-gray-500 dark:text-gray-400">Your cart is empty</div>
    </div>
  );
}`;
  };

  const generateMetricsCardComponent = (enhancements: number[]): string => {
    return `import { TrendingUp, TrendingDown } from 'lucide-react';

export function MetricsCard({ title, value, change }) {
  const isPositive = change.startsWith('+');
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <span className={\`flex items-center text-sm font-semibold \${
          isPositive ? 'text-green-600' : 'text-red-600'
        }\`}>
          {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {change}
        </span>
      </div>
    </div>
  );
}`;
  };

  const generateChartWidgetComponent = (enhancements: number[]): string => {
    return `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
];

export function ChartWidget() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}`;
  };

  const generateDataTableComponent = (enhancements: number[]): string => {
    return `export function DataTable() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              Example Item
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Active
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              $1,234
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}`;
  };

  const generateThemeContext = (): string => {
    return `import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
} | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark';
    if (stored) setTheme(stored);
  }, []);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};`;
  };

  const generateCommandPalette = (): string => {
    return `import { useState, useEffect } from 'react';
import { Search, Command } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center border-b dark:border-gray-700 px-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 px-4 py-4 bg-transparent focus:outline-none dark:text-white"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
        </div>
        <div className="p-2 max-h-96 overflow-y-auto">
          <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
            No results found
          </div>
        </div>
      </div>
    </div>
  );
}`;
  };

  const generateGlobalStyles = (colorScheme: ColorScheme): string => {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: ${colorScheme.primary};
  --color-secondary: ${colorScheme.secondary};
  --color-accent: ${colorScheme.accent};
  --color-background: ${colorScheme.background};
  --color-text: ${colorScheme.text};
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerate = async () => {
    setPhase('analyzing');
    setProgress(0);
    
    // Generate template
    const newTemplate = await generateTemplate(prompt);
    setTemplate(newTemplate);
    setPhase('designing');
    
    // Generate enhancements
    setCurrentStep('Analyzing similar premium apps...');
    await delay(1000);
    setProgress(50);
    
    const newEnhancements = generateEnhancements(newTemplate);
    setEnhancements(newEnhancements);
    
    // Auto-select top enhancements
    const topEnhancements = new Set(newEnhancements.slice(0, 5).map((_, i) => i));
    setSelectedEnhancements(topEnhancements);
    
    setPhase('enhancing');
  };

  const handleBuildApp = async () => {
    setPhase('coding');
    const files = await generateCode(template!, Array.from(selectedEnhancements));
    setGeneratedFiles(files);
    setProgress(100);
    setCurrentStep('Complete!');
    setPhase('complete');
  };

  const toggleEnhancement = (index: number) => {
    const newSelected = new Set(selectedEnhancements);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEnhancements(newSelected);
  };

  const copyCode = (content: string) => {
    copyToClipboard(content);
  };

  const downloadSingleFile = (file: FileStructure) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Get filename from path
    const filename = file.path.split('/').pop() || 'file.tsx';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    // Use JSZip to create a proper ZIP file
    const zip = new JSZip();
    
    // Add each file to the ZIP
    generatedFiles.forEach(file => {
      // Remove leading slash and create proper file path
      const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      zip.file(filePath, file.content);
    });
    
    // Add README
    const readme = `# ${template?.name}

Generated by Ultra App Generator

## Files Included

${generatedFiles.map(f => `- ${f.path} - ${f.description}`).join('\n')}

## Features

${template?.baseFeatures.map(f => `- ${f}`).join('\n')}

## Premium Features Included

${Array.from(selectedEnhancements).map(i => `- ${enhancements[i]?.title}`).join('\n')}

## Tech Stack

${template?.techStack.join(', ')}

## Getting Started

\`\`\`bash
# 1. Extract this ZIP file and cd into it
cd ${template?.name.replace(/\s/g, '-').toLowerCase()}

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
# → http://localhost:5173
\`\`\`

## Important: Tailwind CSS Setup

This project uses Tailwind CSS with PostCSS. Config files are included, but verify if styles are missing:

### postcss.config.js
\`\`\`js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
\`\`\`

### src/index.css (or src/styles/globals.css) must contain:
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

## Build for Production

\`\`\`bash
npm run build
\`\`\`

## Next Steps

- Customize the components
- Add your data
- Deploy to Vercel or Netlify

Enjoy your new app!
`;
    
    zip.file('README.md', readme);
    
    // Add package.json
    const packageJson = {
      name: template?.name.toLowerCase().replace(/\s/g, '-'),
      version: '1.0.0',
      description: template?.description,
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'lucide-react': '^0.263.1',
        ...(template?.techStack.includes('Recharts') && { recharts: '^2.5.0' }),
        ...(template?.techStack.includes('Zustand') && { zustand: '^4.3.8' }),
        ...(template?.techStack.includes('Motion') && { motion: '^10.16.2' }),
        ...(template?.techStack.includes('Date-fns') && { 'date-fns': '^2.30.0' }),
        ...(template?.techStack.includes('React Hook Form') && { 'react-hook-form': '^7.45.1' })
      },
      devDependencies: {
        '@types/react': '^18.2.15',
        '@types/react-dom': '^18.2.7',
        '@vitejs/plugin-react': '^4.0.3',
        typescript: '^5.0.2',
        vite: '^4.4.5',
        tailwindcss: '^4.0.0',
        '@tailwindcss/postcss': '^4.0.0',
        autoprefixer: '^10.4.14',
        postcss: '^8.4.27'
      }
    };
    
    zip.file('package.json', JSON.stringify(packageJson, null, 2));
    
    // Add tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }]
    };
    
    zip.file('tsconfig.json', JSON.stringify(tsConfig, null, 2));
    
    // Add index.html
    const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${template?.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    zip.file('index.html', indexHtml);
    
    // Add main.tsx
    const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
    
    zip.file('src/main.tsx', mainTsx);

    // Add src/index.css with Tailwind directives (fallback if globals.css is missing)
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    zip.file('src/index.css', indexCss);
    
    // Add vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    
    zip.file('vite.config.ts', viteConfig);
    
    // Add tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '${template?.colorScheme.primary}',
        secondary: '${template?.colorScheme.secondary}',
        accent: '${template?.colorScheme.accent}',
      },
    },
  },
  plugins: [],
}`;
    
    zip.file('tailwind.config.js', tailwindConfig);
    
    // Add postcss.config.js
    const postcssConfig = `export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
}`;
    
    zip.file('postcss.config.js', postcssConfig);
    
    // Add .gitignore
    const gitignore = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`;
    
    zip.file('.gitignore', gitignore);
    
    // Generate ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template?.name.replace(/\s/g, '-').toLowerCase()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-6">
        <h3 className="text-white font-bold text-2xl flex items-center gap-3">
          <Wand2 className="w-7 h-7" />
          Ultra App Generator
          <Crown className="w-6 h-6 text-yellow-300" />
        </h3>
        <p className="text-white/90 text-sm mt-1">Template Designer → Code Writer → Premium Enhancements</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!phase && (
          <div>
            {/* Input Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <label className="text-white font-semibold text-lg mb-3 block flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Describe your app
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a todo list app with priorities, due dates, and dark mode"
                className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={4}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="mt-4 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Rocket className="w-6 h-6" />
                Generate Ultra App
              </button>
            </div>

            {/* Examples */}
            <div className="mt-8">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Quick Examples
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appTypes.map((type, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(type.example)}
                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-purple-400">{type.icon}</div>
                      <span className="text-white font-semibold">{type.name}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{type.example}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Loader className="w-6 h-6 text-purple-400 animate-spin" />
              <h4 className="text-white font-bold text-xl">Analyzing Requirements...</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Detecting app type
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Loader className="w-5 h-5 animate-spin" />
                {currentStep}
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">{progress}% complete</p>
            </div>
          </div>
        )}

        {phase === 'designing' && template && (
          <div className="space-y-6">
            {/* Template Card */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg p-6 border border-purple-700">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-2xl mb-2">{template.name}</h3>
                  <p className="text-gray-300">{template.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {template.techStack.map((tech, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Base Features */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                Base Features (Included)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {template.baseFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Move to enhancements */}
            <button
              onClick={() => setPhase('enhancing')}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all"
            >
              <Crown className="w-6 h-6" />
              Add Premium Features
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {phase === 'enhancing' && template && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6">
              <h3 className="text-white font-bold text-2xl flex items-center gap-3 mb-2">
                <Crown className="w-7 h-7" />
                Ultra Platinum Features
                <Award className="w-6 h-6" />
              </h3>
              <p className="text-white/90">
                Based on analysis of top apps like {template.type === 'todo' ? 'Notion, Asana, ClickUp' :
                template.type === 'ecommerce' ? 'Amazon, Shopify, Etsy' :
                template.type === 'dashboard' ? 'Tableau, Grafana, Datadog' :
                'industry leaders'}
              </p>
              <p className="text-white/80 text-sm mt-2">
                {selectedEnhancements.size} of {enhancements.length} features selected
              </p>
            </div>

            {/* Enhancements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enhancements.map((enhancement, i) => (
                <div
                  key={i}
                  onClick={() => toggleEnhancement(i)}
                  className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedEnhancements.has(i)
                      ? 'bg-purple-900/30 border-purple-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-white font-bold">{enhancement.title}</h5>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          enhancement.impact === 'high' ? 'bg-red-600 text-white' :
                          enhancement.impact === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {enhancement.impact.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{enhancement.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded border-2 flex-shrink-0 ml-3 flex items-center justify-center ${
                      selectedEnhancements.has(i)
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-600'
                    }`}>
                      {selectedEnhancements.has(i) && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {enhancement.usedBy.slice(0, 3).map((app, j) => (
                      <span key={j} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        {app}
                      </span>
                    ))}
                    {enhancement.usedBy.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        +{enhancement.usedBy.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  {enhancement.code && (
                    <div className="mt-3 p-3 bg-black rounded text-xs text-green-400 font-mono overflow-x-auto">
                      {enhancement.code.split('\n')[0]}...
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Build Button */}
            <button
              onClick={handleBuildApp}
              disabled={selectedEnhancements.size === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Code className="w-6 h-6" />
              Build Complete App with {selectedEnhancements.size} Premium Features
              <Rocket className="w-6 h-6" />
            </button>
          </div>
        )}

        {phase === 'coding' && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Loader className="w-6 h-6 text-purple-400 animate-spin" />
              <h4 className="text-white font-bold text-xl">Writing Production Code...</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-300">
                <Code className="w-5 h-5 text-blue-400" />
                {currentStep}
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">{progress}% complete</p>
            </div>
          </div>
        )}

        {phase === 'complete' && generatedFiles.length > 0 && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-white" />
                <h3 className="text-white font-bold text-2xl">App Generated Successfully!</h3>
              </div>
              <p className="text-white/90">
                {generatedFiles.length} files created with {selectedEnhancements.size} premium features
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={downloadZip}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download ZIP ({generatedFiles.length + 8} files)
              </button>
              <button
                onClick={() => setShowCode(!showCode)}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Code className="w-5 h-5" />
                {showCode ? 'Hide' : 'View'} Code
              </button>
            </div>

            {/* File List */}
            {showCode && (
              <div className="space-y-4">
                {generatedFiles.map((file, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-mono text-sm">{file.path}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{file.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadSingleFile(file)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                          title="Download this file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyCode(file.content)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 text-sm text-gray-300 overflow-x-auto bg-black">
                      {file.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Start Over */}
            <button
              onClick={() => {
                setPhase(null);
                setTemplate(null);
                setEnhancements([]);
                setSelectedEnhancements(new Set());
                setGeneratedFiles([]);
                setProgress(0);
                setPrompt('');
              }}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
            >
              Create Another App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
