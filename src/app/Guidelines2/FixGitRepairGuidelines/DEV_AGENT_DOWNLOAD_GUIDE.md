# 📥 How to Download from Dev Agent

## Quick Answer

**Use the Git Repair page** - it's your Self-Healing Build System with full download capabilities!

---

## Method 1: Git Repair Download (Recommended) ✨

### Step 1: Navigate to Git Repair
1. Open your application
2. Click on **"Git Repair"** in the navigation menu
3. You'll see the Self-Healing Build System interface

### Step 2: Scan Your Project
1. Click **"🔍 Deep Scan All Files"** button
2. Wait for the scan to complete
3. It will detect any errors and show you a summary

### Step 3: Auto-Fix Errors (If Any)
1. Click **"⚡ Fix All Errors"** button
2. The system will:
   - Use pattern-based fixes FIRST (no AI credits needed)
   - Fall back to OpenRouter AI for complex issues
   - Store all fixed files in memory

### Step 4: Download ZIP Package
1. Click **"📥 Download ZIP"** button at the top
2. This downloads:
   - All fixed files
   - Complete project structure
   - Package.json with dependencies
   - README with setup instructions
   - All components, pages, and utilities

### Step 5: Extract and Run
```bash
# Extract the downloaded ZIP
unzip git-repair-fixed-project.zip
cd git-repair-fixed-project

# Install dependencies
npm install

# Run the development server
npm run dev
```

---

## Method 2: Upload to GitHub Directly

Instead of downloading, you can push directly to GitHub:

### Step 1: Open Git Repair
Same as above - navigate to Git Repair page

### Step 2: Fix All Errors
Click "Fix All Errors" to repair your project

