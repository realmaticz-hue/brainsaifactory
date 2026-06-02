# 🧬 Quick Reference: Deep Structure Scan

## What is Deep Structure Scan?

An **automatic project analysis** that runs every time you upload files to Git Repair Brain v5.

---

## ⚡ Quick Facts

- ✅ **Automatic**: No configuration needed
- ✅ **Comprehensive**: Scans ALL uploaded files
- ✅ **Fast**: Completes in seconds
- ✅ **Smart**: Detects framework, language, build system, and more
- ✅ **Context-Aware**: Helps repair system make better fixes

---

## 🚀 How to Use

### Step 1: Upload Your Project
```
Click "Upload Project Folder" → Select your project directory
```

### Step 2: Watch the Magic
The system automatically:
1. Uploads all files (skips node_modules)
2. 🧬 Runs Deep Structure Scan
3. Displays project genome
4. Begins error detection

### Step 3: Review Results
Check the **Deep Structure Scan Results Panel** to see:
- Your framework (React, Vue, Angular, etc.)
- Language (TypeScript or JavaScript)
- Build system (Vite, Webpack, etc.)
- Dependencies count
- Routing & state management libraries

---

## 📊 What It Detects

| Category | Examples |
|----------|----------|
| **Framework** | React, Vue, Angular, Svelte, Vanilla JS |
| **Language** | TypeScript, JavaScript |
| **Build System** | Vite, Webpack, Rollup, esbuild |
| **Package Manager** | npm, yarn, pnpm, bun |
| **Routing** | react-router, Next.js, Remix, vue-router |
| **State Management** | Redux, Zustand, MobX, Jotai |
| **Styling** | Tailwind CSS, styled-components, SASS |
| **Testing** | Jest, Vitest, Playwright, Cypress |

---

## 🎯 Example Output

```
🧬 Deep Structure Scan Complete!
📊 Project Type: react + typescript
🏗️  Build System: vite
🎨 Styling: tailwind
🧭 Routing: react-router
📦 State Management: zustand
📚 Dependencies: 42 packages
```

---

## 💡 Why It Matters

### Better Repairs
The repair system uses genome data to:
- Choose framework-specific fixes
- Suggest compatible packages
- Respect your project structure
- Avoid incompatible solutions

### Smarter AI
When AI repairs are needed, the genome provides:
- Complete project context
- Technology stack information
- Dependency awareness
- Architectural patterns

### Faster Debugging
You instantly see:
- What technologies your project uses
- Missing or incorrect configurations
- Dependency issues
- Framework compatibility

---

## 🔍 Where to Find Results

### 1. Terminal Output
Look for these logs:
```
🧬 Starting Deep Structure Scan...
✅ Deep Structure Scan Complete!
```

### 2. Visual Panel
A blue panel appears showing:
- Framework + Language
- Build System
- Dependencies
- Routing/State/Styling

### 3. Upload Status
Below the clone/upload section:
```
🧬 Deep Structure Scan Complete
react + typescript • Build: vite • Routing: react-router
```

---

## ❓ FAQ

**Q: Does it slow down uploads?**
A: No! It runs in parallel and completes in seconds.

**Q: Does it upload files twice?**
A: No! It analyzes files already in memory.

**Q: What if my project is unusual?**
A: It gracefully handles any project structure.

**Q: Can I skip it?**
A: No, it's automatic. But you can ignore the results if needed.

**Q: Does it work with monorepos?**
A: Yes! It analyzes the uploaded portion of your project.

**Q: What about private packages?**
A: It reads package.json but doesn't access npm registry.

---

## 🎬 Watch It in Action

### Upload Flow:
```
1. Click "Upload Project Folder"
2. Select your project directory
3. See "Uploading Files..." 
4. See "🧬 Deep Structure Scan..."
5. See beautiful genome results
6. Error scan begins with full context
```

### Terminal Timeline:
```
[10:23:45] 📤 Uploading 127 files...
[10:23:47] ✅ Successfully uploaded 127 files
[10:23:47] 🧬 Starting Deep Structure Scan...
[10:23:48] 🔬 Analyzing project genome...
[10:23:49] ✅ Deep Structure Scan Complete!
[10:23:49] 📊 Project Type: react + typescript
[10:23:50] 🔄 Initiating automatic error scan...
```

---

## 🏆 Pro Tips

1. **Upload the whole project** for best results
2. **Include package.json** for accurate dependency detection
3. **Check the genome panel** to verify detection accuracy
4. **Review terminal logs** for detailed analysis steps
5. **Use genome data** to understand your project better

---

## 🔧 Troubleshooting

**"Deep Structure Scan failed"**
- Check your internet connection
- Verify files uploaded successfully
- Try uploading again

**"Framework: unknown"**
- May be a vanilla JS project (this is fine!)
- Or missing package.json
- Or using uncommon framework

**"Build System: Not detected"**
- Some projects don't use build tools
- Or using a custom/uncommon builder
- This won't affect error detection

---

## ✅ What You Should Know

- ✅ Deep Structure Scan runs AUTOMATICALLY on EVERY upload
- ✅ It scans ALL uploaded files (except node_modules)
- ✅ Results appear in UI and terminal
- ✅ Repair system uses results for smarter fixes
- ✅ No configuration needed from you
- ✅ Works with ANY project structure
- ✅ Completes in seconds

---

**Ready to try it?**

Upload your project and watch Deep Structure Scan work its magic! 🧬✨
