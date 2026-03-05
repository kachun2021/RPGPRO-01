export interface MixmasterMonsterRow {
      name: string;
      series?: string | null;
      baseLevel?: number | null;
      imageId?: string | null;
      dropEggRaw?: string | null;
      dropEgg?: boolean | null;
      maps?: string[] | string | null;
}

export interface MixmasterRecipeRow {
      rowId?: number;
      resultName: string;
      mainName: string;
      subName: string;
      mainAdjust?: number;
      subAdjust?: number;
      resultSeries?: string | null;
      resultBaseLevel?: number | null;
      resultImageId?: string | null;
      resultDropEggRaw?: string | null;
      resultDropEgg?: boolean | null;
      resultMaps?: string[] | string | null;
      mainSeries?: string | null;
      mainBaseLevel?: number | null;
      mainImageId?: string | null;
      mainDropEggRaw?: string | null;
      mainDropEgg?: boolean | null;
      mainMaps?: string[] | string | null;
      subSeries?: string | null;
      subBaseLevel?: number | null;
      subImageId?: string | null;
      subDropEggRaw?: string | null;
      subDropEgg?: boolean | null;
      subMaps?: string[] | string | null;
}

export interface MixmasterRecipePayload {
      meta?: {
            source?: string;
            rowCount?: number;
            exportedAt?: string;
            mdbPath?: string;
            monsterCount?: number;
            distributionNameCount?: number;
      };
      monsters?: MixmasterMonsterRow[];
      recipes?: MixmasterRecipeRow[];
}

export interface ListPetRow {
      name: string;
      level?: number | null;
      series?: string | null;
      fusible?: boolean | null;
}

export interface ListPetPayload {
      meta?: {
            source?: string;
            exportedAt?: string;
            petCount?: number;
      };
      pets?: ListPetRow[];
}

