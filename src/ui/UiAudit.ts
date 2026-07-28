export interface UiBounds { x: number; y: number; width: number; height: number }
export interface UiAuditSnapshot {
  scene: string; title: string; focusedId: string | null;
  interactiveItems: { id: string; label: string; enabled: boolean; destructive: boolean; bounds: UiBounds }[];
  textBlocks: { id: string; text: string; fontSize: number; bounds: UiBounds; metadata?: boolean }[];
  panels: { id: string; bounds: UiBounds }[];
}
const snapshots = new Map<string, UiAuditSnapshot>();
export const publishUiAudit = (snapshot: UiAuditSnapshot): void => { if (import.meta.env.VITE_E2E) snapshots.set(snapshot.scene, snapshot); };
export const readUiAudit = (scene: string): UiAuditSnapshot | null => snapshots.get(scene) ?? null;
