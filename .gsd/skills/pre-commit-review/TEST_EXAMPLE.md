# Test Example - Pre-Commit Review Skill

This example demonstrates how the skill detects and fixes issues.

## Test Case: XSS Vulnerability

### Step 1: Create a vulnerable file

Create `web/src/test-vuln.ts`:

```typescript
export class TestComponent {
    private statusElement: HTMLElement;
    
    constructor() {
        this.statusElement = document.createElement('div');
        document.body.appendChild(this.statusElement);
    }
    
    // VULNERABLE: XSS attack possible
    setStatus(message: string) {
        this.statusElement.innerHTML = `Status: ${message}`;
    }
    
    // VULNERABLE: Memory leak
    startPolling() {
        setInterval(() => this.poll(), 1000);
    }
    
    private poll() {
        console.log('Polling...');
    }
}
```

### Step 2: Stage the file

```bash
git add web/src/test-vuln.ts
```

### Step 3: Ask to commit

```
You: "commit and push this"
```

### Expected Agent Behavior

```
Agent:
1. Scanning staged files...
   Found: web/src/test-vuln.ts

2. Running security checks...
   🔴 CRITICAL: XSS vulnerability detected
   Line 10: this.statusElement.innerHTML = `Status: ${message}`;
   
   Auto-fixing: Replacing innerHTML with textContent

3. Running performance checks...
   🟡 HIGH: Memory leak detected
   Line 15: setInterval without cleanup
   
   Auto-fixing: Adding cleanup method

4. Running code quality checks...
   🟢 LOW: console.log statement
   Line 19: console.log('Polling...')
   
   Auto-fixing: Replacing with logger.debug

5. Applying fixes...
   ✓ Fixed XSS vulnerability
   ✓ Added destroy() method
   ✓ Replaced console.log with logger

6. Running tests...
   ✓ Type check passed
   ✓ Build succeeded

7. Generating commit message...
   fix(security): sanitize innerHTML and add cleanup to TestComponent

8. Committing...
   ✓ Committed: abc1234

9. Pushing...
   ✓ Pushed to origin/main

Complete! All security issues fixed.
```

### Step 4: Verify the fixes

```bash
git diff HEAD~1
```

**Expected output:**

```typescript
export class TestComponent {
    private statusElement: HTMLElement;
+   private pollInterval?: NodeJS.Timer;
    
    constructor() {
        this.statusElement = document.createElement('div');
        document.body.appendChild(this.statusElement);
    }
    
-   // VULNERABLE: XSS attack possible
+   // FIXED: Safe text rendering
    setStatus(message: string) {
-       this.statusElement.innerHTML = `Status: ${message}`;
+       this.statusElement.textContent = `Status: ${message}`;
    }
    
-   // VULNERABLE: Memory leak
+   // FIXED: Cleanup added
    startPolling() {
-       setInterval(() => this.poll(), 1000);
+       this.pollInterval = setInterval(() => this.poll(), 1000);
    }
    
+   public destroy() {
+       if (this.pollInterval) {
+           clearInterval(this.pollInterval);
+           this.pollInterval = undefined;
+       }
+   }
    
    private poll() {
-       console.log('Polling...');
+       logger.debug('Polling...');
    }
}
```

## Test Case: LocalStorage Injection

### Create vulnerable code

```typescript
export class SaveManager {
    save(data: any) {
        localStorage.setItem('game', JSON.stringify(data));
    }
    
    // VULNERABLE: No validation
    load() {
        const raw = localStorage.getItem('game');
        return JSON.parse(raw!); // Can crash or inject malicious data
    }
}
```

### Expected fix

```typescript
import { z } from 'zod';

const GameSaveSchema = z.object({
    name: z.string().max(50),
    score: z.number().min(0).max(1000000),
    level: z.number().min(1).max(100)
});

export type GameSave = z.infer<typeof GameSaveSchema>;

export class SaveManager {
    save(data: GameSave) {
        localStorage.setItem('game', JSON.stringify(data));
    }
    
    // FIXED: Validation added
    load(): GameSave | null {
        const raw = localStorage.getItem('game');
        if (!raw) return null;
        
        try {
            const parsed = JSON.parse(raw);
            return GameSaveSchema.parse(parsed);
        } catch (e) {
            console.error('Invalid save data:', e);
            return null;
        }
    }
}
```

## Test Case: Network Packet Injection

### Create vulnerable code

```typescript
export class NetworkHandler {
    private connection: WebSocket;
    
    constructor() {
        this.connection = new WebSocket('ws://localhost:8080');
        
        // VULNERABLE: No validation
        this.connection.onmessage = (event) => {
            const packet = JSON.parse(event.data) as GamePacket;
            this.handlePacket(packet);
        };
    }
    
    private handlePacket(packet: GamePacket) {
        // Process untrusted data
    }
}
```

### Expected fix

```typescript
import { z } from 'zod';

const GamePacketSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('move'), x: z.number(), y: z.number() }),
    z.object({ type: z.literal('chat'), message: z.string().max(200) }),
    z.object({ type: z.literal('action'), action: z.string(), data: z.any() })
]);

export type GamePacket = z.infer<typeof GamePacketSchema>;

export class NetworkHandler {
    private connection: WebSocket;
    
    constructor() {
        this.connection = new WebSocket('ws://localhost:8080');
        
        // FIXED: Validation added
        this.connection.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                const packet = GamePacketSchema.parse(parsed);
                this.handlePacket(packet);
            } catch (e) {
                console.error('Invalid packet received:', e);
            }
        };
    }
    
    private handlePacket(packet: GamePacket) {
        // Process validated data
    }
}
```

## Manual Test Commands

```bash
# 1. Create test file with vulnerabilities
cat > web/src/test-vuln.ts << 'ENDFILE'
export class Test {
    start() {
        document.getElementById('status')!.innerHTML = `Hello ${userName}`;
        setInterval(() => console.log('tick'), 1000);
    }
}
ENDFILE

# 2. Stage it
git add web/src/test-vuln.ts

# 3. Trigger skill
# Say to agent: "commit this change"

# 4. Verify fixes were applied
git diff HEAD~1 web/src/test-vuln.ts

# 5. Clean up
git reset HEAD~1
rm web/src/test-vuln.ts
```

## Expected Commit Message Format

```
fix(security): sanitize innerHTML and add cleanup to TestComponent

Fixed XSS vulnerability by replacing innerHTML with textContent.
Added destroy() method to clean up setInterval timer.
Replaced console.log with logger.debug.

Security fixes:
- XSS vulnerability in setStatus() (line 10)
- Memory leak in startPolling() (line 15)

Performance improvements:
- Proper cleanup prevents memory leaks

Files changed: 1
Insertions: 8
Deletions: 3
```

## Bypass Test

```bash
# If you need to commit without review
git commit --no-verify -m "test commit"

# Or tell agent
"skip review and commit with message 'test commit'"
```

## Success Criteria

After the skill runs, verify:

✅ XSS vulnerabilities fixed (innerHTML → textContent)  
✅ Memory leaks fixed (cleanup methods added)  
✅ Data validation added (zod schemas)  
✅ console.log replaced with logger  
✅ Tests passed  
✅ Commit created  
✅ Changes pushed  
✅ Commit message follows convention  

---

**Test this skill by creating one of the vulnerable examples above and asking to commit!**
