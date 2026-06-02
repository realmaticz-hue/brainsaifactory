// =============================================================================
// GRAMMAR & STYLE CHECKER — LanguageTool Integration + Local Analysis
// =============================================================================

export interface GrammarIssue {
  id: string;
  message: string;
  shortMessage: string;
  replacements: string[];
  offset: number;
  length: number;
  context: {
    text: string;
    offset: number;
    length: number;
  };
  rule: {
    id: string;
    description: string;
    issueType: 'misspelling' | 'grammar' | 'style' | 'typography' | 'uncategorized';
    category: string;
  };
  type: 'error' | 'warning' | 'suggestion';
}

export interface StyleAnalysis {
  score: number; // 0-100
  issues: {
    passiveVoice: number;
    adverbs: number;
    complexWords: number;
    longSentences: number;
    repeatWords: number;
  };
  suggestions: string[];
  hemingwayGrade: number;
  toneConsistency: number;
}

export interface GrammarCheckResult {
  issues: GrammarIssue[];
  styleAnalysis: StyleAnalysis;
  correctedText?: string;
  stats: {
    totalIssues: number;
    errors: number;
    warnings: number;
    suggestions: number;
  };
}

/**
 * Check grammar using LanguageTool API
 */
export async function checkGrammarWithLanguageTool(
  text: string,
  language: string = 'en-US'
): Promise<GrammarIssue[]> {
  try {
    // Use public LanguageTool API
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        language,
        enabledOnly: 'false',
      }),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const data = await response.json();

    return data.matches.map((match: any, idx: number) => ({
      id: `lt-${idx}`,
      message: match.message,
      shortMessage: match.shortMessage || match.message,
      replacements: match.replacements?.map((r: any) => r.value).slice(0, 3) || [],
      offset: match.offset,
      length: match.length,
      context: {
        text: match.context.text,
        offset: match.context.offset,
        length: match.context.length,
      },
      rule: {
        id: match.rule.id,
        description: match.rule.description,
        issueType: match.rule.issueType || 'uncategorized',
        category: match.rule.category.id,
      },
      type: match.rule.issueType === 'misspelling' ? 'error' :
            match.rule.category.id === 'STYLE' ? 'suggestion' : 'warning',
    }));
  } catch (error) {
    console.error('LanguageTool API error:', error);
    return [];
  }
}

/**
 * Local grammar check (fallback when API is unavailable)
 */
export function checkGrammarLocal(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];

  // Common spelling mistakes
  const commonMisspellings: Record<string, string> = {
    'teh': 'the',
    'recieve': 'receive',
    'occured': 'occurred',
    'seperate': 'separate',
    'definately': 'definitely',
    'accomodate': 'accommodate',
    'wich': 'which',
    'untill': 'until',
    'thier': 'their',
    'occassion': 'occasion',
  };

  Object.entries(commonMisspellings).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: `spell-${issues.length}`,
        message: `Possible spelling mistake found.`,
        shortMessage: 'Spelling',
        replacements: [correct],
        offset: match.index,
        length: wrong.length,
        context: {
          text: text.substring(Math.max(0, match.index - 20), match.index + wrong.length + 20),
          offset: 20,
          length: wrong.length,
        },
        rule: {
          id: 'SPELLING',
          description: 'Spelling mistake',
          issueType: 'misspelling',
          category: 'TYPOS',
        },
        type: 'error',
      });
    }
  });

  // Double spaces
  const doubleSpaceRegex = /  +/g;
  let match;
  while ((match = doubleSpaceRegex.exec(text)) !== null) {
    issues.push({
      id: `space-${issues.length}`,
      message: 'Multiple consecutive spaces.',
      shortMessage: 'Extra space',
      replacements: [' '],
      offset: match.index,
      length: match[0].length,
      context: {
        text: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20),
        offset: 20,
        length: match[0].length,
      },
      rule: {
        id: 'DOUBLE_SPACE',
        description: 'Multiple spaces',
        issueType: 'typography',
        category: 'WHITESPACE',
      },
      type: 'warning',
    });
  }

  // Missing capital letter at start of sentence
  const sentenceStartRegex = /([.!?]\s+)([a-z])/g;
  while ((match = sentenceStartRegex.exec(text)) !== null) {
    const lowerChar = match[2];
    const upperChar = lowerChar.toUpperCase();

    issues.push({
      id: `cap-${issues.length}`,
      message: 'Sentences should start with a capital letter.',
      shortMessage: 'Capitalization',
      replacements: [upperChar],
      offset: match.index + match[1].length,
      length: 1,
      context: {
        text: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
        offset: 10 + match[1].length,
        length: 1,
      },
      rule: {
        id: 'UPPERCASE_SENTENCE_START',
        description: 'Sentence start capitalization',
        issueType: 'grammar',
        category: 'CASING',
      },
      type: 'warning',
    });
  }

  return issues;
}

