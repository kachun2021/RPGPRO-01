import { ZONE_DEFS } from '../../world/ZoneDefinitions';

export type RuntimeZoneMatchMode = 'exact' | 'keyword' | 'series' | 'level' | 'none';

const EXACT_ZONE_MAP: Record<string, string> = {
      '巴爾幹入口': 'thunder_plains',
      '巴爾幹峽谷': 'thunder_plains',
      '命運的沙漠岔道': 'thunder_plains',
      '黑暗森林': 'dark_hollow',
      '迷幻沼澤': 'moonlit_grove',
      '魯那特地獄入口': 'lava_sanctum',
      '魯那特地獄1層': 'lava_sanctum',
      '魯那特地獄2層': 'lava_sanctum',
      '魯那特地獄3層': 'lava_sanctum',
      '魯那特地獄4層': 'lava_sanctum',
      '魯那特地獄5層': 'lava_sanctum',
      '魯狄斯地城廢墟': 'ancient_ruins',
      '2號魯狄斯南部': 'ancient_ruins',
      '魯狄斯廢墟[高]': 'ancient_ruins',
      '魯狄斯廢墟[低]': 'ancient_ruins',
      '29號靜音廢墟': 'ancient_ruins',
      '貝赫魯廢墟[高]': 'storm_coast',
      '貝赫魯廢墟[低]': 'storm_coast',
      '馬吉利塔廢墟[高]': 'storm_coast',
      '馬吉利塔廢墟[低]': 'storm_coast',
      '13號馬吉利塔西部海岸': 'storm_coast',
      '26號布買': 'ancient_ruins',
      '布買廢墟': 'ancient_ruins',
      '4號白色荒野': 'frost_peaks',
      '5號雙子峽谷': 'thunder_plains',
      '28號伊斯凱森林': 'misty_forest',
      '地城-機械之屋': 'dragon_nest',
      '地城-龍之屋': 'dragon_nest',
      '地城-鳥之屋': 'dragon_nest',
      '地城-植物之屋': 'dragon_nest',
      '地城-惡魔之屋': 'dragon_nest',
      '地城-獸之屋': 'dragon_nest',
      '地城-神秘之屋': 'dragon_nest',
      '地城-蟲之屋': 'dragon_nest',
      '勇氣試煉城1層': 'sky_temple',
      '勇氣試煉城2層': 'sky_temple',
      '勇氣試煉城3層': 'sky_temple',
      '勇氣試煉城4層': 'sky_temple',
      '勞吉塔地牢6層': 'dragon_nest',
      '勞吉塔地牢7層': 'dragon_nest',
      '勞吉塔地牢8層': 'dragon_nest',
      '勞吉塔地牢9層': 'dragon_nest',
      '希南的秘密通道': 'main_city',
      '西奈的遺址': 'ancient_ruins',
      '混亂的島': 'coral_beach',
      '流氓兔地圖': 'main_city',
};

const KEYWORD_ZONE_MAP: Array<{ keyword: string; zoneId: string }> = [
      { keyword: '巴爾克牧場', zoneId: 'starter_meadow' },
      { keyword: '河谷農場', zoneId: 'echo_valley' },
      { keyword: '巴爾幹', zoneId: 'thunder_plains' },
      { keyword: '魯那特地獄', zoneId: 'lava_sanctum' },
      { keyword: '魯狄斯', zoneId: 'ancient_ruins' },
      { keyword: '靜音廢墟', zoneId: 'ancient_ruins' },
      { keyword: '布買', zoneId: 'ancient_ruins' },
      { keyword: '貝赫魯', zoneId: 'storm_coast' },
      { keyword: '馬吉利塔', zoneId: 'storm_coast' },
      { keyword: '海岸', zoneId: 'storm_coast' },
      { keyword: '伊斯凱森林', zoneId: 'misty_forest' },
      { keyword: '森林', zoneId: 'misty_forest' },
      { keyword: '沼澤', zoneId: 'moonlit_grove' },
      { keyword: '白色荒野', zoneId: 'frost_peaks' },
      { keyword: '地城', zoneId: 'dragon_nest' },
      { keyword: '地牢', zoneId: 'dragon_nest' },
      { keyword: '試煉城', zoneId: 'sky_temple' },
      { keyword: '秘密通道', zoneId: 'main_city' },
      { keyword: '混亂的島', zoneId: 'coral_beach' },
];

const SERIES_FLOOR_PATTERN = /^(植物|龍系|龙系|獸系|兽系|蟲系|虫系|機械|机械|神秘|惡魔|恶魔|鳥系|鸟系)\d+層$/;

export function canonicalRuntimeMapName(raw: string): string {
      let clean = String(raw ?? '').trim();
      if (!clean) return '';
      clean = clean.replace(/［/g, '[').replace(/］/g, ']');
      clean = clean.replace(/\s+/g, '');
      clean = clean.replace(/巴爾克牧場([abc])/i, (_all, letter: string) => `巴爾克牧場${String(letter).toUpperCase()}`);
      clean = clean.replace(/\?+$/g, '');
      return clean;
}

export function matchRuntimeMapToSceneZone(mapName: string, minLevel: number, maxLevel: number): { zoneId: string | null; mode: RuntimeZoneMatchMode } {
      const key = canonicalRuntimeMapName(mapName);
      if (!key) return { zoneId: null, mode: 'none' };

      const lower = key.toLowerCase();
      for (const [exact, zoneId] of Object.entries(EXACT_ZONE_MAP)) {
            if (lower === exact.toLowerCase()) return { zoneId, mode: 'exact' };
      }

      if (SERIES_FLOOR_PATTERN.test(key)) return { zoneId: 'dragon_nest', mode: 'series' };

      for (const hint of KEYWORD_ZONE_MAP) {
            if (key.includes(hint.keyword)) return { zoneId: hint.zoneId, mode: 'keyword' };
      }

      const zones = ZONE_DEFS.filter(zone => !zone.isTown);
      if (zones.length === 0) return { zoneId: null, mode: 'none' };

      const avgLevel = (Math.max(1, minLevel) + Math.max(1, maxLevel)) / 2;
      let bestZone = zones[0];
      let bestScore = Number.POSITIVE_INFINITY;

      for (const zone of zones) {
            const center = (zone.levelMin + zone.levelMax) / 2;
            let score = Math.abs(center - avgLevel);
            if (avgLevel < zone.levelMin) score += (zone.levelMin - avgLevel) * 0.6;
            if (avgLevel > zone.levelMax) score += (avgLevel - zone.levelMax) * 0.6;
            if (score < bestScore) {
                  bestScore = score;
                  bestZone = zone;
            }
      }

      return { zoneId: bestZone.id, mode: 'level' };
}

