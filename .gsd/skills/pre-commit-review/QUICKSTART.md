# Quick Start - Pre-Commit Review Skill

**TL;DR:** Just commit normally. The skill will automatically review, fix issues, and push.

---

## Instant Usage

```
You: "commit and push my changes"
```

The agent will:
1. Scan your staged files
2. Fix security issues automatically
3. Run tests
4. Commit with proper message
5. Push to remote

**That's it.** No setup needed - it just works.

---

## What Gets Fixed Automatically

✅ XSS vulnerabilities (innerHTML → textContent)  
✅ Data injection (adds zod validation)  
✅ Memory leaks (adds cleanup methods)  
✅ Missing error handling  
✅ console.log statements  

---

## Try It Now

### Test 1: Create a vulnerability

```bash
# Create test file with XSS
echo 'const el = document.getElementById("test");
el.innerHTML = userInput;' > web/src/vuln-test.ts

# Stage it
git add web/src/vuln-test.ts
```

### Test 2: Commit

```
You: "commit this"
```

### Test 3: Watch it work

```
Agent:
✓ Found XSS vulnerability in vuln-test.ts
✓ Auto-fixed: innerHTML → textContent
✓ Committed: fix(security): sanitize innerHTML
✓ Pushed to remote

Done!
```

---

## Examples

### Example 1: Basic Commit
```
You: "commit"
→ Agent scans, fixes, commits, pushes
```

### Example 2: Review First
```
You: "review my changes"
→ Agent shows issues found
You: "looks good, commit it"
→ Agent commits and pushes
```

### Example 3: Emergency Bypass
```
You: "skip review and force push"
→ Agent pushes without review
```

---

## Configuration (Optional)

Edit `.gsd/skills/pre-commit-review/config.json`:

```json
{
  "autoFix": true,        // Auto-fix when safe
  "blockOnCritical": true, // Prevent commit if critical
  "skipTests": false      // Run tests before commit
}
```

**Fast mode (skip tests):**
```json
{ "skipTests": true }
```

**Strict mode (block on warnings):**
```json
{ "blockOnHigh": true }
```

---

## Bypass When Needed

```bash
# Git directly
git commit --no-verify -m "emergency"

# Or tell agent
"skip review and commit"
```

---

## Full Documentation

- `.gsd/PRE_COMMIT_SKILL_COMPLETE.md` - Complete overview
- `.gsd/skills/pre-commit-review/README.md` - User guide
- `.gsd/skills/pre-commit-review/SKILL.md` - Implementation
- `.gsd/CODE_REVIEW.md` - Original security audit

---

**That's all you need to know. Just commit - the skill handles the rest!** 🚀
