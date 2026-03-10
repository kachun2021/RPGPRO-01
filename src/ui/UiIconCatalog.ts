import type { NPCType } from '../entities/NPC';

export type UiIconId =
      | 'book'
      | 'shop'
      | 'character'
      | 'pet'
      | 'bag'
      | 'fusion'
      | 'skill'
      | 'quest'
      | 'map'
      | 'settings'
      | 'menu'
      | 'merchant'
      | 'skill_master'
      | 'pet_trader'
      | 'accept'
      | 'report';

const INLINE_SVG: Record<string, string> = {
      book: `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 5.5C4 4.12 5.12 3 6.5 3H19v15.5c0 1.1-.9 2-2 2H7c-1.66 0-3-1.34-3-3V5.5Z" fill="rgba(255,248,228,0.16)" stroke="#d7b56a" stroke-width="1.7"/>
                  <path d="M8 6h7.5M8 10h7.5M8 14h5.5" stroke="#f5e2a8" stroke-width="1.6" stroke-linecap="round"/>
                  <path d="M6.3 5.3h.2c.83 0 1.5.67 1.5 1.5v10.7" stroke="#95b8d9" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
      `,
      skill: `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.5l2.1 5.2 5.4.4-4.2 3.5 1.4 5.2L12 14.1 7.3 16.8l1.4-5.2-4.2-3.5 5.4-.4L12 2.5Z" fill="rgba(244,210,121,0.9)" stroke="#d6b168" stroke-width="1.4"/>
                  <circle cx="12" cy="12" r="2.2" fill="#7ea4cc"/>
            </svg>
      `,
      fusion: `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="7.8" fill="rgba(255,248,228,0.08)" stroke="#d7b56a" stroke-width="1.5"/>
                  <path d="M12 5.3v3.2M12 15.5v3.2M5.3 12h3.2M15.5 12h3.2" stroke="#95b8d9" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="m8.2 8.2 2.3 2.3m3 3 2.3 2.3M15.8 8.2l-2.3 2.3m-3 3-2.3 2.3" stroke="#f5e2a8" stroke-width="1.3" stroke-linecap="round"/>
                  <circle cx="12" cy="12" r="2.4" fill="#f2dfaa" stroke="#d7b56a" stroke-width="1.1"/>
            </svg>
      `,
      map: `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.5 5.5 8.8 3l6.4 2.2L20.5 3v15.5l-5.3 2.5-6.4-2.2-5.3 2.3V5.5Z" fill="rgba(255,248,228,0.12)" stroke="#d7b56a" stroke-width="1.6" stroke-linejoin="round"/>
                  <path d="M8.8 3v15.9M15.2 5.2v15.8" stroke="#95b8d9" stroke-width="1.4"/>
                  <circle cx="12" cy="10" r="2.2" fill="#d7b56a"/>
            </svg>
      `,
      menu: `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="6" height="6" rx="1.8" fill="#f2dfaa"/>
                  <rect x="14" y="4" width="6" height="6" rx="1.8" fill="#7ea4cc"/>
                  <rect x="4" y="14" width="6" height="6" rx="1.8" fill="#7ea4cc"/>
                  <rect x="14" y="14" width="6" height="6" rx="1.8" fill="#f2dfaa"/>
            </svg>
      `,
      accept: `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8.2" fill="rgba(102,167,122,0.25)" stroke="#5b9b6a" stroke-width="1.7"/>
                  <path d="m8.3 12.5 2.4 2.4 5-5" fill="none" stroke="#eaf5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
      `,
      report: `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4v16" stroke="#d7b56a" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M8 5.5h8l-1.8 3.1 1.8 3.4H8V5.5Z" fill="rgba(126,164,204,0.92)" stroke="#95b8d9" stroke-width="1.4" stroke-linejoin="round"/>
            </svg>
      `,
};

const ASSET_ICON_PATHS: Partial<Record<UiIconId, string>> = {
      shop: '/assets/icons/nav_shop.png',
      character: '/assets/icons/nav_char.png',
      pet: '/assets/icons/nav_pet.png',
      bag: '/assets/icons/nav_bag.png',
      quest: '/assets/icons/nav_quest.png',
      settings: '/assets/icons/nav_settings.png',
      merchant: '/assets/icons/nav_shop.png',
      skill_master: '/assets/icons/nav_char.png',
      pet_trader: '/assets/icons/nav_pet.png',
};

const SVG_ICON_BY_ID: Partial<Record<UiIconId, string>> = {
      book: INLINE_SVG.book,
      fusion: INLINE_SVG.fusion,
      skill: INLINE_SVG.skill,
      map: INLINE_SVG.map,
      menu: INLINE_SVG.menu,
      accept: INLINE_SVG.accept,
      report: INLINE_SVG.report,
};

function svgToDataUrl(svg: string): string {
      const compact = svg.replace(/\s+/g, ' ').trim();
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(compact)}`;
}

export function getUiIconUrl(iconId: UiIconId): string {
      const assetPath = ASSET_ICON_PATHS[iconId];
      if (assetPath) return assetPath;
      const svg = SVG_ICON_BY_ID[iconId];
      if (svg) return svgToDataUrl(svg);
      return svgToDataUrl(INLINE_SVG.menu);
}

export function renderUiIcon(iconId: UiIconId, extraClass = ''): string {
      const className = ['ui-icon-glyph', extraClass].filter(Boolean).join(' ');
      return `<span class="${className}" data-ui-icon="${iconId}" aria-hidden="true"><img src="${getUiIconUrl(iconId)}" alt=""></span>`;
}

export function getNpcUiIconId(type: NPCType): UiIconId {
      switch (type) {
            case 'merchant': return 'merchant';
            case 'skill_master': return 'skill_master';
            case 'quest': return 'quest';
            case 'pet_trader': return 'pet_trader';
      }
}
