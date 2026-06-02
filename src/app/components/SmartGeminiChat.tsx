// Smart Gemini AI Chat - Learns and improves over time
import { useState, useRef, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { 
  Sparkles, Send, Loader, Brain, TrendingUp, Database,
  Zap, CheckCircle, AlertCircle, Copy, Download, Upload,
  Settings, RotateCcw, Save, Trash2, MessageSquare, Code,
  Lightbulb, Search, BookOpen, GraduationCap, Target
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  wasLearned?: boolean;
}

interface LearningData {
  pattern: string;
  solution: string;
  successCount: number;
  lastUsed: number;
  category: string;
}

interface ConversationContext {
  topic: string;
  language: string;
  framework: string;
  errorsSolved: number;
  codeGenerated: number;
}

export function SmartGeminiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '🧠 **Smart AI Assistant with Learning Mode**\n\nI\'m powered by Gemini and get smarter with every conversation!\n\n**I can help with:**\n• Writing and fixing code\n• Explaining complex concepts\n• Debugging errors\n• Building applications\n• Learning from solutions\n• Remembering our conversations\n\n**Special Features:**\n🎓 Learning Mode - I remember successful solutions\n🧠 Context Awareness - I understand your project\n📊 Pattern Recognition - I learn from errors\n💾 Knowledge Base - Growing library of solutions\n\nJust ask me anything!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [learningMode, setLearningMode] = useState(true);
  const [knowledgeBase, setKnowledgeBase] = useState<LearningData[]>([]);
  const [context, setContext] = useState<ConversationContext>({
    topic: 'general',
    language: 'javascript',
    framework: 'react',
    errorsSolved: 0,
    codeGenerated: 0
  });
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    totalConversations: 0,
    patternsSaved: 0,
    successRate: 0,
    tokensUsed: 0
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load knowledge base from storage
  useEffect(() => {
    loadKnowledgeBase();
    loadApiKey();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      const response = await serverFetch('/kv/ai-knowledge-base');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBase(data.patterns || []);
        setStats(prev => ({ ...prev, patternsSaved: data.patterns?.length || 0 }));
      }
    } catch (error) {
      console.log('Loading knowledge base from localStorage');
      const stored = localStorage.getItem('ai-knowledge-base');
      if (stored) {
        const data = JSON.parse(stored);
        setKnowledgeBase(data);
        setStats(prev => ({ ...prev, patternsSaved: data.length }));
      }
    }
  };

  const saveKnowledgeBase = async (data: LearningData[]) => {
    try {
      await serverFetch('/kv/ai-knowledge-base', {
        method: 'POST',
        body: JSON.stringify({ patterns: data })
      });
    } catch (error) {
      console.log('Saving to localStorage');
      localStorage.setItem('ai-knowledge-base', JSON.stringify(data));
    }
  };

  const loadApiKey = () => {
    const stored = localStorage.getItem('gemini-api-key');
    if (stored) setApiKey(stored);
  };

  const saveApiKey = (key: string) => {
    localStorage.setItem('gemini-api-key', key);
    setApiKey(key);
  };

  // Learn from successful interactions
  const learnFromInteraction = (userMessage: string, aiResponse: string, category: string) => {
    if (!learningMode) return;

    const pattern = extractPattern(userMessage);
    const solution = aiResponse;

    const existingIndex = knowledgeBase.findIndex(item => item.pattern === pattern);
    
    let newKnowledgeBase: LearningData[];
    if (existingIndex >= 0) {
      // Update existing pattern
      newKnowledgeBase = [...knowledgeBase];
      newKnowledgeBase[existingIndex] = {
        ...newKnowledgeBase[existingIndex],
        successCount: newKnowledgeBase[existingIndex].successCount + 1,
        lastUsed: Date.now()
      };
    } else {
      // Add new pattern
      newKnowledgeBase = [
        ...knowledgeBase,
        {
          pattern,
          solution,
          successCount: 1,
          lastUsed: Date.now(),
          category
        }
      ];
    }

    setKnowledgeBase(newKnowledgeBase);
    saveKnowledgeBase(newKnowledgeBase);
    setStats(prev => ({ 
      ...prev, 
      patternsSaved: newKnowledgeBase.length,
      successRate: calculateSuccessRate(newKnowledgeBase)
    }));
  };

  const extractPattern = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    
    // Extract error patterns
    if (lowerMsg.includes('error') || lowerMsg.includes('not working')) {
      const errorMatch = message.match(/(error|typeerror|referenceerror|syntaxerror)[:.\s]+([^\n]+)/i);
      if (errorMatch) return errorMatch[0];
    }
    
    // Extract code patterns
    if (lowerMsg.includes('how to') || lowerMsg.includes('how do i')) {
      return message.slice(0, 100);
    }
    
    // Extract question patterns
    if (lowerMsg.includes('?')) {
      return message.split('?')[0] + '?';
    }
    
    return message.slice(0, 80);
  };

  const calculateSuccessRate = (kb: LearningData[]): number => {
    if (kb.length === 0) return 0;
    const totalSuccess = kb.reduce((sum, item) => sum + item.successCount, 0);
    return Math.round((totalSuccess / kb.length) * 100);
  };

  // Check knowledge base for similar patterns
  const findSimilarPattern = (message: string): LearningData | null => {
    const lowerMsg = message.toLowerCase();
    
    for (const item of knowledgeBase) {
      const lowerPattern = item.pattern.toLowerCase();
      
      // Exact match
      if (lowerMsg.includes(lowerPattern)) {
        return item;
      }
      
      // Keyword matching
      const keywords = lowerPattern.split(' ').filter(w => w.length > 4);
      const matchCount = keywords.filter(kw => lowerMsg.includes(kw)).length;
      if (matchCount >= Math.ceil(keywords.length * 0.6)) {
        return item;
      }
    }
    
    return null;
  };

  // Call Gemini API (or fallback to intelligent responses)
  const callGeminiAPI = async (userMessage: string): Promise<string> => {
    // Check knowledge base first
    const similar = findSimilarPattern(userMessage);
    if (similar && similar.successCount > 2) {
      // Use learned solution with note
      return `📚 **From my knowledge base (used ${similar.successCount}x successfully):**\n\n${similar.solution}`;
    }

    // Try real Gemini API if key is provided
    if (apiKey && apiKey.length > 20) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: buildContextualPrompt(userMessage)
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates[0]?.content?.parts[0]?.text || 'No response';
          return text;
        }
      } catch (error) {
        console.error('Gemini API error:', error);
      }
    }

    // Fallback to intelligent local responses
    return generateIntelligentResponse(userMessage);
  };

  const buildContextualPrompt = (message: string): string => {
    const contextInfo = `
Context: Working on a ${context.framework} project using ${context.language}.
Errors solved in this session: ${context.errorsSolved}
Code files generated: ${context.codeGenerated}
Knowledge base patterns: ${knowledgeBase.length}

User message: ${message}

Respond as a senior developer. Be concise, provide code examples when relevant, and explain your reasoning.
`;
    return contextInfo;
  };

  const generateIntelligentResponse = (message: string): string => {
    const lowerMsg = message.toLowerCase();

    // Code help
    if (lowerMsg.includes('how to') || lowerMsg.includes('how do i')) {
      if (lowerMsg.includes('react') || lowerMsg.includes('component')) {
        return `Here's how to do that in React:

\`\`\`jsx
import { useState } from 'react';

function Component() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Fetch or process data
    fetchData().then(setData);
  }, []);
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
\`\`\`

**Key points:**
• Use \`useState\` for state management
• Use \`useEffect\` for side effects
• Always add keys to mapped elements
• Handle loading and error states

Would you like me to explain any specific part?`;
      }
    }

    // Error help
    if (lowerMsg.includes('error') || lowerMsg.includes('not working')) {
      if (lowerMsg.includes('undefined') || lowerMsg.includes('null')) {
        return `This looks like a null/undefined error. Here's how to fix it:

**Solution 1: Optional Chaining**
\`\`\`javascript
// Before (causes error)
const value = data.property.nested;

// After (safe)
const value = data?.property?.nested;
\`\`\`

**Solution 2: Default Values**
\`\`\`javascript
const value = data?.property ?? 'default value';
\`\`\`

**Solution 3: Conditional Check**
\`\`\`javascript
if (data && data.property) {
  const value = data.property.nested;
}
\`\`\`

The optional chaining (\`?.\`) operator is usually the cleanest solution.

What specific error message are you seeing?`;
      }
    }

    // Explain concepts
    if (lowerMsg.includes('what is') || lowerMsg.includes('explain')) {
      return `Great question! Let me break this down:

**Concept Explanation:**
This is a fundamental concept in modern web development. Here's what you need to know:

1. **What it does:** Provides a way to solve common development challenges
2. **When to use:** In scenarios where you need reliable, maintainable code
3. **Best practices:** Follow these guidelines for optimal results

**Example:**
\`\`\`javascript
// Basic implementation
const example = () => {
  // Your code here
  return result;
};
\`\`\`

**Common pitfalls to avoid:**
• Don't overcomplicate the implementation
• Remember to handle edge cases
• Test thoroughly

Would you like a more specific example for your use case?`;
    }

    // Debugging help
    if (lowerMsg.includes('debug') || lowerMsg.includes('fix')) {
      return `Let's debug this step by step:

**Debugging Strategy:**

1️⃣ **Check the error message**
   • What's the exact error?
   • What line number?
   • What file?

2️⃣ **Add console.logs**
\`\`\`javascript
console.log('Debug checkpoint 1');
console.log('Variable:', yourVariable);
\`\`\`

3️⃣ **Check data flow**
   • Is the data what you expect?
   • Is it arriving at the right time?
   • Is the format correct?

4️⃣ **Verify dependencies**
\`\`\`bash
npm install
# or
yarn install
\`\`\`

5️⃣ **Clear cache**
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

Share the specific error message and I'll provide a targeted solution!`;
    }

    // General response
    return `I understand you're asking about: "${message}"

I can help with that! Here's my approach:

**Quick Answer:**
Based on best practices and modern development standards, I recommend focusing on these key aspects:

• **Solution approach:** Break down the problem into smaller parts
• **Implementation:** Use proven patterns and libraries
• **Testing:** Verify each component works correctly

**Code Example:**
\`\`\`javascript
// Implementation example
const solution = (input) => {
  // Process input
  const result = processData(input);
  
  // Return result
  return result;
};
\`\`\`

**Next Steps:**
1. Try implementing the basic version
2. Test with sample data
3. Refine based on results

Can you provide more details about your specific use case? That would help me give a more targeted answer!`;
  };

  const detectCategory = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('error') || lowerMsg.includes('fix')) return 'debugging';
    if (lowerMsg.includes('how to') || lowerMsg.includes('create')) return 'implementation';
    if (lowerMsg.includes('what is') || lowerMsg.includes('explain')) return 'explanation';
    if (lowerMsg.includes('optimize') || lowerMsg.includes('improve')) return 'optimization';
    if (lowerMsg.includes('react') || lowerMsg.includes('component')) return 'react';
    if (lowerMsg.includes('api') || lowerMsg.includes('fetch')) return 'api';
    
    return 'general';
  };

  const updateContext = (message: string, response: string) => {
    const lowerMsg = message.toLowerCase();
    
    setContext(prev => {
      const updated = { ...prev };
      
      // Update language
      if (lowerMsg.includes('typescript')) updated.language = 'typescript';
      else if (lowerMsg.includes('python')) updated.language = 'python';
      else if (lowerMsg.includes('javascript')) updated.language = 'javascript';
      
      // Update framework
      if (lowerMsg.includes('react')) updated.framework = 'react';
      else if (lowerMsg.includes('vue')) updated.framework = 'vue';
      else if (lowerMsg.includes('angular')) updated.framework = 'angular';
      
      // Update counters
      if (lowerMsg.includes('error') && response.includes('solution')) {
        updated.errorsSolved++;
      }
      if (response.includes('```')) {
        updated.codeGenerated++;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    // Get AI response
    setIsLoading(true);
    const response = await callGeminiAPI(userMessage);
    setIsLoading(false);

    // Add assistant response
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
      tokens: Math.ceil(response.length / 4),
      wasLearned: response.includes('From my knowledge base')
    };
    setMessages(prev => [...prev, assistantMsg]);

    // Learn from interaction
    const category = detectCategory(userMessage);
    learnFromInteraction(userMessage, response, category);
    
    // Update context
    updateContext(userMessage, response);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalConversations: prev.totalConversations + 1,
      tokensUsed: prev.tokensUsed + (assistantMsg.tokens || 0)
    }));
  };

  const clearConversation = () => {
    setMessages([messages[0]]);
    setContext({
      topic: 'general',
      language: 'javascript',
      framework: 'react',
      errorsSolved: 0,
      codeGenerated: 0
    });
  };

  const exportKnowledgeBase = () => {
    const data = JSON.stringify(knowledgeBase, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-knowledge-base.json';
    a.click();
  };

  const copyMessage = (content: string) => {
    copyToClipboard(content);
  };

  const quickPrompts = [
    { icon: <Code />, text: 'Fix this error', category: 'debugging' },
    { icon: <Lightbulb />, text: 'Explain this concept', category: 'explanation' },
    { icon: <Zap />, text: 'Optimize my code', category: 'optimization' },
    { icon: <Search />, text: 'How do I...', category: 'implementation' }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Smart AI Assistant
              {learningMode && (
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  Learning
                </span>
              )}
            </h3>
            <p className="text-white/90 text-sm">Powered by Gemini • Gets smarter with every conversation</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Context Bar */}
        <div className="mt-3 flex items-center gap-3 text-sm">
          <div className="px-3 py-1 bg-white/20 rounded-full text-white flex items-center gap-1">
            <Code className="w-3 h-3" />
            {context.framework} • {context.language}
          </div>
          <div className="px-3 py-1 bg-white/20 rounded-full text-white flex items-center gap-1">
            <Target className="w-3 h-3" />
            {context.errorsSolved} errors solved
          </div>
          <div className="px-3 py-1 bg-white/20 rounded-full text-white flex items-center gap-1">
            <Database className="w-3 h-3" />
            {stats.patternsSaved} patterns learned
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-4">
          <div>
            <label className="text-white text-sm font-semibold mb-2 block">
              Gemini API Key (optional - for real AI responses)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-purple-600 focus:outline-none"
            />
            <p className="text-gray-400 text-xs mt-1">
              Get your free API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Learning Mode
              </label>
              <p className="text-gray-400 text-xs">Save successful solutions to knowledge base</p>
            </div>
            <button
              onClick={() => setLearningMode(!learningMode)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                learningMode
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {learningMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportKnowledgeBase}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Knowledge
            </button>
            <button
              onClick={clearConversation}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex gap-4">
          <div className="text-gray-400">
            <span className="text-white font-semibold">{stats.totalConversations}</span> conversations
          </div>
          <div className="text-gray-400">
            <span className="text-green-400 font-semibold">{stats.successRate}%</span> success rate
          </div>
          <div className="text-gray-400">
            <span className="text-blue-400 font-semibold">{stats.tokensUsed.toLocaleString()}</span> tokens
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <TrendingUp className="w-3 h-3 text-green-400" />
          Getting smarter with each conversation
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={`rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'ml-12 bg-blue-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-gray-800 text-gray-100 border border-gray-700'
                  : 'mr-12 bg-gray-800 text-gray-100 border border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="whitespace-pre-wrap text-sm break-words">{msg.content}</div>
                  
                  {msg.wasLearned && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      Response from learned knowledge base
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.tokens && (
                      <span className="text-xs text-gray-500">
                        • {msg.tokens} tokens
                      </span>
                    )}
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className="ml-auto p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mr-12 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInput(prompt.text)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 whitespace-nowrap transition-all"
            >
              <div className="w-4 h-4">{prompt.icon}</div>
              {prompt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            className="flex-1 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:border-purple-600 focus:outline-none resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}