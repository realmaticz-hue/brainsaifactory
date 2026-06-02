// =============================================================================
// SEO ANALYZER — Real-time SEO Scoring and Optimization
// =============================================================================

export interface SEOScore {
  overall: number; // 0-100
  breakdown: {
    title: number;
    description: number;
    keywords: number;
    readability: number;
    structure: number;
    links: number;
  };
}

export interface SEOIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'title' | 'description' | 'keywords' | 'readability' | 'structure' | 'links';
  message: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export interface KeywordAnalysis {
  primary: string;
  density: number; // percentage
  placement: {
    title: boolean;
    firstParagraph: boolean;
    headings: boolean;
    metaDescription: boolean;
  };
  relatedKeywords: string[];
  suggestions: string[];
}

export interface ReadabilityScore {
  score: number; // 0-100
  gradeLevel: string;
  avgSentenceLength: number;
  avgWordLength: number;
  complexWords: number;
  passiveVoice: number;
}

export interface SEOAnalysisResult {
  score: SEOScore;
  issues: SEOIssue[];
  keywords: KeywordAnalysis;
  readability: ReadabilityScore;
  recommendations: string[];
  competitors?: {
    url: string;
    score: number;
    keywords: string[];
  }[];
}

/**
 * Analyze content for SEO optimization
 */
export function analyzeSEO(
  content: string,
  seoTitle?: string,
  metaDescription?: string,
  primaryKeyword?: string,
  slug?: string
): SEOAnalysisResult {
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];

  // Title Analysis
  const titleScore = analyzeTitleSEO(seoTitle || '', primaryKeyword || '', issues);

  // Meta Description Analysis
  const descriptionScore = analyzeMetaDescription(metaDescription || '', primaryKeyword || '', issues);

  // Keyword Analysis
  const keywordAnalysis = analyzeKeywords(content, seoTitle || '', metaDescription || '', primaryKeyword || '', issues);
  const keywordScore = keywordAnalysis.density > 0 ? Math.min(100, keywordAnalysis.density * 50) : 0;

  // Readability Analysis
  const readability = analyzeReadability(content, issues);

  // Structure Analysis
  const structureScore = analyzeStructure(content, issues);

  // Links Analysis
  const linksScore = analyzeLinks(content, issues);

  // Overall Score (weighted average)
  const overall = Math.round(
    titleScore * 0.25 +
    descriptionScore * 0.2 +
    keywordScore * 0.2 +
    readability.score * 0.15 +
    structureScore * 0.1 +
    linksScore * 0.1
  );

  // Generate recommendations
  if (overall < 60) {
    recommendations.push('🚨 Critical: Your SEO score is below 60. Focus on title, keywords, and readability.');
  }
  if (titleScore < 80) {
    recommendations.push('Optimize your title: Include primary keyword and keep it under 60 characters.');
  }
  if (keywordAnalysis.density < 1) {
    recommendations.push(`Increase keyword density: "${primaryKeyword}" appears too infrequently.`);
  }
  if (readability.score < 70) {
    recommendations.push('Improve readability: Shorten sentences and use simpler words.');
  }
  if (!content.includes('##') && !content.includes('#')) {
    recommendations.push('Add headings (H2, H3) to improve structure and scannability.');
  }

  return {
    score: {
      overall,
      breakdown: {
        title: titleScore,
        description: descriptionScore,
        keywords: keywordScore,
        readability: readability.score,
        structure: structureScore,
        links: linksScore,
      },
    },
    issues,
    keywords: keywordAnalysis,
    readability,
    recommendations,
  };
}

/**
 * Analyze title for SEO
 */
function analyzeTitleSEO(title: string, primaryKeyword: string, issues: SEOIssue[]): number {
  let score = 100;

  if (!title) {
    issues.push({
      id: 'title-missing',
      type: 'error',
      category: 'title',
      message: 'SEO title is missing',
      suggestion: 'Add a compelling title with your primary keyword',
      impact: 'high',
    });
    return 0;
  }

  if (title.length < 30) {
    issues.push({
      id: 'title-too-short',
      type: 'warning',
      category: 'title',
      message: 'Title is too short (< 30 characters)',
      suggestion: 'Expand to 50-60 characters for better visibility',
      impact: 'medium',
    });
    score -= 20;
  }

  if (title.length > 60) {
    issues.push({
      id: 'title-too-long',
      type: 'warning',
      category: 'title',
      message: 'Title is too long (> 60 characters)',
      suggestion: 'Keep it under 60 characters to avoid truncation',
      impact: 'medium',
    });
    score -= 15;
  }

  if (primaryKeyword && !title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    issues.push({
      id: 'title-no-keyword',
      type: 'error',
      category: 'title',
      message: 'Primary keyword not in title',
      suggestion: `Include "${primaryKeyword}" in your title`,
      impact: 'high',
    });
    score -= 30;
  }

  return Math.max(0, score);
}

