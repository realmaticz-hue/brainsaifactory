// AI App Builder Backend - Generates complete, functional applications

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface AppGenerationRequest {
  prompt: string;
  platform: 'mobile' | 'tablet' | 'desktop';
}

export async function generateAppWithAI(request: AppGenerationRequest) {
  console.log('Generating app with AI for prompt:', request.prompt);

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    console.log('No AI API keys found, using template-based generation');
    return generateTemplateApp(request);
  }

  try {
    // Use Claude or GPT-4 to generate app structure
    const apiKey = ANTHROPIC_API_KEY || OPENAI_API_KEY;
    const isAnthropic = !!ANTHROPIC_API_KEY;

    const systemPrompt = `## 🧠 AI SUPER CODING BRAIN — MULTI-AGENT AUTONOMOUS SOFTWARE ENGINEER

### SURFACES POWERED BY THIS BRAIN
This system prompt is active across all four surfaces:
- 💬 Genius AI Chat — conversational AI coding assistant
- 🔧 Git Repair — self-healing build system & code repair engine
- 🛠️ AI Code Assistant — real-time code analysis, debugging & optimization
- ⚡ Build Apps (Elite App Builder) — autonomous full-stack application generator

### ROLE
You are an autonomous AI software engineer capable of planning, building, debugging, optimizing, and deploying complete applications.

### PRIMARY OBJECTIVE
Transform user ideas into fully functioning software products through autonomous reasoning and continuous development processes.

### OPERATING PRINCIPLES

1. THINK LIKE A SENIOR SOFTWARE ARCHITECT — analyze the request, determine optimal architecture before writing any code.
2. GENERATE FULL PROJECT STRUCTURE — always produce structured projects, never isolated snippets.
3. PLAN BEFORE CODING — analyze requirements, design architecture, define APIs/DB schema, determine dependencies.
4. BUILD FULL-STACK APPLICATIONS — Frontend: React, Next.js, Tailwind · Backend: Node.js, Python, REST APIs · Database: SQL, PostgreSQL, Supabase · Auth: secure sessions · Deployment: CI/CD.
5. SELF-HEALING DEVELOPMENT LOOP — Detect error → Analyze stack trace → Search solution → Rewrite code → Rebuild. Repeat until zero critical errors.
6. USE GLOBAL KNOWLEDGE SOURCES — Stack Overflow · GitHub Issues · Framework docs · Package registries · Internal AI memory.
7. ALWAYS MAINTAIN CODE QUALITY — Clean architecture · Modular components · Type safety · Error handling · Documentation. NEVER truncate code.
8. GENERATE AUTOMATED TESTS — Unit · Integration · API endpoint · UI interaction tests for every major feature.
9. OPTIMIZE PERFORMANCE — Slow rendering · Large bundles · Inefficient DB queries · Memory leaks. Auto-refactor.
10. ENFORCE SECURITY — Injection attacks · Insecure auth · Exposed env vars · Dependency vulnerabilities.
11. SUPPORT AUTONOMOUS ITERATION — Continue debugging → rewrite → rebuild until the application works.
12. LEARN FROM EVERY TASK — Store error solutions · Architecture patterns · Performance improvements · Framework fixes.

### EXECUTION WORKFLOW
User Idea → Architecture Planning (Agent 1) → Project Generation (Agent 2) → Build Execution (Agent 7)
→ Error Detection (Agent 4) → Self-Healing Debugging (Agents 5+6) → Testing (Agent 8)
→ Optimization (Agent 9) → Security Audit (Agent 10) → Deployment (Agent 12) → Memory (Agent 11)
→ RESULT: A fully functioning application ready for real-world use.

### SURFACE: ⚡ BUILD APPS — ELITE APP BUILDER
Active Agents: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (ALL AGENTS)
- Agent 1 designs full system architecture before any code is written.
- Agent 2 generates the complete project file structure — no snippets, full files only.
- Agents 4+5+6 run the Self-Healing Loop automatically on every build error.
- Agent 7 validates every build passes before moving to the next phase.
- Agent 8 generates a full test suite (unit, integration, E2E) for every feature.
- Agent 9 profiles and refactors for performance before deployment.
- Agent 10 performs complete security audit — no exposed secrets, no vulnerabilities.
- Agent 12 configures deployment pipeline and delivers a live, monitored application.
- GOAL: Transform the user's idea into a production-ready, deployed application.

---

You are generating a complete app structure. Return a JSON object with:
{
  "components": [
    {
      "id": "unique-id",
      "type": "button|text|image|input|container|video",
      "x": 0,
      "y": 0,
      "width": 100,
      "height": 50,
      "properties": {
        "text": "Button text",
        "backgroundColor": "#6366f1",
        "color": "#ffffff",
        "fontSize": 16,
        "borderRadius": 8,
        "padding": 12
      },
      "children": []
    }
  ],
  "code": {
    "html": "<!DOCTYPE html>...",
    "css": "body { ... }",
    "js": "// JavaScript code",
    "react": "import React from 'react'..."
  }
}

Make the app functional, beautiful, and production-ready. Use modern design principles. Apply all 12 Operating Principles above on every generation.`;

    let aiResponse;

    if (isAnthropic) {
      // Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: `${systemPrompt}\n\nUser prompt: ${request.prompt}\nPlatform: ${request.platform}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      aiResponse = data.content[0].text;
    } else {
      // OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create an app: ${request.prompt}\nPlatform: ${request.platform}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;
    }

    // Parse AI response
    const appStructure = JSON.parse(aiResponse);

    return {
      success: true,
      ...appStructure
    };
  } catch (error) {
    console.error('AI app generation error:', error);
    return generateTemplateApp(request);
  }
}

