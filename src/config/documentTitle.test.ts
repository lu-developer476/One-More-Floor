import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';

describe('browser presentation', () => {
  it('uses the exact document title', () => {
    expect(html.match(/<title>(.*?)<\/title>/)?.[1]).toBe('One More Floor');
    expect(html).toContain('<meta property="og:title" content="One More Floor" />');
  });
});
