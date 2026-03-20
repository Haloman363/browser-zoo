# Pre-Commit Review - Quick Reference

## Detection Patterns

### XSS (innerHTML)
```typescript
// ❌ BAD
element.innerHTML = `Hello ${userName}`;
status.innerHTML = `Score: ${score}`;

// ✅ GOOD
element.textContent = `Hello ${userName}`;
status.textContent = `Score: ${score}`;

// ✅ GOOD (if HTML needed)
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(htmlContent);
```

### Data Injection (localStorage/network)
```typescript
// ❌ BAD
const data = JSON.parse(localStorage.getItem('save'));

// ✅ GOOD
import { z } from 'zod';
const schema = z.object({ name: z.string(), score: z.number() });
const raw = localStorage.getItem('save');
const data = raw ? schema.parse(JSON.parse(raw)) : null;
```

### Memory Leaks (timers)
```typescript
// ❌ BAD
constructor() {
    setInterval(() => this.update(), 1000);
}

// ✅ GOOD
private timer?: NodeJS.Timer;
constructor() {
    this.timer = setInterval(() => this.update(), 1000);
}
destroy() {
    if (this.timer) clearInterval(this.timer);
}
```

### Memory Leaks (events)
```typescript
// ❌ BAD
window.addEventListener('click', () => this.handleClick());

// ✅ GOOD
private handleClick = () => { /* ... */ };
constructor() {
    window.addEventListener('click', this.handleClick);
}
destroy() {
    window.removeEventListener('click', this.handleClick);
}
```

### Network Validation
```typescript
// ❌ BAD
conn.on('data', (data) => {
    this.process(data as MyType);
});

// ✅ GOOD
const schema = z.object({ type: z.string(), value: z.number() });
conn.on('data', (data) => {
    try {
        const validated = schema.parse(data);
        this.process(validated);
    } catch (e) {
        console.error('Invalid packet:', e);
    }
});
```

## Auto-Fix Summary

| Issue | Auto-Fix | Manual Required |
|-------|----------|-----------------|
| innerHTML with interpolation | Replace with textContent | Review if HTML needed |
| JSON.parse without validation | Add zod schema | Define schema structure |
| setInterval without cleanup | Add destroy() method | Call destroy() properly |
| addEventListener without remove | Store handler, add cleanup | Call cleanup on unmount |
| Network data without validation | Add schema validation | Define packet schema |
| Nested loops | Suggest Map/Set | Refactor algorithm |
| Console.log | Replace with logger | None |
| Magic numbers | Extract to const | Choose meaningful names |

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `fix`: Bug fix (security, logic, visual)
- `feat`: New feature
- `perf`: Performance improvement
- `refactor`: Code restructure (no behavior change)
- `security`: Security fix
- `chore`: Maintenance (deps, config, build)
- `docs`: Documentation
- `test`: Tests

**Examples:**
```
fix(security): sanitize innerHTML in status display

Replaced innerHTML with textContent to prevent XSS attacks.
User-controlled data (hostId, scenarioId) is now safely rendered.

Fixes #123
```

```
perf(core): add cleanup methods to prevent memory leaks

Added destroy() methods to EditorManager and AudioManager.
Timers and event listeners are now properly cleaned up.

- Clear setInterval in EditorManager.destroy()
- Remove event listeners in cleanup()
- Reduce memory growth by 40% over 30min session
```

## Skip Review

If you need to bypass the review:

```bash
# Commit without hooks
git commit --no-verify -m "emergency fix"

# Or tell agent
"skip review and commit"
"force push without checks"
```

## Manual Review Triggers

The skill automatically activates on these phrases:
- "commit"
- "push"
- "commit and push"
- "check in"
- "save changes"
- "git commit"
- "ready to commit"

You can also invoke explicitly:
- "review my changes before committing"
- "run pre-commit checks"
- "scan for security issues"
