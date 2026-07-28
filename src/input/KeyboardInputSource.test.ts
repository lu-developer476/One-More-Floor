import { describe, expect, it } from 'vitest';
import {
  KeyboardInputSource,
  type KeyboardDocument,
  type KeyboardWindow,
} from './KeyboardInputSource';

class FakeDocument extends EventTarget implements KeyboardDocument {
  hidden = false;
}

const keyboardEvent = (type: string, code: string): Event => {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    code: { value: code },
    ctrlKey: { value: false },
    metaKey: { value: false },
    altKey: { value: false },
  });
  return event;
};

describe('KeyboardInputSource', () => {
  it('tracks code, releases it, and prevents only game bindings', () => {
    const doc = new FakeDocument();
    const win = new EventTarget() as KeyboardWindow;
    const source = new KeyboardInputSource((code) => code === 'Space', win, doc);
    const down = keyboardEvent('keydown', 'Space');
    doc.dispatchEvent(down);
    expect(source.activeCodes.has('Space')).toBe(true);
    expect(down.defaultPrevented).toBe(true);
    doc.dispatchEvent(keyboardEvent('keyup', 'Space'));
    expect(source.activeCodes.size).toBe(0);
    source.destroy();
  });

  it('clears held keys on blur and when the document becomes hidden', () => {
    const doc = new FakeDocument();
    const win = new EventTarget() as KeyboardWindow;
    const source = new KeyboardInputSource(() => true, win, doc);
    doc.dispatchEvent(keyboardEvent('keydown', 'KeyA'));
    win.dispatchEvent(new Event('blur'));
    expect(source.activeCodes.size).toBe(0);
    doc.dispatchEvent(keyboardEvent('keydown', 'KeyD'));
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(source.activeCodes.size).toBe(0);
    source.destroy();
  });

  it('removes every listener on destroy', () => {
    const doc = new FakeDocument();
    const win = new EventTarget() as KeyboardWindow;
    const source = new KeyboardInputSource(() => true, win, doc);
    source.destroy();
    doc.dispatchEvent(keyboardEvent('keydown', 'Enter'));
    expect(source.activeCodes.size).toBe(0);
  });
});
