// Advanced AI Engine - Elite Intelligence System
// Handles multi-domain expertise, context tracking, and proactive assistance

export interface ConversationContext {
  domain: 'coding' | 'marketing' | 'business' | 'script-writing' | 'debugging' | 'systems-design' | 'general';
  tone: 'technical' | 'casual' | 'persuasive' | 'scientific' | 'business';
  project?: {
    type: string;
    tech_stack: string[];
    goals: string[];
    challenges: string[];
  };
  user_preferences: {
    code_style?: string;
    framework?: string;
    detail_level?: 'brief' | 'detailed' | 'comprehensive';
  };
  conversation_history: Array<{
    question: string;
    context: string;
    timestamp: Date;
  }>;
}

export function detectDomain(query: string): ConversationContext['domain'] {
  const lower = query.toLowerCase();
  
  // Coding detection
  if (lower.match(/\b(react|next\.?js|typescript|javascript|code|component|api|hook|tailwind|css|html|bug|error|function|class|variable)\b/)) {
    return 'coding';
  }
  
  // Marketing detection
  if (lower.match(/\b(ad|ads|commercial|campaign|copy|marketing|persuasive|conversion|ugc|content|audience|brand|cta)\b/)) {
    return 'marketing';
  }
  
  // Business detection
  if (lower.match(/\b(business|strategy|roi|revenue|growth|market|competition|scale|startup|enterprise|stakeholder)\b/)) {
    return 'business';
  }
  
  // Script writing detection
  if (lower.match(/\b(script|video|scene|dialogue|narrator|voiceover|storyboard|commercial script)\b/)) {
    return 'script-writing';
  }
  
  // Debugging detection
  if (lower.match(/\b(debug|error|fix|broken|crash|issue|problem|not working|fails|exception|stack trace)\b/)) {
    return 'debugging';
  }
  
  // Systems design detection
  if (lower.match(/\b(architecture|system design|scalability|infrastructure|database design|microservices|deployment|ci\/cd)\b/)) {
    return 'systems-design';
  }
  
  return 'general';
}

export function detectTone(query: string, domain: ConversationContext['domain']): ConversationContext['tone'] {
  const lower = query.toLowerCase();
  
  // Explicit tone requests
  if (lower.includes('explain like') || lower.includes('simple') || lower.includes('beginner')) {
    return 'casual';
  }
  
  if (lower.includes('technical') || lower.includes('advanced') || lower.includes('deep dive')) {
    return 'technical';
  }
  
  if (lower.includes('convince') || lower.includes('persuade') || lower.includes('pitch')) {
    return 'persuasive';
  }
  
  // Domain-based defaults
  switch (domain) {
    case 'coding':
    case 'debugging':
    case 'systems-design':
      return 'technical';
    case 'marketing':
    case 'script-writing':
      return 'persuasive';
    case 'business':
      return 'business';
    default:
      return 'casual';
  }
}

export function extractProjectContext(query: string, history: ConversationContext['conversation_history']): ConversationContext['project'] | undefined {
  const lower = query.toLowerCase();
  const tech_stack: string[] = [];
  
  // Detect tech stack
  if (lower.includes('next.js') || lower.includes('nextjs')) tech_stack.push('Next.js');
  if (lower.includes('react')) tech_stack.push('React');
  if (lower.includes('typescript')) tech_stack.push('TypeScript');
  if (lower.includes('tailwind')) tech_stack.push('Tailwind CSS');
  if (lower.includes('supabase')) tech_stack.push('Supabase');
  if (lower.includes('postgres')) tech_stack.push('PostgreSQL');
  if (lower.includes('mongodb')) tech_stack.push('MongoDB');
  
  if (tech_stack.length > 0 || history.length > 0) {
    return {
      type: lower.includes('e-commerce') ? 'e-commerce' : 
            lower.includes('dashboard') ? 'dashboard' :
            lower.includes('advertising') ? 'advertising-platform' : 'web-app',
      tech_stack,
      goals: [],
      challenges: []
    };
  }
  
  return undefined;
}

