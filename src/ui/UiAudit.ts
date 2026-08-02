export interface UiBounds { x: number; y: number; width: number; height: number }
export interface UiAuditSnapshot {
  scene: string; title: string; titleCount: number; footerCount: number; focusedId: string | null;
  interactiveItems: { id: string; type: string; role: string; label: string; enabled: boolean; destructive: boolean; focused: boolean; parentPanel: string; fontSize: number; bounds: UiBounds }[];
  textBlocks: { id: string; text: string; fontSize: number; bounds: UiBounds; metadata?: boolean }[];
  panels: { id: string; bounds: UiBounds }[];
}
const snapshots = new Map<string, UiAuditSnapshot>();
export const publishUiAudit = (snapshot: UiAuditSnapshot): void => { snapshots.set(snapshot.scene, snapshot); };
export const readUiAudit = (scene: string): UiAuditSnapshot | null => snapshots.get(scene) ?? null;
