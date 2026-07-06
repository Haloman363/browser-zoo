import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { ArchiveManager } from './archive';

// fixture: base.ztd + zupdate.ztd (update archives take priority)
function fixtureDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ztd-'));
    const base = new AdmZip();
    base.addFile('a/B.TXT', Buffer.from('base'));
    base.addFile('only/in/base.dat', Buffer.from('solo'));
    base.writeZip(path.join(dir, 'base.ztd'));
    const upd = new AdmZip();
    upd.addFile('a/b.txt', Buffer.from('updated'));
    upd.writeZip(path.join(dir, 'zupdate.ztd'));
    return dir;
}

const dir = fixtureDir();
const am = new ArchiveManager(dir);

test('update archive overrides base for the same path', () => {
    assert.equal(am.getFile('a/b.txt')!.toString(), 'updated');
});

test('lookups normalize case and backslashes', () => {
    assert.equal(am.getFile('A\\B.TXT')!.toString(), 'updated');
    assert.ok(am.hasFile('ONLY/IN/BASE.DAT'));
});

test('files unique to one archive resolve', () => {
    assert.equal(am.getFile('only/in/base.dat')!.toString(), 'solo');
});

test('listFiles returns normalized paths and honors filter', () => {
    const all = am.listFiles();
    assert.ok(all.includes('a/b.txt'));
    assert.ok(all.includes('only/in/base.dat'));
    assert.deepEqual(am.listFiles(f => f.endsWith('.dat')), ['only/in/base.dat']);
});

test('missing files return null / false', () => {
    assert.equal(am.getFile('nope.txt'), null);
    assert.equal(am.hasFile('nope.txt'), false);
});

test('repeated cross-archive reads stay correct (LRU reopen path)', () => {
    for (let i = 0; i < 5; i++) {
        assert.equal(am.getFile('a/b.txt')!.toString(), 'updated');
        assert.equal(am.getFile('only/in/base.dat')!.toString(), 'solo');
    }
});
