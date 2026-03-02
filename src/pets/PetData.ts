import { Color3 } from '@babylonjs/core/Maths/math.color';

/** 八大系列 */
export enum PetSeries {
      Plant = 'Plant',
      Dragon = 'Dragon',
      Beast = 'Beast',
      Insect = 'Insect',
      Metal = 'Metal',
      Mystery = 'Mystery',
      Demon = 'Demon',
      Bird = 'Bird',
}

/** 克制循環: Plant→Dragon→Beast→Insect→Metal→Mystery→Demon→Bird→Plant */
export const COUNTER_MAP: Record<PetSeries, PetSeries> = {
      [PetSeries.Plant]: PetSeries.Dragon,
      [PetSeries.Dragon]: PetSeries.Beast,
      [PetSeries.Beast]: PetSeries.Insect,
      [PetSeries.Insect]: PetSeries.Metal,
      [PetSeries.Metal]: PetSeries.Mystery,
      [PetSeries.Mystery]: PetSeries.Demon,
      [PetSeries.Demon]: PetSeries.Bird,
      [PetSeries.Bird]: PetSeries.Plant,
};

/** 系列顏色 */
export const SERIES_COLORS: Record<PetSeries, Color3> = {
      [PetSeries.Plant]: new Color3(0.2, 0.75, 0.3),
      [PetSeries.Dragon]: new Color3(0.9, 0.5, 0.15),
      [PetSeries.Beast]: new Color3(0.8, 0.65, 0.2),
      [PetSeries.Insect]: new Color3(0.55, 0.8, 0.25),
      [PetSeries.Metal]: new Color3(0.6, 0.65, 0.7),
      [PetSeries.Mystery]: new Color3(0.6, 0.3, 0.85),
      [PetSeries.Demon]: new Color3(0.8, 0.15, 0.2),
      [PetSeries.Bird]: new Color3(0.3, 0.7, 0.9),
};

/** 系列圖標文件名 */
export const SERIES_ICONS: Record<PetSeries, string> = {
      [PetSeries.Plant]: 'series_plant.png',
      [PetSeries.Dragon]: 'series_dragon.png',
      [PetSeries.Beast]: 'series_beast.png',
      [PetSeries.Insect]: 'series_insect.png',
      [PetSeries.Metal]: 'series_metal.png',
      [PetSeries.Mystery]: 'series_mystery.png',
      [PetSeries.Demon]: 'series_demon.png',
      [PetSeries.Bird]: 'series_bird.png',
};

/** 系列 Emoji (UI fallback) */
export const SERIES_EMOJI: Record<PetSeries, string> = {
      [PetSeries.Plant]: '🌿',
      [PetSeries.Dragon]: '🐉',
      [PetSeries.Beast]: '🦁',
      [PetSeries.Insect]: '🐛',
      [PetSeries.Metal]: '⚙️',
      [PetSeries.Mystery]: '🔮',
      [PetSeries.Demon]: '😈',
      [PetSeries.Bird]: '🦅',
};

export type Gender = 'male' | 'female';

export interface PetSkillDef {
      id: string; name: string; damage: number; cooldown: number;
      type?: 'physical' | 'magical'; // default physical
      range?: number; // attack range in units, default 2 (melee)
      mpCost?: number; // MP cost, default 0
}

export interface FusionIngredient {
      main: string; // pet def id
      sub: string;  // pet def id
}

// Note: MonsterBehavior ('主动式'|'被动式') moved to Monster.ts
// Pets have NO independent AI — they follow player's target

export interface PetDef {
      id: string;
      name: string;
      nameCN: string;
      series: PetSeries;
      acquisition: 'egg_drop' | 'fusion';
      fusionRecipes: FusionIngredient[]; // empty = egg_drop only
      attackType: 'melee' | 'ranged'; // melee=run to target, ranged=shoot projectile
      baseStats: {
            hp: number; mp: number;
            str: number; agi: number; acc: number; luk: number;
            atkMin: number; atkMax: number;
            hitRate: number; dodgeRate: number; element: number;
      };
      skills: PetSkillDef[];
      baseLevel: number;
}

