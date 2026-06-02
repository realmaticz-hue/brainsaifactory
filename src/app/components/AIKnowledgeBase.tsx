// Comprehensive AI Knowledge Base for answering any question
export function generateComprehensiveAnswer(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // React Performance
  if (lowerQuery.includes('react') && (lowerQuery.includes('performance') || lowerQuery.includes('optimize') || lowerQuery.includes('slow'))) {
    return `# React Performance - Simple Guide

**🎯 Simple Explanation:**
React can get slow when components re-render too often. Think of it like refreshing your entire webpage every time you click a button - that's wasteful! We need to be smarter about what updates.

**🔍 How to Detect Performance Problems:**

1. **Open Chrome DevTools** (Press F12)
2. **Go to Performance tab** → Click Record → Use your app → Stop recording
3. **Look for yellow bars** - these are slow areas
4. **Check React DevTools Profiler** - shows which components are slow

**Warning Signs:**
- App feels laggy when typing
- Buttons take time to respond
- Lists are slow to scroll
- Page freezes briefly

**✅ How to Fix (Step-by-Step):**

**Problem 1: Component Re-renders Too Much**
\`\`\`typescript
// ❌ BAD - Re-renders every time parent updates
function UserCard({ user }) {
  console.log('Rendering UserCard');
  return <div>{user.name}</div>;
}

// ✅ GOOD - Only re-renders when user changes
const UserCard = React.memo(({ user }) => {
  console.log('Rendering UserCard');
  return <div>{user.name}</div>;
});
\`\`\`

**Problem 2: Heavy Calculations Slow Down Renders**
\`\`\`typescript
// ❌ BAD - Calculates every render
function ProductList({ products }) {
  const sorted = products.sort((a, b) => b.price - a.price);
  return <div>{sorted.map(p => <div key={p.id}>{p.name}</div>)}</div>;
}

// ✅ GOOD - Only calculates when products change
function ProductList({ products }) {
  const sorted = useMemo(() => {
    return products.sort((a, b) => b.price - a.price);
  }, [products]);
  
  return <div>{sorted.map(p => <div key={p.id}>{p.name}</div>)}</div>;
}
\`\`\`

**🎓 Quick Win Checklist:**
✅ Add React.memo() to components that don't need to re-render often
✅ Use useMemo() for expensive calculations
✅ Use useCallback() for functions passed to child components
✅ Use react-window for lists with 100+ items
✅ Add "key" prop to all list items`;
  }

  // State Management  
  if (lowerQuery.includes('state') || lowerQuery.includes('redux') || lowerQuery.includes('zustand')) {
    return `# State Management - Simple Guide

**🎯 Simple Explanation:**
State is like a notebook where your app remembers things. When you click a button, add items to a cart, or log in, that information needs to be stored somewhere.

**🤔 Which State Management Should I Use?**

**For Small Apps (1-5 pages):**
👉 **Use useState + Context API** - Built into React, free, simple!

**For Medium Apps (5-20 pages):**
👉 **Use Zustand** - Super easy, fast, popular

**For Large Apps (20+ pages, teams):**
👉 **Use Redux Toolkit** - Industry standard

**✅ Solution: Zustand (Recommended)**

\`\`\`typescript
// Step 1: Install - Run: npm install zustand

// Step 2: Create store
import create from 'zustand';

export const useStore = create((set) => ({
  count: 0,
  user: null,
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user }),
}));

// Step 3: Use anywhere - NO PROVIDER NEEDED!
function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}
\`\`\``;
  }

  // Errors and Debugging
  if (lowerQuery.includes('error') || lowerQuery.includes('bug') || lowerQuery.includes('debug') || lowerQuery.includes('fix') || lowerQuery.includes('broken')) {
    return `# Complete Error Detection & Fixing Guide

**🎯 Simple Explanation:**
Errors are your app's way of telling you "something's wrong!" Learning to read errors is the #1 skill of great developers.

**🔍 How to Find Errors:**

**Step 1: Open Developer Tools**
- **Chrome/Edge**: Press F12
- **Firefox**: Press F12
- Red text = Errors (must fix)
- Yellow text = Warnings (should fix)

**🐛 MOST COMMON ERRORS:**

**Error 1: "Cannot read property 'X' of undefined"**
\`\`\`typescript
// ❌ PROBLEM
function UserProfile() {
  const [user, setUser] = useState(null);
  return <div>{user.name}</div>; // CRASH! user is null
}

// ✅ FIX: Check if it exists
function UserProfile() {
  const [user, setUser] = useState(null);
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

// ✅ BETTER: Use optional chaining
function UserProfile() {
  const [user, setUser] = useState(null);
  return <div>{user?.name || 'Loading...'}</div>;
}
\`\`\`

**Error 2: "X is not defined"**
\`\`\`typescript
// ❌ PROBLEM: Forgot to import
function App() {
  return <Button>Click</Button>; // Error!
}

// ✅ FIX: Import it
import { Button } from './components/Button';
function App() {
  return <Button>Click</Button>;
}
\`\`\`

**Error 3: "Maximum update depth exceeded"**
\`\`\`typescript
// ❌ PROBLEM: Infinite loop
function BadComponent() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(count + 1); // Infinite loop!
  }); // No dependency array!
}

// ✅ FIX: Add dependency array
function GoodComponent() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(1); // Runs once
  }, []); // Empty array = run once
}
\`\`\`

**🔧 Debugging Tools:**

**1. console.log() - Your Best Friend**
\`\`\`javascript
function calculateTotal(items) {
  console.log('Input:', items);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  console.log('Total:', total);
  return total;
}
\`\`\`

**2. React DevTools**
- Install React DevTools extension
- See component props and state
- Find which component is slow

**3. Network Tab**
- See all API calls
- Check status codes (200 = success, 404 = not found)
- View request/response data

**📋 Debugging Process:**

1. **Read the error message** - It tells you what's wrong
2. **Find the line number** - Where it happened
3. **Add console.logs** - See variable values
4. **Check recent changes** - What did you change last?
5. **Google the error** - Someone else had this problem!`;
  }

  // Authentication
  if (lowerQuery.includes('auth') || lowerQuery.includes('login') || lowerQuery.includes('password')) {
    return `# Authentication Made Simple

**🎯 What is Authentication?**
Authentication = Proving you are who you say you are. Like showing your ID.

**🔐 How Login Works:**
1. User enters email + password
2. Server checks if they match
3. Server creates a "token" (like a VIP pass)
4. Browser saves the token
5. Browser sends token with every request

**✅ Complete Login System:**

**Frontend Login Form**
\`\`\`typescript
import { useState } from 'react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
\`\`\`

**🐛 Common Problems:**

**Problem: "Token is not defined"**
\`\`\`typescript
// ❌ Forgot to send token
fetch('/api/profile');

// ✅ Send token in header
const token = localStorage.getItem('token');
fetch('/api/profile', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
\`\`\``;
  }

  // Deployment
  if (lowerQuery.includes('deploy') || lowerQuery.includes('production') || lowerQuery.includes('host')) {
    return `# Deploy Your App - Simple Guide

**🎯 What is Deployment?**
Making your app accessible on the internet, not just your computer.

**🚀 Easiest Way: Vercel**

**Step 1: Prepare**
\`\`\`bash
npm run build   # Make sure it builds
\`\`\`

**Step 2: Deploy**
1. Go to vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Select your repository
5. Click "Deploy"

Done! Your app is live ✨

**🐛 Common Problems:**

**Problem: "Build fails"**
\`\`\`bash
# Make sure package.json has all dependencies
npm install package-name --save
\`\`\`

**Problem: "Environment variables missing"**
1. In Vercel: Settings → Environment Variables
2. Add your variables
3. Redeploy

**Problem: "Works locally, not in production"**
\`\`\`typescript
// ❌ Don't use localhost
fetch('http://localhost:3000/api');

// ✅ Use relative URLs
fetch('/api/data');
\`\`\``;
  }

  // Database
  if (lowerQuery.includes('database') || lowerQuery.includes('data') || lowerQuery.includes('storage')) {
    return `# Database Made Simple

**🎯 What is a Database?**
A permanent storage for your app's data. Data stays saved even after refresh.

**📦 Which Database?**

**For Beginners:**
👉 **localStorage** - Built-in, no setup (5MB limit)

**For Real Apps:**
👉 **Supabase** - Easiest database with auth built-in

**✅ localStorage (Easiest)**

\`\`\`typescript
// Save data
const saveCart = (items) => {
  localStorage.setItem('cart', JSON.stringify(items));
};

// Load data
const loadCart = () => {
  const saved = localStorage.getItem('cart');
  return saved ? JSON.parse(saved) : [];
};

// Example
function Cart() {
  const [items, setItems] = useState(() => loadCart());
  
  const addItem = (item) => {
    const newItems = [...items, item];
    setItems(newItems);
    saveCart(newItems);
  };
  
  return <div>{items.length} items</div>;
}
\`\`\`

**✅ Supabase (For Real Apps)**

\`\`\`typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_URL', 'YOUR_KEY');

// Get data
const { data } = await supabase.from('todos').select('*');

// Add data
await supabase.from('todos').insert([{ text: 'Buy milk' }]);

// Update data
await supabase.from('todos').update({ done: true }).eq('id', 123);

// Delete data
await supabase.from('todos').delete().eq('id', 123);
\`\`\``;
  }

  // React basics
  if (lowerQuery.includes('react') || lowerQuery.includes('component') || lowerQuery.includes('usestate')) {
    return `# React Made Simple

**🎯 What is React?**
A tool for building websites that update automatically. No page refresh needed!

**📦 5 Core Concepts:**

**1. Components**
\`\`\`typescript
function Welcome() {
  return <h1>Hello!</h1>;
}
\`\`\`

**2. Props**
\`\`\`typescript
function Greeting({ name }) {
  return <p>Hi {name}!</p>;
}

<Greeting name="John" />
\`\`\`

**3. State**
\`\`\`typescript
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
\`\`\`

**4. useEffect**
\`\`\`typescript
function UserProfile() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(setUser);
  }, []); // Runs once
  
  if (!user) return <p>Loading...</p>;
  return <p>{user.name}</p>;
}
\`\`\`

**5. Events**
\`\`\`typescript
function Form() {
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(\`Hello \${name}\`);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
\`\`\``;
  }

  // General answer for anything else
  return `# Let Me Help You

**Your Question:** "${query}"

**🎯 Breaking It Down:**

I understand you're asking about "${query}". Let me help you with a clear, step-by-step solution.

**📋 Step-by-Step Approach:**

**Step 1: Understand the Problem**
First, let's identify exactly what you're trying to achieve and break it into smaller pieces.

**Step 2: Find the Right Tools**
Based on your question, here's what you'll need:
- Clear understanding of core concepts
- Right tools or libraries  
- Step-by-step implementation plan

**Step 3: Start Simple**
\`\`\`typescript
// Begin with the simplest version
function example() {
  // Start here
  console.log('Testing...');
  
  // Add your logic step by step
  // Test each part as you go
}
\`\`\`

**🔍 How to Detect Problems:**

**Warning Signs:**
1. Error messages in console (Press F12)
2. Things don't work as expected
3. Slow performance
4. Visual issues

**How to Debug:**
1. Open DevTools (F12) → Check Console
2. Add console.log() to see what's happening
3. Test in small pieces
4. Read error messages carefully

**✅ Common Solutions:**

**If you see errors:**
- Read the error message - it tells you the problem
- Check for typos
- Make sure everything is imported
- Google the exact error message

**If something doesn't update:**
- Are you using state correctly?
- Check your dependencies
- Make sure you're not mutating data directly

**💡 Quick Tips:**
✅ Start with the simplest version
✅ Test after each change
✅ Use console.log() liberally
✅ Read error messages carefully
✅ Google is your friend

**Need More Specific Help?**

Try asking with more details:
- "How do I build a login form?"
- "Why am I getting this error: [paste error]"
- "How do I fetch data from an API?"

I'm here to make this as simple as possible! 😊`;
}