/**
 * Analyze meta description
 */
function analyzeMetaDescription(description: string, primaryKeyword: string, issues: SEOIssue[]): number {
  let score = 100;

  if (!description) {
    issues.push({
      id: 'description-missing',
      type: 'error',
      category: 'description',
      message: 'Meta description is missing',
      suggestion: 'Add a 150-160 character description with your keyword',
      impact: 'high',
    });
    return 0;
  }

  if (description.length < 120) {
    issues.push({
      id: 'description-too-short',
      type: 'warning',
      category: 'description',
      message: 'Meta description is too short',
      suggestion: 'Expand to 150-160 characters',
      impact: 'medium',
    });
    score -= 20;
  }

  if (description.length > 160) {
    issues.push({
      id: 'description-too-long',
      type: 'warning',
      category: 'description',
      message: 'Meta description is too long',
      suggestion: 'Keep it under 160 characters',
      impact: 'low',
    });
    score -= 10;
  }

  if (primaryKeyword && !description.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    issues.push({
      id: 'description-no-keyword',
      type: 'warning',
      category: 'description',
      message: 'Primary keyword not in meta description',
      suggestion: `Include "${primaryKeyword}" naturally`,
      impact: 'medium',
    });
    score -= 25;
  }

  return Math.max(0, score);
}

/**
 * Analyze keyword usage and density
 */
function analyzeKeywords(
  content: string,
  title: string,
  description: string,
  primaryKeyword: string,
  issues: SEOIssue[]
): KeywordAnalysis {
  if (!primaryKeyword) {
    return {
      primary: '',
      density: 0,
      placement: {
        title: false,
        firstParagraph: false,
        headings: false,
        metaDescription: false,
      },
      relatedKeywords: [],
      suggestions: ['Define a primary keyword for better SEO'],
    };
  }

  const lowerContent = content.toLowerCase();
  const lowerKeyword = primaryKeyword.toLowerCase();
  const words = content.split(/\s+/).length;
  const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
  const density = (keywordCount / words) * 100;

  // Check keyword placement
  const firstParagraph = content.split('\n\n')[0] || '';
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];

  const placement = {
    title: title.toLowerCase().includes(lowerKeyword),
    firstParagraph: firstParagraph.toLowerCase().includes(lowerKeyword),
    headings: headings.some(h => h.toLowerCase().includes(lowerKeyword)),
    metaDescription: description.toLowerCase().includes(lowerKeyword),
  };

  const suggestions: string[] = [];

  if (density < 0.5) {
    issues.push({
      id: 'keyword-density-low',
      type: 'warning',
      category: 'keywords',
      message: 'Keyword density too low',
      suggestion: `Use "${primaryKeyword}" more naturally throughout content (aim for 1-2%)`,
      impact: 'high',
    });
    suggestions.push(`Increase "${primaryKeyword}" usage to 1-2% density`);
  }

  if (density > 3) {
    issues.push({
      id: 'keyword-stuffing',
      type: 'error',
      category: 'keywords',
      message: 'Keyword stuffing detected',
      suggestion: 'Reduce keyword usage to avoid penalties',
      impact: 'high',
    });
    suggestions.push('Reduce keyword density to avoid looking spammy');
  }

  if (!placement.firstParagraph) {
    suggestions.push('Include keyword in the first paragraph');
  }

  if (!placement.headings) {
    suggestions.push('Use keyword in at least one heading');
  }

  // Extract potential related keywords (simple extraction)
  const relatedKeywords = extractRelatedKeywords(content, primaryKeyword);

  return {
    primary: primaryKeyword,
    density,
    placement,
    relatedKeywords,
    suggestions,
  };
}

/**
 * Analyze readability
 */
