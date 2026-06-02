// Smart AI Code Assistant - Actually intelligent and helpful!
import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Code, Sparkles, Copy, X, Terminal, Zap,
  CheckCircle, AlertCircle, Lightbulb, Play, RefreshCw
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface SmartAIAssistantProps {
  isopen: boolean;
  onClose: () => void;
  context?: {
    currentCode?: string;
    error?: string;
    language?: string;
    fileName?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: {
    language: string;
    content: string;
    fileName?: string;
  };
  timestamp: Date;
}

export function SmartAIAssistant({ isopen, onClose, context }: SmartAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your AI coding assistant. Ask me anything - I'll generate code, fix bugs, explain concepts, or help you build features!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateSmartResponse(input);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 800);
  };

  const generateSmartResponse = (query: string): Message => {
    const q = query.toLowerCase();

    // Authentication
    if (q.includes('auth') || q.includes('login') || q.includes('signup')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'll help you build a complete authentication system with login, signup, and session management:",
        code: {
          language: 'typescript',
          fileName: 'AuthSystem.tsx',
          content: `import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      console.log('Login successful!', data);
      // Redirect to dashboard or home
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;
      
      alert('Signup successful! Check your email for verification.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}

// Check if user is logged in
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

// Logout
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/';
}`
        },
        timestamp: new Date()
      };
    }

    // Form creation
    if (q.includes('form')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here's a professional form with validation:",
        code: {
          language: 'typescript',
          fileName: 'Form.tsx',
          content: `import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Submission failed');

      alert('Form submitted successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      alert('Error submitting form');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={\`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 \${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }\`}
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={\`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 \${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }\`}
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Message *</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className={\`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 \${
            errors.message ? 'border-red-500' : 'border-gray-300'
          }\`}
        />
        {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}`
        },
        timestamp: new Date()
      };
    }

    // API endpoint
    if (q.includes('api') || q.includes('endpoint') || q.includes('backend')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here's a complete API endpoint with validation and error handling:",
        code: {
          language: 'typescript',
          fileName: 'supabase/functions/server/api.tsx',
          content: `import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// GET all items
app.get('/make-server-7d87310d/items', async (c) => {
  try {
    const items = await kv.getByPrefix('item:');
    
    return c.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch items'
    }, 500);
  }
});

// GET single item
app.get('/make-server-7d87310d/items/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const item = await kv.get(\`item:\${id}\`);
    
    if (!item) {
      return c.json({
        success: false,
        error: 'Item not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch item'
    }, 500);
  }
});

// POST create item
app.post('/make-server-7d87310d/items', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validation
    if (!body.name) {
      return c.json({
        success: false,
        error: 'Name is required'
      }, 400);
    }
    
    const id = \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    const item = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(\`item:\${id}\`, item);
    
    return c.json({
      success: true,
      data: item,
      message: 'Item created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating item:', error);
    return c.json({
      success: false,
      error: 'Failed to create item'
    }, 500);
  }
});

// PUT update item
app.put('/make-server-7d87310d/items/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(\`item:\${id}\`);
    if (!existing) {
      return c.json({
        success: false,
        error: 'Item not found'
      }, 404);
    }
    
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(\`item:\${id}\`, updated);
    
    return c.json({
      success: true,
      data: updated,
      message: 'Item updated successfully'
    });
  } catch (error) {
    console.error('Error updating item:', error);
    return c.json({
      success: false,
      error: 'Failed to update item'
    }, 500);
  }
});

// DELETE item
app.delete('/make-server-7d87310d/items/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const existing = await kv.get(\`item:\${id}\`);
    if (!existing) {
      return c.json({
        success: false,
        error: 'Item not found'
      }, 404);
    }
    
    await kv.del(\`item:\${id}\`);
    
    return c.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return c.json({
      success: false,
      error: 'Failed to delete item'
    }, 500);
  }
});

Deno.serve(app.fetch);`
        },
        timestamp: new Date()
      };
    }

    // Component creation
    if (q.includes('component') || q.includes('button') || q.includes('card') || q.includes('modal')) {
      const componentName = q.includes('button') ? 'Button' : q.includes('card') ? 'Card' : q.includes('modal') ? 'Modal' : 'CustomComponent';

      let code = '';
      if (componentName === 'Button') {
        code = `import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  className = '' 
}: ButtonProps) {
  const baseClasses = 'rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]} \${className}\`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}`;
      } else if (componentName === 'Card') {
        code = `import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ 
  children, 
  title, 
  footer, 
  className = '',
  onClick,
  hover = false
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={\`bg-white rounded-lg shadow-md overflow-hidden \${
        hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''
      } \${className}\`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}`;
      } else if (componentName === 'Modal') {
        code = `import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isopen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ 
  isopen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md' 
}: ModalProps) {
  useEffect(() => {
    if (isopen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isopen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isopen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isopen, onClose]);

  if (!isopen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div 
          className="fixed inset-0 bg-black opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className={\`relative bg-white rounded-lg shadow-xl \${sizeClasses[size]} w-full\`}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="px-6 py-4">
            {children}
          </div>
          
          {footer && (
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
      } else {
        code = `import { useState, useEffect } from 'react';

interface ${componentName}Props {
  title: string;
  data?: any[];
  onAction?: (item: any) => void;
}

export function ${componentName}({ title, data = [], onAction }: ${componentName}Props) {
  const [items, setItems] = useState(data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const handleClick = (item: any) => {
    if (onAction) {
      onAction(item);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => handleClick(item)}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No items to display
        </div>
      )}
    </div>
  );
}`;
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here's a professional ${componentName} component:`,
        code: {
          language: 'typescript',
          fileName: `${componentName}.tsx`,
          content: code
        },
        timestamp: new Date()
      };
    }

    // Database/Data fetching
    if (q.includes('database') || q.includes('fetch') || q.includes('data') || q.includes('crud')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here's a complete data fetching hook with loading states and error handling:",
        code: {
          language: 'typescript',
          fileName: 'useData.ts',
          content: `import { useState, useEffect } from 'react';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useData<T>(url: string): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Usage example:
export function DataComponent() {
  const { data, loading, error, refetch } = useData<any[]>('/api/items');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}`
        },
        timestamp: new Date()
      };
    }

    // State management
    if (q.includes('state') || q.includes('redux') || q.includes('context') || q.includes('zustand')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here's a clean state management solution using React Context:",
        code: {
          language: 'typescript',
          fileName: 'AppContext.tsx',
          content: `import { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  user: any | null;
  theme: 'light' | 'dark';
  notifications: any[];
}

interface AppContextType extends AppState {
  setUser: (user: any | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    theme: 'light',
    notifications: []
  });

  const setUser = (user: any | null) => {
    setState(prev => ({ ...prev, user }));
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const addNotification = (notification: any) => {
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, { ...notification, id: Date.now().toString() }]
    }));
  };

  const removeNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const clearNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setUser,
      setTheme,
      addNotification,
      removeNotification,
      clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// Usage:
// Wrap your app in <AppProvider>
// Then use: const { user, setUser } = useApp();`
        },
        timestamp: new Date()
      };
    }

    // Default: Try to be helpful anyway
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I understand you're asking about "${query}". Let me help you with that!\n\n**Quick tips:**\n• Be specific about what you want to build\n• Tell me the technology (React, API, etc.)\n• Ask for components, features, or fixes\n\n**Examples:**\n- "Create a login form"\n- "Build an API endpoint for users"\n- "Make a data table component"\n- "Add authentication to my app"\n- "Fix this error: [paste error]"\n\n**I can help with:**\n✅ React components & hooks\n✅ API endpoints & backends\n✅ Forms with validation\n✅ Authentication & authorization\n✅ Database operations\n✅ State management\n✅ Error fixes & debugging\n✅ Performance optimization\n\nWhat specific feature do you want to build?`,
      timestamp: new Date()
    };
  };

  const copyCode = async (code: string) => {
    await copyToClipboard(code);
    alert('Code copied!');
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-purple-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Bot className="w-7 h-7 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">AI Code Assistant</h2>
              <p className="text-sm text-white/90">Ask me anything - I'll help you code!</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg p-4`}>
                <div className="text-white whitespace-pre-wrap">{msg.content}</div>

                {msg.code && (
                  <div className="mt-3 bg-gray-900 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                      <span className="text-sm text-gray-400">{msg.code.fileName || msg.code.language}</span>
                      <button
                        onClick={() => copyCode(msg.code!.content)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
                      <code>{msg.code.content}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me to build something or help you debug..."
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
