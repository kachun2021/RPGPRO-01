import type { UiIconId } from './UiIconCatalog';
import type { ManagedPanelLandscapeBudget, ManagedPanelRegistration } from './ManagedPanelTypes';

export type ManagedPanelId =
      | 'afk'
      | 'bag'
      | 'book'
      | 'char'
      | 'community'
      | 'dialogue'
      | 'fusion'
      | 'map'
      | 'pet'
      | 'quest'
      | 'rename'
      | 'resonance'
      | 'revival'
      | 'settings'
      | 'shop'
      | 'skill';

export interface HudNavDefinition {
      panelId: ManagedPanelId;
      navId: string;
      label: string;
      icon: UiIconId;
      primary: boolean;
}

export interface ManagedPanelDefinition {
      panelId: ManagedPanelId;
      registration: ManagedPanelRegistration;
      nav?: HudNavDefinition;
}

function budget(maxPrimaryActions: number, notes: string, targetViewport = '667x375'): ManagedPanelLandscapeBudget {
      return {
            targetViewport,
            maxPrimaryActions,
            preferNoScroll: true,
            notes,
      };
}

const PRIMARY_PANEL: ManagedPanelRegistration = {
      kind: 'primary',
      chromeMode: 'panel_focus',
      blocksGameplayInput: true,
      template: 'primary_panel',
      densityTier: 'balanced',
};

const MODAL_PANEL: ManagedPanelRegistration = {
      kind: 'modal',
      layoutKind: 'modal',
      chromeMode: 'dialogue_focus',
      blocksGameplayInput: true,
      template: 'modal_overlay',
      densityTier: 'comfortable',
};