### Step 3: Upload to GitHub
1. Click **"📤 Upload to GitHub"** button
2. Enter your GitHub token (created at https://github.com/settings/tokens)
3. Enter repository details:
   - Repository owner (your username)
   - Repository name
   - Branch name (e.g., `main`)
4. Click **"Upload"**

### Step 4: Clone from GitHub
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
npm run dev
```

---

## Method 3: Clone Existing GitHub Repo

If you already have a GitHub repository:

### Step 1: Clone in Git Repair
1. Go to Git Repair page
2. Look for **"GitHub Clone"** section
3. Enter your repository URL: `https://github.com/username/repo`
4. Click **"Clone & Analyze"**

### Step 2: System Will:
- Clone all files from GitHub
- Scan for errors automatically
- Cache all file contents locally
- Show you the error summary

### Step 3: Fix and Download
- Click "Fix All Errors"
- Click "Download ZIP" to get the repaired version

---

## What Gets Downloaded?

When you download the ZIP package, you get:

```
your-project/
├── package.json          # All dependencies
├── README.md             # Setup instructions
├── tsconfig.json         # TypeScript config
├── .gitignore           # Git ignore rules
├── App.tsx              # Main app file
├── components/          # All React components
│   ├── AIBlogFactory.tsx
│   ├── GeniusAIChat.tsx
│   ├── GitRepair.tsx
│   └── ... (all others)
├── pages/               # All pages
│   ├── GitRepair.tsx
│   ├── AutonomousAgent.tsx
│   └── ... (all others)
├── supabase/            # Backend server
│   └── functions/
│       └── server/
│           ├── index.tsx
│           ├── scraper.tsx
│           ├── pattern_fix.tsx
│           └── ... (all others)
├── utils/               # Utilities
│   ├── serverFetch.ts
│   ├── blogGenerator.ts
│   └── ... (all others)
├── styles/              # CSS styles
│   └── globals.css
└── routes.tsx           # React Router config
```

---

## Download ZIP Features

The Git Repair download system includes:

✅ **All Fixed Files** - Every file with errors corrected  
✅ **Missing Files Auto-Generated** - Detects and creates missing imports  
✅ **Complete Project Structure** - Proper folder hierarchy  
✅ **Package.json** - All dependencies included  
✅ **Setup Instructions** - README with run commands  
✅ **Pattern Fixes Applied** - Common errors fixed without AI credits  
✅ **AI Fixes Applied** - Complex errors solved by OpenRouter  

---

## Pattern-Based Fixes (No Credits Required)

The system automatically fixes these **WITHOUT using AI credits**:

1. ✅ `react-router-dom` → `react-router` (library replacement)
2. ✅ Parsing ecmascript errors (syntax corruption)
3. ✅ "Cannot read properties of undefined" errors
4. ✅ Missing import statements
5. ✅ Incorrect file paths
6. ✅ Duplicate declarations
7. ✅ Type errors in common patterns

**Pattern fixes run FIRST** - AI is only called for complex issues!

---

## Troubleshooting

### Issue: "No files to download"
**Solution**: 
- Run "Deep Scan All Files" first
- Wait for scan to complete
- Then click "Download ZIP"

### Issue: "ZIP download is empty"
**Solution**:
- Fix errors first using "Fix All Errors"
- The system needs fixed files to download
- Check the terminal logs for file count

### Issue: Downloaded project has errors
**Solution**:
- The download includes all fixes
- Make sure you ran "Fix All Errors" before downloading
- Check the `BUILD_TEST_RESULTS.md` file in the ZIP for verification

### Issue: Missing files after extraction
**Solution**:
- The system auto-detects missing files
- Re-run "Deep Scan" to detect missing imports
- The AI will generate missing files automatically

---

## Best Practices

### Before Downloading:

1. ✅ Run **Deep Scan All Files** to detect all errors
2. ✅ Click **Fix All Errors** to repair everything
3. ✅ Wait for "ALL ERRORS RESOLVED" message
4. ✅ (Optional) Run **Build Test** to verify
5. ✅ Click **Download ZIP** to get your project

### After Downloading:

```bash
# Extract
unzip git-repair-fixed-project.zip

# Navigate
cd git-repair-fixed-project

# Install dependencies
npm install

# Check for any remaining issues
npm run build

# Run development server
npm run dev
```

### If You Get Errors After Download:

1. Check the `BUILD_TEST_RESULTS.md` file in the ZIP
2. Look at the terminal output for specific errors
3. Re-upload the project to Git Repair
4. Run another scan and fix cycle
5. Download again

---

## Advanced: Download Summary Report

After fixing errors, you can download a detailed report:

1. Click **"📊 Download Summary"** button
2. This generates a `GIT_REPAIR_SUMMARY.md` file with:
   - All errors detected
   - All fixes applied
   - Pattern fixes used
   - AI fixes used
   - Build test results
   - File change log

---

## What About Individual Files?

### Download Single Files:

1. **Blog Posts**: Each blog post card has a **"Download"** button
   - Downloads the blog post as `.txt` file
   
2. **Videos**: Video recorder has a **"Download Video"** button
   - Downloads as `.webm` video file
   
3. **Ads**: Ad editor has a **"Download Ad"** button
   - Downloads as `.png` image file

4. **Code Snippets**: Social Media Settings has **"Download"** for scripts
   - Downloads as `.js`, `.py`, or `.sh` file

### Download Full Project:
- Use **Git Repair** for complete project download
- Use **GitHub Upload** to push to repository
- Use **Download ZIP** for local backup

---

## System Architecture

```
Git Repair Self-Healing System
         │
         ├─► Deep Scan (Detects errors)
         │
         ├─► Pattern Fix (No AI credits)
         │    └─► 7 common patterns fixed
         │
         ├─► AI Fix (OpenRouter when needed)
         │    └─► Complex errors solved
         │
         ├─► Build Test (Verification)
         │    └─► Ensures project compiles
         │
         └─► Download/Upload
              ├─► Download ZIP
              └─► Upload to GitHub
```

---

## Quick Reference Commands

### After Downloading ZIP:

```bash
# Standard setup
unzip git-repair-fixed-project.zip
cd git-repair-fixed-project
npm install
npm run dev

# If you want to build for production
npm run build

# If you want to deploy
npm run build
npm start
```

---

## Support

If you encounter issues:

1. **Check Terminal Logs**: Look for error messages in Git Repair terminal
2. **Run Build Test**: Verify your project before download
3. **Check Summary**: Download the repair summary for details
4. **Re-scan**: Sometimes a second scan catches additional issues
5. **Pattern Fixes**: Most issues are fixed automatically without AI

---

**Git Repair Status**: ✅ Operational  
**Pattern Fixes**: ✅ Active (saves AI credits)  
**Download**: ✅ Full project ZIP available  
**GitHub Upload**: ✅ Direct push supported  
**Build Verification**: ✅ Automated testing  

**Last Updated**: March 12, 2026  
**System**: Self-Healing Build System v5.0