/**
 * Analyze writing style (Hemingway-inspired)
 */
export function analyzeStyle(text: string): StyleAnalysis {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  // Count issues
  const passiveVoice = countPassiveVoice(text);
  const adverbs = countAdverbs(words);
  const complexWords = countComplexWords(words);
  const longSentences = countLongSentences(sentences);
  const repeatWords = countRepeatedWords(words);

  // Calculate Hemingway grade
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const avgSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0) / Math.max(words.length, 1);
  const hemingwayGrade = Math.round(4.71 * avgSyllables + 0.5 * avgSentenceLength - 21.43);

  // Generate suggestions
  const suggestions: string[] = [];

  if (passiveVoice > sentences.length * 0.2) {
    suggestions.push('🎯 Reduce passive voice - Use active voice for stronger writing');
  }
  if (adverbs > words.length * 0.05) {
    suggestions.push('✂️ Cut adverbs - Show, don\'t tell with stronger verbs');
  }
  if (complexWords > words.length * 0.1) {
    suggestions.push('📖 Simplify vocabulary - Use simpler words when possible');
  }
  if (longSentences > sentences.length * 0.3) {
    suggestions.push('✏️ Shorten sentences - Break long sentences into shorter ones');
  }
  if (repeatWords > 10) {
    suggestions.push('🔄 Reduce repetition - Find synonyms for repeated words');
  }

  // Tone consistency (simple heuristic based on variation)
  const toneConsistency = 100 - Math.min(50, (repeatWords * 2) + (passiveVoice / sentences.length * 100));

  // Overall style score
  const score = Math.max(0, Math.min(100,
    100 -
    (passiveVoice / sentences.length * 100) -
    (adverbs / words.length * 200) -
    (complexWords / words.length * 100) -
    (longSentences / sentences.length * 100) -
    (repeatWords * 2)
  ));

  return {
    score: Math.round(score),
    issues: {
      passiveVoice,
      adverbs,
      complexWords,
      longSentences,
      repeatWords,
    },
    suggestions,
    hemingwayGrade: Math.max(0, hemingwayGrade),
    toneConsistency: Math.round(toneConsistency),
  };
}

/**
 * Comprehensive grammar and style check
 */
export async function checkGrammarAndStyle(
  text: string,
  useAPI: boolean = true
): Promise<GrammarCheckResult> {
  // Get grammar issues
  let issues: GrammarIssue[] = [];

  if (useAPI) {
    try {
      issues = await checkGrammarWithLanguageTool(text);
    } catch (error) {
      console.warn('LanguageTool API unavailable, using local check');
      issues = checkGrammarLocal(text);
    }
  } else {
    issues = checkGrammarLocal(text);
  }

  // Get style analysis
  const styleAnalysis = analyzeStyle(text);

  // Calculate stats
  const stats = {
    totalIssues: issues.length,
    errors: issues.filter(i => i.type === 'error').length,
    warnings: issues.filter(i => i.type === 'warning').length,
    suggestions: issues.filter(i => i.type === 'suggestion').length,
  };

  // Generate corrected text (apply first replacement for each issue)
  let correctedText = text;
  const sortedIssues = [...issues].sort((a, b) => b.offset - a.offset); // Apply from end to start

  for (const issue of sortedIssues) {
    if (issue.replacements.length > 0) {
      correctedText =
        correctedText.substring(0, issue.offset) +
        issue.replacements[0] +
        correctedText.substring(issue.offset + issue.length);
    }
  }

  return {
    issues,
    styleAnalysis,
    correctedText: correctedText !== text ? correctedText : undefined,
    stats,
  };
}

// Helper functions

function countPassiveVoice(text: string): number {
  const passiveIndicators = text.match(/\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi);
  return passiveIndicators ? passiveIndicators.length : 0;
}

function countAdverbs(words: string[]): number {
  return words.filter(word => word.toLowerCase().endsWith('ly')).length;
}

function countComplexWords(words: string[]): number {
  return words.filter(word => countSyllables(word) >= 3).length;
}

function countLongSentences(sentences: string[]): number {
  return sentences.filter(s => s.split(/\s+/).length > 20).length;
}

function countRepeatedWords(words: string[]): number {
  const wordCounts = new Map<string, number>();
  const normalized = words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 4);

  normalized.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  let repeats = 0;
  wordCounts.forEach(count => {
    if (count > 3) repeats += count - 3;
  });

  return repeats;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  if (word.endsWith('e')) count--;
  return Math.max(1, count);
}
