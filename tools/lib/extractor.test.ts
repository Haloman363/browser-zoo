import test from 'node:test';
import assert from 'node:assert/strict';
import { Extractor } from './extractor';

function header(palName: string, { fatz = false, bg = 0, speed = 100, frames = 0 } = {}): Buffer {
    const name = Buffer.from(palName + '\0', 'utf8');
    const body = Buffer.alloc(4 + 4 + name.length + 4);
    body.writeUInt32LE(speed, 0);
    body.writeUInt32LE(name.length, 4);
    name.copy(body, 8);
    body.writeUInt32LE(frames, 8 + name.length);
    if (!fatz) return body;
    const pre = Buffer.alloc(9);           // "FATZ" + 4 unknown + bg byte
    pre.write('FATZ', 0, 'utf8');
    pre.writeUInt8(bg, 8);
    return Buffer.concat([pre, body]);
}

test('reads a plain (non-FATZ) header', () => {
    const h = Extractor.readHeader(header('animals/asbear/asbear.pal'))!;
    assert.equal(h.speed, 100);
    assert.equal(h.palName, 'animals/asbear/asbear.pal');
    assert.equal(h.frameCount, 0);
    assert.equal(h.hasBackground, false);
});

test('reads a FATZ header with background flag', () => {
    const h = Extractor.readHeader(header('ui/x.pal', { fatz: true, bg: 1 }))!;
    assert.equal(h.hasBackground, true);
    assert.equal(h.palName, 'ui/x.pal');
});

test('strips trailing NULs from palName', () => {
    const h = Extractor.readHeader(header('a/b.pal'))!;
    assert.ok(!h.palName.includes('\0'));
});

test('rejects buffers that are not ZT1 graphics', () => {
    assert.equal(Extractor.readHeader(Buffer.from('this is a text file, not a sprite')), null);
    assert.equal(Extractor.readHeader(Buffer.alloc(4)), null);   // too short
});

test('dataOffset points at first frame record', () => {
    const buf = header('a/b.pal');
    const h = Extractor.readHeader(buf)!;
    assert.equal(h.dataOffset, buf.length);   // header-only buffer: offset === end
});
