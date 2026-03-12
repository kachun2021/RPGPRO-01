import type { ManagedPanelDebugStateValue } from '../ManagedPanelTypes';

function normalizeText(value: string): string {
      return String(value ?? '')
            .replace(/\s+/g, ' ')
            .trim();
}

export function isVisibleElement(element: HTMLElement | null): element is HTMLElement {
      if (!(element instanceof HTMLElement)) return false;
      if (element.hidden) return false;
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 2 && rect.height > 2;
}

export function collectVisibleButtonLabels(root: ParentNode, limit = 6): string[] {
      const labels: string[] = [];
      const seen = new Set<string>();
      root.querySelectorAll<HTMLElement>('button, [role="button"], .rpg-op-btn, .game-btn, .sa-action-btn').forEach((node) => {
            if (!isVisibleElement(node)) return;
            const text = normalizeText(node.textContent ?? '');
            if (!text || seen.has(text)) return;
            seen.add(text);
            labels.push(text);
      });
      return labels.slice(0, limit);
}

export function buildDebugSummary(
      summary: Record<string, ManagedPanelDebugStateValue | undefined>,
): Record<string, ManagedPanelDebugStateValue> {
      return Object.fromEntries(
            Object.entries(summary).filter((entry): entry is [string, ManagedPanelDebugStateValue] => entry[1] !== undefined),
      );
}
