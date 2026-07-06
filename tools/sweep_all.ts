import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';

const run = promisify(execFile);

// Driver for sweep_assets.ts. One `sweep_assets --only=<chunk>` subprocess per
// chunk, run in a small concurrent pool. Why subprocesses: Jimp's PNG encode
// holds native (off-heap) memory that neither GC nor --max-old-space-size can
// reclaim — only process exit frees it. A single process over the whole 328k-file
// corpus climbs to OOM; chunked, each subprocess peaks ~1.6GB / ~900 graphics and
// exits clean (measured via /usr/bin/time). Chunks: animal species subdirs (the
// big category, ~250 of them) individually, every other top-level dir whole.
const CONCURRENCY = 4;   // 4 × ~1.6GB peak ≈ 6.5GB, safe on this 15GB / 12-core box

function chunks(): string[] {
    const am = new ArchiveManager('Gamefiles');
    const tops = new Set<string>();
    const speciesUnderAnimals = new Set<string>();
    for (const f of am.listFiles()) {
        const parts = f.split('/');
        tops.add(parts[0]);
        if (parts[0] === 'animals' && parts.length > 2) speciesUnderAnimals.add(`animals/${parts[1]}`);
    }
    const out: string[] = [];
    for (const t of tops) {
        if (t.includes('.')) continue;   // loose root file (no '/'); handled by the roots pass
        if (t === 'animals') out.push(...speciesUnderAnimals);   // split the big one
        else out.push(t);
    }
    return out.sort();
}

const ROOTS = '__roots__';   // sentinel: sweep loose top-level files (no '/')

async function main() {
    const list = [...chunks(), ROOTS];
    console.log(`${list.length} chunks, concurrency ${CONCURRENCY}`);
    const script = path.join(__dirname, 'sweep_assets.ts');
    let next = 0, done = 0, failed = 0;
    const totals = { accounted: 0, total: 0, decoded: 0, copied: 0, failures: 0, unrecognized: 0 };
    // Each subprocess writes its own data/sweep-report.json (they'd clobber each
    // other), so aggregate accounting here from each chunk's "Done." stdout line:
    //   Done. accounted=N/N decoded=.. copied=.. skippedPal=.. failures=.. unrecognized=..
    function tally(out: string): void {
        const g = (re: RegExp) => Number(out.match(re)?.[1] ?? 0);
        totals.accounted += g(/accounted=(\d+)\//);
        totals.total += g(/accounted=\d+\/(\d+)/);
        totals.decoded += g(/decoded=(\d+)/);
        totals.copied += g(/copied=(\d+)/);
        totals.failures += g(/failures=(\d+)/);
        totals.unrecognized += g(/unrecognized=(\d+)/);
    }
    async function worker(): Promise<void> {
        while (next < list.length) {
            const chunk = list[next++];
            const arg = chunk === ROOTS ? '--roots-only' : `--only=${chunk}/`;
            try {
                // async spawn (not execFileSync) so CONCURRENCY workers actually run
                // in parallel — a sync call blocks the single JS thread and serializes
                // the whole pool.
                const { stdout } = await run('node', ['-r', 'ts-node/register', script, arg], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
                tally(stdout);
            } catch (e) {
                failed++;
                console.error(`chunk FAILED: ${chunk}`);
            }
            if (++done % 10 === 0 || done === list.length) console.log(`  ${done}/${list.length} chunks (${failed} failed)`);
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`Done. ${done} chunks, ${failed} failed.`);
    console.log('Aggregate:', JSON.stringify(totals));
    if (failed) process.exit(1);
}

main();
