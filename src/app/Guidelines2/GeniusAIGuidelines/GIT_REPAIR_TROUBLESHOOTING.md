# 🔧 Git Repair - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot access repository" Error

**Symptoms:**
```
❌ Cannot access repository owner/repo
🔑 GitHub authentication failed
```

**Root Cause:** Invalid or missing GitHub Personal Access Token

**Solutions:**

#### Option A: No Token Provided
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "Git Repair Access"
4. Select scopes: ✅ **repo** (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Paste into Git Repair "GitHub Token" field

#### Option B: Invalid Token
Your token may be:
- **Expired**: Tokens can have expiration dates
- **Revoked**: Check if you deleted the token on GitHub
- **Wrong format**: Should start with `ghp_` or `ghs_`
- **Missing permissions**: Needs full "repo" scope

**How to Fix:**
1. Visit https://github.com/settings/tokens
2. Find your token in the list
3. Check expiration date and scopes
4. If missing "repo" scope → Delete and create new token
5. If expired → Create new token with no expiration (or longer expiration)

#### Option C: Repository Not Found
- **Private repo**: Requires token with access
- **Misspelled name**: Verify owner/repo in URL
- **Token lacks access**: Token's account must have read access to the repo

---

### Issue 2: "No AI models available" Error

**Symptoms:**
```
❌ No AI models available and pattern-based fix could not be applied
Please add credits at https://openrouter.ai/settings/credits
```

**Root Cause:** 
- OpenRouter credits exhausted
- Error requires AI analysis (pattern fix not applicable)

**Solutions:**

#### Quick Fix: Add OpenRouter Credits
1. Go to https://openrouter.ai/settings/credits
2. Add credits ($5-10 recommended)
3. Retry the fix operation

#### Alternative: Use Pattern Fixes (Free!)
Pattern fixes work WITHOUT AI credits for:
- ✅ react-router-dom errors
- ✅ Missing React imports
- ✅ Missing React hooks (useState, useEffect)
- ✅ Import extension errors (.js → .ts)
- ✅ package.json dependency issues

**These errors are automatically fixed for FREE!**

#### Manual Fix
If you don't want to add credits:
1. Click on the error in Git Repair
2. Read the error message and suggestion
3. Manually edit the file in your code editor
4. Commit and push the fix

---

### Issue 3: Token Format Errors

**Symptoms:**
```
🔐 Token format looks invalid
```

**Valid GitHub Token Formats:**
- Personal Access Token (classic): `ghp_1234567890abcdefABCDEF1234567890abcd`
- Personal Access Token (fine-grained): `github_pat_...`
- OAuth token: `gho_...`

**Invalid Formats:**
- ❌ Username:password
- ❌ SSH keys
- ❌ Random strings
- ❌ API keys from other services

**Solution:**
Only use GitHub Personal Access Tokens from:
https://github.com/settings/tokens

---

### Issue 4: Rate Limit Exceeded

**Symptoms:**
```
403 Forbidden
Rate limit exceeded
```

**Cause:** Too many requests to GitHub API

**Solutions:**

#### With Token:
- Authenticated rate limit: 5,000 requests/hour
- Usually sufficient for normal use
- Wait 1 hour or use a different token

#### Without Token:
- Unauthenticated rate limit: 60 requests/hour
- Add a GitHub token to increase limit

---

### Issue 5: Repository Too Large

**Symptoms:**
```
Repository has 10,000+ files
Scan taking very long
```

**Solutions:**

#### Automatic Optimization:
Git Repair automatically:
- Prioritizes important files (App.tsx, index.tsx, routes)
- Skips test files, node_modules, dist, build folders
- Scans up to 150 most important files

#### Manual Optimization:
1. **Clone locally** instead of using Git Repair
2. **Fix errors locally** with your IDE
3. **Use Git Repair** only for final validation

---

## 🎯 Best Practices

### Token Security

**DO:**
- ✅ Use fine-grained tokens with minimum required permissions
- ✅ Set expiration dates (30-90 days recommended)
- ✅ Regenerate tokens periodically
- ✅ Store tokens in browser localStorage (auto-saved)
- ✅ Delete unused tokens from GitHub settings

**DON'T:**
- ❌ Share tokens publicly
- ❌ Commit tokens to repositories
- ❌ Use tokens with unnecessary permissions
- ❌ Keep tokens without expiration
- ❌ Reuse the same token across multiple services

### Scanning Strategy

**For Small Repos (<100 files):**
1. Clone entire repo
2. Scan all files
3. Fix all errors automatically

**For Medium Repos (100-1,000 files):**
1. Clone entire repo
2. Git Repair auto-prioritizes files
3. Fix critical errors first
4. Review warnings separately

**For Large Repos (1,000+ files):**
1. Clone locally with git
2. Use your IDE's linter
3. Use Git Repair for final validation only
4. Focus on specific directories

### Credit Management

**Free Fixes (0 credits):**
- react-router-dom errors
- Missing imports (React, hooks)
- Basic syntax errors
- Package.json fixes

**Paid Fixes (AI required):**
- Complex logic errors
- Refactoring suggestions
- Performance optimizations
- Architecture improvements

**Credit Saving Tips:**
1. **Fix patterns first**: Let pattern fixes run before AI
2. **Batch fixes**: Fix multiple errors at once
3. **Manual review**: Some errors are faster to fix manually
4. **Use free models**: Git Repair tries free AI models first

---

## 🔍 Debugging Guide

### Enable Detailed Logging

**In Browser Console:**
```javascript
// Show all Git Repair logs
localStorage.setItem('gitRepairDebug', 'true');

// Show network requests
localStorage.setItem('gitRepairNetworkDebug', 'true');
```

**Server Logs:**
All server operations are logged with `[GitRepair]` prefix.
Check browser Network tab → Response for server logs.

### Common Log Messages

**✅ Success:**
```
[GitRepair] ✅ Pattern-based fix successful!
[GitRepair] ✅ SUCCESS - Replaced react-router-dom with react-router
[GitRepair] ✅ Created basic router file as fallback
```

**⚠️ Warnings:**
```
[GitRepair] ⚠️ No token provided - attempting unauthenticated request
[GitRepair] ⚠️ File contains 'react-router-dom' but replacements didn't change anything
```

**❌ Errors:**
```
[GitRepair] ❌ AUTHENTICATION FAILED on repo info request
[GitRepair] ❌ No content available and not a router error - cannot fix
[GitRepair] ❌ PATTERN FIX FAILED - No applicable patterns found
```

---

## 📞 Getting Help

### Self-Service Resources
1. **Check this guide** for common issues
2. **Review error messages** in terminal output
3. **Check browser console** for JavaScript errors
4. **Verify GitHub token** at https://github.com/settings/tokens

### Error Knowledge Base
Consult `/ERROR_KNOWLEDGE_BASE.md` for:
- Comprehensive error catalog
- Detailed fix instructions
- Pattern recognition rules

### Documentation
- `/GIT_REPAIR_FIXES_COMPLETE.md` - Recent fixes and improvements
- `/docs/git-repair-brain-integration.md` - Technical architecture
- `/imports/git-repair-doc.md` - Original documentation

---

## 🚀 Quick Checklist

Before using Git Repair, verify:

- [ ] GitHub repository URL is correct
- [ ] GitHub Personal Access Token is valid
- [ ] Token has "repo" scope enabled
- [ ] Token is not expired
- [ ] Repository is accessible with the token
- [ ] OpenRouter API key is configured (for AI fixes)
- [ ] Browser has internet connection
- [ ] No browser extensions blocking requests

---

## 💡 Pro Tips

1. **Test with public repos first**: Verify Git Repair works before using with private repos

2. **Use pattern fixes**: Most common errors are fixed free without AI

3. **Batch operations**: Clone once, fix multiple errors together

4. **Monitor credits**: Check OpenRouter balance before large operations

5. **Keep tokens secure**: Never share or commit your GitHub tokens

6. **Regular token rotation**: Update tokens every 30-90 days for security

7. **Local backups**: Always have a local copy before running automated fixes

8. **Review fixes**: Check AI-generated fixes before committing

---

**Last Updated:** March 10, 2026  
**Version:** 2.0 (Enhanced Authentication & Pattern Fixes)
