type RuntimeBiomeType =
      | 'grass'
      | 'forest'
      | 'desert'
      | 'snow'
      | 'cave'
      | 'beach'
      | 'lava'
      | 'town';

export interface SceneZoneProfile {
      id: string;
      name: string;
      nameCN: string;
      biome: RuntimeBiomeType;
      levelMin: number;
      levelMax: number;
      isTown: boolean;
}

// Canonical scene-zone profiles used for runtime->scene mapping heuristics.
// This replaces the old ZoneDefinitions dependency.
export const SCENE_ZONE_PROFILES: SceneZoneProfile[] = [
      { id: 'starter_meadow', name: 'Starter Meadow', nameCN: '新手草原', biome: 'grass', levelMin: 1, levelMax: 5, isTown: false },
      { id: 'misty_forest', name: 'Misty Forest', nameCN: '迷霧森林', biome: 'forest', levelMin: 5, levelMax: 10, isTown: false },
      { id: 'echo_valley', name: 'Echo Valley', nameCN: '迴聲谷', biome: 'grass', levelMin: 9, levelMax: 15, isTown: false },
      { id: 'iron_ridge', name: 'Iron Ridge', nameCN: '鐵脊山', biome: 'cave', levelMin: 13, levelMax: 20, isTown: false },
      { id: 'coral_beach', name: 'Coral Beach', nameCN: '珊瑚海灘', biome: 'beach', levelMin: 20, levelMax: 30, isTown: false },
      { id: 'crystal_caves', name: 'Crystal Caves', nameCN: '水晶洞窟', biome: 'cave', levelMin: 30, levelMax: 45, isTown: false },
      { id: 'ember_wastes', name: 'Ember Wastes', nameCN: '燼荒原', biome: 'lava', levelMin: 40, levelMax: 60, isTown: false },
      { id: 'frost_peaks', name: 'Frost Peaks', nameCN: '霜峰', biome: 'snow', levelMin: 60, levelMax: 85, isTown: false },
      { id: 'dark_hollow', name: 'Dark Hollow', nameCN: '暗穴', biome: 'cave', levelMin: 80, levelMax: 105, isTown: false },
      { id: 'thunder_plains', name: 'Thunder Plains', nameCN: '雷鳴平原', biome: 'grass', levelMin: 100, levelMax: 125, isTown: false },
      { id: 'lava_sanctum', name: 'Lava Sanctum', nameCN: '熔岩聖所', biome: 'lava', levelMin: 136, levelMax: 162, isTown: false },
      { id: 'ancient_ruins', name: 'Ancient Ruins', nameCN: '遠古遺跡', biome: 'desert', levelMin: 17, levelMax: 46, isTown: false },
      { id: 'moonlit_grove', name: 'Moonlit Grove', nameCN: '月光林地', biome: 'forest', levelMin: 45, levelMax: 69, isTown: false },
      { id: 'storm_coast', name: 'Storm Coast', nameCN: '風暴海岸', biome: 'beach', levelMin: 47, levelMax: 93, isTown: false },
      { id: 'dragon_nest', name: 'Dragon Nest', nameCN: '龍巢', biome: 'cave', levelMin: 90, levelMax: 119, isTown: false },
      { id: 'sky_temple', name: 'Sky Temple', nameCN: '天空神殿', biome: 'snow', levelMin: 121, levelMax: 165, isTown: false },
      { id: 'main_city', name: 'Main City', nameCN: '卡魯它那城', biome: 'town', levelMin: 0, levelMax: 0, isTown: true },
];
