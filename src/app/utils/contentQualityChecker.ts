// ─────────────────────────────────────────────────────────────────
// Content Quality Checker
// Runs after blog generation to detect:
//   • Duplicate consecutive words  ("the the", "is is")
//   • Repeated phrases within a post
//   • Incomplete / abruptly ending sentences
//   • Common spelling errors
//   • Missing spaces after punctuation
// ─────────────────────────────────────────────────────────────────

export type IssueType =
  | 'duplicate_word'
  | 'duplicate_phrase'
  | 'incomplete_sentence'
  | 'spelling'
  | 'spacing'
  | 'repeated_phrase';

export interface ContentIssue {
  id: string;
  type: IssueType;
  severity: 'error' | 'warning' | 'info';
  label: string;
  context: string;      // the snippet where the issue occurs
  suggestion: string;   // the auto-fix suggestion
  original: string;     // exact match to replace
  replacement: string;  // what to replace it with
}

export interface QualityReport {
  postId: string;
  score: number;          // 0–100 (100 = perfect)
  issues: ContentIssue[];
  fixedContent: string;   // content with all auto-fixes applied
}

// ─── Common misspellings ─────────────────────────────────────────
const MISSPELLINGS: Record<string, string> = {
  'teh ':        'the ',
  'adn ':        'and ',
  'hte ':        'the ',
  'ot ':         'to ',
  'fo ':         'of ',
  'thier ':      'their ',
  'recieve ':    'receive ',
  'beleive ':    'believe ',
  'experiance ': 'experience ',
  'definately ': 'definitely ',
  'seperately ': 'separately ',
  'occurance ':  'occurrence ',
  'occurence ':  'occurrence ',
  'wierd ':      'weird ',
  'freind ':     'friend ',
  'buisness ':   'business ',
  'busines ':    'business ',
  'sucessful ':  'successful ',
  'succesful ':  'successful ',
  'achive ':     'achieve ',
  'achiev ':     'achieve ',
  'enviornment': 'environment',
  'enviroment':  'environment',
  'managment ':  'management ',
  'mangement ':  'management ',
  'perfomance ': 'performance ',
  'performace ': 'performance ',
  'availble ':   'available ',
  'avaliable ':  'available ',
  'accomodate ':  'accommodate ',
  'goverment ':  'government ',
  'knowlege ':   'knowledge ',
  'oppurtunity': 'opportunity',
  'grammer ':    'grammar ',
  'calender ':   'calendar ',
  'existance ':  'existence ',
  'maintainance':'maintenance',
  'restaraunt ':  'restaurant ',
  'reccomend ':  'recommend ',
  'untill ':     'until ',
  'tommorow ':   'tomorrow ',
  'tomorow ':    'tomorrow ',
  'becuase ':    'because ',
  'beacuse ':    'because ',
  'absense ':    'absence ',
  'alot ':       'a lot ',
};

// ─── Truncation patterns (incomplete sentence signals) ───────────
const INCOMPLETE_ENDINGS = [
  / and$/, / or$/, / but$/, / with$/, / for$/, / the$/, / a$/, / an$/,
  / in$/, / on$/, / at$/, / by$/, / to$/, / of$/, / is$/, / are$/,
  / was$/, / were$/, / that$/, / which$/, / who$/, / when$/, / where$/,
  / —$/, / \.$/, / \,$/, / \;$/, / \:$/,
];

// ─── Core checker ────────────────────────────────────────────────

