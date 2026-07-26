import { describe, expect, it } from 'vitest';
import { inspectTrackedFile } from './text-only-policy.mjs';
describe('text-only policy', () => {
  it('accepts source and pure vector SVG', () => expect(inspectTrackedFile('art.svg', '<svg><path d="M0 0"/></svg>', 30)).toEqual([]));
  it('rejects forbidden extensions and embedded payloads', () => {
    expect(inspectTrackedFile('bad.' + 'png', '', 0)).not.toEqual([]);
    expect(inspectTrackedFile('bad.svg', '<' + 'image href="x"/>', 20)).not.toEqual([]);
    expect(inspectTrackedFile('bad.txt', 'data:x;' + 'base64,AAAA', 20)).not.toEqual([]);
  });
});
