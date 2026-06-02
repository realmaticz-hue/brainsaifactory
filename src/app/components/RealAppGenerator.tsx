// Real App Generator - Creates actual functional applications
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';

export interface RealAppConfig {
  name: string;
  description: string;
  type: string;
  features: string[];
  pages: string[];
  hasAuth: boolean;
  hasDatabase: boolean;
  hasAPI: boolean;
}

export interface GeneratedAppFiles {
  [filename: string]: string;
}

export class RealAppGenerator {

  static generateCompleteApp(config: RealAppConfig): GeneratedAppFiles {
    const files: GeneratedAppFiles = {};

    // Generate main App.tsx with routing
    files['App.tsx'] = this.generateAppTsx(config);

    // Generate routes configuration
    files['routes.ts'] = this.generateRoutes(config);

    // Generate all page components
    config.pages.forEach(page => {
      files[`pages/${page}.tsx`] = this.generatePageComponent(page, config);
    });

    // Generate reusable components
    files['components/Header.tsx'] = this.generateHeader(config);
    files['components/Footer.tsx'] = this.generateFooter(config);
    files['components/Navigation.tsx'] = this.generateNavigation(config);
    files['components/Card.tsx'] = this.generateCard();
    files['components/Button.tsx'] = this.generateButton();
    files['components/Input.tsx'] = this.generateInput();
    files['components/Modal.tsx'] = this.generateModal();
    files['components/Loading.tsx'] = this.generateLoading();

    // Generate authentication if needed
    if (config.hasAuth) {
      files['components/LoginForm.tsx'] = this.generateLoginForm(config);
      files['components/SignupForm.tsx'] = this.generateSignupForm(config);
      files['utils/auth.ts'] = this.generateAuthUtils();
    }

    // Generate API integration if needed
    if (config.hasAPI) {
      files['utils/api.ts'] = this.generateAPIUtils(config);
      files['hooks/useAPI.ts'] = this.generateAPIHooks(config);
    }

    // Generate database integration if needed
    if (config.hasDatabase) {
      files['utils/database.ts'] = this.generateDatabaseUtils(config);
      files['hooks/useData.ts'] = this.generateDataHooks(config);
    }

    // Generate styles
    files['styles/globals.css'] = this.generateGlobalStyles();

    // Generate package.json
    files['package.json'] = this.generatePackageJson(config);

    // Generate README
    files['README.md'] = this.generateReadme(config);

    return files;
  }

  static generateAppTsx(config: RealAppConfig): string {
    return `import { RouterProvider } from 'react-router';
import { router } from './routes';
import './styles/globals.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
`;
  }

  static generateRoutes(config: RealAppConfig): string {
    const imports = config.pages.map(page =>
      `import ${page} from './pages/${page}';`
    ).join('\n');

    const routes = config.pages.map((page, index) => {
      if (index === 0) {
        return `      { index: true, Component: ${page} }`;
      }
      const path = page.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
      return `      { path: '${path}', Component: ${page} }`;
    }).join(',\n');

    return `import { createBrowserRouter } from 'react-router';
${imports}
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
${routes},
      { path: '*', Component: NotFound }
    ]
  }
]);
`;
  }

  static generatePageComponent(pageName: string, config: RealAppConfig): string {
    const hasAPI = config.hasAPI;
    const hasDatabase = config.hasDatabase;

    let imports = `import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Card from './Card';
import Button from './Button';
import Loading from './Loading';
`;

    if (hasAPI) {
      imports += `import { useAPI } from '../hooks/useAPI';\n`;
    }

    if (hasDatabase) {
      imports += `import { useData } from '../hooks/useData';\n`;
    }

    let componentBody = `export default function ${pageName}() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
`;

    if (hasAPI) {
      componentBody += `  const { fetchData } = useAPI();\n`;
    }

    if (hasDatabase) {
      componentBody += `  const { getData } = useData();\n`;
    }

    componentBody += `
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
`;

    if (hasAPI || hasDatabase) {
      componentBody += `      const result = await ${hasAPI ? 'fetchData' : 'getData'}('${pageName.toLowerCase()}');
      setData(result || []);
`;
    } else {
      componentBody += `      // Simulate data loading
      await new Promise(resolve => setTimeout(resolve, 500));
      setData([
        { id: 1, title: 'Sample Item 1', description: 'This is a sample item' },
        { id: 2, title: 'Sample Item 2', description: 'Another sample item' },
        { id: 3, title: 'Sample Item 3', description: 'Yet another item' }
      ]);
`;
    }

    componentBody += `    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">${pageName}</h1>
          <p className="text-gray-600">Welcome to the ${pageName} page</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(item => (
            <Card key={item.id}>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <Button onClick={() => console.log('Clicked:', item.id)}>
                View Details
              </Button>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
`;

    return imports + '\n' + componentBody;
  }

  static generateHeader(config: RealAppConfig): string {
    return `import { Link } from 'react-router';
import Navigation from './Navigation';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            ${config.name}
          </Link>
          <Navigation />
        </div>
      </div>
    </header>
  );
}
`;
  }

  static generateFooter(config: RealAppConfig): string {
    return `export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">${config.name}</h3>
            <p className="text-gray-400">${config.description}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white">Home</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white">About</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-gray-400">Built with Figma Make</p>
            <p className="text-gray-400 mt-2">&copy; {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
`;
  }

