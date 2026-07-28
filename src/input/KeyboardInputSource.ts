export interface KeyboardWindow extends EventTarget {
  addEventListener(type: 'blur', listener: EventListener): void;
  removeEventListener(type: 'blur', listener: EventListener): void;
}

export interface KeyboardDocument extends EventTarget {
  readonly hidden: boolean;
}

const heldCodes = new Set<string>();

const isEditable = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  return Boolean(
    element &&
      (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)),
  );
};

/** DOM keyboard adapter. KeyboardEvent.code is the only key representation exposed. */
export class KeyboardInputSource {
  private destroyed = false;

  constructor(
    private readonly usedCode: (code: string) => boolean,
    private readonly windowTarget: KeyboardWindow = window,
    private readonly documentTarget: KeyboardDocument = document,
  ) {
    documentTarget.addEventListener('keydown', this.onKeyDown);
    documentTarget.addEventListener('keyup', this.onKeyUp);
    documentTarget.addEventListener('visibilitychange', this.onVisibilityChange);
    windowTarget.addEventListener('blur', this.clear);
  }

  get activeCodes(): ReadonlySet<string> {
    return heldCodes;
  }

  private onKeyDown = (raw: Event): void => {
    const event = raw as KeyboardEvent;
    heldCodes.add(event.code);
    if (
      this.usedCode(event.code) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !isEditable(event.target)
    )
      event.preventDefault();
  };

  private onKeyUp = (raw: Event): void => {
    const event = raw as KeyboardEvent;
    heldCodes.delete(event.code);
    if (
      this.usedCode(event.code) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !isEditable(event.target)
    )
      event.preventDefault();
  };

  private onVisibilityChange = (): void => {
    if (this.documentTarget.hidden) this.clear();
  };

  private clear = (): void => {
    heldCodes.clear();
  };

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.documentTarget.removeEventListener('keydown', this.onKeyDown);
    this.documentTarget.removeEventListener('keyup', this.onKeyUp);
    this.documentTarget.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.windowTarget.removeEventListener('blur', this.clear);
  }
}