function generateTemplateApp(request: AppGenerationRequest) {
  // Template-based generation when AI is not available
  const prompt = request.prompt.toLowerCase();

  const components = [];

  // Header/Title
  components.push({
    id: 'title-' + Date.now(),
    type: 'text',
    x: 50,
    y: 50,
    width: 300,
    height: 50,
    properties: {
      text: extractTitle(request.prompt),
      fontSize: 28,
      fontWeight: 'bold',
      color: '#1f2937'
    },
    children: []
  });

  // Add components based on keywords in prompt
  if (prompt.includes('button') || prompt.includes('click') || prompt.includes('submit')) {
    components.push({
      id: 'button-' + Date.now(),
      type: 'button',
      x: 100,
      y: 250,
      width: 200,
      height: 50,
      properties: {
        text: 'Submit',
        backgroundColor: '#6366f1',
        color: '#ffffff',
        fontSize: 16,
        borderRadius: 8,
        padding: 12
      },
      children: []
    });
  }

  if (prompt.includes('input') || prompt.includes('form') || prompt.includes('enter')) {
    components.push({
      id: 'input-' + Date.now(),
      type: 'input',
      x: 50,
      y: 150,
      width: 300,
      height: 45,
      properties: {
        placeholder: 'Enter text...',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        fontSize: 14
      },
      children: []
    });
  }

  if (prompt.includes('image') || prompt.includes('photo') || prompt.includes('picture')) {
    components.push({
      id: 'image-' + Date.now(),
      type: 'image',
      x: 50,
      y: 350,
      width: 300,
      height: 200,
      properties: {
        src: 'https://source.unsplash.com/400x300/?app,technology',
        borderRadius: 12
      },
      children: []
    });
  }

  // Generate code
  const code = {
    html: generateHTML(components),
    css: generateCSS(components),
    js: generateJS(components),
    react: generateReact(components, request.prompt)
  };

  return {
    success: true,
    components,
    code
  };
}