/** 40 pet definitions — 5 per series, CHM-authentic names, two-path acquisition */
export const PET_DEFS: PetDef[] = [
      // ── Plant (🌿 植物系) ──
      { id: 'p_flowco', name: 'Flowco', nameCN: '苹果球', series: PetSeries.Plant, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 1, baseStats: { hp: 80, mp: 30, str: 12, agi: 8, acc: 10, luk: 6, atkMin: 6, atkMax: 10, hitRate: 18, dodgeRate: 8, element: 5 }, skills: [{ id: 'vine_whip', name: 'Vine Whip', damage: 12, cooldown: 1.5 }] },
      { id: 'p_manglock', name: 'Manglock', nameCN: '刺球', series: PetSeries.Plant, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 3, baseStats: { hp: 90, mp: 35, str: 14, agi: 9, acc: 12, luk: 7, atkMin: 7, atkMax: 12, hitRate: 20, dodgeRate: 9, element: 6 }, skills: [{ id: 'thorn_bash', name: 'Thorn Bash', damage: 14, cooldown: 1.8 }] },
      { id: 'p_jamoo', name: 'Jamoo', nameCN: '山参', series: PetSeries.Plant, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 5, baseStats: { hp: 110, mp: 40, str: 16, agi: 10, acc: 14, luk: 8, atkMin: 8, atkMax: 14, hitRate: 24, dodgeRate: 10, element: 8 }, skills: [{ id: 'root_bind', name: 'Root Bind', damage: 16, cooldown: 2.0 }] },
      { id: 'p_hornmameo', name: 'HornMameo', nameCN: '顽皮球', series: PetSeries.Plant, acquisition: 'fusion', fusionRecipes: [{ main: 'p_mameo', sub: 'i_snailbell' }, { main: 'p_flowco', sub: 'd_draco' }], attackType: 'melee', baseLevel: 35, baseStats: { hp: 200, mp: 70, str: 35, agi: 18, acc: 28, luk: 18, atkMin: 16, atkMax: 28, hitRate: 48, dodgeRate: 16, element: 24 }, skills: [{ id: 'petal_storm', name: 'Petal Storm', damage: 28, cooldown: 3.0 }] },
      { id: 'p_tenkaki', name: 'Tenkaki', nameCN: '木偶人', series: PetSeries.Plant, acquisition: 'fusion', fusionRecipes: [{ main: 'p_bamboo', sub: 'b_elephant' }], attackType: 'melee', baseLevel: 43, baseStats: { hp: 250, mp: 100, str: 45, agi: 20, acc: 36, luk: 22, atkMin: 18, atkMax: 32, hitRate: 60, dodgeRate: 22, element: 32 }, skills: [{ id: 'nature_wrath', name: 'Nature Wrath', damage: 35, cooldown: 4.0 }] },

      // ── Dragon (🐉 龙系) ──
      { id: 'd_draco', name: 'Draco', nameCN: '泡泡龙', series: PetSeries.Dragon, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 1, baseStats: { hp: 90, mp: 35, str: 14, agi: 10, acc: 12, luk: 5, atkMin: 8, atkMax: 16, hitRate: 22, dodgeRate: 10, element: 6 }, skills: [{ id: 'fire_breath', name: 'Fire Breath', damage: 15, cooldown: 1.5 }] },
      { id: 'd_pikey', name: 'Pikey', nameCN: '小泥鰅', series: PetSeries.Dragon, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 3, baseStats: { hp: 100, mp: 38, str: 16, agi: 11, acc: 14, luk: 6, atkMin: 9, atkMax: 17, hitRate: 24, dodgeRate: 11, element: 7 }, skills: [{ id: 'water_jet', name: 'Water Jet', damage: 16, cooldown: 1.6 }] },
      { id: 'd_imon', name: 'Imon', nameCN: '蓝箭', series: PetSeries.Dragon, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 5, baseStats: { hp: 120, mp: 45, str: 20, agi: 14, acc: 16, luk: 8, atkMin: 12, atkMax: 22, hitRate: 30, dodgeRate: 14, element: 10 }, skills: [{ id: 'thunder_claw', name: 'Thunder Claw', damage: 20, cooldown: 2.0 }] },
      { id: 'd_lausta', name: 'Lausta', nameCN: '肥肥', series: PetSeries.Dragon, acquisition: 'fusion', fusionRecipes: [{ main: 'd_darkdragon', sub: 'e_wraith' }, { main: 'd_humandragon', sub: 'e_wraith' }, { main: 'd_draco', sub: 'p_manglock' }], attackType: 'ranged', baseLevel: 48, baseStats: { hp: 200, mp: 80, str: 40, agi: 22, acc: 32, luk: 16, atkMin: 22, atkMax: 38, hitRate: 52, dodgeRate: 22, element: 25 }, skills: [{ id: 'inferno', name: 'Inferno', damage: 30, cooldown: 3.5 }] },
      { id: 'd_dragoer', name: 'Dragoer', nameCN: '胖头龙', series: PetSeries.Dragon, acquisition: 'fusion', fusionRecipes: [{ main: 'd_lausta_1', sub: 'y_chowie_1' }], attackType: 'ranged', baseLevel: 69, baseStats: { hp: 300, mp: 120, str: 55, agi: 28, acc: 42, luk: 22, atkMin: 30, atkMax: 50, hitRate: 68, dodgeRate: 28, element: 38 }, skills: [{ id: 'dragon_rage', name: 'Dragon Rage', damage: 45, cooldown: 5.0 }] },

      // ── Beast (🦁 兽系) ──
      { id: 'b_beasco', name: 'Beasco', nameCN: '猫尾球', series: PetSeries.Beast, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 1, baseStats: { hp: 85, mp: 25, str: 13, agi: 12, acc: 11, luk: 7, atkMin: 7, atkMax: 13, hitRate: 20, dodgeRate: 12, element: 5 }, skills: [{ id: 'pounce', name: 'Pounce', damage: 13, cooldown: 1.2 }] },
      { id: 'b_rabbo', name: 'Rabbo', nameCN: '蹦蹦兔', series: PetSeries.Beast, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 3, baseStats: { hp: 90, mp: 28, str: 14, agi: 14, acc: 12, luk: 8, atkMin: 8, atkMax: 14, hitRate: 22, dodgeRate: 14, element: 6 }, skills: [{ id: 'kick', name: 'Rabbit Kick', damage: 14, cooldown: 1.3 }] },
      { id: 'b_goa', name: 'Goa', nameCN: '舌怪', series: PetSeries.Beast, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 5, baseStats: { hp: 100, mp: 35, str: 18, agi: 16, acc: 15, luk: 10, atkMin: 10, atkMax: 18, hitRate: 28, dodgeRate: 16, element: 8 }, skills: [{ id: 'fang_strike', name: 'Fang Strike', damage: 17, cooldown: 1.5 }] },
      { id: 'b_rrainova', name: 'Rrainova', nameCN: '雪橇狗', series: PetSeries.Beast, acquisition: 'fusion', fusionRecipes: [{ main: 'b_whitetiger', sub: 'd_humandragon' }], attackType: 'melee', baseLevel: 47, baseStats: { hp: 220, mp: 60, str: 42, agi: 24, acc: 32, luk: 18, atkMin: 20, atkMax: 34, hitRate: 52, dodgeRate: 24, element: 28 }, skills: [{ id: 'ice_fang', name: 'Ice Fang', damage: 30, cooldown: 2.5 }] },
      { id: 'b_dashabell', name: 'Dashabell', nameCN: '黑暗守护犬', series: PetSeries.Beast, acquisition: 'fusion', fusionRecipes: [{ main: 'b_rrainova_1', sub: 'd_darkdragon_1' }], attackType: 'melee', baseLevel: 69, baseStats: { hp: 260, mp: 90, str: 50, agi: 28, acc: 40, luk: 24, atkMin: 28, atkMax: 46, hitRate: 64, dodgeRate: 28, element: 35 }, skills: [{ id: 'king_roar', name: 'King Roar', damage: 40, cooldown: 4.0 }] },

      // ── Insect (🐛 虫系) ──
      { id: 'i_inseco', name: 'Inseco', nameCN: '琥珀球', series: PetSeries.Insect, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 1, baseStats: { hp: 60, mp: 20, str: 10, agi: 14, acc: 9, luk: 8, atkMin: 5, atkMax: 9, hitRate: 16, dodgeRate: 14, element: 4 }, skills: [{ id: 'acid_spit', name: 'Acid Spit', damage: 10, cooldown: 1.0 }] },
      { id: 'i_pee', name: 'Pee', nameCN: '天使蜂', series: PetSeries.Insect, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 3, baseStats: { hp: 65, mp: 25, str: 11, agi: 16, acc: 11, luk: 9, atkMin: 6, atkMax: 10, hitRate: 18, dodgeRate: 16, element: 5 }, skills: [{ id: 'sting', name: 'Bee Sting', damage: 12, cooldown: 1.2 }] },
      { id: 'i_bookworm', name: 'Bookworm', nameCN: '眼镜虫', series: PetSeries.Insect, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 5, baseStats: { hp: 90, mp: 30, str: 14, agi: 10, acc: 16, luk: 10, atkMin: 7, atkMax: 13, hitRate: 26, dodgeRate: 10, element: 7 }, skills: [{ id: 'shell_slam', name: 'Shell Slam', damage: 14, cooldown: 2.0 }] },
      { id: 'i_hornking', name: 'HornKing', nameCN: '变异领路甲虫', series: PetSeries.Insect, acquisition: 'fusion', fusionRecipes: [{ main: 'i_snailbell', sub: 'y_xiaoxin' }], attackType: 'melee', baseLevel: 47, baseStats: { hp: 160, mp: 65, str: 36, agi: 22, acc: 30, luk: 16, atkMin: 18, atkMax: 30, hitRate: 48, dodgeRate: 22, element: 26 }, skills: [{ id: 'cross_slash', name: 'Cross Slash', damage: 28, cooldown: 2.0 }] },
      { id: 'i_kingdusty', name: 'KingDusty', nameCN: '皇翼蜂', series: PetSeries.Insect, acquisition: 'fusion', fusionRecipes: [{ main: 'i_gascan_1', sub: 'r_doctoreagle_1' }], attackType: 'melee', baseLevel: 65, baseStats: { hp: 200, mp: 80, str: 40, agi: 24, acc: 36, luk: 20, atkMin: 22, atkMax: 38, hitRate: 58, dodgeRate: 26, element: 30 }, skills: [{ id: 'swarm', name: 'Swarm Strike', damage: 35, cooldown: 4.0 }] },

      // ── Metal (⚙️ 机械系) ──
      { id: 'm_metaco', name: 'Metaco', nameCN: '圆圆', series: PetSeries.Metal, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 1, baseStats: { hp: 100, mp: 30, str: 12, agi: 8, acc: 13, luk: 5, atkMin: 6, atkMax: 12, hitRate: 20, dodgeRate: 8, element: 6 }, skills: [{ id: 'spark', name: 'Spark Bolt', damage: 11, cooldown: 1.5 }] },
      { id: 'm_metalocks', name: 'Metalocks', nameCN: '尖甲虫', series: PetSeries.Metal, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 3, baseStats: { hp: 110, mp: 32, str: 14, agi: 9, acc: 15, luk: 6, atkMin: 7, atkMax: 14, hitRate: 22, dodgeRate: 9, element: 7 }, skills: [{ id: 'metal_claw', name: 'Metal Claw', damage: 13, cooldown: 1.6 }] },
      { id: 'm_bigmaq', name: 'BigMaq', nameCN: '小齿轮', series: PetSeries.Metal, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'melee', baseLevel: 5, baseStats: { hp: 130, mp: 40, str: 18, agi: 10, acc: 18, luk: 8, atkMin: 10, atkMax: 18, hitRate: 28, dodgeRate: 10, element: 10 }, skills: [{ id: 'shield_bash', name: 'Shield Bash', damage: 15, cooldown: 2.0 }] },
      { id: 'm_ancientkilla', name: 'AncientKilla', nameCN: '斯芬克思', series: PetSeries.Metal, acquisition: 'fusion', fusionRecipes: [{ main: 'y_monoai', sub: 'i_snailbell' }], attackType: 'melee', baseLevel: 38, baseStats: { hp: 220, mp: 70, str: 32, agi: 14, acc: 28, luk: 14, atkMin: 16, atkMax: 28, hitRate: 44, dodgeRate: 14, element: 24 }, skills: [{ id: 'iron_fist', name: 'Iron Fist', damage: 28, cooldown: 3.0 }] },
      { id: 'm_gamerika', name: 'Gamerika', nameCN: '卡梅拉克', series: PetSeries.Metal, acquisition: 'fusion', fusionRecipes: [{ main: 'm_bullturtle', sub: 'y_maruino' }], attackType: 'melee', baseLevel: 50, baseStats: { hp: 320, mp: 110, str: 50, agi: 18, acc: 42, luk: 20, atkMin: 26, atkMax: 44, hitRate: 66, dodgeRate: 18, element: 36 }, skills: [{ id: 'overdrive', name: 'Overdrive', damage: 42, cooldown: 5.0 }] },

      // ── Mystery (🔮 神秘系) ──
      { id: 'y_mysco', name: 'Mysco', nameCN: '灵球', series: PetSeries.Mystery, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 1, baseStats: { hp: 65, mp: 50, str: 8, agi: 12, acc: 14, luk: 10, atkMin: 8, atkMax: 18, hitRate: 24, dodgeRate: 12, element: 8 }, skills: [{ id: 'magic_bolt', name: 'Magic Bolt', damage: 14, cooldown: 1.2 }] },
      { id: 'y_ukki', name: 'Ukki', nameCN: '护卫', series: PetSeries.Mystery, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 3, baseStats: { hp: 70, mp: 55, str: 10, agi: 14, acc: 16, luk: 12, atkMin: 10, atkMax: 20, hitRate: 28, dodgeRate: 14, element: 10 }, skills: [{ id: 'guard_pulse', name: 'Guard Pulse', damage: 15, cooldown: 1.5 }] },
      { id: 'y_nortscross', name: 'NortsNcross', nameCN: '斑马虫', series: PetSeries.Mystery, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 5, baseStats: { hp: 75, mp: 60, str: 12, agi: 16, acc: 18, luk: 14, atkMin: 12, atkMax: 22, hitRate: 32, dodgeRate: 16, element: 12 }, skills: [{ id: 'starfall', name: 'Starfall', damage: 18, cooldown: 1.8 }] },
      { id: 'y_aquaping', name: 'AquaPing', nameCN: '变异大眼', series: PetSeries.Mystery, acquisition: 'fusion', fusionRecipes: [{ main: 'y_dashanket', sub: 'i_snailbell' }], attackType: 'ranged', baseLevel: 38, baseStats: { hp: 120, mp: 100, str: 24, agi: 18, acc: 30, luk: 22, atkMin: 22, atkMax: 38, hitRate: 52, dodgeRate: 20, element: 26 }, skills: [{ id: 'cosmic_ray', name: 'Cosmic Ray', damage: 30, cooldown: 3.0 }] },
      { id: 'y_chowie', name: 'Chowie', nameCN: '亡马立奥', series: PetSeries.Mystery, acquisition: 'fusion', fusionRecipes: [{ main: 'y_dashanket', sub: 'p_bamboo' }, { main: 'y_dashanket', sub: 'b_whitetiger' }], attackType: 'ranged', baseLevel: 45, baseStats: { hp: 200, mp: 140, str: 42, agi: 26, acc: 44, luk: 28, atkMin: 34, atkMax: 56, hitRate: 72, dodgeRate: 28, element: 40 }, skills: [{ id: 'void_flame', name: 'Void Flame', damage: 48, cooldown: 5.0 }] },

      // ── Demon (😈 恶魔系) ──
      { id: 'e_devilco', name: 'Devilco', nameCN: '黑球球', series: PetSeries.Demon, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 1, baseStats: { hp: 70, mp: 35, str: 14, agi: 12, acc: 11, luk: 6, atkMin: 7, atkMax: 15, hitRate: 20, dodgeRate: 12, element: 5 }, skills: [{ id: 'dark_claw', name: 'Dark Claw', damage: 13, cooldown: 1.3 }] },
      { id: 'e_rurabbi', name: 'Rurabbi', nameCN: '露露', series: PetSeries.Demon, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 3, baseStats: { hp: 75, mp: 38, str: 15, agi: 13, acc: 12, luk: 7, atkMin: 8, atkMax: 16, hitRate: 22, dodgeRate: 13, element: 6 }, skills: [{ id: 'shadow_bolt', name: 'Shadow Bolt', damage: 14, cooldown: 1.4 }] },
      { id: 'e_bebe', name: 'Bebe', nameCN: '奶嘴鹰', series: PetSeries.Demon, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 5, baseStats: { hp: 80, mp: 42, str: 17, agi: 14, acc: 14, luk: 8, atkMin: 9, atkMax: 18, hitRate: 24, dodgeRate: 14, element: 8 }, skills: [{ id: 'soul_drain', name: 'Soul Drain', damage: 16, cooldown: 1.6 }] },
      { id: 'e_pumped', name: 'Pumped', nameCN: '万圣恶魔', series: PetSeries.Demon, acquisition: 'fusion', fusionRecipes: [{ main: 'e_wraith', sub: 'y_xiaoxin' }], attackType: 'ranged', baseLevel: 52, baseStats: { hp: 180, mp: 80, str: 38, agi: 22, acc: 34, luk: 18, atkMin: 26, atkMax: 42, hitRate: 56, dodgeRate: 22, element: 28 }, skills: [{ id: 'hex', name: 'Hex Bolt', damage: 34, cooldown: 2.5 }] },
      { id: 'e_kugutu', name: 'Kugutu', nameCN: '巨灵恶魔', series: PetSeries.Demon, acquisition: 'fusion', fusionRecipes: [{ main: 'e_mask_1', sub: 'd_lausta_1' }], attackType: 'ranged', baseLevel: 65, baseStats: { hp: 280, mp: 130, str: 58, agi: 28, acc: 48, luk: 24, atkMin: 36, atkMax: 58, hitRate: 76, dodgeRate: 30, element: 42 }, skills: [{ id: 'hellfire', name: 'Hellfire', damage: 50, cooldown: 5.0 }] },

      // ── Bird (🦅 鸟系) ──
      { id: 'r_birdco', name: 'Birdco', nameCN: '天使球', series: PetSeries.Bird, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 1, baseStats: { hp: 55, mp: 25, str: 10, agi: 16, acc: 12, luk: 8, atkMin: 5, atkMax: 11, hitRate: 20, dodgeRate: 16, element: 4 }, skills: [{ id: 'gust', name: 'Gust Strike', damage: 11, cooldown: 1.0 }] },
      { id: 'r_beasco', name: 'BeascoBird', nameCN: '尖嘴鸡', series: PetSeries.Bird, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 3, baseStats: { hp: 60, mp: 28, str: 12, agi: 18, acc: 13, luk: 9, atkMin: 6, atkMax: 13, hitRate: 22, dodgeRate: 18, element: 5 }, skills: [{ id: 'peck', name: 'Sharp Peck', damage: 13, cooldown: 1.1 }] },
      { id: 'r_caminho', name: 'Caminho', nameCN: '荷包蛋', series: PetSeries.Bird, acquisition: 'egg_drop', fusionRecipes: [], attackType: 'ranged', baseLevel: 5, baseStats: { hp: 70, mp: 35, str: 16, agi: 20, acc: 16, luk: 12, atkMin: 9, atkMax: 17, hitRate: 28, dodgeRate: 20, element: 7 }, skills: [{ id: 'dive_bomb', name: 'Dive Bomb', damage: 16, cooldown: 1.5 }] },
      { id: 'r_thunderbird', name: 'Thunderbird', nameCN: '大红鹰', series: PetSeries.Bird, acquisition: 'fusion', fusionRecipes: [{ main: 'r_redpig', sub: 'y_xiaoxin' }, { main: 'r_redpig', sub: 'd_humandragon' }], attackType: 'ranged', baseLevel: 48, baseStats: { hp: 130, mp: 70, str: 34, agi: 30, acc: 30, luk: 20, atkMin: 20, atkMax: 36, hitRate: 52, dodgeRate: 30, element: 22 }, skills: [{ id: 'sky_fury', name: 'Sky Fury', damage: 28, cooldown: 2.5 }] },
      { id: 'r_wingcrusher', name: 'WingCrusher', nameCN: '翁克来斯', series: PetSeries.Bird, acquisition: 'fusion', fusionRecipes: [{ main: 'r_thunderbird_1', sub: 'i_gascan_1' }], attackType: 'ranged', baseLevel: 69, baseStats: { hp: 220, mp: 100, str: 50, agi: 36, acc: 42, luk: 26, atkMin: 30, atkMax: 50, hitRate: 70, dodgeRate: 36, element: 38 }, skills: [{ id: 'tempest', name: 'Tempest', damage: 44, cooldown: 4.5 }] },
];