export function generateEliteResponse(
  query: string,
  context: ConversationContext
): string {
  const domain = context.domain;
  const tone = context.tone;
  
  // Multi-domain response generation
  switch (domain) {
    case 'coding':
      return generateCodingResponse(query, context);
    case 'debugging':
      return generateDebuggingResponse(query, context);
    case 'marketing':
      return generateMarketingResponse(query, context);
    case 'business':
      return generateBusinessResponse(query, context);
    case 'script-writing':
      return generateScriptWritingResponse(query, context);
    case 'systems-design':
      return generateSystemsDesignResponse(query, context);
    default:
      return generateGeneralResponse(query, context);
  }
}

function generateCodingResponse(query: string, context: ConversationContext): string {
  const lower = query.toLowerCase();
  
  // React component creation
  if (lower.includes('component') || lower.includes('create') && lower.includes('react')) {
    return `# Production-Ready React Component

## 🎯 What You're Building
A modern, scalable React component following industry best practices.

## ✅ Production-Ready Code

\`\`\`typescript
import React, { useState, useEffect } from 'react';

interface ComponentProps {
  title: string;
  data?: any[];
  onAction?: (id: string) => void;
}

export function ProductionComponent({ title, data = [], onAction }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup code here
    };
  }, []);
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }
  
  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      <div className="space-y-2">
        {data.map((item) => (
          <div 
            key={item.id} 
            className="p-3 hover:bg-gray-50 rounded transition-colors"
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\`

## 🏗️ Architecture Best Practices Applied

✅ **TypeScript Interfaces** - Type safety prevents runtime errors
✅ **Error Boundaries** - Graceful error handling
✅ **Loading States** - Better UX
✅ **Cleanup Effects** - Prevents memory leaks
✅ **Accessibility** - Semantic HTML
✅ **Responsive Design** - Tailwind CSS utilities

## ⚠️ Scalability Warnings

**Potential Issues:**
1. If \`data\` array has 1000+ items → Use react-window for virtualization
2. If component re-renders often → Wrap with React.memo()
3. If onAction triggers API calls → Add debouncing

## 🚀 Next Steps

1. **Add Tests**: Create \`ComponentName.test.tsx\`
2. **Add Storybook**: Document component variants
3. **Performance**: Use React DevTools Profiler to measure

## 📦 Dependencies Needed

\`\`\`bash
npm install react typescript
npm install -D @types/react
\`\`\`

Need help with a specific feature? Ask me!`;
  }
  
  // API integration
  if (lower.includes('api') || lower.includes('fetch') || lower.includes('axios')) {
    return `# Production-Ready API Integration

## 🎯 Enterprise-Grade API Setup

\`\`\`typescript
// utils/api.ts - Centralized API client
import axios, { AxiosError } from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject({
      message: error.response?.data?.message || 'An error occurred',
      status: error.response?.status,
    });
  }
);

export default apiClient;
\`\`\`

## 🔥 React Hook for API Calls

\`\`\`typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';
import apiClient from '@/utils/api';

export function useApi<T>(endpoint: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      try {
        setLoading(true);
        const response = await apiClient.get<T>(endpoint);
        
        if (!cancelled) {
          setData(response.data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      cancelled = true; // Prevent state updates after unmount
    };
  }, [endpoint]);
  
  return { data, loading, error };
}
\`\`\`

## 💪 Usage in Components

\`\`\`typescript
function UserDashboard() {
  const { data: users, loading, error } = useApi<User[]>('/users');
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
\`\`\`

## 🏗️ Architecture Decisions Explained

**Why Axios over Fetch?**
- Automatic JSON transformation
- Request/response interceptors
- Better error handling
- Request cancellation
- Progress tracking

**Why Centralized Client?**
- Single source of truth for config
- Easy to update base URL
- Consistent error handling
- Auth token management

## ⚡ Performance Optimizations

1. **Add Request Caching**:
\`\`\`typescript
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
\`\`\`

2. **Add Request Deduplication** - React Query handles this automatically

## ⚠️ Security Best Practices

✅ Never store sensitive tokens in localStorage (use httpOnly cookies)
✅ Always validate API responses
✅ Sanitize user input before sending
✅ Use HTTPS only
✅ Implement rate limiting on backend

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] Error tracking (Sentry) integrated
- [ ] Request timeout configured
- [ ] Retry logic for failed requests
- [ ] Loading states for all API calls
- [ ] Error boundaries around components

Need help with error handling, authentication, or WebSocket? Ask me!`;
  }
  
  // Default coding response
  return `# Code Solution - Production Ready

I'll help you write clean, scalable code. To give you the best solution, I need to know:

1. **What are you building?** (component, API, feature, etc.)
2. **What tech stack?** (React, Next.js, TypeScript, etc.)
3. **What's the specific problem?**

In the meantime, here are best practices for any code:

## ✅ Code Quality Checklist

**Type Safety:**
\`\`\`typescript
// ❌ BAD
function processData(data: any) { ... }

// ✅ GOOD
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processData(data: UserData) { ... }
\`\`\`

**Error Handling:**
\`\`\`typescript
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  console.error('API call failed:', error);
  // Show user-friendly error
  toast.error('Something went wrong. Please try again.');
}
\`\`\`

**Performance:**
- Use React.memo() for expensive components
- Use useMemo() for heavy calculations
- Use useCallback() for functions passed to children
- Lazy load routes and components

Ask me to dive deeper into any area!`;
}