function extractTitle(prompt: string): string {
  // Extract a title from the prompt
  const words = prompt.split(' ').slice(0, 3);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateHTML(components: any[]): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app-container">
`;

  components.forEach(comp => {
    if (comp.type === 'button') {
      html += `    <button class="comp-${comp.id}">${comp.properties.text}</button>\n`;
    } else if (comp.type === 'text') {
      html += `    <div class="comp-${comp.id}">${comp.properties.text}</div>\n`;
    } else if (comp.type === 'input') {
      html += `    <input class="comp-${comp.id}" placeholder="${comp.properties.placeholder}" />\n`;
    } else if (comp.type === 'image') {
      html += `    <img class="comp-${comp.id}" src="${comp.properties.src}" alt="App image" />\n`;
    }
  });

  html += `  </div>
  <script src="script.js"></script>
</body>
</html>`;

  return html;
}

function generateCSS(components: any[]): string {
  let css = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.app-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 500px;
  width: 100%;
}

`;

  components.forEach(comp => {
    css += `.comp-${comp.id} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  width: ${comp.width}px;
  height: ${comp.height}px;
`;

    if (comp.properties.backgroundColor) {
      css += `  background-color: ${comp.properties.backgroundColor};\n`;
    }
    if (comp.properties.color) {
      css += `  color: ${comp.properties.color};\n`;
    }
    if (comp.properties.fontSize) {
      css += `  font-size: ${comp.properties.fontSize}px;\n`;
    }
    if (comp.properties.borderRadius) {
      css += `  border-radius: ${comp.properties.borderRadius}px;\n`;
    }
    if (comp.properties.padding) {
      css += `  padding: ${comp.properties.padding}px;\n`;
    }
    if (comp.type === 'button') {
      css += `  border: none;\n  cursor: pointer;\n  font-weight: 600;\n  transition: transform 0.2s;\n`;
      css += `}\n\n.comp-${comp.id}:hover {\n  transform: scale(1.05);\n`;
    }

    css += `}\n\n`;
  });

  return css;
}

function generateJS(components: any[]): string {
  return `// Generated JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('App loaded successfully');
  
  // Add event listeners
  ${components.filter(c => c.type === 'button').map(btn => `
  document.querySelector('.comp-${btn.id}').addEventListener('click', () => {
    alert('Button clicked!');
  });`).join('\n')}
});`;
}

function generateReact(components: any[], appName: string): string {
  const cleanName = appName.replace(/[^a-zA-Z0-9]/g, '');

  return `import React, { useState } from 'react';
import './App.css';

function ${cleanName}App() {
  const [state, setState] = useState({});
  
  return (
    <div className="app-container">
${components.map(comp => {
    if (comp.type === 'button') {
      return `      <button 
        className="comp-${comp.id}"
        style={{
          position: 'absolute',
          left: '${comp.x}px',
          top: '${comp.y}px',
          width: '${comp.width}px',
          height: '${comp.height}px',
          backgroundColor: '${comp.properties.backgroundColor}',
          color: '${comp.properties.color}',
          fontSize: '${comp.properties.fontSize}px',
          borderRadius: '${comp.properties.borderRadius}px',
          padding: '${comp.properties.padding}px'
        }}
        onClick={() => alert('Button clicked!')}
      >
        ${comp.properties.text}
      </button>`;
    } else if (comp.type === 'text') {
      return `      <div 
        className="comp-${comp.id}"
        style={{
          position: 'absolute',
          left: '${comp.x}px',
          top: '${comp.y}px',
          fontSize: '${comp.properties.fontSize}px',
          fontWeight: '${comp.properties.fontWeight || 'normal'}',
          color: '${comp.properties.color}'
        }}
      >
        ${comp.properties.text}
      </div>`;
    } else if (comp.type === 'input') {
      return `      <input 
        className="comp-${comp.id}"
        placeholder="${comp.properties.placeholder}"
        style={{
          position: 'absolute',
          left: '${comp.x}px',
          top: '${comp.y}px',
          width: '${comp.width}px',
          height: '${comp.height}px',
          backgroundColor: '${comp.properties.backgroundColor}',
          borderRadius: '${comp.properties.borderRadius}px',
          padding: '${comp.properties.padding}px',
          border: 'none',
          outline: 'none'
        }}
      />`;
    }
    return '';
  }).join('\n')}
    </div>
  );
}

export default ${cleanName}App;`;
}

export async function saveAppProject(project: any) {
  const { set } = await import('./kv_store.tsx');
  await set(`app-project:${project.id}`, project);
  return { success: true, projectId: project.id };
}

export async function getAppProject(projectId: string) {
  const { get } = await import('./kv_store.tsx');
  return await get(`app-project:${projectId}`);
}

export async function listAppProjects() {
  const { getByPrefix } = await import('./kv_store.tsx');
  return await getByPrefix('app-project:');
}