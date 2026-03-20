# Pre-Commit Review Skill

Automatically review code changes for security vulnerabilities, performance issues, and code quality problems before committing.

## What It Does

When you ask to commit changes, this skill:

1. **Scans staged files** for security vulnerabilities and performance issues
2. **Auto-fixes** common problems (XSS, memory leaks, missing validation)
3. **Runs tests** to verify changes don't break anything
4. **Commits** with a well-formatted message
5. **Pushes** to remote repository

## Quick Start

Just commit normally:

```
You: "commit and push my changes"
```

The agent will:
- Review all staged changes
- Fix security issues automatically
- Run tests
- Commit with proper message format
- Push to remote

## What Gets Checked

### 🔴 Critical (Must Fix)
- **XSS vulnerabilities** - innerHTML with user data
- **Data injection** - localStorage/network without validation
- **Command injection** - Unsafe exec/eval usage

### 🟡 High Priority (Should Fix)
- **Memory leaks** - Timers and event listeners not cleaned up
- **Performance** - O(n²) loops, unnecessary re-renders
- **Resource cleanup** - Audio, textures, connections

### 🟢 Low Priority (Can Fix)
- **Type safety** - `as any` casts
- **Error handling** - Empty catch blocks
- **Code style** - Console.log, magic numbers

## Configuration

Edit `.gsd/skills/pre-commit-review/config.json`:

```json
{
  "autoFix": true,           // Auto-fix issues when possible
  "blockOnCritical": true,   // Prevent commit if critical issues found
  "blockOnHigh": false,      // Allow commit with warnings
  "skipTests": false,        // Run tests before commit
  "requireBuildSuccess": false // Require successful build
}
```

## Examples

### Example 1: XSS Fixed Automatically

**Before:**
```typescript
status.innerHTML = `Connecting to ${hostId}...`;
```

**Agent fixes:**
```typescript
status.textContent = `Connecting to ${hostId}...`;
```

**Commit message:**
```
fix(security): sanitize innerHTML in status display

Replaced innerHTML with textContent to prevent XSS.
```

### Example 2: Memory Leak Fixed

**Before:**
```typescript
constructor() {
    setInterval(() => this.saveZoo(), 5000);
}
```

**Agent fixes:**
```typescript
private saveInterval?: NodeJS.Timer;

constructor() {
    this.saveInterval = setInterval(() => this.saveZoo(), 5000);
}

public destroy() {
    if (this.saveInterval) {
        clearInterval(this.saveInterval);
    }
}
```

**Commit message:**
```
perf(core): add cleanup to prevent memory leaks

Added destroy() method to EditorManager to clean up timers.
```

### Example 3: Data Validation Added

**Before:**
```typescript
const data = JSON.parse(localStorage.getItem('save'));
```

**Agent fixes:**
```typescript
import { z } from 'zod';

const SaveSchema = z.object({
    name: z.string().max(50),
    cash: z.number().min(0).max(10_000_000)
});

const raw = localStorage.getItem('save');
const data = raw ? SaveSchema.parse(JSON.parse(raw)) : null;
```

**Commit message:**
```
fix(security): add localStorage validation

Added zod schema validation for save data to prevent injection.
```

## Manual Review

You can also invoke review without committing:

```
You: "review my changes for security issues"
You: "check staged files for problems"
You: "scan for performance issues"
```

## Skip Review

Emergency bypass:

```
You: "skip review and force push"
```

Or use git directly:
```bash
git commit --no-verify -m "emergency fix"
git push
```

## Dependencies

The skill will auto-install these if needed:
- `zod` - Runtime validation
- `dompurify` - HTML sanitization (if HTML in innerHTML is required)

## Files Created

The skill creates these helper utilities as needed:

- `web/src/utils/sanitize.ts` - HTML/text sanitization
- `web/src/utils/logger.ts` - Structured logging
- `web/src/utils/validators.ts` - Zod schemas for validation

## Integration with GSD

Add to `.gsd/preferences.md` to run automatically in GSD auto-mode:

```markdown
## Pre-Commit Review

auto_review_before_commit: true
review_skill: pre-commit-review
```

## Troubleshooting

**Q: Review is too slow**  
A: Set `"skipTests": true` in config.json

**Q: Too many false positives**  
A: Disable specific rules in config.json

**Q: Need to commit urgently**  
A: Say "skip review and commit" or use `git commit --no-verify`

**Q: Auto-fix broke something**  
A: Run `git diff` to see changes, then `git checkout -- <file>` to undo

## See Also

- [SKILL.md](./SKILL.md) - Full skill implementation details
- [REFERENCE.md](./REFERENCE.md) - Quick reference for patterns
- [config.json](./config.json) - Configuration options

---

**Version:** 1.0.0  
**Created:** 2026-03-19  
**For:** Browser Zoo Project
