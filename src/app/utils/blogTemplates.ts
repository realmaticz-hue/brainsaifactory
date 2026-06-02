// =============================================================================
// BLOG TEMPLATES LIBRARY — Pre-Built Content Structures
// =============================================================================

export interface BlogTemplate {
  id: string;
  name: string;
  description: string;
  category: 'howto' | 'listicle' | 'review' | 'comparison' | 'tutorial' | 'guide' | 'news' | 'opinion';
  icon: string;
  duration: 7 | 30;
  structure: string;
  seoTitleTemplate: string;
  metaDescriptionTemplate: string;
  keywords: string[];
  tags: string[];
}

export const BLOG_TEMPLATES: BlogTemplate[] = [
  // How-To Templates
  {
    id: 'howto-basic',
    name: 'How-To Guide',
    description: 'Step-by-step instructions for solving a problem',
    category: 'howto',
    icon: '📝',
    duration: 30,
    structure: `# How to [Action]

## Introduction
[Brief overview of what readers will learn and why it matters]

## Prerequisites
- [Required tool/knowledge 1]
- [Required tool/knowledge 2]

## Step 1: [First Step]
[Detailed instructions with explanation]

## Step 2: [Second Step]
[Detailed instructions with explanation]

## Step 3: [Third Step]
[Detailed instructions with explanation]

## Common Mistakes to Avoid
- [Mistake 1]: [How to avoid it]
- [Mistake 2]: [How to avoid it]

## Conclusion
[Summary and next steps]`,
    seoTitleTemplate: 'How to [Action]: Complete Guide for [Year]',
    metaDescriptionTemplate: 'Learn how to [action] with this step-by-step guide. Includes tips, common mistakes, and expert advice.',
    keywords: ['how to', 'guide', 'tutorial', 'step-by-step'],
    tags: ['Tutorial', 'Guide', 'How-To'],
  },

  // Listicle Templates
  {
    id: 'listicle-tips',
    name: '10 Tips Listicle',
    description: 'Numbered list of actionable tips',
    category: 'listicle',
    icon: '📋',
    duration: 30,
    structure: `# [Number] [Topic] Tips That Actually Work

## Introduction
[Hook explaining why these tips matter]

### 1. [Tip Title]
[Explanation of the tip with concrete examples]

### 2. [Tip Title]
[Explanation with actionable advice]

### 3. [Tip Title]
[Clear instructions and benefits]

### 4. [Tip Title]
[Practical application]

### 5. [Tip Title]
[How to implement]

### 6. [Tip Title]
[Results you can expect]

### 7. [Tip Title]
[Common pitfalls to avoid]

### 8. [Tip Title]
[Expert recommendation]

### 9. [Tip Title]
[Advanced technique]

### 10. [Tip Title]
[Final power tip]

## Bonus Tip
[Extra valuable insight]

## Conclusion
[Summary of key takeaways and call to action]`,
    seoTitleTemplate: '[Number] [Topic] Tips That Will [Benefit]',
    metaDescriptionTemplate: 'Discover [number] proven [topic] tips. Learn actionable strategies that deliver real results.',
    keywords: ['tips', 'tricks', 'advice', 'best practices'],
    tags: ['Listicle', 'Tips', 'Best Practices'],
  },

  // Product Review Template
  {
    id: 'review-product',
    name: 'Product Review',
    description: 'In-depth product evaluation',
    category: 'review',
    icon: '⭐',
    duration: 30,
    structure: `# [Product Name] Review: Is It Worth It?

## Quick Verdict
[1-2 sentence summary of your recommendation]

⭐ Rating: [X]/5 stars

## What is [Product Name]?
[Brief overview of the product]

## Key Features
- **[Feature 1]**: [Description]
- **[Feature 2]**: [Description]
- **[Feature 3]**: [Description]

## Pros
✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

## Cons
❌ [Drawback 1]
❌ [Drawback 2]
❌ [Drawback 3]

## Performance
[Detailed testing and performance analysis]

## Value for Money
[Price analysis and ROI discussion]

## Who Should Buy This?
[Ideal customer profile]

## Final Verdict
[Detailed recommendation with alternatives]`,
    seoTitleTemplate: '[Product Name] Review: Worth the Hype? (Honest Analysis)',
    metaDescriptionTemplate: 'Our honest [product name] review covers features, pros, cons, and value. Find out if it\'s right for you.',
    keywords: ['review', 'analysis', 'pros and cons', 'worth it'],
    tags: ['Review', 'Product', 'Analysis'],
  },

  // Comparison Template
  {
    id: 'comparison-vs',
    name: 'Product Comparison',
    description: 'Side-by-side product comparison',
    category: 'comparison',
    icon: '⚖️',
    duration: 30,
    structure: `# [Product A] vs [Product B]: Which is Better?

## Quick Summary
| Feature | [Product A] | [Product B] |
|---------|-------------|-------------|
| Price | $X | $Y |
| Best For | [Use case] | [Use case] |
| Rating | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## Overview

### [Product A]
[Brief description and main selling points]

### [Product B]
[Brief description and main selling points]

## Feature Comparison

### Design & Build Quality
**[Product A]**: [Description]
**[Product B]**: [Description]
**Winner**: [Product A/B] - [Reason]

### Performance
**[Product A]**: [Description]
**[Product B]**: [Description]
**Winner**: [Product A/B] - [Reason]

### Price & Value
**[Product A]**: [Description]
**[Product B]**: [Description]
**Winner**: [Product A/B] - [Reason]

## The Verdict
[Final recommendation based on different use cases]

## Choose [Product A] if:
- [Scenario 1]
- [Scenario 2]

## Choose [Product B] if:
- [Scenario 1]
- [Scenario 2]`,
    seoTitleTemplate: '[Product A] vs [Product B]: Which Should You Choose?',
    metaDescriptionTemplate: 'Compare [product A] and [product B]. See which one wins in performance, features, and value.',
    keywords: ['vs', 'comparison', 'which is better', 'differences'],
    tags: ['Comparison', 'Review', 'Versus'],
  },

  // Quick Listicle (7 sec)
  {
    id: 'quick-listicle',
    name: 'Quick Tips (7-sec)',
    description: 'Short, punchy list for quick reads',
    category: 'listicle',
    icon: '⚡',
    duration: 7,
    structure: `# [Number] Quick [Topic] Tips

1. **[Tip]** - [One sentence explanation]
2. **[Tip]** - [One sentence explanation]
3. **[Tip]** - [One sentence explanation]
4. **[Tip]** - [One sentence explanation]
5. **[Tip]** - [One sentence explanation]

💡 Pro Tip: [Bonus insight]`,
    seoTitleTemplate: '[Number] Quick [Topic] Tips You Need to Know',
    metaDescriptionTemplate: 'Quick [topic] tips that work. Save time with these proven strategies.',
    keywords: ['quick tips', 'fast', 'simple', 'easy'],
    tags: ['Quick Tips', 'Fast Read'],
  },

  // Tutorial Template
  {
    id: 'tutorial-complete',
    name: 'Complete Tutorial',
    description: 'Comprehensive educational guide',
    category: 'tutorial',
    icon: '🎓',
    duration: 30,
    structure: `# The Complete [Topic] Tutorial

## Table of Contents
1. [Section 1]
2. [Section 2]
3. [Section 3]

## What You'll Learn
- [Learning outcome 1]
- [Learning outcome 2]
- [Learning outcome 3]

## Prerequisites
[What readers need before starting]

## Part 1: [Fundamentals]
### Understanding [Concept]
[Explanation with examples]

### Key Terminology
- **[Term 1]**: [Definition]
- **[Term 2]**: [Definition]

## Part 2: [Practical Application]
### Exercise 1: [Task]
[Step-by-step instructions]

### Exercise 2: [Task]
[Step-by-step instructions]

## Part 3: [Advanced Techniques]
[More complex concepts and applications]

## Troubleshooting
[Common issues and solutions]

## Next Steps
[What to learn next]

## Resources
[Additional learning materials]`,
    seoTitleTemplate: 'The Complete [Topic] Tutorial: [Beginner to Advanced]',
    metaDescriptionTemplate: 'Master [topic] with our complete tutorial. From basics to advanced techniques, everything you need.',
    keywords: ['tutorial', 'learn', 'complete guide', 'beginner'],
    tags: ['Tutorial', 'Education', 'Complete Guide'],
  },

  // Ultimate Guide Template
  {
    id: 'guide-ultimate',
    name: 'Ultimate Guide',
    description: 'Comprehensive resource on a topic',
    category: 'guide',
    icon: '📖',
    duration: 30,
    structure: `# The Ultimate Guide to [Topic]

## Introduction
[Why this guide is the definitive resource]

## Chapter 1: [Foundation]
[Core concepts and principles]

## Chapter 2: [Getting Started]
[Practical first steps]

## Chapter 3: [Intermediate Strategies]
[More advanced techniques]

## Chapter 4: [Advanced Tips]
[Expert-level insights]

## Chapter 5: [Tools & Resources]
[Recommended tools and where to find them]

## Chapter 6: [Case Studies]
[Real-world examples and success stories]

## Chapter 7: [Common Mistakes]
[What to avoid and why]

## Chapter 8: [Future Trends]
[What's coming next]

## Conclusion
[Key takeaways and action items]

## Frequently Asked Questions
**Q: [Question]**
A: [Answer]`,
    seoTitleTemplate: 'The Ultimate Guide to [Topic]: Everything You Need to Know',
    metaDescriptionTemplate: 'Everything you need to know about [topic]. Comprehensive guide with examples, tips, and expert advice.',
    keywords: ['ultimate guide', 'complete resource', 'everything', 'comprehensive'],
    tags: ['Guide', 'Ultimate', 'Complete'],
  },

  // News/Update Template
  {
    id: 'news-update',
    name: 'News & Updates',
    description: 'Breaking news or industry updates',
    category: 'news',
    icon: '📰',
    duration: 7,
    structure: `# [Topic]: [What Happened]

## What's New
[Summary of the news/update]

## Why It Matters
[Impact and significance]

## Key Details
- [Detail 1]
- [Detail 2]
- [Detail 3]

## What This Means for You
[Practical implications]

## What's Next
[Future developments to watch]`,
    seoTitleTemplate: '[Topic]: [What Happened] - Latest Updates',
    metaDescriptionTemplate: 'Breaking: [Topic update]. Find out what happened and what it means for you.',
    keywords: ['news', 'update', 'latest', 'breaking'],
    tags: ['News', 'Updates', 'Latest'],
  },

  // Opinion/Thought Leadership
  {
    id: 'opinion-piece',
    name: 'Opinion Piece',
    description: 'Thought leadership and commentary',
    category: 'opinion',
    icon: '💭',
    duration: 30,
    structure: `# Why [Opinion/Argument]

## My Take
[Clear statement of your position]

## The Problem
[What's wrong with the current situation]

## Why Most People Get This Wrong
[Common misconceptions]

## Here's What I Believe
[Your argument with supporting evidence]

### Evidence 1
[Data or example supporting your view]

### Evidence 2
[Additional support]

### Evidence 3
[More backing]

## The Counter-Argument
[Acknowledging the other side]

## Why I Still Stand By My Position
[Rebuttal]

## What This Means Going Forward
[Implications and predictions]

## My Challenge to You
[Call to action]`,
    seoTitleTemplate: 'Why [Opinion]: A Bold Take on [Topic]',
    metaDescriptionTemplate: 'Here\'s why [opinion]. A thought-provoking perspective on [topic] with evidence and analysis.',
    keywords: ['opinion', 'perspective', 'why', 'argument'],
    tags: ['Opinion', 'Commentary', 'Analysis'],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: BlogTemplate['category']): BlogTemplate[] {
  return BLOG_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): BlogTemplate | undefined {
  return BLOG_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): Array<{ id: BlogTemplate['category']; name: string; icon: string }> {
  return [
    { id: 'howto', name: 'How-To Guides', icon: '📝' },
    { id: 'listicle', name: 'Listicles', icon: '📋' },
    { id: 'review', name: 'Reviews', icon: '⭐' },
    { id: 'comparison', name: 'Comparisons', icon: '⚖️' },
    { id: 'tutorial', name: 'Tutorials', icon: '🎓' },
    { id: 'guide', name: 'Complete Guides', icon: '📖' },
    { id: 'news', name: 'News & Updates', icon: '📰' },
    { id: 'opinion', name: 'Opinion Pieces', icon: '💭' },
  ];
}