export const PANEL_DEFINITIONS: Record<ManagedPanelId, ManagedPanelDefinition> = {
      quest: {
            panelId: 'quest',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'detail_list',
                  densityTier: 'compact',
                  compactLandscapeBudget: budget(2, '保留單一任務詳情主動作，不允許目錄與詳情同時出現捲動壓力。'),
                  primaryActionLabels: ['接受任務', '領取獎勵'],
            },
            nav: { panelId: 'quest', navId: 'nav-quest', label: '任務', icon: 'quest', primary: true },
      },
      bag: {
            panelId: 'bag',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'split',
                  densityTier: 'compact',
                  compactLandscapeBudget: budget(3, '裝備板、物品格與頁碼列需同屏完成，不允許格子因字長撐破。'),
                  primaryActionLabels: ['上一頁', '下一頁'],
            },
            nav: { panelId: 'bag', navId: 'nav-bag', label: '背包', icon: 'bag', primary: true },
      },
      map: {
            panelId: 'map',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'split',
                  compactLandscapeBudget: budget(2, '左側地圖列表與右側詳情必須同屏，傳送 CTA 必須首屏可見。'),
                  primaryActionLabels: ['傳送', '追蹤路線'],
            },
            nav: { panelId: 'map', navId: 'nav-map', label: '地圖', icon: 'map', primary: true },
      },
      pet: {
            panelId: 'pet',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'split',
                  compactLandscapeBudget: budget(3, '編隊、已選寵物與倉庫三欄同時成立，主操作維持在詳情首屏。'),
                  primaryActionLabels: ['出戰', '撤下', '更名', '復活'],
            },
            nav: { panelId: 'pet', navId: 'nav-pet', label: '寵物', icon: 'pet', primary: true },
      },
      book: {
            panelId: 'book',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'split',
                  compactLandscapeBudget: budget(2, '條目列表與詳情區同屏，條目卡不可裁字。'),
                  primaryActionLabels: ['查看配方', '查看地圖'],
            },
            nav: { panelId: 'book', navId: 'nav-book', label: '圖鑑', icon: 'book', primary: false },
      },
      shop: {
            panelId: 'shop',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'split',
                  compactLandscapeBudget: budget(2, '分類、清單、詳情與購買 rail 需同屏完成。'),
                  primaryActionLabels: ['購買', '出售', '製作'],
            },
            nav: { panelId: 'shop', navId: 'nav-shop', label: '商店', icon: 'shop', primary: false },
      },
      char: {
            panelId: 'char',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'dashboard',
                  compactLandscapeBudget: budget(2, '分頁與主卡固定，數值區不可把主標推到折線以下。'),
                  primaryActionLabels: ['+'],
            },
            nav: { panelId: 'char', navId: 'nav-char', label: '角色', icon: 'character', primary: false },
      },
      skill: {
            panelId: 'skill',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'split',
                  compactLandscapeBudget: budget(2, '裝備欄與技能卡並列，技能升級 CTA 需可見。'),
                  primaryActionLabels: ['升級', '主角', '寵物'],
            },
            nav: { panelId: 'skill', navId: 'nav-skill', label: '技能', icon: 'skill', primary: false },
      },
      settings: {
            panelId: 'settings',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'dashboard',
                  compactLandscapeBudget: budget(2, '四個設定分頁在 667x375 下不得出現主區域滾動。'),
                  primaryActionLabels: ['操作', '帳號', 'DATA', '關於'],
            },
            nav: { panelId: 'settings', navId: 'nav-settings', label: '系統', icon: 'settings', primary: false },
      },
      afk: {
            panelId: 'afk',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'dashboard',
                  compactLandscapeBudget: budget(3, '掛機狀態、模式與套用操作需首屏可見。'),
                  primaryActionLabels: ['開始掛機', '套用設定', '重置'],
            },
      },
      resonance: {
            panelId: 'resonance',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'dashboard',
                  compactLandscapeBudget: budget(2, '系列條件與套用 CTA 不得被推離首屏。'),
                  primaryActionLabels: ['套用'],
            },
      },
      fusion: {
            panelId: 'fusion',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'split',
                  compactLandscapeBudget: budget(2, '配方與合成樹頁面都要在 compact landscape 保持 CTA 首屏可見。'),
                  primaryActionLabels: ['合成機', '配方', '合成樹', '開始合成'],
            },
      },
      community: {
            panelId: 'community',
            registration: {
                  ...PRIMARY_PANEL,
                  layoutKind: 'dashboard',
                  compactLandscapeBudget: budget(2, '公告與服務邊界都要保證關鍵資訊不裁字。'),
                  primaryActionLabels: ['服務邊界', '公告看板'],
            },
      },
      dialogue: {
            panelId: 'dialogue',
            registration: {
                  ...MODAL_PANEL,
                  compactLandscapeBudget: budget(3, '對話文字與操作清單保持兩段式，不得超出畫面。'),
                  primaryActionLabels: ['接受任務', '購買補給', '學習技能', '結束對話'],
            },
      },
      rename: {
            panelId: 'rename',
            registration: {
                  ...MODAL_PANEL,
                  compactLandscapeBudget: budget(2, '輸入框、費用與確認操作需同屏。'),
                  primaryActionLabels: ['確認', '取消'],
            },
      },
      revival: {
            panelId: 'revival',
            registration: {
                  ...MODAL_PANEL,
                  compactLandscapeBudget: budget(2, '死亡寵物列表與全部復活 CTA 同屏，避免次級滾動。'),
                  primaryActionLabels: ['全部復活', '取消', '復活'],
            },
      },
};

export const HUD_NAV_ITEMS: HudNavDefinition[] = Object.values(PANEL_DEFINITIONS)
      .flatMap((definition) => (definition.nav ? [definition.nav] : []));

export function getManagedPanelDefinition(panelId: string): ManagedPanelDefinition | null {
      return PANEL_DEFINITIONS[panelId as ManagedPanelId] ?? null;
}

export function getManagedPanelRegistration(panelId: string): ManagedPanelRegistration | null {
      return getManagedPanelDefinition(panelId)?.registration ?? null;
}
