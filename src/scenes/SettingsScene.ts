import Phaser from 'phaser';
import { ScreenShell, UiFocusController, UiTypography, type UiButtonHandle } from '../ui/UiKit';
import { StorageService, type SaveData, type Settings } from '../services/StorageService';
import { audioService } from '../services/AudioService';
import { eventBus, Events } from '../utils/EventBus';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LocalAnalyticsService } from '../analytics/LocalAnalyticsService';
import { ToastController } from '../ui/Toast';

type SettingsCategory = 'audio' | 'accessibility' | 'gameplay' | 'controls' | 'local-data';
const categories: readonly { id: SettingsCategory; label: string; description: string }[] = [
  { id: 'audio', label: 'AUDIO', description: 'Ajustá volumen y silencio.' },
  { id: 'accessibility', label: 'IMAGEN Y ACCESIBILIDAD', description: 'Reducí estímulos y mejorá la lectura.' },
  { id: 'gameplay', label: 'JUGABILIDAD', description: 'Elegí ayudas visuales y estadísticas.' },
  { id: 'controls', label: 'CONTROLES', description: 'Revisá y personalizá tus asignaciones.' },
  { id: 'local-data', label: 'DATOS LOCALES', description: 'Administrá copias, récords y progreso.' },
];
export class SettingsScene extends Phaser.Scene {
  private service = new StorageService(); private save!: SaveData; private manager!: InputManager;
  private shell!: ScreenShell; private category: SettingsCategory = 'audio'; private categoryIndex = 0; private rowIndex = 0;
  private categoryButtons: UiButtonHandle[] = []; private rowButtons: UiButtonHandle[] = []; private focus!: UiFocusController;
  private content: Phaser.GameObjects.GameObject[] = []; private dialog?: ConfirmDialog; private toast!: ToastController;
  constructor() { super('Settings'); }
  create(): void {
    this.shell = new ScreenShell(this, 'AJUSTES', 'Personalizá audio, accesibilidad, controles y datos locales.');
    this.save = this.service.load(); this.manager = new InputManager(this, this.save.input); this.manager.blockInherited(); this.toast = new ToastController(this);
    this.shell.panel(40, 108, 270, 344, 'categories'); this.shell.panel(328, 108, 592, 344, 'settings-content');
    this.categoryButtons = categories.map((item, index) => this.shell.button(`category-${item.id}`, item.label, 52, 120 + index * 58, 246, () => this.selectCategory(index), { parent: 'categories' }));
    this.focus = new UiFocusController(this.shell, this.categoryButtons); this.renderCategory();
    this.scale.on('enterfullscreen', this.syncFullscreen, this); this.scale.on('leavefullscreen', this.syncFullscreen, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }
  update(): void {
    this.manager.poll(); if (this.dialog) return this.dialog.update(this.manager);
    if (this.manager.wasPressed(InputAction.MENU_LEFT)) this.selectCategory((this.categoryIndex + categories.length - 1) % categories.length);
    if (this.manager.wasPressed(InputAction.MENU_RIGHT)) this.selectCategory((this.categoryIndex + 1) % categories.length);
    if (this.manager.wasPressed(InputAction.MENU_UP)) { this.rowIndex = (this.rowIndex + this.rowButtons.length - 1) % this.rowButtons.length; this.paint(); }
    if (this.manager.wasPressed(InputAction.MENU_DOWN)) { this.rowIndex = (this.rowIndex + 1) % this.rowButtons.length; this.paint(); }
    if (this.manager.wasPressed(InputAction.CONFIRM)) this.rowButtons[this.rowIndex]?.bg.emit('pointerdown');
    if (this.manager.wasPressed(InputAction.BACK)) this.back();
  }
  private selectCategory(index: number): void { this.categoryIndex = index; this.category = categories[index]!.id; this.rowIndex = 0; this.renderCategory(); }
  private clearContent(): void { this.rowButtons.forEach(item => item.destroy()); this.rowButtons = []; this.content.forEach(item => item.destroy()); this.content = []; }
  private heading(text: string, y: number): void { this.content.push(this.add.text(350, y, text, UiTypography(16, '#5ef1ff', true))); }
  private addButton(id: string, label: string, y: number, action: () => void, destructive = false): void { this.rowButtons.push(this.shell.button(id, label, 350, y, 548, action, { parent: 'settings-content', destructive })); }
  private renderCategory(): void {
    this.clearContent(); const definition = categories[this.categoryIndex]!; this.heading(definition.label, 124); this.content.push(this.add.text(350, 150, definition.description, UiTypography(16, '#91a6b6')));
    let y = 184; const toggle = (key: keyof Settings, label: string) => { this.addButton(String(key), `${label}                                      ${this.save.settings[key] ? 'SÍ' : 'NO'}`, y, () => { (this.save.settings[key] as boolean) = !this.save.settings[key]; this.persist(); }); y += 50; };
    if (this.category === 'audio') { this.addButton('volume', `VOLUMEN  ${'■'.repeat(Math.round(this.save.settings.volume * 10))}${'·'.repeat(10 - Math.round(this.save.settings.volume * 10))}  ${Math.round(this.save.settings.volume * 100)}%`, y, () => { this.save.settings.volume = (Math.round(this.save.settings.volume * 10) + 1) % 11 / 10; this.persist(); }); y += 50; toggle('mute', 'SILENCIO'); }
    else if (this.category === 'accessibility') { toggle('screenShake', 'SACUDIDA DE CÁMARA'); toggle('reducedShake', 'INTENSIDAD REDUCIDA'); toggle('reduceFlashes', 'REDUCIR FLASHES'); toggle('highContrast', 'ALTO CONTRASTE'); this.addButton('particles', `PARTÍCULAS                                      ${this.save.settings.particleIntensity === 'normal' ? 'NORMAL' : this.save.settings.particleIntensity === 'reduced' ? 'REDUCIDA' : 'DESACTIVADA'}`, y, () => { const values = ['normal','reduced','off'] as const; this.save.settings.particleIntensity = values[(values.indexOf(this.save.settings.particleIntensity)+1)%3]!; this.persist(); }); y += 50; toggle('fullscreen', 'PANTALLA COMPLETA'); }
    else if (this.category === 'gameplay') { toggle('showGhost', 'MOSTRAR FANTASMA'); toggle('localAnalyticsEnabled', 'ESTADÍSTICAS LOCALES'); this.addButton('restore-settings', 'RESTAURAR AJUSTES', y, () => this.restoreSettings()); this.content.push(this.add.text(350, y + 47, 'Restaura audio, imagen y jugabilidad. No borra progreso ni controles.', { ...UiTypography(16, '#91a6b6'), wordWrap: { width: 540 } })); }
    else if (this.category === 'controls') { this.content.push(this.add.text(350, 190, `Saltar: ${this.save.input.keyboard.JUMP}  ·  Dash: ${this.save.input.keyboard.DASH}\nPausa: ${this.save.input.keyboard.PAUSE}`, UiTypography(16))); this.addButton('customize-controls', 'PERSONALIZAR CONTROLES', 270, () => { this.scene.pause(); this.scene.launch('Controls'); }); }
    else { this.heading('COPIA DE SEGURIDAD', 184); this.addButton('backup', 'COPIAR COPIA DE SEGURIDAD', 210, () => void this.copyBackup()); this.heading('LIMPIEZA SELECTIVA', 266); this.addButton('clear-ghosts', 'BORRAR FANTASMAS', 292, () => this.confirmClear('BORRAR FANTASMAS', () => this.service.clearGhosts())); this.addButton('clear-records', 'BORRAR RÉCORDS', 342, () => this.confirmClear('BORRAR RÉCORDS', () => this.service.clearRecords())); this.heading('ZONA DE PELIGRO', 398); this.addButton('reset-progress', 'BORRAR TODO EL PROGRESO', 424, () => this.confirmClear('BORRAR TODOS LOS DATOS', () => { this.save = this.service.resetProgress(); new LocalAnalyticsService().clear(); }), true); }
    this.paint();
  }
  private paint(): void { this.categoryButtons.forEach((button, index) => button.setFocused(index === this.categoryIndex)); this.rowButtons.forEach((button, index) => button.setFocused(index === this.rowIndex)); const focused = this.rowButtons[this.rowIndex] ?? this.categoryButtons[this.categoryIndex]; if (focused) this.shell.focus(focused.id); }
  private persist(): void { const ok = this.service.save(this.save); audioService.apply(this.save.settings); eventBus.emit(Events.SETTINGS_CHANGED, this.save.settings); if (!ok) this.toast.show('NO SE PUDIERON GUARDAR LOS CAMBIOS', 'warning'); this.renderCategory(); }
  private restoreSettings(): void { const defaults = new StorageService({ getItem: () => null, setItem: () => undefined }).load().settings; this.save.settings = defaults; this.persist(); this.toast.show('AJUSTES RESTAURADOS', 'success'); }
  private confirmClear(title: string, action: () => void): void { this.dialog = new ConfirmDialog(this, title, 'Esta acción modifica los datos guardados en este dispositivo.', () => { this.dialog = undefined; action(); this.save = this.service.load(); this.renderCategory(); }, () => { this.dialog = undefined; }, { danger: true, confirmLabel: 'BORRAR', consequences: 'No se puede deshacer.' }); }
  private async copyBackup(): Promise<void> { try { await navigator.clipboard.writeText(this.service.exportBackup()); this.toast.show('COPIA GUARDADA', 'success'); } catch { this.toast.show('PORTAPAPELES NO DISPONIBLE', 'error'); } }
  private syncFullscreen(): void { this.save.settings.fullscreen = this.scale.isFullscreen; this.persist(); }
  private back(): void { this.scene.stop(); if (this.scene.isPaused('Pause')) this.scene.resume('Pause'); else if (!this.scene.isActive('Menu')) this.scene.start('Menu'); }
  private shutdown(): void { this.dialog?.destroy(); this.toast.destroy(); this.focus.destroy(); this.manager.destroy(); this.scale.off('enterfullscreen', this.syncFullscreen, this); this.scale.off('leavefullscreen', this.syncFullscreen, this); }
}
