/**
 * ZoneMonsterData — Monster entries per MapMon area from tables/Monster_Spawns.md.
 * Used by WorldMapPanel to show zone monster details.
 */

export interface ZoneMonsterEntry {
      name: string;
      level: number;
      mode: '主动式' | '被动式';
      respawnSec: number;
}

/** Map of MapMon IDs to their monster entries */
export const ZONE_MONSTER_DATA: Record<string, ZoneMonsterEntry[]> = {
      // ── MapMon003: Starter Meadow (Lv.1-5) ──
      MapMon003: [
            { name: '泡泡龍', level: 1, mode: '被动式', respawnSec: 60 },
            { name: '黑球球', level: 1, mode: '被动式', respawnSec: 60 },
            { name: '琥珀球', level: 1, mode: '被动式', respawnSec: 60 },
            { name: '露露', level: 3, mode: '被动式', respawnSec: 60 },
            { name: '蹦蹦兔', level: 3, mode: '被动式', respawnSec: 60 },
            { name: '尖嘴雞', level: 3, mode: '被动式', respawnSec: 60 },
            { name: '天使蜜蜂', level: 3, mode: '被动式', respawnSec: 60 },
            { name: '刺球', level: 3, mode: '被动式', respawnSec: 60 },
            { name: '蘋果球', level: 1, mode: '被动式', respawnSec: 60 },
            { name: '圓圓', level: 1, mode: '被动式', respawnSec: 60 },
            { name: '護衛', level: 3, mode: '被动式', respawnSec: 60 },
            { name: '尖甲蟲', level: 3, mode: '被动式', respawnSec: 60 },
            { name: '五尾狐', level: 110, mode: '被动式', respawnSec: 300 },
      ],

      // ── MapMon017: Misty Forest (Lv.5-10) ──
      MapMon017: [
            { name: '藍箭', level: 5, mode: '被动式', respawnSec: 60 },
            { name: '蝙蝠龍', level: 7, mode: '被动式', respawnSec: 60 },
            { name: '奶嘴鷹', level: 5, mode: '被动式', respawnSec: 60 },
            { name: '舌怪', level: 5, mode: '被动式', respawnSec: 60 },
            { name: '飛天豬', level: 7, mode: '被动式', respawnSec: 60 },
            { name: '眼鏡蟲', level: 5, mode: '被动式', respawnSec: 60 },
            { name: '小探頭', level: 7, mode: '被动式', respawnSec: 60 },
            { name: '綠苞子', level: 7, mode: '被动式', respawnSec: 60 },
            { name: '斑馬蟲', level: 5, mode: '被动式', respawnSec: 60 },
            { name: '靈靈', level: 7, mode: '被动式', respawnSec: 60 },
            { name: '小齒輪', level: 5, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon023: Echo Valley (Lv.9-15) ──
      MapMon023: [
            { name: '龍貓', level: 9, mode: '被动式', respawnSec: 60 },
            { name: 'ET寶寶', level: 11, mode: '被动式', respawnSec: 60 },
            { name: '達Q拉', level: 9, mode: '被动式', respawnSec: 60 },
            { name: '饅頭豬', level: 9, mode: '被动式', respawnSec: 60 },
            { name: '乖乖蛋', level: 9, mode: '被动式', respawnSec: 60 },
            { name: '喇叭蜂', level: 9, mode: '被动式', respawnSec: 60 },
            { name: '吉祥龜', level: 11, mode: '被动式', respawnSec: 60 },
            { name: '綠葉寶寶', level: 11, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon014: Iron Ridge (Lv.13-16) ──
      MapMon014: [
            { name: '鐵甲蟲', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '木茄', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '綠蔬', level: 15, mode: '被动式', respawnSec: 60 },
            { name: '甜心小子', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '刺刺豬', level: 15, mode: '被动式', respawnSec: 60 },
            { name: '百合鳥', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '傑弗德', level: 15, mode: '被动式', respawnSec: 60 },
            { name: '呆頭蠅', level: 15, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon006: Iron Ridge 2nd area (Lv.13-16) ──
      MapMon006: [
            { name: '憨豆龍', level: 15, mode: '被动式', respawnSec: 60 },
            { name: '蝠翼龍', level: 14, mode: '被动式', respawnSec: 60 },
            { name: '變異邦迪', level: 16, mode: '主动式', respawnSec: 120 },
            { name: '皮皮', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '幽靈狗', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '酷日波伊', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '小丑怪', level: 15, mode: '被动式', respawnSec: 60 },
            { name: '那莎波', level: 13, mode: '被动式', respawnSec: 60 },
            { name: '望遠鏡晃晃', level: 15, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon015: Coral Beach (Lv.20-30) ──
      MapMon015: [
            { name: '紅嘴豚', level: 30, mode: '被动式', respawnSec: 60 },
            { name: '臭臭', level: 24, mode: '被动式', respawnSec: 60 },
            { name: '大象露比', level: 27, mode: '被动式', respawnSec: 60 },
            { name: '領路甲蟲', level: 27, mode: '被动式', respawnSec: 60 },
            { name: '變異博士鷹', level: 31, mode: '主动式', respawnSec: 60 },
            { name: '變異拳擊兔', level: 28, mode: '主动式', respawnSec: 60 },
            { name: '水鏡', level: 30, mode: '被动式', respawnSec: 60 },
            { name: '羅基仁', level: 25, mode: '被动式', respawnSec: 60 },
            { name: '酷基馬', level: 24, mode: '被动式', respawnSec: 60 },
            { name: '蝸牛叮鐺', level: 30, mode: '被动式', respawnSec: 60 },
            { name: '大嘴怪', level: 24, mode: '被动式', respawnSec: 60 },
            { name: '樹精寶寶', level: 27, mode: '被动式', respawnSec: 60 },
            { name: '椰蛋樹', level: 30, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon021: Crystal Caves (Lv.33-47) ──
      MapMon021: [
            { name: '白虎', level: 34, mode: '被动式', respawnSec: 60 },
            { name: '小新', level: 37, mode: '被动式', respawnSec: 60 },
            { name: '運動貓', level: 43, mode: '被动式', respawnSec: 60 },
            { name: '節節高', level: 33, mode: '被动式', respawnSec: 60 },
            { name: '木偶人', level: 43, mode: '被动式', respawnSec: 60 },
            { name: '木牌怪', level: 46, mode: '被动式', respawnSec: 60 },
            { name: '變異領路甲蟲', level: 47, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon001: Ember Wastes (Lv.40-45) ──
      MapMon001: [
            { name: '小流氓兔', level: 40, mode: '被动式', respawnSec: 120 },
            { name: '玉杵兔子', level: 40, mode: '主动式', respawnSec: 60 },
            { name: '變異刺球', level: 40, mode: '主动式', respawnSec: 180 },
            { name: '大流氓兔', level: 45, mode: '主动式', respawnSec: 3600 },
      ],

      // ── MapMon004: Ember Wastes 2 (Lv.60-65) ──
      MapMon004: [
            { name: '小流氓兔', level: 60, mode: '被动式', respawnSec: 120 },
            { name: '玉杵兔子', level: 60, mode: '主动式', respawnSec: 60 },
            { name: '變異刺球', level: 60, mode: '主动式', respawnSec: 180 },
            { name: '大流氓兔', level: 65, mode: '主动式', respawnSec: 3600 },
      ],

      // ── MapMon005: Frost Peaks (Lv.80-85) ──
      MapMon005: [
            { name: '小流氓兔', level: 80, mode: '被动式', respawnSec: 120 },
            { name: '玉杵兔子', level: 80, mode: '主动式', respawnSec: 60 },
            { name: '變異刺球', level: 80, mode: '主动式', respawnSec: 180 },
            { name: '大流氓兔', level: 85, mode: '主动式', respawnSec: 3600 },
      ],

      // ── MapMon009-011: Frost Peaks side areas ──
      MapMon009: [
            { name: '曲奇狗', level: 40, mode: '主动式', respawnSec: 120 },
            { name: '小坎布', level: 40, mode: '主动式', respawnSec: 60 },
            { name: '紫尾狐', level: 40, mode: '主动式', respawnSec: 180 },
            { name: '坎布大王', level: 45, mode: '主动式', respawnSec: 3600 },
      ],
      MapMon010: [
            { name: '曲奇狗', level: 60, mode: '主动式', respawnSec: 120 },
            { name: '小坎布', level: 60, mode: '主动式', respawnSec: 60 },
            { name: '紫尾狐', level: 60, mode: '主动式', respawnSec: 180 },
            { name: '坎布大王', level: 65, mode: '主动式', respawnSec: 3600 },
      ],
      MapMon011: [
            { name: '曲奇狗', level: 80, mode: '主动式', respawnSec: 120 },
            { name: '小坎布', level: 80, mode: '主动式', respawnSec: 60 },
            { name: '紫尾狐', level: 80, mode: '主动式', respawnSec: 180 },
            { name: '坎布大王', level: 85, mode: '主动式', respawnSec: 3600 },
      ],

      // ── MapMon007: Dark Hollow (Lv.100-105) ──
      MapMon007: [
            { name: '小流氓兔', level: 100, mode: '被动式', respawnSec: 120 },
            { name: '玉杵兔子', level: 100, mode: '主动式', respawnSec: 60 },
            { name: '變異刺球', level: 100, mode: '主动式', respawnSec: 180 },
            { name: '大流氓兔', level: 105, mode: '主动式', respawnSec: 3600 },
      ],

      // ── MapMon012: Dark Hollow 2 (Lv.100-105) ──
      MapMon012: [
            { name: '曲奇狗', level: 100, mode: '主动式', respawnSec: 120 },
            { name: '小坎布', level: 100, mode: '主动式', respawnSec: 60 },
            { name: '紫尾狐', level: 100, mode: '主动式', respawnSec: 180 },
            { name: '坎布大王', level: 105, mode: '主动式', respawnSec: 3600 },
      ],

      // ── MapMon008: Thunder Plains (Lv.120-125) ──
      MapMon008: [
            { name: '小流氓兔', level: 120, mode: '被动式', respawnSec: 120 },
            { name: '玉杵兔子', level: 120, mode: '主动式', respawnSec: 60 },
            { name: '變異刺球', level: 120, mode: '主动式', respawnSec: 180 },
            { name: '大流氓兔', level: 125, mode: '主动式', respawnSec: 3600 },
      ],

      // ── MapMon013: Thunder Plains 2 (Lv.120-125) ──
      MapMon013: [
            { name: '曲奇狗', level: 120, mode: '主动式', respawnSec: 120 },
            { name: '小坎布', level: 120, mode: '主动式', respawnSec: 60 },
            { name: '紫尾狐', level: 120, mode: '主动式', respawnSec: 180 },
            { name: '坎布大王', level: 125, mode: '主动式', respawnSec: 3600 },
      ],
};