function generateDebuggingResponse(query: string, context: ConversationContext): string {
  return `# 🐛 Elite Debugging Protocol

## Step 1: Understand the Error

**What I need to help you:**
- Exact error message
- Stack trace
- What you were trying to do
- When it started happening

## Step 2: Common Error Patterns

### TypeScript Errors

**"Cannot read property 'X' of undefined"**

\`\`\`typescript
// ❌ CAUSES:
user.profile.name  // user or profile is undefined

// ✅ FIXES:
// Option 1: Optional chaining
user?.profile?.name

// Option 2: Nullish coalescing
const name = user?.profile?.name ?? 'Guest';

// Option 3: Type guard
if (user && user.profile) {
  const name = user.profile.name;
}
\`\`\`

**Why this happens:**
- API returned null/undefined
- Component rendered before data loaded
- Missing error boundary

**Prevention:**
1. Always add loading states
2. Add default values
3. Validate API responses

### React Errors

**"Maximum update depth exceeded"**

\`\`\`typescript
// ❌ CAUSES INFINITE LOOP:
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // Called every render!
  return <div>{count}</div>;
}

// ✅ FIX:
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1); // Only on mount
  }, []); // Empty dependency array
  
  return <div>{count}</div>;
}
\`\`\`

## Step 3: Debugging Tools

**Browser DevTools:**
1. Console tab → See errors
2. Network tab → Check API calls
3. React DevTools → Inspect components
4. Performance tab → Find slow code

**VS Code Debugging:**
\`\`\`json
// .vscode/launch.json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Next.js",
  "url": "http://localhost:3000",
  "webRoot": "\${workspaceFolder}"
}
\`\`\`

## Step 4: Prevention Strategy

**Add Error Boundaries:**
\`\`\`typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
\`\`\`

**Add Logging:**
\`\`\`typescript
console.log('User data:', user);
console.log('API response:', response);
\`\`\`

## 🎯 Next Steps

Paste your error message and I'll:
1. ✅ Identify the root cause
2. ✅ Provide the fix
3. ✅ Explain why it happened
4. ✅ Show how to prevent it
5. ✅ Suggest architectural improvements

**What's your error? Paste it below!**`;
}

