# Pre-Commit Security & Performance Review

**Trigger phrases:** "commit", "push", "commit and push", "check in", "save changes", "git commit"

**Purpose:** Automatically review staged changes for security vulnerabilities, performance issues, and code quality problems before committing. Fixes issues found, runs tests, then commits and pushes.

---

## Activation

This skill activates when the user requests to commit code changes. It performs a focused review of **staged changes only** (not the entire codebase), ensuring new code meets security and quality standards.

---

## Review Protocol

### Phase 1: Analyze Staged Changes (2 minutes)

1. **Get diff of staged files:**
   ```bash
   git diff --cached --name-only
   git diff --cached
   ```

2. **Categorize changes:**
   - New files: Full security review
   - Modified files: Review changed lines + 10 line context
   - Deleted files: No review needed

3. **Run static analysis:**
   ```bash
   # TypeScript type checking
   npx tsc --noEmit
   
   # ESLint if configured
   npx eslint $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')
   ```

### Phase 2: Security Checks (High Priority)

Scan changed code for:

#### 2.1 XSS Vulnerabilities
```bash
rg "innerHTML\s*=" $(git diff --cached --name-only) -A 2 -B 2
```

**Detection patterns:**
- `element.innerHTML = ${variable}`
- `element.innerHTML = \`...\${...}\``
- `.innerHTML` without sanitization

**Auto-fix:**
- Replace with `textContent` if plain text
- Add DOMPurify if HTML needed
- Add sanitization helper if not present

#### 2.2 Data Injection
```bash
rg "(localStorage|sessionStorage)\.(getItem|setItem)" $(git diff --cached --name-only) -A 3 -B 1
rg "JSON\.parse" $(git diff --cached --name-only) -A 2 -B 1
```

**Detection patterns:**
- `JSON.parse()` without try/catch or validation
- localStorage loads without schema validation
- Network data deserialization without checks

**Auto-fix:**
- Add zod schema validation for localStorage
- Wrap JSON.parse in try/catch with error handling
- Add input validation for network packets

#### 2.3 Network Security
```bash
rg "\.on\('data'|\.on\('message'|conn\.on" $(git diff --cached --name-only) -A 5
```

**Detection patterns:**
- Network event handlers without validation
- `data as Type` casts without runtime checks
- Missing rate limiting on incoming data

**Auto-fix:**
- Add zod schema for packet validation
- Implement rate limiter if missing
- Add input sanitization

#### 2.4 SQL Injection / Command Injection
```bash
rg "(exec|spawn|eval)\s*\(" $(git diff --cached --name-only) -A 2
rg "query\s*=.*\+|query\s*=.*\`" $(git diff --cached --name-only) -A 2
```

**Detection patterns:**
- String concatenation in queries
- User input in exec/spawn commands
- eval() usage

**Auto-fix:**
- Replace with parameterized queries
- Add input validation
- Remove eval() or add strict sandboxing

### Phase 3: Performance Checks (Medium Priority)

#### 3.1 Memory Leaks
```bash
rg "setInterval|setTimeout" $(git diff --cached --name-only) -A 3 -B 3
rg "addEventListener" $(git diff --cached --name-only) -A 3 -B 3
```

**Detection patterns:**
- `setInterval` without `clearInterval`
- `setTimeout` without `clearTimeout`
- `addEventListener` without `removeEventListener`
- Class constructors with timers but no cleanup method

**Auto-fix:**
- Store timer IDs in class properties
- Add `destroy()` or `cleanup()` method
- Implement cleanup in component unmount

#### 3.2 N+1 and O(n²) Loops
```bash
rg "forEach.*forEach|for.*for\s*\(" $(git diff --cached --name-only) -A 5 -B 2
```

**Detection patterns:**
- Nested loops over same dataset
- Database queries inside loops
- Array.find/filter inside loops

**Auto-fix:**
- Use Maps for O(1) lookups
- Batch database queries
- Use Set for deduplication

#### 3.3 Unnecessary Re-renders / Re-computations
```bash
rg "requestAnimationFrame|setInterval.*render" $(git diff --cached --name-only) -A 3
```

**Detection patterns:**
- Rendering on every frame without dirty checks
- Expensive computations without memoization
- No throttle/debounce on frequent events

**Auto-fix:**
- Add dirty flags
- Implement memoization/caching
- Add throttle/debounce utilities

#### 3.4 Resource Cleanup
```bash
rg "new\s+(Audio|Image|WebSocket|Worker|Peer)" $(git diff --cached --name-only) -A 10
```

**Detection patterns:**
- Creating resources without destroy path
- No `.dispose()` or `.destroy()` calls
- Missing cleanup in catch blocks

**Auto-fix:**
- Add object pooling for frequently created objects
- Implement cleanup methods
- Add try/finally for resource cleanup

### Phase 4: Code Quality Checks (Low Priority)

#### 4.1 Type Safety
```bash
rg "as\s+any|@ts-ignore|@ts-expect-error" $(git diff --cached --name-only)
```

