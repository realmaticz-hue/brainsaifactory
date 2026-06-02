// =============================================================================
// CONTENT REPURPOSER — Auto-Convert Blog Posts to Multiple Formats
// =============================================================================

export type ContentFormat =
  | 'twitter-thread'
  | 'linkedin-post'
  | 'tiktok-script'
  | 'youtube-script'
  | 'instagram-caption'
  | 'email-newsletter'
  | 'podcast-script'
  | 'infographic-outline';

export interface RepurposedContent {
  format: ContentFormat;
  content: string;
  metadata?: {
    wordCount?: number;
    estimatedDuration?: number; // seconds
    hashtags?: string[];
    callToAction?: string;
  };
}

/**
 * Repurpose blog post to multiple formats
 */
export function repurposeContent(
  title: string,
  content: string,
  format: ContentFormat,
  keywords?: string[]
): RepurposedContent {
  switch (format) {
    case 'twitter-thread':
      return convertToTwitterThread(title, content, keywords);
    case 'linkedin-post':
      return convertToLinkedInPost(title, content, keywords);
    case 'tiktok-script':
      return convertToTikTokScript(title, content);
    case 'youtube-script':
      return convertToYouTubeScript(title, content);
    case 'instagram-caption':
      return convertToInstagramCaption(title, content, keywords);
    case 'email-newsletter':
      return convertToEmailNewsletter(title, content);
    case 'podcast-script':
      return convertToPodcastScript(title, content);
    case 'infographic-outline':
      return convertToInfographicOutline(title, content);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Convert to Twitter/X Thread
 */
function convertToTwitterThread(
  title: string,
  content: string,
  keywords?: string[]
): RepurposedContent {
  // Extract key points
  const points = extractKeyPoints(content, 8);

  // Build thread
  const tweets: string[] = [];

  // Tweet 1: Hook
  tweets.push(`🧵 ${title}\n\nHere's what you need to know 👇`);

  // Main tweets (max 280 chars each)
  points.forEach((point, idx) => {
    let tweet = `${idx + 1}/ ${point}`;

    // Ensure under 280 characters
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...';
    }

    tweets.push(tweet);
  });

  // Final tweet: CTA
  const hashtags = keywords?.slice(0, 3).map(k => `#${k.replace(/\s+/g, '')}`).join(' ') || '';
  tweets.push(`That's a wrap! 🎬\n\nIf you found this helpful:\n• Like this tweet\n• Retweet for others\n• Follow me for more\n\n${hashtags}`);

  return {
    format: 'twitter-thread',
    content: tweets.join('\n\n---TWEET BREAK---\n\n'),
    metadata: {
      wordCount: tweets.join(' ').split(/\s+/).length,
      hashtags: keywords?.slice(0, 3),
    },
  };
}

/**
 * Convert to LinkedIn Post
 */
function convertToLinkedInPost(
  title: string,
  content: string,
  keywords?: string[]
): RepurposedContent {
  const points = extractKeyPoints(content, 5);

  const linkedInPost = `${title}

${points.map((p, i) => `${i + 1}. ${p}`).join('\n\n')}

💡 Key Takeaway:
${points[0]}

What's your experience with this? Drop a comment below! 👇

${keywords?.slice(0, 5).map(k => `#${k.replace(/\s+/g, '')}`).join(' ') || ''}`;

  return {
    format: 'linkedin-post',
    content: linkedInPost,
    metadata: {
      wordCount: linkedInPost.split(/\s+/).length,
      hashtags: keywords?.slice(0, 5),
      callToAction: 'Drop a comment below!',
    },
  };
}

/**
 * Convert to TikTok Script
 */
function convertToTikTokScript(title: string, content: string): RepurposedContent {
  const hook = extractFirstSentence(content);
  const points = extractKeyPoints(content, 3);

  const script = `🎬 TikTok Script (60 seconds)

[HOOK - First 3 seconds]
"${hook}"
[Show shock/surprise facial expression]

[MAIN CONTENT - 45 seconds]

${points.map((p, i) => `[Point ${i + 1} - Show on screen]
"${p}"
[Gesture/visual to emphasize]
`).join('\n')}

[CALL TO ACTION - Final 12 seconds]
"If you want to learn more, check the link in my bio!"
[Point to link]

"Follow for more tips like this!"
[Thumbs up]

---

Visual Suggestions:
✓ Use captions for all spoken words
✓ Quick cuts every 3-4 seconds
✓ Trending audio in background
✓ On-screen text for key points
✓ Energetic delivery`;

  return {
    format: 'tiktok-script',
    content: script,
    metadata: {
      estimatedDuration: 60,
      callToAction: 'Check link in bio!',
    },
  };
}

/**
 * Convert to YouTube Script
 */
function convertToYouTubeScript(title: string, content: string): RepurposedContent {
  const points = extractKeyPoints(content, 6);

  const script = `📹 YouTube Video Script

TITLE: ${title}

[INTRO - 0:00-0:30]
"Hey everyone! In today's video, we're talking about ${title.toLowerCase()}.

By the end of this video, you'll know exactly [benefit statement].

Let's dive in!"

[MAIN CONTENT - 0:30-8:00]

${points.map((p, i) => `[Section ${i + 1} - ${Math.round(30 + i * 90 / 60)}:${String(30 + i * 90 % 60).padStart(2, '0')}]
"${p}"

[Pause for emphasis]
[Show relevant B-roll or graphics]
`).join('\n')}

[RECAP - 8:00-9:00]
"So to recap:
${points.slice(0, 3).map((p, i) => `${i + 1}. ${p.substring(0, 100)}...`).join('\n')}
"

[OUTRO - 9:00-9:30]
"If you found this helpful, make sure to:
• Hit that like button
• Subscribe for more content
• Drop a comment with your thoughts

Thanks for watching, and I'll see you in the next one!"

[END SCREEN with related videos]

---

Production Notes:
✓ Add lower thirds with key stats
✓ Use chapter markers for each section
✓ Include timestamps in description
✓ Add relevant tags and SEO keywords`;

  return {
    format: 'youtube-script',
    content: script,
    metadata: {
      estimatedDuration: 570, // 9:30
    },
  };
}

/**
 * Convert to Instagram Caption
 */
function convertToInstagramCaption(
  title: string,
  content: string,
  keywords?: string[]
): RepurposedContent {
  const points = extractKeyPoints(content, 4);

  const caption = `${title} ✨

${points.map((p, i) => `${i + 1}. ${p.substring(0, 100)}${p.length > 100 ? '...' : ''}`).join('\n\n')}

💡 Save this for later!

Tag someone who needs to see this 👇

---

${keywords?.slice(0, 10).map(k => `#${k.replace(/\s+/g, '')}`).join(' ') || ''}

#education #tips #motivation #success`;

  return {
    format: 'instagram-caption',
    content: caption,
    metadata: {
      wordCount: caption.split(/\s+/).length,
      hashtags: [...(keywords?.slice(0, 10) || []), 'education', 'tips', 'motivation', 'success'],
      callToAction: 'Tag someone who needs to see this!',
    },
  };
}

/**
 * Convert to Email Newsletter
 */
function convertToEmailNewsletter(title: string, content: string): RepurposedContent {
  const points = extractKeyPoints(content, 6);

  const newsletter = `Subject: ${title}

Hi there! 👋

${extractFirstSentence(content)}

Here's what we're covering today:

${points.map((p, i) => `${i + 1}. ${p}`).join('\n\n')}

---

💡 Key Takeaway:

${points[0]}

---

Want to learn more? Reply to this email with your thoughts or questions!

Best regards,
[Your Name]

P.S. If you found this valuable, forward it to a friend who might benefit!

---

[Unsubscribe] | [Update Preferences]`;

  return {
    format: 'email-newsletter',
    content: newsletter,
    metadata: {
      wordCount: newsletter.split(/\s+/).length,
      callToAction: 'Reply with your thoughts!',
    },
  };
}

/**
 * Convert to Podcast Script
 */
function convertToPodcastScript(title: string, content: string): RepurposedContent {
  const points = extractKeyPoints(content, 5);

  const script = `🎙️ Podcast Episode Script

EPISODE TITLE: ${title}

[INTRO MUSIC - 0:00-0:15]

[COLD OPEN - 0:15-1:00]
"${extractFirstSentence(content)}

That's exactly what we're diving into in today's episode. Stick around."

[INTRO MUSIC FADE]

[INTRO - 1:00-2:00]
"Hey everyone, welcome back to [Podcast Name]! I'm [Your Name], and today we're talking about ${title.toLowerCase()}.

If you're new here, make sure to subscribe so you don't miss future episodes.

Alright, let's get into it."

[MAIN CONTENT - 2:00-18:00]

${points.map((p, i) => {
  const timestamp = 2 + (i * 3.2);
  const minutes = Math.floor(timestamp);
  const seconds = Math.round((timestamp % 1) * 60);
  return `[${minutes}:${String(seconds).padStart(2, '0')}]
"${p}"

[Elaborate and tell a story]
[Share an example]
[Pause for effect]
`;
}).join('\n')}

[RECAP - 18:00-19:30]
"Let's quickly recap what we covered:
${points.slice(0, 3).map((p, i) => `${i + 1}. ${p.substring(0, 80)}...`).join('\n')}
"

[OUTRO - 19:30-20:30]
"That's all for today's episode! If you enjoyed this, please:
• Leave a 5-star review
• Share with a friend
• Connect with me on [social media]

Thanks for tuning in, and I'll catch you in the next episode!"

[OUTRO MUSIC - 20:30-20:45]

---

Show Notes:
✓ Add timestamps for each section
✓ Include relevant links in description
✓ Prepare audiogram clips for social media`;

  return {
    format: 'podcast-script',
    content: script,
    metadata: {
      estimatedDuration: 1245, // ~20:45
    },
  };
}

/**
 * Convert to Infographic Outline
 */
function convertToInfographicOutline(title: string, content: string): RepurposedContent {
  const points = extractKeyPoints(content, 5);
  const stats = extractStats(content);

  const outline = `📊 Infographic Outline

TITLE: ${title}

LAYOUT: Vertical (optimized for Pinterest, Instagram)

---

SECTION 1: Header
• Eye-catching title: "${title}"
• Subtitle/tagline
• Your logo/branding

SECTION 2: Hook/Problem
• Opening stat or question
${stats.length > 0 ? `• "${stats[0]}"` : ''}
• Visual: Icon or illustration

SECTION 3: Main Points
${points.map((p, i) => `
${i + 1}. ${p.substring(0, 60)}
   • Icon: [suggest relevant icon]
   • Visual element: [chart/graph/illustration]
`).join('\n')}

SECTION 4: Key Stat/Highlight
${stats.length > 1 ? `• BIG NUMBER: "${stats[1]}"` : '• Main takeaway'}
• Circle or box highlight

SECTION 5: Call-to-Action
• "Want to learn more?"
• Website URL or QR code
• Social media handles

---

DESIGN NOTES:
✓ Color scheme: Brand colors
✓ Typography: Clear hierarchy (large title, readable body)
✓ White space: Don't overcrowd
✓ Icons: Consistent style throughout
✓ Size: 1080x1920px (vertical) or 1200x628px (horizontal)

TOOLS TO USE:
• Canva
• Adobe Illustrator
• Figma`;

  return {
    format: 'infographic-outline',
    content: outline,
  };
}

/**
 * Extract key points from content
 */
function extractKeyPoints(content: string, maxPoints: number = 5): string[] {
  // Split by paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 20);

  // Extract first sentence from each paragraph
  const points: string[] = [];

  for (const para of paragraphs) {
    if (points.length >= maxPoints) break;

    // Get first sentence
    const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      let point = sentences[0].trim();

      // Remove markdown headers
      point = point.replace(/^#{1,6}\s+/, '');

      // Clean up
      point = point.replace(/\*\*/g, '').replace(/\*/g, '');

      if (point.length > 20 && point.length < 250) {
        points.push(point);
      }
    }
  }

  // If we don't have enough points, split content into chunks
  if (points.length < maxPoints) {
    const words = content.split(/\s+/);
    const chunkSize = Math.floor(words.length / maxPoints);

    for (let i = 0; i < maxPoints && points.length < maxPoints; i++) {
      const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ');
      const sentence = chunk.split(/[.!?]+/)[0];

      if (sentence && sentence.length > 20 && !points.includes(sentence.trim())) {
        points.push(sentence.trim());
      }
    }
  }

  return points.slice(0, maxPoints);
}

/**
 * Extract first sentence
 */
function extractFirstSentence(content: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.length > 0 ? sentences[0].trim() : content.substring(0, 200);
}

/**
 * Extract statistics from content
 */
function extractStats(content: string): string[] {
  const stats: string[] = [];

  // Look for patterns like "X%", "X in Y", numbers with context
  const patterns = [
    /(\d+%[^.!?]*)/g,
    /(\d+\s+(?:times|people|users|companies)[^.!?]*)/gi,
    /(\d+\s+out of\s+\d+[^.!?]*)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      stats.push(...matches.slice(0, 3));
    }
  });

  return stats.slice(0, 5);
}

/**
 * Batch repurpose to multiple formats
 */
export function repurposeToAllFormats(
  title: string,
  content: string,
  keywords?: string[]
): RepurposedContent[] {
  const formats: ContentFormat[] = [
    'twitter-thread',
    'linkedin-post',
    'instagram-caption',
    'email-newsletter',
  ];

  return formats.map(format => repurposeContent(title, content, format, keywords));
}
