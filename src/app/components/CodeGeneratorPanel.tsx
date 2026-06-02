import { useState } from 'react';
import { Sparkles, Code2, Copy, Download, Save, Trash2, FileCode, Zap, BookOpen, ArrowRightLeft } from 'lucide-react';
import {
  generateCode,
  explainCode,
  convertCode,
  saveSnippet,
  getSnippets,
  deleteSnippet,
  analyzeCode,
  detectLanguage,
  LANGUAGE_CONFIG,
  type ProgrammingLanguage,
  type CodeGenerationRequest,
  type CodeSnippet,
  type CodeExplanation,
  type CodeConversion,
} from '../utils/codeGenerator';
import { toast } from 'sonner';

type TabType = 'generate' | 'explain' | 'convert' | 'library';

export function CodeGeneratorPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('javascript');
  const [style, setStyle] = useState<'concise' | 'documented' | 'verbose'>('documented');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeTests, setIncludeTests] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeToExplain, setCodeToExplain] = useState('');
  const [explanation, setExplanation] = useState<CodeExplanation | null>(null);
  const [sourceCode, setSourceCode] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<ProgrammingLanguage>('javascript');
  const [targetLanguage, setTargetLanguage] = useState<ProgrammingLanguage>('python');
  const [conversion, setConversion] = useState<CodeConversion | null>(null);
  const [savedSnippets, setSavedSnippets] = useState<CodeSnippet[]>(getSnippets());
  const [isGenerating, setIsGenerating] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetDescription, setSnippetDescription] = useState('');
  const [snippetTags, setSnippetTags] = useState('');

  const languages = Object.keys(LANGUAGE_CONFIG) as ProgrammingLanguage[];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const request: CodeGenerationRequest = {
        prompt,
        language: selectedLanguage,
        style,
        includeComments,
        includeTests,
      };

      const code = await generateCode(request);
      setGeneratedCode(code);
      toast.success('Code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate code');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExplain = async () => {
    if (!codeToExplain.trim()) {
      toast.error('Please enter code to explain');
      return;
    }

    setIsGenerating(true);
    try {
      const detectedLang = detectLanguage(codeToExplain);
      const result = await explainCode(codeToExplain, detectedLang);
      setExplanation(result);
      toast.success('Code explained successfully!');
    } catch (error) {
      toast.error('Failed to explain code');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvert = async () => {
    if (!sourceCode.trim()) {
      toast.error('Please enter code to convert');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await convertCode(sourceCode, sourceLanguage, targetLanguage);
      setConversion(result);
      toast.success(`Converted from ${LANGUAGE_CONFIG[sourceLanguage].name} to ${LANGUAGE_CONFIG[targetLanguage].name}`);
    } catch (error) {
      toast.error('Failed to convert code');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSnippet = () => {
    if (!generatedCode.trim()) {
      toast.error('No code to save');
      return;
    }

    if (!snippetTitle.trim()) {
      toast.error('Please enter a title for the snippet');
      return;
    }

    const snippet = saveSnippet({
      title: snippetTitle,
      description: snippetDescription,
      language: selectedLanguage,
      code: generatedCode,
      tags: snippetTags.split(',').map(t => t.trim()).filter(Boolean),
      isPublic: false,
    });

    setSavedSnippets(getSnippets());
    setSnippetTitle('');
    setSnippetDescription('');
    setSnippetTags('');
    toast.success('Snippet saved!');
  };

  const handleDeleteSnippet = (snippetId: string) => {
    deleteSnippet(snippetId);
    setSavedSnippets(getSnippets());
    toast.success('Snippet deleted');
  };

  const handleLoadSnippet = (snippet: CodeSnippet) => {
    setGeneratedCode(snippet.code);
    setSelectedLanguage(snippet.language);
    setActiveTab('generate');
    toast.success('Snippet loaded');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const stats = generatedCode ? analyzeCode(generatedCode) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Code Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Generate, explain, and convert code using AI
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1 p-2">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'generate'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generate
              </button>
              <button
                onClick={() => setActiveTab('explain')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'explain'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Explain
              </button>
              <button
                onClick={() => setActiveTab('convert')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'convert'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Convert
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'library'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FileCode className="w-4 h-4" />
                Library ({savedSnippets.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'generate' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What do you want to build?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A function that validates email addresses using regex"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as ProgrammingLanguage)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_CONFIG[lang].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Style
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="concise">Concise</option>
                      <option value="documented">Documented</option>
                      <option value="verbose">Verbose</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeComments}
                      onChange={(e) => setIncludeComments(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Include comments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTests}
                      onChange={(e) => setIncludeTests(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Include tests</span>
                  </label>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate Code
                    </>
                  )}
                </button>

                {generatedCode && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Code</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(generatedCode)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => downloadCode(generatedCode, `code${LANGUAGE_CONFIG[selectedLanguage].extension}`)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{generatedCode}</code>
                    </pre>

                    {stats && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Lines</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.lines}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Characters</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.characters}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Words</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.words}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Complexity</div>
                          <div className={`text-lg font-semibold capitalize ${
                            stats.complexity === 'low' ? 'text-green-600' :
                            stats.complexity === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {stats.complexity}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Read Time</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.estimatedReadTime}s</div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Save to Library</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={snippetTitle}
                          onChange={(e) => setSnippetTitle(e.target.value)}
                          placeholder="Snippet title"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={snippetDescription}
                          onChange={(e) => setSnippetDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={snippetTags}
                          onChange={(e) => setSnippetTags(e.target.value)}
                          placeholder="Tags (comma-separated)"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <button
                          onClick={handleSaveSnippet}
                          className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          Save Snippet
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'explain' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Paste your code
                  </label>
                  <textarea
                    value={codeToExplain}
                    onChange={(e) => setCodeToExplain(e.target.value)}
                    placeholder="Paste code here to get a detailed explanation..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                    rows={12}
                  />
                </div>

                <button
                  onClick={handleExplain}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" />
                      Explain Code
                    </>
                  )}
                </button>

                {explanation && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Overview</h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{explanation.overall}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Line-by-Line Explanation</h3>
                      <div className="space-y-2">
                        {explanation.lineByLine.map((line) => (
                          <div key={line.lineNumber} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded flex items-center justify-center text-xs font-mono">
                                {line.lineNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <code className="text-xs text-gray-800 dark:text-gray-200 block mb-1">{line.code}</code>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{line.explanation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">Key Concepts</h3>
                        <ul className="space-y-1">
                          {explanation.concepts.map((concept, idx) => (
                            <li key={idx} className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full" />
                              {concept}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Improvements</h3>
                        <ul className="space-y-1">
                          {explanation.improvements.map((improvement, idx) => (
                            <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'convert' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      From
                    </label>
                    <select
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value as ProgrammingLanguage)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_CONFIG[lang].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value as ProgrammingLanguage)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_CONFIG[lang].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source Code
                  </label>
                  <textarea
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    placeholder={`Paste your ${LANGUAGE_CONFIG[sourceLanguage].name} code here...`}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                    rows={12}
                  />
                </div>

                <button
                  onClick={handleConvert}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" />
                      Convert Code
                    </>
                  )}
                </button>

                {conversion && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Converted to {LANGUAGE_CONFIG[conversion.targetLanguage].name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(conversion.convertedCode)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => downloadCode(conversion.convertedCode, `converted${LANGUAGE_CONFIG[conversion.targetLanguage].extension}`)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{conversion.convertedCode}</code>
                    </pre>

                    {conversion.notes && conversion.notes.length > 0 && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">Important Notes</h4>
                        <ul className="space-y-1">
                          {conversion.notes.map((note, idx) => (
                            <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-full mt-1.5" />
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'library' && (
              <div className="space-y-4">
                {savedSnippets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No saved snippets yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Generate code and save it to your library
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedSnippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{snippet.title}</h3>
                            {snippet.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{snippet.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLoadSnippet(snippet)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Load snippet"
                            >
                              <Code2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteSnippet(snippet.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Delete snippet"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                            {LANGUAGE_CONFIG[snippet.language].name}
                          </span>
                          <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                          {snippet.tags.length > 0 && (
                            <div className="flex gap-1">
                              {snippet.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
                          <code>{snippet.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