**Detection patterns:**
- `as any` casts
- `@ts-ignore` comments
- Optional chaining abuse (`obj?.?.?.`)

**Auto-fix:**
- Replace with proper types
- Add runtime checks where needed
- Document why type assertion is safe

#### 4.2 Error Handling
```bash
rg "catch\s*\(\s*\)|catch.*\{\s*\}" $(git diff --cached --name-only) -A 1
rg "Promise.*then.*catch|async.*await" $(git diff --cached --name-only) -A 5
```

**Detection patterns:**
- Empty catch blocks
- Async functions without try/catch
- Promises without .catch()

**Auto-fix:**
- Add error logging
- Implement error recovery strategy
- Add user-facing error messages

#### 4.3 Magic Numbers / Hardcoded Values
```bash
rg "\b(100|1000|5000|10000)\b" $(git diff --cached --name-only) --type ts -A 1 -B 1
```

**Detection patterns:**
- Numeric literals in logic (not 0, 1, -1)
- Hardcoded strings used multiple times
- No constants file

**Auto-fix:**
- Extract to named constants
- Create config object
- Add inline comments explaining values

#### 4.4 Console Statements
```bash
rg "console\.(log|debug|info)" $(git diff --cached --name-only)
```

**Detection patterns:**
- console.log in production code
- No logging levels
- Sensitive data in logs

**Auto-fix:**
- Replace with logger utility
- Remove debug console.logs
- Sanitize logged data

### Phase 5: Fix Issues

For each issue found:

1. **Categorize severity:**
   - 🔴 Critical (security): MUST fix before commit
   - 🟡 High (perf/quality): SHOULD fix before commit
   - 🟢 Low (style): CAN fix before commit

2. **Attempt auto-fix:**
   - Apply safe transformations automatically
   - Generate fix code for common patterns
   - Create helper utilities if needed

3. **Report unfixable issues:**
   - Show code location and explanation
   - Suggest manual fix
   - Ask user: "Fix manually, skip, or abort commit?"

### Phase 6: Test Changes

```bash
# Type check
npx tsc --noEmit

# Run linter if configured
npx eslint . --ext .ts,.tsx,.js,.jsx --fix

# Run tests on changed files
npm test -- --findRelatedTests $(git diff --cached --name-only)

# Build check
npm run build || vite build
```

If any test fails:
- Show failure output
- Ask user: "Fix and retry, skip tests, or abort?"

### Phase 7: Commit & Push

```bash
# Stage auto-fixed files
git add -u

# Generate commit message from changes
# Format: <type>(<scope>): <subject>
# Types: fix, feat, perf, refactor, security, chore

git commit -m "<generated message>"

# Push to remote
git push
```

---

## Auto-Fix Patterns

### Pattern: innerHTML → textContent

**Before:**
```typescript
status.innerHTML = `Connecting to ${hostId}...`;
```

**After:**
```typescript
status.textContent = `Connecting to ${hostId}...`;
```

### Pattern: Add localStorage validation

**Before:**
```typescript
const data = JSON.parse(localStorage.getItem('key'));
```

**After:**
```typescript
import { z } from 'zod';

const schema = z.object({
    name: z.string(),
    value: z.number()
});

const raw = localStorage.getItem('key');
if (!raw) throw new Error('No data found');

let data;
try {
    const parsed = JSON.parse(raw);
    data = schema.parse(parsed);
} catch (e) {
    console.error('Invalid data:', e);
    throw e;
}
```

### Pattern: Add cleanup for timers

**Before:**
```typescript
constructor() {
    setInterval(() => this.update(), 1000);
}
```

**After:**
```typescript
private updateTimer?: NodeJS.Timer;

constructor() {
    this.updateTimer = setInterval(() => this.update(), 1000);
}

public destroy() {
    if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = undefined;
    }
}
```

### Pattern: Add event listener cleanup

**Before:**
```typescript
window.addEventListener('click', this.handleClick);
```

**After:**
```typescript
private handleClick = () => { /* ... */ };

constructor() {
    window.addEventListener('click', this.handleClick);
}

public destroy() {
    window.removeEventListener('click', this.handleClick);
}
```

### Pattern: Add network validation

**Before:**
```typescript
conn.on('data', (data) => {
    this.handlePacket(data as Packet);
});
```

**After:**
```typescript
import { z } from 'zod';

const PacketSchema = z.object({
    type: z.enum(['message', 'action']),
    payload: z.any()
});

conn.on('data', (data) => {
    try {
        const validated = PacketSchema.parse(data);
        this.handlePacket(validated);
    } catch (e) {
        console.error('Invalid packet:', e);
    }
});
```

### Pattern: Optimize nested loops

**Before:**
```typescript
items.forEach(item => {
    users.forEach(user => {
        if (user.id === item.userId) {
            // O(n²)
        }
    });
});
```

