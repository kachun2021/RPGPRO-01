/**
 * ZoneMonsterData — Monster entries per MapMon area from tables/Monster_Spawns.md.
 * Used by WorldMapPanel to show zone monster details and by MonsterManager for spawning.
 */

export interface ZoneMonsterEntry {
      name: string;
      level: number;
      mode: '主动式' | '被动式';
      respawnSec: number;
      isBoss?: boolean;
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
            { name: '坎布大王', level: 125, mode: '主动式', respawnSec: 3600, isBoss: true },
      ],

      // ══════ Expansion Zone MapMon Entries ══════

      // ── MapMon002: Ancient Ruins area 1 (Lv.17-21) ──
      MapMon002: [
            { name: '飛天龍', level: 20, mode: '被动式', respawnSec: 60 },
            { name: '阿呆', level: 19, mode: '被动式', respawnSec: 60 },
            { name: '小魔女', level: 21, mode: '被动式', respawnSec: 60 },
            { name: '紅眼藍鯨', level: 17, mode: '被动式', respawnSec: 60 },
            { name: '貓巫', level: 17, mode: '被动式', respawnSec: 60 },
            { name: '莫諾阿伊', level: 20, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon025: Ancient Ruins area 2 (Lv.17-22) ──
      MapMon025: [
            { name: '拳擊兔', level: 18, mode: '被动式', respawnSec: 60 },
            { name: '氣球鸚', level: 17, mode: '被动式', respawnSec: 60 },
            { name: '藍氣球鸚', level: 19, mode: '被动式', respawnSec: 60 },
            { name: '博士鷹', level: 21, mode: '被动式', respawnSec: 60 },
            { name: '紅鼻瓢蟲', level: 18, mode: '被动式', respawnSec: 60 },
            { name: '甜心寶貝', level: 20, mode: '被动式', respawnSec: 60 },
            { name: '甜心隊長', level: 22, mode: '被动式', respawnSec: 60 },
            { name: '哈普斯', level: 21, mode: '被动式', respawnSec: 60 },
            { name: '托娜西', level: 18, mode: '被动式', respawnSec: 60 },
            { name: '波理莫斯', level: 20, mode: '被动式', respawnSec: 60 },
            { name: '花妖寶寶', level: 22, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon050: Ancient Ruins area 3 (Lv.35-46) ──
      MapMon050: [
            { name: '人龍', level: 36, mode: '被动式', respawnSec: 60 },
            { name: '大腳怪', level: 35, mode: '被动式', respawnSec: 60 },
            { name: '惡靈', level: 38, mode: '被动式', respawnSec: 60 },
            { name: '暗人龍', level: 46, mode: '主动式', respawnSec: 60 },
            { name: '斯芬克思', level: 38, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon052: Ancient Ruins area 4 (Lv.25-38) ──
      MapMon052: [
            { name: '年獸', level: 29, mode: '被动式', respawnSec: 60 },
            { name: '牛牛龜', level: 25, mode: '被动式', respawnSec: 60 },
            { name: '阿莫布', level: 26, mode: '被动式', respawnSec: 60 },
            { name: '馬爾伊諾', level: 26, mode: '被动式', respawnSec: 60 },
            { name: '達杉凱特', level: 30, mode: '被动式', respawnSec: 60 },
            { name: '變異大眼', level: 38, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon031: Moonlit Grove (Lv.60-69) ──
      MapMon031: [
            { name: '黑暗守護犬', level: 69, mode: '主动式', respawnSec: 60 },
            { name: '翁克來斯', level: 69, mode: '主动式', respawnSec: 60 },
            { name: '斯凱波', level: 60, mode: '被动式', respawnSec: 60 },
            { name: '皇翼蜂', level: 65, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon038: Moonlit Grove area 2 (Lv.50-62) ──
      MapMon038: [
            { name: '綠尾雲龍', level: 52, mode: '被动式', respawnSec: 60 },
            { name: '萬聖惡魔', level: 52, mode: '被动式', respawnSec: 60 },
            { name: '布熱迪連特', level: 62, mode: '主动式', respawnSec: 60 },
            { name: '卡梅拉克', level: 50, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon066: Moonlit Grove area 3 (Lv.45-49) ──
      MapMon066: [
            { name: '肥肥', level: 48, mode: '被动式', respawnSec: 60 },
            { name: '假面鬼', level: 48, mode: '被动式', respawnSec: 60 },
            { name: '亘馬立奧', level: 45, mode: '被动式', respawnSec: 60 },
            { name: '暗惡靈', level: 49, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon033: Storm Coast (Lv.47-58) ──
      MapMon033: [
            { name: '雪橇狗', level: 47, mode: '被动式', respawnSec: 60 },
            { name: '大紅鷹', level: 48, mode: '被动式', respawnSec: 60 },
            { name: '瓦斯蛋', level: 53, mode: '被动式', respawnSec: 60 },
            { name: '變異大紅鷹', level: 58, mode: '主动式', respawnSec: 60 },
            { name: '蘇德特日', level: 56, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon035: Storm Coast area 2 (Lv.79-93) ──
      MapMon035: [
            { name: '伊夫來克', level: 80, mode: '被动式', respawnSec: 60 },
            { name: '毒骨龍', level: 93, mode: '主动式', respawnSec: 60 },
            { name: '小惡魔', level: 79, mode: '被动式', respawnSec: 60 },
      ],

      // ── MapMon036: Storm Coast area 3 (Lv.68-72) ──
      MapMon036: [
            { name: '蘇夫來克', level: 68, mode: '被动式', respawnSec: 60 },
            { name: '胖頭龍', level: 69, mode: '被动式', respawnSec: 60 },
            { name: '石奴', level: 72, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon039: Dragon Nest (Lv.90-104) ──
      MapMon039: [
            { name: '強化運動貓', level: 100, mode: '主动式', respawnSec: 60 },
            { name: '翡翠龜', level: 94, mode: '主动式', respawnSec: 60 },
            { name: '白毛怪', level: 104, mode: '主动式', respawnSec: 60 },
            { name: '變異蹦蹦兔', level: 90, mode: '主动式', respawnSec: 60 },
            { name: '雪人獅', level: 95, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon040: Dragon Nest area 2 (Lv.106-119) ──
      MapMon040: [
            { name: '滑輪犀牛', level: 119, mode: '主动式', respawnSec: 60 },
            { name: '雪狐', level: 112, mode: '主动式', respawnSec: 60 },
            { name: '雪地獅', level: 106, mode: '主动式', respawnSec: 60 },
            { name: '象鼻獸', level: 106, mode: '主动式', respawnSec: 60 },
            { name: '考拉', level: 106, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon041: Sky Temple (Lv.121-135) ──
      MapMon041: [
            { name: '暗影龜', level: 127, mode: '主动式', respawnSec: 60 },
            { name: '藍豬', level: 125, mode: '主动式', respawnSec: 60 },
            { name: '雪地獅王', level: 135, mode: '主动式', respawnSec: 60 },
            { name: '齙牙兔', level: 121, mode: '主动式', respawnSec: 60 },
            { name: '變異象鼻獸', level: 126, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon042: Lava Sanctum (Lv.136-151) ──
      MapMon042: [
            { name: '變異滑輪犀牛', level: 151, mode: '主动式', respawnSec: 60 },
            { name: '火焰獸', level: 150, mode: '主动式', respawnSec: 60 },
            { name: '背包考拉', level: 145, mode: '主动式', respawnSec: 60 },
            { name: '奶瓶牛', level: 136, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon043: Lava Sanctum area 2 (Lv.157-162) ──
      MapMon043: [
            { name: '風女', level: 162, mode: '主动式', respawnSec: 60 },
            { name: '超級雪地獅王', level: 162, mode: '主动式', respawnSec: 60 },
            { name: '老齙牙兔', level: 157, mode: '主动式', respawnSec: 60 },
      ],

      // ── MapMon098: Sky Temple area 2 (Lv.160-165) ──
      MapMon098: [
            { name: '紅剛', level: 160, mode: '主动式', respawnSec: 60 },
            { name: '超級卷尾巴', level: 164, mode: '主动式', respawnSec: 300 },
            { name: '變異毒骨龍', level: 163, mode: '主动式', respawnSec: 60 },
            { name: '魔術師', level: 160, mode: '主动式', respawnSec: 60 },
            { name: '魔王', level: 165, mode: '主动式', respawnSec: 60 },
      ],
};