export function checkContentQuality(postId: string, content: string): QualityReport {
  const issues: ContentIssue[] = [];
  let fixed = content;
  let issueIndex = 0;

  const mkId = () => `issue-${postId}-${issueIndex++}`;

  // ── 1. Duplicate consecutive words ───────────────────────────
  const dupWordRx = /\b(\w+)\s+\1\b/gi;
  let m: RegExpExecArray | null;
  while ((m = dupWordRx.exec(content)) !== null) {
    const matched = m[0];
    const word    = m[1];
    issues.push({
      id: mkId(),
      type: 'duplicate_word',
      severity: 'error',
      label: `Duplicate word: "${word}"`,
      context: getContext(content, m.index, matched.length),
      suggestion: `Remove the second "${word}"`,
      original: matched,
      replacement: word,
    });
  }

  // ── 2. Repeated short phrases (3–6 word phrases appearing 2+ times) ──
  const sentences = content.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
  const phraseCount: Record<string, number> = {};
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().split(/\s+/);
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length > 12) {
          phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
        }
      }
    }
  }
  for (const [phrase, count] of Object.entries(phraseCount)) {
    if (count >= 2) {
      issues.push({
        id: mkId(),
        type: 'repeated_phrase',
        severity: 'warning',
        label: `Repeated phrase (${count}×): "${phrase}"`,
        context: phrase,
        suggestion: `Rephrase one occurrence of "${phrase}" to vary the language`,
        original: phrase,
        replacement: phrase, // no auto-replace for this
      });
    }
  }

  // ── 3. Duplicate consecutive sentences ────────────────────────
  for (let i = 0; i < sentences.length - 1; i++) {
    const a = sentences[i].toLowerCase().trim();
    const b = sentences[i + 1].toLowerCase().trim();
    if (a === b && a.length > 10) {
      issues.push({
        id: mkId(),
        type: 'duplicate_phrase',
        severity: 'error',
        label: 'Duplicate sentence detected',
        context: sentences[i].slice(0, 80) + (sentences[i].length > 80 ? '…' : ''),
        suggestion: 'Remove the duplicate sentence',
        original: sentences[i + 1],
        replacement: '',
      });
    }
  }

  // ── 4. Spelling errors ────────────────────────────────────────
  const lc = content.toLowerCase();
  for (const [typo, correct] of Object.entries(MISSPELLINGS)) {
    if (lc.includes(typo.toLowerCase())) {
      // Find case-sensitive index
      const idx = lc.indexOf(typo.toLowerCase());
      const actualTypo = content.slice(idx, idx + typo.length);
      issues.push({
        id: mkId(),
        type: 'spelling',
        severity: 'error',
        label: `Possible misspelling: "${actualTypo.trim()}"`,
        context: getContext(content, idx, typo.length),
        suggestion: `Replace with "${correct.trim()}"`,
        original: actualTypo,
        replacement: preserveCase(actualTypo, correct),
      });
    }
  }

  // ── 5. Missing space after punctuation ────────────────────────
  const spacingRx = /([.!?,;:])([A-Za-z])/g;
  while ((m = spacingRx.exec(content)) !== null) {
    const matched = m[0];
    issues.push({
      id: mkId(),
      type: 'spacing',
      severity: 'warning',
      label: `Missing space after "${m[1]}"`,
      context: getContext(content, m.index, matched.length),
      suggestion: `Add a space: "${m[1]} ${m[2]}"`,
      original: matched,
      replacement: `${m[1]} ${m[2]}`,
    });
  }

  // ── 6. Incomplete sentence at end ─────────────────────────────
  const trimmed = content.trimEnd();
  for (const rx of INCOMPLETE_ENDINGS) {
    if (rx.test(trimmed)) {
      issues.push({
        id: mkId(),
        type: 'incomplete_sentence',
        severity: 'warning',
        label: 'Post may end abruptly',
        context: trimmed.slice(-60),
        suggestion: 'Add a complete closing sentence or call to action',
        original: '',
        replacement: '',
      });
      break;
    }
  }

  // ── Apply auto-fixes (errors only, skip repeated_phrase and incomplete_sentence) ──
  const fixable = issues.filter(i =>
    i.original &&
    i.type !== 'repeated_phrase' &&
    i.type !== 'incomplete_sentence' &&
    i.replacement !== i.original
  );

  for (const issue of fixable) {
    if (issue.original) {
      fixed = fixed.replace(issue.original, issue.replacement);
    }
  }

  // ── Score: start at 100, deduct per issue ────────────────────
  const deductions = issues.reduce((acc, i) => {
    if (i.severity === 'error')   return acc + 15;
    if (i.severity === 'warning') return acc + 5;
    return acc + 2;
  }, 0);
  const score = Math.max(0, 100 - deductions);

  return { postId, score, issues, fixedContent: fixed };
}

// ─── Batch check ─────────────────────────────────────────────────
export function checkAllPosts(
  posts: { id: string; content: string }[]
): QualityReport[] {
  return posts.map(p => checkContentQuality(p.id, p.content));
}

// ─── Helpers ─────────────────────────────────────────────────────

function getContext(text: string, index: number, length: number): string {
  const start  = Math.max(0, index - 20);
  const end    = Math.min(text.length, index + length + 20);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return prefix + text.slice(start, end) + suffix;
}

function preserveCase(original: string, replacement: string): string {
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}
