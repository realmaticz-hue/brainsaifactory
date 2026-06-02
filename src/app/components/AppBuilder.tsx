import { useState, useRef, useEffect } from 'react';
import {
  X, Code, Layout, Smartphone, Monitor, Tablet, Play, Save,
  Download, Upload, Sparkles, GitBranch, FileCode, Palette,
  Settings, Layers, Eye, EyeOff, Zap, Brain, RefreshCw
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';

interface AppBuilderProps {
  isopen: boolean;
  onClose: () => void;
}

interface Component {
  id: string;
  type: 'button' | 'text' | 'image' | 'input' | 'container' | 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  children: string[];
}

interface AppProject {
  id: string;
  name: string;
  description: string;
  platform: 'ios' | 'android' | 'web' | 'all';
  components: Component[];
  code: {
    html: string;
    css: string;
    js: string;
    react: string;
  };
  lastModified: Date;
}

export function AppBuilder({ isopen, onClose }: AppBuilderProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'code' | 'preview' | 'deploy'>('design');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('My App');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [generatedCode, setGeneratedCode] = useState({
    html: '',
    css: '',
    js: '',
    react: ''
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  const deviceDimensions = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 }
  };

  const componentTemplates = [
    { type: 'button', icon: '🔘', label: 'Button' },
    { type: 'text', icon: '📝', label: 'Text' },
    { type: 'image', icon: '🖼️', label: 'Image' },
    { type: 'input', icon: '⌨️', label: 'Input' },
    { type: 'container', icon: '📦', label: 'Container' },
    { type: 'video', icon: '🎬', label: 'Video' }
  ];

  const addComponent = (type: Component['type']) => {
    const newComponent: Component = {
      id: `comp-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === 'button' ? 120 : type === 'text' ? 200 : 150,
      height: type === 'button' ? 40 : type === 'text' ? 30 : 150,
      properties: {
        text: type === 'button' ? 'Click Me' : type === 'text' ? 'Text Label' : '',
        backgroundColor: type === 'button' ? '#6366f1' : '#ffffff',
        color: type === 'button' ? '#ffffff' : '#000000',
        fontSize: 16,
        borderRadius: 8,
        padding: 12
      },
      children: []
    };
    setComponents([...components, newComponent]);
    setSelectedComponent(newComponent.id);
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Call AI to generate app design
      const response = await serverFetch('/generate-app', {
        method: 'POST',
        body: JSON.stringify({ prompt: aiPrompt, platform: device }),
      });

      if (response.ok) {
        const data = await response.json();
        setComponents(data.components || []);
        setGeneratedCode(data.code || generatedCode);
      } else {
        // Fallback: Generate basic components from prompt
        const promptLower = aiPrompt.toLowerCase();
        const newComponents: Component[] = [];

        if (promptLower.includes('button')) {
          newComponents.push({
            id: `btn-${Date.now()}`,
            type: 'button',
            x: 100,
            y: 300,
            width: 200,
            height: 50,
            properties: { text: 'Submit', backgroundColor: '#10b981', color: '#ffffff', fontSize: 18, borderRadius: 8, padding: 12 },
            children: []
          });
        }

        if (promptLower.includes('title') || promptLower.includes('heading')) {
          newComponents.push({
            id: `text-${Date.now()}`,
            type: 'text',
            x: 50,
            y: 50,
            width: 300,
            height: 40,
            properties: { text: 'Welcome', fontSize: 32, color: '#1f2937', fontWeight: 'bold' },
            children: []
          });
        }

        if (promptLower.includes('input') || promptLower.includes('form')) {
          newComponents.push({
            id: `input-${Date.now()}`,
            type: 'input',
            x: 50,
            y: 200,
            width: 300,
            height: 45,
            properties: { placeholder: 'Enter text...', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12 },
            children: []
          });
        }

        setComponents([...components, ...newComponents]);
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportCode = () => {
    // Generate React code from components
    let reactCode = `import React from 'react';\n\n`;
    reactCode += `export default function ${projectName.replace(/\s/g, '')}() {\n`;
    reactCode += `  return (\n`;
    reactCode += `    <div className="app-container" style={{ width: '100%', height: '100vh' }}>\n`;

    components.forEach(comp => {
      const style = `style={{ 
        position: 'absolute',
        left: '${comp.x}px',
        top: '${comp.y}px',
        width: '${comp.width}px',
        height: '${comp.height}px',
        backgroundColor: '${comp.properties.backgroundColor || 'transparent'}',
        color: '${comp.properties.color || '#000'}',
        fontSize: '${comp.properties.fontSize || 16}px',
        borderRadius: '${comp.properties.borderRadius || 0}px',
        padding: '${comp.properties.padding || 0}px'
      }}`;

      if (comp.type === 'button') {
        reactCode += `      <button ${style}>${comp.properties.text}</button>\n`;
      } else if (comp.type === 'text') {
        reactCode += `      <div ${style}>${comp.properties.text}</div>\n`;
      } else if (comp.type === 'input') {
        reactCode += `      <input ${style} placeholder="${comp.properties.placeholder || ''}" />\n`;
      }
    });

    reactCode += `    </div>\n`;
    reactCode += `  );\n`;
    reactCode += `}\n`;

    setGeneratedCode({ ...generatedCode, react: reactCode });

    // Download code
    const blob = new Blob([reactCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s/g, '')}.jsx`;
    a.click();
  };

  const saveProject = async () => {
    const project: AppProject = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: aiPrompt,
      platform: 'all',
      components,
      code: generatedCode,
      lastModified: new Date()
    };

    // Save to Supabase
    try {
      await serverFetch('/save-project', {
        method: 'POST',
        body: JSON.stringify(project),
      });
      alert('Project saved successfully!');
    } catch (error) {
      // Fallback to localStorage
      localStorage.setItem(`app-project-${project.id}`, JSON.stringify(project));
      alert('Project saved locally!');
    }
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code className="w-6 h-6 text-purple-400" />
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded text-lg font-bold border-none outline-none"
            />
          </div>

          <div className="flex gap-2">
            {['design', 'code', 'preview', 'deploy'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg transition-all capitalize ${activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveProject}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={exportCode}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        {activeTab === 'design' && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            {/* AI Assistant */}
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                AI Assistant
              </h3>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe your app: 'Create a login screen with email input and submit button'"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 resize-none focus:outline-none focus:border-purple-500"
                rows={4}
              />
              <button
                onClick={generateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>

            {/* Components */}
            <div>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Components
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {componentTemplates.map(template => (
                  <button
                    key={template.type}
                    onClick={() => addComponent(template.type as any)}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all"
                  >
                    <div className="text-2xl mb-1">{template.icon}</div>
                    <div className="text-xs">{template.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Properties */}
            {selectedComponent && (
              <div className="mt-6">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-400" />
                  Properties
                </h3>
                <div className="space-y-3">
                  {Object.entries(components.find(c => c.id === selectedComponent)?.properties || {}).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-gray-400 text-xs block mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={e => {
                          const updated = components.map(c => {
                            if (c.id === selectedComponent) {
                              return {
                                ...c,
                                properties: {
                                  ...c.properties,
                                  [key]: typeof value === 'number' ? parseFloat(e.target.value) : e.target.value
                                }
                              };
                            }
                            return c;
                          });
                          setComponents(updated);
                        }}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-900 overflow-auto">
          {activeTab === 'design' && (
            <div className="p-8">
              {/* Device Selector */}
              <div className="flex justify-center gap-2 mb-6">
                <button
                  onClick={() => setDevice('mobile')}
                  className={`p-2 rounded-lg ${device === 'mobile' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <Smartphone className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setDevice('tablet')}
                  className={`p-2 rounded-lg ${device === 'tablet' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <Tablet className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setDevice('desktop')}
                  className={`p-2 rounded-lg ${device === 'desktop' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <Monitor className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="p-2 rounded-lg bg-gray-700 ml-4"
                >
                  {showGrid ? <Eye className="w-5 h-5 text-white" /> : <EyeOff className="w-5 h-5 text-white" />}
                </button>
              </div>

              {/* Canvas */}
              <div className="flex justify-center">
                <div
                  ref={canvasRef}
                  style={{
                    width: deviceDimensions[device].width,
                    height: deviceDimensions[device].height,
                  }}
                  className={`bg-white rounded-lg shadow-2xl relative overflow-hidden ${showGrid ? 'bg-grid-pattern' : ''
                    }`}
                >
                  {components.map(comp => (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedComponent(comp.id)}
                      style={{
                        position: 'absolute',
                        left: comp.x,
                        top: comp.y,
                        width: comp.width,
                        height: comp.height,
                        backgroundColor: comp.properties.backgroundColor,
                        color: comp.properties.color,
                        fontSize: comp.properties.fontSize,
                        borderRadius: comp.properties.borderRadius,
                        padding: comp.properties.padding,
                        cursor: 'move',
                        border: selectedComponent === comp.id ? '2px solid #8b5cf6' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {comp.type === 'button' && comp.properties.text}
                      {comp.type === 'text' && comp.properties.text}
                      {comp.type === 'input' && <input placeholder={comp.properties.placeholder} className="w-full h-full bg-transparent border-none outline-none" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-6 h-full">
              <div className="bg-gray-800 rounded-lg p-6 h-full overflow-auto">
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm">React</button>
                  <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm">HTML</button>
                  <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm">CSS</button>
                </div>
                <pre className="text-green-400 font-mono text-sm">
                  {generatedCode.react || '// Click "Export" to generate code'}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Play className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">Live Preview</h3>
                <p className="text-gray-400">Preview your app in real-time</p>
              </div>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-white text-2xl font-bold mb-6">Deploy Your App</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
                    <div className="text-3xl mb-3">🍎</div>
                    <h3 className="text-white font-bold mb-2">iOS App Store</h3>
                    <p className="text-gray-400 text-sm">Deploy to Apple App Store</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
                    <div className="text-3xl mb-3">🤖</div>
                    <h3 className="text-white font-bold mb-2">Google Play</h3>
                    <p className="text-gray-400 text-sm">Deploy to Android Play Store</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
                    <div className="text-3xl mb-3">🌐</div>
                    <h3 className="text-white font-bold mb-2">Web App</h3>
                    <p className="text-gray-400 text-sm">Deploy as Progressive Web App</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer">
                    <div className="text-3xl mb-3">💻</div>
                    <h3 className="text-white font-bold mb-2">Desktop</h3>
                    <p className="text-gray-400 text-sm">Deploy as Electron app</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}