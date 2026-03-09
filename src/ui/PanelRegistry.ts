export type ManagedPanelKind = 'primary' | 'modal';
export type ManagedPanelLayoutKind = 'dashboard' | 'split' | 'detail_list' | 'modal';
export type ManagedPanelChromeMode = 'explore' | 'panel_focus' | 'dialogue_focus';

export interface ManagedPanel {
      panelId: string;
      isVisible: boolean;
      hide(): void;
}

export interface ManagedPanelRegistration {
      kind?: ManagedPanelKind;
      layoutKind?: ManagedPanelLayoutKind;
      chromeMode?: ManagedPanelChromeMode;
      blocksGameplayInput?: boolean;
}

interface RegisteredPanel extends Required<ManagedPanelRegistration> {
      panel: ManagedPanel;
}

export class PanelRegistry {
      private _panels = new Map<string, RegisteredPanel>();
      private _order: string[] = [];

      register(panel: ManagedPanel, registration: ManagedPanelKind | ManagedPanelRegistration = 'primary'): void {
            const normalized = typeof registration === 'string'
                  ? this._normalizeRegistration({ kind: registration })
                  : this._normalizeRegistration(registration);
            if (this._panels.has(panel.panelId)) {
                  this._panels.set(panel.panelId, { panel, ...normalized });
                  return;
            }
            this._panels.set(panel.panelId, { panel, ...normalized });
            this._order.push(panel.panelId);
      }

      unregister(panelId: string): void {
            this._panels.delete(panelId);
            this._order = this._order.filter((id) => id !== panelId);
      }

      hideAllExcept(exceptId?: string, kinds: ManagedPanelKind[] = ['primary', 'modal']): void {
            const kindSet = new Set(kinds);
            for (const id of this._order) {
                  if (id === exceptId) continue;
                  const registered = this._panels.get(id);
                  if (!registered || !kindSet.has(registered.kind) || !registered.panel.isVisible) continue;
                  registered.panel.hide();
            }
      }

      getVisiblePanels(kind?: ManagedPanelKind): string[] {
            return this._order.filter((id) => {
                  const registered = this._panels.get(id);
                  if (!registered) return false;
                  if (kind && registered.kind !== kind) return false;
                  return registered.panel.isVisible;
            });
      }

      getCurrentPanel(): string | null {
            const visiblePrimaries = this.getVisiblePanels('primary');
            return visiblePrimaries.length > 0 ? visiblePrimaries[visiblePrimaries.length - 1] : null;
      }

      getCurrentPanelMeta(): Omit<RegisteredPanel, 'panel'> | null {
            const currentPanelId = this.getCurrentPanel();
            if (!currentPanelId) return null;
            const registered = this._panels.get(currentPanelId);
            if (!registered) return null;
            const { panel: _panel, ...meta } = registered;
            return { ...meta };
      }

      getModalStack(): string[] {
            return this.getVisiblePanels('modal');
      }

      getModalStackMeta(): Array<{ panelId: string } & Omit<RegisteredPanel, 'panel'>> {
            return this.getVisiblePanels('modal')
                  .map((panelId) => {
                        const registered = this._panels.get(panelId);
                        if (!registered) return null;
                        const { panel: _panel, ...meta } = registered;
                        return { panelId, ...meta };
                  })
                  .filter((entry): entry is { panelId: string } & Omit<RegisteredPanel, 'panel'> => !!entry);
      }

      getActiveChromeMode(): ManagedPanelChromeMode {
            const visibleModal = this.getModalStackMeta();
            if (visibleModal.length > 0) {
                  return visibleModal[visibleModal.length - 1]?.chromeMode ?? 'dialogue_focus';
            }
            return this.getCurrentPanelMeta()?.chromeMode ?? 'explore';
      }

      getVisibilitySnapshot(): Record<string, boolean> {
            const snapshot: Record<string, boolean> = {};
            for (const id of this._order) {
                  const registered = this._panels.get(id);
                  snapshot[id] = Boolean(registered?.panel.isVisible);
            }
            return snapshot;
      }

      private _normalizeRegistration(registration: ManagedPanelRegistration): Required<ManagedPanelRegistration> {
            const kind = registration.kind ?? 'primary';
            return {
                  kind,
                  layoutKind: registration.layoutKind ?? (kind === 'modal' ? 'modal' : 'dashboard'),
                  chromeMode: registration.chromeMode ?? (kind === 'modal' ? 'dialogue_focus' : 'panel_focus'),
                  blocksGameplayInput: registration.blocksGameplayInput ?? kind === 'modal',
            };
      }
}