function analyzeReadability(content: string, issues: SEOIssue[]): ReadabilityScore {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease
  const fleschScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  const readabilityScore = Math.max(0, Math.min(100, fleschScore));

  // Complex words (3+ syllables)
  const complexWords = words.filter(w => countSyllables(w) >= 3).length;
  const complexWordPercentage = (complexWords / words.length) * 100;

  // Passive voice detection (simple heuristic)
  const passiveIndicators = content.match(/\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi) || [];
  const passiveVoice = (passiveIndicators.length / sentences.length) * 100;

  // Grade level (Flesch-Kincaid)
  const gradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  const gradeLevelStr = gradeLevel < 6 ? 'Elementary' : gradeLevel < 9 ? 'Middle School' : gradeLevel < 13 ? 'High School' : 'College';

  if (avgSentenceLength > 25) {
    issues.push({
      id: 'sentences-too-long',
      type: 'warning',
      category: 'readability',
      message: 'Sentences are too long',
      suggestion: 'Break into shorter sentences (aim for 15-20 words)',
      impact: 'medium',
    });
  }

  if (complexWordPercentage > 15) {
    issues.push({
      id: 'complex-words',
      type: 'info',
      category: 'readability',
      message: 'High use of complex words',
      suggestion: 'Simplify language where possible',
      impact: 'low',
    });
  }

  if (passiveVoice > 20) {
    issues.push({
      id: 'passive-voice',
      type: 'info',
      category: 'readability',
      message: 'Frequent passive voice usage',
      suggestion: 'Use active voice for stronger writing',
      impact: 'low',
    });
  }

  return {
    score: readabilityScore,
    gradeLevel: gradeLevelStr,
    avgSentenceLength: Math.round(avgSentenceLength),
    avgWordLength: Math.round((content.replace(/\s+/g, '').length / words.length) * 10) / 10,
    complexWords,
    passiveVoice: Math.round(passiveVoice),
  };
}

/**
 * Analyze content structure
 */
function analyzeStructure(content: string, issues: SEOIssue[]): number {
  let score = 100;

  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  const h1s = content.match(/^#\s+.+$/gm) || [];
  const h2s = content.match(/^#{2}\s+.+$/gm) || [];
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const words = content.split(/\s+/).length;

  if (h1s.length === 0) {
    issues.push({
      id: 'no-h1',
      type: 'error',
      category: 'structure',
      message: 'No H1 heading found',
      suggestion: 'Add a main H1 heading',
      impact: 'high',
    });
    score -= 30;
  }

  if (h1s.length > 1) {
    issues.push({
      id: 'multiple-h1',
      type: 'warning',
      category: 'structure',
      message: 'Multiple H1 headings',
      suggestion: 'Use only one H1 heading',
      impact: 'medium',
    });
    score -= 15;
  }

  if (h2s.length === 0 && words > 300) {
    issues.push({
      id: 'no-subheadings',
      type: 'warning',
      category: 'structure',
      message: 'No subheadings (H2)',
      suggestion: 'Add H2 headings to break up content',
      impact: 'medium',
    });
    score -= 20;
  }

  if (paragraphs.some(p => p.split(/\s+/).length > 150)) {
    issues.push({
      id: 'long-paragraphs',
      type: 'info',
      category: 'structure',
      message: 'Some paragraphs are very long',
      suggestion: 'Break into smaller paragraphs for readability',
      impact: 'low',
    });
    score -= 10;
  }

  return Math.max(0, score);
}

/**
 * Analyze internal/external links
 */
function analyzeLinks(content: string, issues: SEOIssue[]): number {
  let score = 100;

  const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  const httpLinks = markdownLinks.filter(link => link.includes('http'));
  const internalLinks = markdownLinks.length - httpLinks.length;

  if (markdownLinks.length === 0) {
    issues.push({
      id: 'no-links',
      type: 'info',
      category: 'links',
      message: 'No links found',
      suggestion: 'Add relevant internal and external links',
      impact: 'low',
    });
    score -= 20;
  }

  if (httpLinks.length === 0 && markdownLinks.length > 0) {
    issues.push({
      id: 'no-external-links',
      type: 'info',
      category: 'links',
      message: 'No external links',
      suggestion: 'Link to authoritative sources',
      impact: 'low',
    });
    score -= 10;
  }

  return Math.max(0, score);
}

/**
 * Count syllables in a word (simple approximation)
 */
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

  // Adjust for silent 'e'
  if (word.endsWith('e')) count--;

  return Math.max(1, count);
}

/**
 * Extract related keywords (simple extraction based on frequency)
 */
function extractRelatedKeywords(content: string, primaryKeyword: string): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4); // Only words > 4 chars

  const stopWords = new Set(['about', 'above', 'after', 'again', 'against', 'would', 'could', 'should', 'there', 'their', 'which', 'while', 'where']);

  const frequency = new Map<string, number>();
  words.forEach(word => {
    if (!stopWords.has(word) && word !== primaryKeyword.toLowerCase()) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