**After:**
```typescript
const userMap = new Map(users.map(u => [u.id, u]));
items.forEach(item => {
    const user = userMap.get(item.userId); // O(n)
    if (user) {
        // ...
    }
});
```

---

## Configuration

Create `.gsd/skills/pre-commit-review/config.json`:

```json
{
    "autoFix": true,
    "severity": {
        "blockOnCritical": true,
        "blockOnHigh": false,
        "blockOnLow": false
    },
    "rules": {
        "xss": { "enabled": true, "autoFix": true },
        "injection": { "enabled": true, "autoFix": true },
        "memoryLeaks": { "enabled": true, "autoFix": true },
        "networkValidation": { "enabled": true, "autoFix": false },
        "performance": { "enabled": true, "autoFix": false },
        "magicNumbers": { "enabled": false, "autoFix": false },
        "consoleStatements": { "enabled": true, "autoFix": true }
    },
    "skipTests": false,
    "requireBuildSuccess": true
}
```

---

## Usage Examples

### Example 1: Basic commit
```
User: "commit and push my changes"

Agent:
1. Checks git status → 3 files staged
2. Scans web/src/main.ts for issues
   - Found: innerHTML XSS vulnerability (line 45)
   - Fixed: Replaced with textContent
3. Scans web/src/core/EditorManager.ts
   - Found: setInterval without cleanup (line 37)
   - Fixed: Added destroy() method with clearInterval
4. Runs tests → All pass
5. Commits with message: "fix(security): sanitize innerHTML, add cleanup methods"
6. Pushes to remote
```

### Example 2: Critical issue found
```
User: "push this"

Agent:
1. Scans staged changes
2. Found CRITICAL: Network data deserialized without validation
3. Auto-fix attempted → Added zod schema
4. Tests pass
5. Shows fix to user: "Added packet validation schema. Review changes?"
6. User: "looks good"
7. Commits and pushes
```

### Example 3: Unfixable issue
```
User: "commit"

Agent:
1. Scans changes
2. Found: Complex O(n³) algorithm in pathfinding
3. Cannot auto-fix (requires refactor)
4. Shows issue to user:
   "⚠️  Performance issue in Pathfinder.ts:45
    Nested triple loop may cause lag with large grids.
    
    Options:
    - Fix manually (abort commit)
    - Skip this check
    - Commit anyway with //TODO comment"
5. User chooses action
```

---

## Integration with GSD Workflow

When GSD auto-mode is running, this skill can be configured to run automatically before each slice completion:

```markdown
# In .gsd/preferences.md

auto_review_before_commit: true
review_skill: pre-commit-review
```

---

## Helper Utilities

The skill will create/use these helper utilities as needed:

### `web/src/utils/sanitize.ts`
```typescript
export function sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

export function sanitizeText(text: string): string {
    return text.replace(/[<>'"]/g, '');
}
```

### `web/src/utils/logger.ts`
```typescript
enum LogLevel { ERROR, WARN, INFO, DEBUG }

class Logger {
    private level: LogLevel = 
        process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    
    error(...args: any[]) { console.error('[ERROR]', ...args); }
    warn(...args: any[]) { if (this.level >= LogLevel.WARN) console.warn('[WARN]', ...args); }
    info(...args: any[]) { if (this.level >= LogLevel.INFO) console.info('[INFO]', ...args); }
    debug(...args: any[]) { if (this.level >= LogLevel.DEBUG) console.debug('[DEBUG]', ...args); }
}

export const logger = new Logger();
```

### `web/src/utils/validators.ts`
```typescript
import { z } from 'zod';

export const ZooSaveSchema = z.object({
    name: z.string().max(50),
    date: z.string(),
    terrain: z.array(z.number().min(0).max(10)).length(5625),
    paths: z.array(z.number()),
    animals: z.array(z.object({
        id: z.string().max(20),
        tileX: z.number().min(0).max(74),
        tileY: z.number().min(0).max(74)
    })).max(200),
    scenery: z.array(z.any()).max(500),
    fences: z.array(z.any()).max(1000),
    cash: z.number().min(0).max(10_000_000)
});

export function validateLocalStorage<T>(
    key: string,
    schema: z.ZodSchema<T>
): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    try {
        const parsed = JSON.parse(raw);
        return schema.parse(parsed);
    } catch (e) {
        console.error(`Invalid data for ${key}:`, e);
        return null;
    }
}
```

---

## Success Criteria

After running this skill:

✅ No XSS vulnerabilities in committed code  
✅ All localStorage/network data validated  
✅ No memory leaks from timers/listeners  
✅ All tests pass  
✅ Build succeeds  
✅ Type checking passes  
✅ Commit message follows convention  
✅ Changes pushed to remote  

---

## Emergency Bypass

If the user needs to commit urgently without review:

```bash
git commit --no-verify -m "message"
git push
```

Or tell the agent: "skip review and force push"

---

**Skill Version:** 1.0.0  
**Last Updated:** 2026-03-19  
**Maintained by:** GSD Agent