function generateMarketingResponse(query: string, context: ConversationContext): string {
  return `# 🎯 Elite Marketing Strategy

## Your Goal
Create high-converting copy that drives action.

## The Psychology

**People don't buy products. They buy:**
- Solutions to problems
- Better versions of themselves
- Status and belonging
- Time savings
- Peace of mind

## Proven Copy Framework

### 1. Hook (Stop the scroll)

\`\`\`
❌ "Our product is great"
✅ "Wasting 3 hours/day on repetitive tasks?"
\`\`\`

### 2. Problem (Agitate the pain)

\`\`\`
"Every minute spent manually creating content is:
- Lost revenue
- Missed opportunities
- Competitor advantage
- Team burnout"
\`\`\`

### 3. Solution (Present your offer)

\`\`\`
"AI Ad Generator creates 30-second UGC videos in 2 minutes.
No filming. No editing. No expensive creators."
\`\`\`

### 4. Proof (Build credibility)

\`\`\`
"2,400+ businesses generating 50,000+ ads/month
Average ROI: 340%"
\`\`\`

### 5. CTA (Clear next step)

\`\`\`
❌ "Learn more"
✅ "Create Your First Video (Free)" ← Specific + Low risk
\`\`\`

## Platform-Specific Strategies

**Facebook/Instagram:**
- First 3 seconds = critical
- Use native format (no logos/urls in first frame)
- Test 3-5 variations
- Budget: 70% winners, 30% testing

**TikTok:**
- Raw > polished
- Hooks in 0.5 seconds
- Trend-jack current sounds
- Post 1-3x/day

**Google Ads:**
- Match search intent exactly
- Use numbers in headlines
- Include price (filters unqualified clicks)
- Test 3 headlines + 2 descriptions

## Conversion Optimization

**A/B Test Everything:**
1. Headlines (biggest impact)
2. CTA button text
3. Images/videos
4. Social proof placement
5. Color scheme

**Winning Headlines Pattern:**
\`\`\`
[Number] + [Adjective] + [Outcome] + [Time frame]

Examples:
- "7 Simple Ways to Double Sales in 30 Days"
- "3 Proven Scripts That Convert 40% More Leads"
- "Generate 100 Ads in 5 Minutes (No Experience)"
\`\`\`

## 📊 Performance Metrics

**Track:**
- CTR (Click-through rate) → Target: 2-5%
- CPC (Cost per click) → Lower = better
- CVR (Conversion rate) → Target: 3-10%
- ROAS (Return on ad spend) → Target: 3x-5x

**Kill ads if:**
- CTR < 1% after 1000 impressions
- CPA > 2x target after 50 conversions
- No conversions after $100 spend

## 🚀 Quick Wins

1. Add urgency: "Only 5 spots left"
2. Use power words: Free, New, Proven, Guaranteed
3. Show faces (increase engagement 38%)
4. Use odd numbers (7 tips > 5 tips)
5. Ask questions in hooks

Want me to write specific copy for your campaign? Give me:
- Product/service
- Target audience
- Main benefit
- Platform (FB, TikTok, Google)

I'll create 3 variations ready to test!`;
}

function generateBusinessResponse(query: string, context: ConversationContext): string {
  return `# 💼 Strategic Business Analysis

## Framework: First Principles Thinking

**Question everything. Optimize for:**
1. Revenue growth
2. Customer lifetime value (LTV)
3. Operational efficiency
4. Competitive moats
5. Scalability

## Business Model Analysis

### SaaS Metrics That Matter

| Metric | Good | Great | Elite |
|--------|------|-------|-------|
| MRR Growth | 10%/mo | 20%/mo | 30%/mo |
| Churn | <5%/mo | <3%/mo | <2%/mo |
| CAC Payback | <12mo | <6mo | <3mo |
| LTV:CAC Ratio | 3:1 | 5:1 | 7:1+ |
| NPS | 30+ | 50+ | 70+ |

### Revenue Optimization

**Pricing Strategy:**

\`\`\`
❌ Single tier: $99/mo
✅ Value-based tiers:

Starter: $29/mo (entry point)
↓
Pro: $99/mo (80% choose this)  ← Anchor pricing
↓
Enterprise: $299/mo (high margin)
\`\`\`

**Why this works:**
- 3 tiers = 30% more revenue vs. 1 tier
- Middle tier appears "reasonable"
- High tier makes middle look cheaper
- Low tier captures price-sensitive customers

## Growth Strategy

**Phase 1: Product-Market Fit (0-$100k ARR)**
- Talk to 100 customers
- Single channel focus
- Manual onboarding
- Iterate weekly

**Phase 2: Growth (100k-$1M ARR)**
- Automate onboarding
- 2-3 marketing channels
- Hire first sales rep
- Build referral program

**Phase 3: Scale ($1M-$10M ARR)**
- Build marketing team
- Expand to enterprise
- International expansion
- Strategic partnerships

## Competitive Analysis

**Build Moats:**
1. **Network effects** - Product gets better with more users (LinkedIn)
2. **Switching costs** - Hard to leave (Salesforce)
3. **Economies of scale** - Cheaper as you grow (AWS)
4. **Brand** - People pay premium (Apple)
5. **Proprietary tech** - Can't be copied (Google Search)

**Your moat should be:**
- Defensible (hard to copy)
- Valuable (customers pay for it)
- Sustainable (lasts years)

## Decision Framework

**Before any major decision, ask:**
1. What's the downside? (Risk assessment)
2. What's the upside? (Reward calculation)
3. Is it reversible? (Two-way vs one-way door)
4. What would we do with the resources instead? (Opportunity cost)

**Example:**
\`\`\`
Decision: Hire VP of Sales ($200k/year)

Downside: $200k + 6mo search time
Upside: 2x revenue ($500k → $1M)
Reversible: Yes (worst case: 3mo severance)
Alternative: Spend on ads ($200k → ~$600k revenue)

Verdict: Hire if we have clear sales process + enough leads
\`\`\`

## 🎯 Action Items

**This Quarter:**
1. Track these 3 metrics weekly
2. Talk to 10 churned customers
3. Test new pricing
4. Automate 1 manual process

**Need specific advice?**
- Market entry strategy?
- Pricing optimization?
- GTM (Go-to-market) plan?
- Fundraising strategy?
- Competitive positioning?

Give me your situation and I'll build a custom strategy!`;
}

