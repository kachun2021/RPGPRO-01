export type ManagedPanelKind = 'primary' | 'modal';

export interface ManagedPanel {
      panelId: string;
      isVisible: boolean;
      hide(): void;
}

interface RegisteredPanel {
      panel: ManagedPanel;
      kind: ManagedPanelKind;
}

export class PanelRegistry {
      private _panels = new Map<string, RegisteredPanel>();
      private _order: string[] = [];

      register(panel: ManagedPanel, kind: ManagedPanelKind = 'primary'): void {
            if (this._panels.has(panel.panelId)) {
                  this._panels.set(panel.panelId, { panel, kind });
                  return;
            }
            this._panels.set(panel.panelId, { panel, kind });
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

      getModalStack(): string[] {
            return this.getVisiblePanels('modal');
      }

      getVisibilitySnapshot(): Record<string, boolean> {
            const snapshot: Record<string, boolean> = {};
            for (const id of this._order) {
                  const registered = this._panels.get(id);
                  snapshot[id] = Boolean(registered?.panel.isVisible);
            }
            return snapshot;
      }
}
