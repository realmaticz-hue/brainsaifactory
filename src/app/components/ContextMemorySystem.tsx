/**
 * Context Memory System
 * Stores and retrieves project context, component history, and user preferences
 */

import { useState, useEffect } from 'react';
import { Database, Brain, Clock, User, FileCode, Sparkles } from 'lucide-react';

export interface ProjectMemory {
  projectId: string;
  name: string;
  type: string;
  stack: string[];
  components: ComponentMemory[];
  createdAt: Date;
  lastModified: Date;
}

export interface ComponentMemory {
  name: string;
  path: string;
  type: 'page' | 'component' | 'utility' | 'hook';
  dependencies: string[];
  props: string[];
  state: string[];
  history: ComponentVersion[];
}

export interface ComponentVersion {
  version: number;
  code: string;
  timestamp: Date;
  changes: string;
}

export interface UserPreference {
  userId: string;
  stylePreferences: {
    colorScheme: 'light' | 'dark' | 'auto';
    componentStyle: 'minimal' | 'modern' | 'glassmorphism' | 'neumorphism';
    spacing: 'compact' | 'comfortable' | 'spacious';
    borderRadius: 'none' | 'small' | 'medium' | 'large';
  };
  codingPreferences: {
    typescript: boolean;
    functionalComponents: boolean;
    cssFramework: 'tailwind' | 'css-modules' | 'styled-components';
    stateManagement: 'useState' | 'zustand' | 'redux';
  };
  architecturePreferences: {
    folderStructure: 'flat' | 'feature-based' | 'atomic';
    namingConvention: 'camelCase' | 'PascalCase' | 'kebab-case';
    fileExtension: '.tsx' | '.jsx';
  };
}

export interface ArchitectureMemory {
  pattern: string;
  usedIn: string[];
  effectiveness: number;
  notes: string;
}

export class ContextMemorySystem {
  private static STORAGE_KEY = 'figma-make-context-memory';

