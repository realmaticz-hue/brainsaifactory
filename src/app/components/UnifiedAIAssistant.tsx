// Unified AI Assistant - App Builder + Error Troubleshooter + Smart Chat + Ultra Generator
import { useState } from 'react';
import { Sparkles, Bug, Code, X, Brain, Wand2 } from 'lucide-react';
import { PromptToAppAI } from './PromptToAppAI';
import { AIErrorTroubleshooter } from './AIErrorTroubleshooter';
import { SmartGeminiChat } from './SmartGeminiChat';
import { UltraAppGenerator } from './UltraAppGenerator';

type Mode = 'app-builder' | 'error-troubleshooter' | 'smart-chat' | 'ultra-generator';

export function UnifiedAIAssistant() {
  const [mode, setMode] = useState<Mode>('ultra-generator');

  return (
    <div className="h-full flex flex-col">
      {/* Mode Switcher */}
      <div className="bg-gray-800 border-b border-gray-700 flex">
        <button
          onClick={() => setMode('app-builder')}
          className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all ${
            mode === 'app-builder'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          Prompt-to-App Builder
        </button>
        <button
          onClick={() => setMode('error-troubleshooter')}
          className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all ${
            mode === 'error-troubleshooter'
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Bug className="w-5 h-5" />
          Error Troubleshooter
        </button>
        <button
          onClick={() => setMode('smart-chat')}
          className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all ${
            mode === 'smart-chat'
              ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Brain className="w-5 h-5" />
          Smart Chat
        </button>
        <button
          onClick={() => setMode('ultra-generator')}
          className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all ${
            mode === 'ultra-generator'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Wand2 className="w-5 h-5" />
          Ultra Generator
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'app-builder' && <PromptToAppAI />}
        {mode === 'error-troubleshooter' && <AIErrorTroubleshooter />}
        {mode === 'smart-chat' && <SmartGeminiChat />}
        {mode === 'ultra-generator' && <UltraAppGenerator />}
      </div>
    </div>
  );
}