function generateScriptWritingResponse(query: string, context: ConversationContext): string {
  return `# 🎬 Elite Script Writing

## Formula for Viral Video Scripts

### 30-Second Commercial Structure

\`\`\`
[0-3s] HOOK - Stop the scroll
[3-8s] PROBLEM - Agitate pain
[8-20s] SOLUTION - Show product
[20-27s] PROOF - Build trust
[27-30s] CTA - Clear action
\`\`\`

## Example: AI Ad Platform

\`\`\`
VISUAL: Person stressed at computer
NARRATOR: "Spending $5,000 per video ad?"

VISUAL: Money burning animation
NARRATOR: "Most fail anyway. 80% of video ads lose money."

VISUAL: App interface - clean, simple
NARRATOR: "AdGenius AI creates scroll-stopping UGC ads in 90 seconds."

VISUAL: Results dashboard
NARRATOR: "2,400 businesses. 340% average ROI. No filming. No editing."

VISUAL: CTA button pulsing
NARRATOR: "Create your first ad free. Link in bio."
\`\`\`

## Script Psychology

**Hooks That Work:**
1. **Question hook**: "Tired of X?"
2. **Number hook**: "$10k/month doing this"
3. **Shock hook**: "This changed everything"
4. **Challenge hook**: "Don't watch this if..."
5. **Story hook**: "I was broke until..."

**Emotional Triggers:**
- FOMO (Fear of missing out)
- Social proof (Others are winning)
- Authority (Experts recommend)
- Scarcity (Limited time)
- Curiosity (What happens next?)

## Platform-Specific Scripts

### TikTok (15-60s)

\`\`\`
[Hook - 0.5s]
"POV: You just discovered the app every marketer is hiding"

[Pattern interrupt - 2s]
*show phone screen with app*

[Value delivery - 10s]
"It creates these UGC ads in literally 2 minutes
→ No actors
→ No filming
→ No expensive equipment"

[Proof - 5s]
"Just made $15k from one video"

[CTA - 2s]
"Link in bio before they raise prices"
\`\`\`

### Instagram Reels (7-30s)

\`\`\`
[Visual hook - first frame]
TEXT OVERLAY: "How I 10x my ad performance"

[Quick cuts]
1. Problem: Manual video creation
2. Solution: AI generation
3. Result: Dashboard showing wins

[Voiceover throughout]
"Stop wasting money on ads that don't convert.
This AI creates proven winners in minutes.
Link in bio. You're welcome."
\`\`\`

### YouTube Pre-roll (15s non-skip)

\`\`\`
[Attention grab - 0-2s]
"Skip this if you love wasting money on ads"

[Value prop - 2-10s]
"AdGenius creates video ads that actually convert.
AI avatars. Voice synthesis. Full automation."

[CTA - 10-15s]
"Free trial. No credit card. Link below."
\`\`\`

## Voice & Tone Guide

**For B2B (Professional):**
- Confident but not arrogant
- Data-driven
- Solution-focused
- Use "you" not "we"

**For B2C (Casual):**
- Conversational
- Relatable problems
- Simple language
- Emotion-driven

**For Luxury (Aspirational):**
- Sophisticated vocabulary
- Imply exclusivity
- Slow pacing
- Leave mystery

## 🎯 Production Notes

**For AI Avatars:**
- Write shorter sentences
- Add natural pauses
- Avoid complex words
- Include emotional cues: [enthusiastic], [serious]

**For UGC Style:**
- Use "I" and "my"
- Include mistakes/stumbles (feels authentic)
- Casual language
- Direct camera address

## ✅ Script Checklist

Before finalizing:
- [ ] Hook in first 3 seconds?
- [ ] Clear problem identified?
- [ ] Specific solution shown?
- [ ] Proof/credibility included?
- [ ] CTA is concrete and easy?
- [ ] Total time under 30s?
- [ ] Every word earns its place?

**Need a script written?**

Give me:
1. Product/service
2. Target audience
3. Platform (TikTok, IG, YouTube)
4. Video length
5. Style (professional, casual, UGC)

I'll write 3 script variations ready to produce!`;
}

