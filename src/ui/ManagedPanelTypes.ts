export type ManagedPanelKind = 'primary' | 'modal';
export type ManagedPanelLayoutKind = 'dashboard' | 'split' | 'detail_list' | 'modal';
export type ManagedPanelChromeMode = 'explore' | 'panel_focus' | 'dialogue_focus';
export type ManagedPanelTemplate = 'primary_panel' | 'modal_overlay';
export type ManagedPanelDensityTier = 'comfortable' | 'balanced' | 'compact';
export type ManagedPanelDebugStateValue = string | number | boolean | null;

export interface ManagedPanelLandscapeBudget {
      targetViewport: string;
      maxPrimaryActions: number;
      preferNoScroll: boolean;
      notes: string;
}

export interface ManagedPanelDebugState {
      activeTab?: string | null;
      visiblePrimaryActions?: string[];
      keyDataSummary?: Record<string, ManagedPanelDebugStateValue>;
}

export interface ManagedPanel {
      panelId: string;
      isVisible: boolean;
      hide(): void;
      getDebugState?(): ManagedPanelDebugState;
}

export interface ManagedPanelRegistration {
      kind?: ManagedPanelKind;
      layoutKind?: ManagedPanelLayoutKind;
      chromeMode?: ManagedPanelChromeMode;
      blocksGameplayInput?: boolean;
      template?: ManagedPanelTemplate;
      densityTier?: ManagedPanelDensityTier;
      compactLandscapeBudget?: ManagedPanelLandscapeBudget;
      primaryActionLabels?: string[];
}