  static generateNavigation(config: RealAppConfig): string {
    const navItems = config.pages.map((page, index) => {
      const path = index === 0 ? '/' : `/${page.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}`;
      return `          <Link 
            to="${path}" 
            className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            ${page}
          </Link>`;
    }).join('\n');

    return `import { Link } from 'react-router';

export default function Navigation() {
  return (
    <nav className="flex items-center gap-4">
${navItems}
${config.hasAuth ? `          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Login
          </Link>` : ''}
    </nav>
  );
}
`;
  }

  static generateCard(): string {
    return `import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={\`bg-white rounded-lg shadow-md p-6 \${className}\`}>
      {children}
    </div>
  );
}
`;
  }

  static generateButton(): string {
    return `import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = '' 
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`\${baseClasses} \${variantClasses[variant]} \${className}\`}
    >
      {children}
    </button>
  );
}
`;
  }

  static generateInput(): string {
    return `interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function Input({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  error 
}: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={\`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent \${
          error ? 'border-red-500' : 'border-gray-300'
        }\`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
`;
  }

  static generateModal(): string {
    return `import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isopen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isopen, onClose, title, children }: ModalProps) {
  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
`;
  }

  static generateLoading(): string {
    return `export default function Loading() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
`;
  }

  static generateLoginForm(config: RealAppConfig): string {
    return `import { useState } from 'react';
import { useNavigate } from 'react-router';
import Input from './Input';
import Button from './Button';
import { login } from '../utils/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={setEmail}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={setPassword}
      />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
`;
  }

  static generateSignupForm(config: RealAppConfig): string {
    return `import { useState } from 'react';
import { useNavigate } from 'react-router';
import Input from './Input';
import Button from './Button';
import { signup } from '../utils/auth';

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <Input
        label="Name"
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={setName}
      />
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={setEmail}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={setPassword}
      />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account...' : 'Sign Up'}
      </Button>
    </form>
  );
}
`;
  }

  static generateAuthUtils(): string {
    return `import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

const supabase = createClient(
  \`https://\${projectId}.supabase.co\`,
  publicAnonKey
);

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signup(email: string, password: string, name: string) {
  const response = await serverFetch('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session?.user || null;
}
`;
  }

  static generateAPIUtils(config: RealAppConfig): string {
    return `import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = \`https://\${projectId}.supabase.co/functions/v1/make-server-7d87310d\`;

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${publicAnonKey}\`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export async function get(endpoint: string) {
  return apiCall(endpoint, { method: 'GET' });
}

export async function post(endpoint: string, data: any) {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function put(endpoint: string, data: any) {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function del(endpoint: string) {
  return apiCall(endpoint, { method: 'DELETE' });
}
`;
  }

  static generateAPIHooks(config: RealAppConfig): string {
    return `import { useState } from 'react';
import * as api from '../utils/api';

export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (endpoint: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get(\`/\${endpoint}\`);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createData = async (endpoint: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.post(\`/\${endpoint}\`, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (endpoint: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.put(\`/\${endpoint}\`, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async (endpoint: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.del(\`/\${endpoint}\`);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchData,
    createData,
    updateData,
    deleteData
  };
}
`;
  }

  static generateDatabaseUtils(config: RealAppConfig): string {
    return `import * as kv from '../supabase/functions/server/kv_store';

export async function saveData(key: string, value: any) {
  await kv.set(key, value);
}

export async function loadData(key: string) {
  return await kv.get(key);
}

export async function deleteData(key: string) {
  await kv.del(key);
}

export async function loadMultipleData(keys: string[]) {
  return await kv.mget(keys);
}

export async function saveMultipleData(data: Record<string, any>) {
  await kv.mset(data);
}

export async function loadDataByPrefix(prefix: string) {
  return await kv.getByPrefix(prefix);
}
`;
  }

  static generateDataHooks(config: RealAppConfig): string {
    return `import { useState } from 'react';
import * as db from '../utils/database';

export function useData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getData = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.loadData(key);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setData = async (key: string, value: any) => {
    try {
      setLoading(true);
      setError(null);
      await db.saveData(key, value);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeData = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      await db.deleteData(key);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMultipleData = async (keys: string[]) => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.loadMultipleData(keys);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDataByPrefix = async (prefix: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.loadDataByPrefix(prefix);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getData,
    setData,
    removeData,
    getMultipleData,
    getDataByPrefix
  };
}
`;
  }

  static generateGlobalStyles(): string {
    return `@import "tailwindcss";

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`;
  }

  static generatePackageJson(config: RealAppConfig): string {
    return JSON.stringify({
      name: config.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: config.description,
      private: true,
      dependencies: {
        'react': '^19.0.0',
        'react-dom': '^19.0.0',
        'react-router': '^7.1.1',
        'lucide-react': '^0.469.0',
        '@supabase/supabase-js': '^2.47.10'
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        'typescript': '^5.7.2',
        'vite': '^6.0.3',
        '@vitejs/plugin-react': '^4.3.4',
        'tailwindcss': '^4.0.0'
      },
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      }
    }, null, 2);
  }

  static generateReadme(config: RealAppConfig): string {
    return `# ${config.name}

${config.description}

## Features

${config.features.map(f => `- ${f}`).join('\n')}

## Pages

${config.pages.map(p => `- ${p}`).join('\n')}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Technologies

- React 19
- React Router 7
- TypeScript
- Tailwind CSS 4
- Supabase${config.hasAuth ? '\n- Authentication' : ''}${config.hasDatabase ? '\n- Database Integration' : ''}${config.hasAPI ? '\n- API Integration' : ''}

---

Built with Figma Make - AI-Powered App Builder
`;
  }
}