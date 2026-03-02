/**
 * ZoneDefinitions — 17 zone data definitions mapped from 147 CHM MapMon areas.
 * Each zone has unique biome, lighting, level range, and monster spawn config.
 */

export type BiomeType = 'grass' | 'forest' | 'desert' | 'snow' | 'cave' | 'beach' | 'lava' | 'town';

export interface TeleportGateDef {
      targetZoneId: string;
      /** Gate position in this zone */
      position: { x: number; z: number };
      /** Label shown above the gate */
      label: string;
}

export interface ZoneDef {
      id: string;
      name: string;        // English name
      nameCN: string;       // Chinese display name
      biome: BiomeType;
      levelMin: number;
      levelMax: number;
      isTown: boolean;

      // Lighting
      sunColor: string;     // hex
      sunIntensity: number;
      ambientColor: string; // hex
      skyTop: string;       // gradient top hex
      skyBottom: string;    // gradient bottom hex

      // Terrain
      groundColor: string;  // hex tint for PBR

      // Spawn
      spawnPoint: { x: number; y: number; z: number };
      gates: TeleportGateDef[];

      /** MapMon IDs from tables/Monster_Spawns.md mapped to this zone */
      mapMonIds: string[];
}

export const ZONE_DEFS: ZoneDef[] = [
      // ── Zone 1: Starter Meadow (MapMon003) ──
      {
            id: 'starter_meadow', name: 'Starter Meadow', nameCN: '新手草原',
            biome: 'grass', levelMin: 1, levelMax: 5, isTown: false,
            sunColor: '#FFF5E0', sunIntensity: 1.8,
            ambientColor: '#B4C8E8', skyTop: '#4A7FC4', skyBottom: '#A8D8EA',
            groundColor: '#4A7A3A',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'misty_forest', position: { x: 80, z: 0 }, label: '迷霧森林 →' },
                  { targetZoneId: 'main_city', position: { x: -80, z: 0 }, label: '← 主城' },
            ],
            mapMonIds: ['MapMon003'],
      },
      // ── Zone 2: Misty Forest (MapMon017) ──
      {
            id: 'misty_forest', name: 'Misty Forest', nameCN: '迷霧森林',
            biome: 'forest', levelMin: 5, levelMax: 10, isTown: false,
            sunColor: '#C8E8C0', sunIntensity: 1.2,
            ambientColor: '#607860', skyTop: '#3A5A3A', skyBottom: '#7AAA7A',
            groundColor: '#3A5A2A',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'starter_meadow', position: { x: -80, z: 0 }, label: '← 新手草原' },
                  { targetZoneId: 'echo_valley', position: { x: 80, z: 0 }, label: '迴聲谷 →' },
            ],
            mapMonIds: ['MapMon017'],
      },
      // ── Zone 3: Echo Valley (MapMon023) ──
      {
            id: 'echo_valley', name: 'Echo Valley', nameCN: '迴聲谷',
            biome: 'grass', levelMin: 9, levelMax: 15, isTown: false,
            sunColor: '#E8D8C0', sunIntensity: 1.6,
            ambientColor: '#8898A8', skyTop: '#5A7A9A', skyBottom: '#C8D8E8',
            groundColor: '#5A7A4A',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'misty_forest', position: { x: -80, z: 0 }, label: '← 迷霧森林' },
                  { targetZoneId: 'iron_ridge', position: { x: 80, z: 0 }, label: '鐵脊山 →' },
            ],
            mapMonIds: ['MapMon023'],
      },
      // ── Zone 4: Iron Ridge (MapMon014, MapMon006) ──
      {
            id: 'iron_ridge', name: 'Iron Ridge', nameCN: '鐵脊山',
            biome: 'desert', levelMin: 13, levelMax: 20, isTown: false,
            sunColor: '#F0D0A0', sunIntensity: 2.0,
            ambientColor: '#A08868', skyTop: '#C8A060', skyBottom: '#E8D0A0',
            groundColor: '#8A7050',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'echo_valley', position: { x: -80, z: 0 }, label: '← 迴聲谷' },
                  { targetZoneId: 'coral_beach', position: { x: 80, z: 0 }, label: '珊瑚海灘 →' },
            ],
            mapMonIds: ['MapMon014', 'MapMon006'],
      },
      // ── Zone 5: Coral Beach (MapMon015) ──
      {
            id: 'coral_beach', name: 'Coral Beach', nameCN: '珊瑚海灘',
            biome: 'beach', levelMin: 20, levelMax: 30, isTown: false,
            sunColor: '#FFF0D0', sunIntensity: 2.2,
            ambientColor: '#60A0C0', skyTop: '#2080C0', skyBottom: '#80D0F0',
            groundColor: '#C0B088',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'iron_ridge', position: { x: -80, z: 0 }, label: '← 鐵脊山' },
                  { targetZoneId: 'crystal_caves', position: { x: 80, z: 0 }, label: '水晶洞窟 →' },
            ],
            mapMonIds: ['MapMon015'],
      },
      // ── Zone 6: Crystal Caves (MapMon021) ──
      {
            id: 'crystal_caves', name: 'Crystal Caves', nameCN: '水晶洞窟',
            biome: 'cave', levelMin: 30, levelMax: 45, isTown: false,
            sunColor: '#8080C0', sunIntensity: 0.8,
            ambientColor: '#404060', skyTop: '#1A1A2A', skyBottom: '#3A3A5A',
            groundColor: '#3A3A5A',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'coral_beach', position: { x: -80, z: 0 }, label: '← 珊瑚海灘' },
                  { targetZoneId: 'ember_wastes', position: { x: 80, z: 0 }, label: '燼荒原 →' },
            ],
            mapMonIds: ['MapMon021'],
      },
      // ── Zone 7: Ember Wastes (MapMon001, MapMon004) ──
      {
            id: 'ember_wastes', name: 'Ember Wastes', nameCN: '燼荒原',
            biome: 'desert', levelMin: 40, levelMax: 60, isTown: false,
            sunColor: '#F0A060', sunIntensity: 2.0,
            ambientColor: '#804030', skyTop: '#602020', skyBottom: '#C06030',
            groundColor: '#6A4A30',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'crystal_caves', position: { x: -80, z: 0 }, label: '← 水晶洞窟' },
                  { targetZoneId: 'frost_peaks', position: { x: 80, z: 0 }, label: '霜峰 →' },
            ],
            mapMonIds: ['MapMon001', 'MapMon004'],
      },
      // ── Zone 8: Frost Peaks (MapMon005, MapMon009-011) ──
      {
            id: 'frost_peaks', name: 'Frost Peaks', nameCN: '霜峰',
            biome: 'snow', levelMin: 60, levelMax: 85, isTown: false,
            sunColor: '#D0E0F0', sunIntensity: 1.4,
            ambientColor: '#8090A0', skyTop: '#A0B8D0', skyBottom: '#D0E0F0',
            groundColor: '#C0C8D0',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'ember_wastes', position: { x: -80, z: 0 }, label: '← 燼荒原' },
                  { targetZoneId: 'dark_hollow', position: { x: 80, z: 0 }, label: '暗穴 →' },
            ],
            mapMonIds: ['MapMon005', 'MapMon009', 'MapMon010', 'MapMon011'],
      },
      // ── Zone 9: Dark Hollow (MapMon007, MapMon012) ──
      {
            id: 'dark_hollow', name: 'Dark Hollow', nameCN: '暗穴',
            biome: 'cave', levelMin: 80, levelMax: 105, isTown: false,
            sunColor: '#605060', sunIntensity: 0.5,
            ambientColor: '#302030', skyTop: '#0A0510', skyBottom: '#201520',
            groundColor: '#2A2030',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'frost_peaks', position: { x: -80, z: 0 }, label: '← 霜峰' },
                  { targetZoneId: 'thunder_plains', position: { x: 80, z: 0 }, label: '雷鳴平原 →' },
            ],
            mapMonIds: ['MapMon007', 'MapMon012'],
      },
      // ── Zone 10: Thunder Plains (MapMon008, MapMon013) ──
      {
            id: 'thunder_plains', name: 'Thunder Plains', nameCN: '雷鳴平原',
            biome: 'grass', levelMin: 100, levelMax: 125, isTown: false,
            sunColor: '#C0A0E0', sunIntensity: 1.6,
            ambientColor: '#6050A0', skyTop: '#302060', skyBottom: '#7060A0',
            groundColor: '#4A5060',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'dark_hollow', position: { x: -80, z: 0 }, label: '← 暗穴' },
                  { targetZoneId: 'lava_sanctum', position: { x: 80, z: 0 }, label: '熔岩聖所 →' },
            ],
            mapMonIds: ['MapMon008', 'MapMon013'],
      },
      // ── Zone 11: Lava Sanctum ──
      {
            id: 'lava_sanctum', name: 'Lava Sanctum', nameCN: '熔岩聖所',
            biome: 'lava', levelMin: 120, levelMax: 150, isTown: false,
            sunColor: '#F04020', sunIntensity: 1.0,
            ambientColor: '#601010', skyTop: '#200000', skyBottom: '#600808',
            groundColor: '#3A1010',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'thunder_plains', position: { x: -80, z: 0 }, label: '← 雷鳴平原' },
            ],
            mapMonIds: [],
      },
      // ── Zone 12-16: Expansion zones (side areas) ──
      {
            id: 'ancient_ruins', name: 'Ancient Ruins', nameCN: '遠古遺跡',
            biome: 'desert', levelMin: 50, levelMax: 70, isTown: false,
            sunColor: '#E0C890', sunIntensity: 1.8,
            ambientColor: '#907050', skyTop: '#A08040', skyBottom: '#D0B880',
            groundColor: '#786048',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'main_city', position: { x: -80, z: 0 }, label: '← 主城' },
            ],
            mapMonIds: [],
      },
      {
            id: 'moonlit_grove', name: 'Moonlit Grove', nameCN: '月光林地',
            biome: 'forest', levelMin: 35, levelMax: 55, isTown: false,
            sunColor: '#A0B0D0', sunIntensity: 0.9,
            ambientColor: '#506080', skyTop: '#1A2040', skyBottom: '#405080',
            groundColor: '#2A4020',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'main_city', position: { x: -80, z: 0 }, label: '← 主城' },
            ],
            mapMonIds: [],
      },
      {
            id: 'storm_coast', name: 'Storm Coast', nameCN: '風暴海岸',
            biome: 'beach', levelMin: 70, levelMax: 90, isTown: false,
            sunColor: '#90A0B0', sunIntensity: 1.2,
            ambientColor: '#405060', skyTop: '#303848', skyBottom: '#607080',
            groundColor: '#8A9088',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'main_city', position: { x: -80, z: 0 }, label: '← 主城' },
            ],
            mapMonIds: [],
      },
      {
            id: 'dragon_nest', name: 'Dragon Nest', nameCN: '龍巢',
            biome: 'cave', levelMin: 90, levelMax: 120, isTown: false,
            sunColor: '#C06030', sunIntensity: 0.7,
            ambientColor: '#402020', skyTop: '#100505', skyBottom: '#301010',
            groundColor: '#2A1515',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'main_city', position: { x: -80, z: 0 }, label: '← 主城' },
            ],
            mapMonIds: [],
      },
      {
            id: 'sky_temple', name: 'Sky Temple', nameCN: '天空神殿',
            biome: 'snow', levelMin: 110, levelMax: 140, isTown: false,
            sunColor: '#E0E8FF', sunIntensity: 2.0,
            ambientColor: '#8090C0', skyTop: '#6080D0', skyBottom: '#C0D0F0',
            groundColor: '#B0B8D0',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'main_city', position: { x: -80, z: 0 }, label: '← 主城' },
            ],
            mapMonIds: [],
      },
      // ── Zone 17: Main City (Town, no monsters) ──
      {
            id: 'main_city', name: 'Main City', nameCN: '卡魯它那城',
            biome: 'town', levelMin: 0, levelMax: 0, isTown: true,
            sunColor: '#FFF0D8', sunIntensity: 1.6,
            ambientColor: '#A0A0B0', skyTop: '#4A6A9A', skyBottom: '#B0C0D0',
            groundColor: '#706860',
            spawnPoint: { x: 0, y: 0, z: 0 },
            gates: [
                  { targetZoneId: 'starter_meadow', position: { x: 80, z: 0 }, label: '新手草原 →' },
                  { targetZoneId: 'ancient_ruins', position: { x: 0, z: 80 }, label: '遠古遺跡 ↑' },
                  { targetZoneId: 'moonlit_grove', position: { x: 0, z: -80 }, label: '↓ 月光林地' },
                  { targetZoneId: 'storm_coast', position: { x: -80, z: 0 }, label: '← 風暴海岸' },
            ],
            mapMonIds: [],
      },
];

/** Quick lookup by zone ID */
export function getZoneDef(id: string): ZoneDef | undefined {
      return ZONE_DEFS.find(z => z.id === id);
}

/** Biome to texture filename mapping */
export const BIOME_TEXTURES: Record<BiomeType, { diffuse: string; normal: string }> = {
      grass: { diffuse: 'terrain_grass_diffuse.png', normal: 'terrain_grass_normal.png' },
      forest: { diffuse: 'terrain_forest_diffuse.png', normal: 'terrain_forest_normal.png' },
      desert: { diffuse: 'terrain_desert_diffuse.png', normal: 'terrain_desert_normal.png' },
      snow: { diffuse: 'terrain_snow_diffuse.png', normal: 'terrain_snow_normal.png' },
      cave: { diffuse: 'terrain_cave_diffuse.png', normal: 'terrain_cave_normal.png' },
      beach: { diffuse: 'terrain_grass_diffuse.png', normal: 'terrain_grass_normal.png' },  // reuse grass
      lava: { diffuse: 'terrain_desert_diffuse.png', normal: 'terrain_desert_normal.png' }, // reuse desert
      town: { diffuse: 'terrain_grass_diffuse.png', normal: 'terrain_grass_normal.png' },  // reuse grass
};
