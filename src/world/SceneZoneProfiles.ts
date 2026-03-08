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
      spawnPoint?: { x: number; y: number; z: number };
}

const TOWN_SPAWN = { x: 0, y: 0, z: -6 };

export const SCENE_ZONE_PROFILES: SceneZoneProfile[] = [
      { id: 'starter_meadow', name: 'Starter Meadow', nameCN: '新手草原', biome: 'grass', levelMin: 1, levelMax: 5, isTown: false, spawnPoint: { x: 0, y: 0, z: -10 } },
      { id: 'misty_forest', name: 'Misty Forest', nameCN: '迷霧森林', biome: 'forest', levelMin: 1, levelMax: 18, isTown: false },
      { id: 'echo_valley', name: 'Echo Valley', nameCN: '迴聲谷', biome: 'grass', levelMin: 5, levelMax: 22, isTown: false },
      { id: 'iron_ridge', name: 'Iron Ridge', nameCN: '鐵脊山', biome: 'cave', levelMin: 8, levelMax: 26, isTown: false },
      { id: 'coral_beach', name: 'Coral Beach', nameCN: '珊瑚海岸', biome: 'beach', levelMin: 18, levelMax: 30, isTown: false },
      { id: 'ancient_ruins', name: 'Ancient Ruins', nameCN: '遠古遺跡', biome: 'desert', levelMin: 20, levelMax: 42, isTown: false },
      { id: 'crystal_caves', name: 'Crystal Caves', nameCN: '水晶洞窟', biome: 'cave', levelMin: 24, levelMax: 48, isTown: false },
      { id: 'moonlit_grove', name: 'Moonlit Grove', nameCN: '月光林地', biome: 'forest', levelMin: 28, levelMax: 60, isTown: false },
      { id: 'baluk_farm', name: 'Baluk Farm', nameCN: '巴爾克牧場', biome: 'grass', levelMin: 24, levelMax: 44, isTown: false },
      { id: 'storm_coast', name: 'Storm Coast', nameCN: '風暴海岸', biome: 'beach', levelMin: 30, levelMax: 54, isTown: false },
      { id: 'frost_peaks', name: 'Frost Peaks', nameCN: '霜峰', biome: 'snow', levelMin: 34, levelMax: 58, isTown: false },
      { id: 'sinan_ruins', name: 'Sinan Ruins', nameCN: '希南遺址', biome: 'forest', levelMin: 55, levelMax: 110, isTown: false },
      { id: 'dark_hollow', name: 'Dark Hollow', nameCN: '暗穴', biome: 'cave', levelMin: 70, levelMax: 130, isTown: false },
      { id: 'thunder_plains', name: 'Thunder Plains', nameCN: '雷鳴競技場', biome: 'grass', levelMin: 35, levelMax: 70, isTown: false },
      { id: 'training_ground', name: 'Training Ground', nameCN: '訓練場', biome: 'grass', levelMin: 20, levelMax: 55, isTown: false },
      { id: 'lava_sanctum', name: 'Lava Sanctum', nameCN: '熔岩聖所', biome: 'lava', levelMin: 110, levelMax: 180, isTown: false },
      { id: 'sky_temple', name: 'Sky Temple', nameCN: '天空之城', biome: 'snow', levelMin: 45, levelMax: 95, isTown: false },
      { id: 'town_magilita', name: 'Magilita Town', nameCN: '馬吉利塔', biome: 'town', levelMin: 1, levelMax: 15, isTown: true, spawnPoint: TOWN_SPAWN },
      { id: 'town_migrita', name: 'Migrita Town', nameCN: '米格瑞塔', biome: 'town', levelMin: 5, levelMax: 20, isTown: true, spawnPoint: TOWN_SPAWN },
      { id: 'town_beheru', name: 'Beheru Town', nameCN: '貝赫魯', biome: 'town', levelMin: 12, levelMax: 28, isTown: true, spawnPoint: TOWN_SPAWN },
      { id: 'town_helsper', name: 'Helsper Town', nameCN: '黑爾斯波', biome: 'town', levelMin: 8, levelMax: 24, isTown: true, spawnPoint: TOWN_SPAWN },
      { id: 'town_ludis', name: 'Ludis Town', nameCN: '魯狄斯', biome: 'town', levelMin: 20, levelMax: 40, isTown: true, spawnPoint: TOWN_SPAWN },
      { id: 'town_bumai', name: 'Bumai Town', nameCN: '布邁', biome: 'town', levelMin: 40, levelMax: 70, isTown: true, spawnPoint: TOWN_SPAWN },
      { id: 'pk_arena', name: 'PK Arena', nameCN: 'PK 競技區', biome: 'cave', levelMin: 25, levelMax: 90, isTown: false },
      { id: 'office_hub', name: 'Office Hub', nameCN: '事務中樞', biome: 'town', levelMin: 30, levelMax: 80, isTown: true, spawnPoint: TOWN_SPAWN },
      { id: 'beast_sky', name: 'Beast Sky', nameCN: '獸系天空', biome: 'snow', levelMin: 40, levelMax: 80, isTown: false },
      { id: 'dragon_sky', name: 'Dragon Sky', nameCN: '龍系天空', biome: 'snow', levelMin: 70, levelMax: 120, isTown: false },
      { id: 'demon_sky', name: 'Demon Sky', nameCN: '惡魔天空', biome: 'lava', levelMin: 70, levelMax: 120, isTown: false },
      { id: 'plant_sky', name: 'Plant Sky', nameCN: '植物天空', biome: 'forest', levelMin: 65, levelMax: 115, isTown: false },
      { id: 'mystery_sky', name: 'Mystery Sky', nameCN: '神秘天空', biome: 'snow', levelMin: 75, levelMax: 125, isTown: false },
      { id: 'bird_sky', name: 'Bird Sky', nameCN: '鳥系天空', biome: 'beach', levelMin: 65, levelMax: 115, isTown: false },
      { id: 'insect_sky', name: 'Insect Sky', nameCN: '昆蟲天空', biome: 'forest', levelMin: 60, levelMax: 110, isTown: false },
      { id: 'machine_sky', name: 'Machine Sky', nameCN: '機械天空', biome: 'cave', levelMin: 70, levelMax: 120, isTown: false },
      { id: 'kambu_beast', name: 'Kambu Beast Grounds', nameCN: '坎布獸系地盤', biome: 'grass', levelMin: 50, levelMax: 140, isTown: false },
      { id: 'kambu_dragon', name: 'Kambu Dragon Grounds', nameCN: '坎布龍系地盤', biome: 'lava', levelMin: 120, levelMax: 180, isTown: false },
      { id: 'kambu_mystery', name: 'Kambu Mystery Grounds', nameCN: '坎布神秘地盤', biome: 'cave', levelMin: 120, levelMax: 180, isTown: false },
      { id: 'house_dungeons', name: 'Elemental Houses', nameCN: '元素屋地城', biome: 'cave', levelMin: 90, levelMax: 150, isTown: false },
];