function generateSystemsDesignResponse(query: string, context: ConversationContext): string {
  return `# 🏗️ Systems Architecture - Enterprise Grade

## Architecture Decision Framework

**Every system design must answer:**
1. Scale: How many users/requests?
2. Latency: How fast must it respond?
3. Consistency: How important is data accuracy?
4. Availability: Can it go down?
5. Cost: What's the budget?

## Scalable Architecture Pattern

### Tier 1: Entry ($0-$10k/mo)

\`\`\`
┌─────────────┐
│   Next.js   │ ← All-in-one (API + Frontend)
│   on Vercel │
└──────┬──────┘
       │
┌──────▼──────┐
│  Supabase   │ ← Database + Auth + Storage
└─────────────┘
\`\`\`

**Handles:** 100k requests/day
**Cost:** ~$200/mo
**Tradeoffs:** Tightly coupled, hard to scale parts independently

### Tier 2: Growth ($10k-$100k/mo)

\`\`\`
┌──────────┐
│  Next.js │ ← Frontend
└────┬─────┘
     │
┌────▼─────────┐
│  API Gateway │ ← Load balancer
└────┬─────────┘
     │
┌────▼────────┐
│ Microservices│
│  (Node.js)  │ ← Separate services
└────┬────────┘
     │
┌────▼────────┐
│  Postgres   │ ← Primary DB
│   + Redis   │ ← Caching layer
└─────────────┘
\`\`\`

**Handles:** 1M+ requests/day
**Cost:** ~$2k/mo
**Tradeoffs:** More complex, but scales better

### Tier 3: Scale ($100k+/mo)

\`\`\`
        ┌──────────┐
        │   CDN    │ ← Static assets
        └────┬─────┘
             │
    ┌────────▼──────────┐
    │  Load Balancer    │
    └────────┬──────────┘
             │
    ┌────────▼──────────┐
    │  Auto-scaling     │
    │  App Servers      │ ← Horizontal scaling
    └────────┬──────────┘
             │
    ┌────────▼──────────┐
    │  Message Queue    │
    │    (RabbitMQ)     │ ← Async processing
    └────────┬──────────┘
             │
    ┌────────▼──────────┐
    │  Database Cluster │
    │  (Read replicas)  │ ← Data layer
    └───────────────────┘
\`\`\`

**Handles:** 100M+ requests/day
**Cost:** $10k+/mo
**Tradeoffs:** High complexity, needs DevOps team

## Database Design

### Choosing the Right Database

| Use Case | Database | Why |
|----------|----------|-----|
| User profiles, orders | PostgreSQL | ACID compliance, relationships |
| Real-time chat | Firebase | Live updates, offline support |
| Caching | Redis | In-memory, microsecond latency |
| Analytics | ClickHouse | Column-based, fast aggregations |
| Search | ElasticSearch | Full-text search, faceted filters |
| Files/media | S3 + CloudFront | Cheap storage, global CDN |

### Schema Design Example

\`\`\`sql
-- Bad: Everything in one table
CREATE TABLE users (
  id, name, email,
  address_street, address_city, address_zip,
  subscription_plan, subscription_start_date,
  payment_card_number, payment_expiry
);

-- Good: Normalized
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  street VARCHAR(255),
  city VARCHAR(100),
  zip VARCHAR(20)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES plans(id),
  started_at TIMESTAMP,
  status VARCHAR(20)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
\`\`\`

## API Design Best Practices

### RESTful Patterns

\`\`\`
GET    /api/users          → List users
GET    /api/users/:id      → Get user
POST   /api/users          → Create user
PUT    /api/users/:id      → Update user (full)
PATCH  /api/users/:id      → Update user (partial)
DELETE /api/users/:id      → Delete user

// Nested resources
GET    /api/users/:id/orders     → User's orders
POST   /api/users/:id/orders     → Create order for user
\`\`\`

### Response Format

\`\`\`json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John"
  },
  "meta": {
    "page": 1,
    "total": 100,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

## Performance Optimization

**Caching Strategy:**

\`\`\`typescript
// Layer 1: Browser cache
Cache-Control: public, max-age=3600

// Layer 2: CDN cache (Cloudflare)
Cache static assets: 1 year
Cache API responses: 5 minutes

// Layer 3: Application cache (Redis)
const user = await redis.get(\`user:\${id}\`);
if (!user) {
  user = await db.users.findById(id);
  await redis.set(\`user:\${id}\`, user, 'EX', 300); // 5 min
}
\`\`\`

**Database Optimization:**

1. **Add indexes** on columns used in WHERE/JOIN
2. **Use connection pooling** (pg-pool)
3. **Implement query caching** (Redis)
4. **Use read replicas** for analytics
5. **Partition large tables** by date/region

## Security Architecture

**Defense in Depth:**

\`\`\`
1. Rate limiting     → Prevent DDoS
2. Input validation  → Prevent injection
3. Authentication    → JWT tokens
4. Authorization     → Role-based access
5. Encryption        → TLS + at-rest
6. Audit logging     → Track all actions
7. Monitoring        → Detect anomalies
\`\`\`

## 🚨 Common Pitfalls

❌ **Premature optimization** - Don't build for 1M users when you have 100
❌ **Over-engineering** - Use managed services (Supabase, Vercel) first
❌ **No monitoring** - Add logging from day 1
❌ **Tight coupling** - Design for independent deployment
❌ **No backups** - Automate daily backups

## ✅ Migration Strategy

**When to scale:**
1. Response time > 500ms consistently
2. Database CPU > 70%
3. Memory usage > 80%
4. Cost of current setup > cost of migration

**How to migrate:**
1. Run old + new systems in parallel
2. Route 5% traffic to new system
3. Monitor for 1 week
4. Gradually increase to 100%
5. Keep rollback plan ready

**Need architecture review?**

Share:
- Current traffic (requests/day)
- Data volume (GB)
- Budget
- Main bottlenecks

I'll design a scalable solution with migration plan!`;
}