  /**
   * Save project memory to storage
   */
  static saveProjectMemory(memory: ProjectMemory): void {
    try {
      const stored = this.getAllMemories();
      const index = stored.findIndex(m => m.projectId === memory.projectId);
      
      if (index >= 0) {
        stored[index] = memory;
      } else {
        stored.push(memory);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to save project memory:', error);
    }
  }

  /**
   * Get all stored memories
   */
  static getAllMemories(): ProjectMemory[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored).map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
        lastModified: new Date(m.lastModified)
      }));
    } catch (error) {
      console.error('Failed to retrieve memories:', error);
      return [];
    }
  }

  /**
   * Get project memory by ID
   */
  static getProjectMemory(projectId: string): ProjectMemory | null {
    const memories = this.getAllMemories();
    return memories.find(m => m.projectId === projectId) || null;
  }

  /**
   * Search memories using semantic similarity (simplified)
   */
  static searchMemories(query: string): ProjectMemory[] {
    const memories = this.getAllMemories();
    const queryLower = query.toLowerCase();
    
    return memories.filter(memory => {
      const searchable = `${memory.name} ${memory.type} ${memory.stack.join(' ')}`.toLowerCase();
      return searchable.includes(queryLower);
    });
  }

  /**
   * Add component to project memory
   */
  static addComponent(projectId: string, component: ComponentMemory): void {
    const memory = this.getProjectMemory(projectId);
    if (!memory) return;

    const existingIndex = memory.components.findIndex(c => c.path === component.path);
    if (existingIndex >= 0) {
      memory.components[existingIndex] = component;
    } else {
      memory.components.push(component);
    }

    memory.lastModified = new Date();
    this.saveProjectMemory(memory);
  }

  /**
   * Get component history
   */
  static getComponentHistory(projectId: string, componentPath: string): ComponentVersion[] {
    const memory = this.getProjectMemory(projectId);
    if (!memory) return [];

    const component = memory.components.find(c => c.path === componentPath);
    return component?.history || [];
  }

  /**
   * Save user preferences
   */
  static saveUserPreferences(preferences: UserPreference): void {
    try {
      localStorage.setItem('user-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  /**
   * Get user preferences
   */
  static getUserPreferences(): UserPreference | null {
    try {
      const stored = localStorage.getItem('user-preferences');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve user preferences:', error);
      return null;
    }
  }

  /**
   * Generate context-aware suggestions
   */
  static generateSuggestions(projectId: string, currentContext: string): string[] {
    const memory = this.getProjectMemory(projectId);
    const preferences = this.getUserPreferences();
    const suggestions: string[] = [];

    if (!memory) return suggestions;

    // Based on project type
    if (memory.type === 'saas' && currentContext.includes('dashboard')) {
      suggestions.push('Add analytics chart component');
      suggestions.push('Implement user subscription status');
      suggestions.push('Create billing history table');
    }

    // Based on user preferences
    if (preferences?.stylePreferences.componentStyle === 'glassmorphism') {
      suggestions.push('Apply glassmorphism effect with backdrop-blur');
    }

    // Based on existing components
    const hasAuth = memory.components.some(c => c.name.toLowerCase().includes('auth'));
    if (!hasAuth && memory.type !== 'portfolio') {
      suggestions.push('Add authentication system');
    }

    // Based on stack
    if (memory.stack.includes('Supabase') && !memory.components.some(c => c.name.includes('Database'))) {
      suggestions.push('Create database query utilities');
    }

    return suggestions;
  }

  /**
   * Embed text for vector similarity (simplified simulation)
   */
  static embedText(text: string): number[] {
    // In production, this would use a real embedding model
    // For now, we'll create a simple hash-based vector
    const vector: number[] = new Array(128).fill(0);
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = charCode % 128;
      vector[index] += 1;
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Find similar components using vector similarity
   */
  static findSimilarComponents(projectId: string, query: string, limit = 5): ComponentMemory[] {
    const memory = this.getProjectMemory(projectId);
    if (!memory) return [];

    const queryVector = this.embedText(query);

    const similarities = memory.components.map(component => {
      const componentText = `${component.name} ${component.type} ${component.props.join(' ')}`;
      const componentVector = this.embedText(componentText);
      const similarity = this.cosineSimilarity(queryVector, componentVector);

      return { component, similarity };
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.component);
  }
}

/**
 * Context Memory System UI Component
 */
export function ContextMemorySystemUI() {
  const [memories, setMemories] = useState<ProjectMemory[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectMemory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = () => {
    const allMemories = ContextMemorySystem.getAllMemories();
    setMemories(allMemories);
  };

  const handleSearch = () => {
    const results = ContextMemorySystem.searchMemories(searchQuery);
    setMemories(results);
  };

  const selectProject = (project: ProjectMemory) => {
    setSelectedProject(project);
    const suggestions = ContextMemorySystem.generateSuggestions(project.projectId, '');
    setSuggestions(suggestions);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          Context Memory System
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search projects, components, patterns..."
            className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Project Memories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map(memory => (
          <div
            key={memory.projectId}
            onClick={() => selectProject(memory)}
            className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-750 transition-colors border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-semibold text-white">{memory.name}</h4>
                <p className="text-sm text-gray-400 capitalize">{memory.type}</p>
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {memory.stack.slice(0, 3).map(tech => (
                <span key={tech} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <FileCode className="w-4 h-4" />
                <span>{memory.components.length} components</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(memory.lastModified).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Project Details */}
      {selectedProject && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-400">Created</p>
              <p className="text-white">{new Date(selectedProject.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Last Modified</p>
              <p className="text-white">{new Date(selectedProject.lastModified).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {selectedProject.stack.map(tech => (
                <span key={tech} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Components ({selectedProject.components.length})</h4>
            <div className="space-y-2">
              {selectedProject.components.slice(0, 5).map(component => (
                <div key={component.path} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{component.name}</p>
                      <p className="text-xs text-gray-400">{component.path}</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs capitalize">
                      {component.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Context-Aware Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                AI Suggestions
              </h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
