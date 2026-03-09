import type { RuntimeMapRef } from '../../data/runtime/RuntimeFusionGuide';
import type { Pet } from '../../pets/Pet';
import { PetSeries, type FusionIngredient, type PetDef } from '../../pets/PetData';

export type SeriesFilter = 'all' | PetSeries;
export type NoticeTone = 'ok' | 'warn';
export type MainFusionTab = 'machine' | 'recipes' | 'tree';

export interface FormulaEntry {
      key: string;
      source: 'runtime' | 'pet_defs';
      resultName: string;
      resultDef: PetDef;
      isResolvedResult: boolean;
      resultBaseLevel: number;
      resultDropEgg: boolean | null;
      resultDropEggRaw: string | null;
      resultMapNames: string[];
      resultMapKeys: string[];
      resultMapRefs: RuntimeMapRef[];
      recipe: FusionIngredient;
      mainName: string;
      mainDef: PetDef | null;
      isResolvedMain: boolean;
      mainBaseLevel: number;
      subName: string;
      subDef: PetDef | null;
      isResolvedSub: boolean;
      subBaseLevel: number;
      mainAdjust: number;
      subAdjust: number;
}

export interface OwnedSnapshot {
      usable: Pet[];
      alive: Pet[];
      usableById: Map<string, Pet[]>;
      aliveById: Map<string, Pet[]>;
}

export interface FormulaEstimate {
      rate: number | null;
      riskLabel: string;
      riskColor: string;
      summary: string;
}

export const TRACKING_STORAGE_KEY = 'fpo.fusion.panel.tracked.v2';
export const GUIDE_RENDER_STEP = 120;

export const SERIES_LABELS: Record<PetSeries, string> = {
      [PetSeries.Plant]: '植物',
      [PetSeries.Dragon]: '龍系',
      [PetSeries.Beast]: '獸系',
      [PetSeries.Insect]: '昆蟲',
      [PetSeries.Metal]: '機械',
      [PetSeries.Mystery]: '神秘',
      [PetSeries.Demon]: '惡魔',
      [PetSeries.Bird]: '飛禽',
};