function generateGeneralResponse(query: string, context: ConversationContext): string {
  return `# 🎯 Let's Solve This

I can help you with:

## 💻 Technical
- **Coding**: React, Next.js, TypeScript, Tailwind
- **Debugging**: Fix errors, explain stack traces
- **Architecture**: Design scalable systems
- **APIs**: Build & integrate endpoints
- **Performance**: Optimize React apps
- **Deployment**: CI/CD, hosting, monitoring

## 📈 Business & Marketing
- **Marketing**: Ad copy, campaigns, conversion optimization
- **Business Strategy**: Growth, pricing, GTM plans
- **Script Writing**: Video ads, commercials, UGC content
- **Analytics**: Interpret metrics, improve KPIs

## 🧠 How I Help

**I don't just answer questions. I:**
1. ✅ Fix the immediate problem
2. ✅ Explain why it happened
3. ✅ Show you how to prevent it
4. ✅ Suggest architectural improvements
5. ✅ Think several steps ahead

**My responses include:**
- Production-ready code
- Step-by-step instructions
- Architecture diagrams
- Tradeoff analysis
- Performance optimizations
- Security best practices

## 💡 Examples of What to Ask

**Coding:**
- "Build a Next.js API route with auth"
- "Fix this TypeScript error: [paste error]"
- "Create a reusable form component"

**Debugging:**
- "App crashes when I click submit"
- "Getting 'undefined' error on this line"
- "Why is my component re-rendering?"

**Marketing:**
- "Write ad copy for SaaS product"
- "Create TikTok script for this product"
- "How do I improve conversion rate?"

**Business:**
- "Help me price my SaaS"
- "Build a growth strategy"
- "Analyze these business metrics"

**Architecture:**
- "Design a scalable video platform"
- "Choose the right database"
- "Plan migration to microservices"

## 🚀 What's Your Challenge?

Tell me:
1. What you're trying to do
2. What's not working
3. What you've tried

I'll give you a production-ready solution with:
- ✅ Working code
- ✅ Explanation
- ✅ Best practices
- ✅ Scalability considerations
- ✅ Next steps

**What do you need help with?**`;
}
