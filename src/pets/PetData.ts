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

export type Gender = 'male' | 'female';

export interface PetSkillDef {
      id: string; name: string; damage: number; cooldown: number;
}

export interface PetDef {
      id: string;
      name: string;
      series: PetSeries;
      baseStats: {
            hp: number; mp: number;
            str: number; agi: number; acc: number; luk: number;
            atkMin: number; atkMax: number;
            hitRate: number; dodgeRate: number; element: number;
      };
      skills: PetSkillDef[];
      baseLevel: number;
}

/** 40 pet definitions — 5 per series, 8-dimension Stone Age stats */
export const PET_DEFS: PetDef[] = [
      // Plant (🌿)
      { id: 'p_sprout', name: 'Sproutling', series: PetSeries.Plant, baseLevel: 1, baseStats: { hp: 80, mp: 30, str: 12, agi: 8, acc: 10, luk: 6, atkMin: 6, atkMax: 10, hitRate: 18, dodgeRate: 8, element: 5 }, skills: [{ id: 'vine_whip', name: 'Vine Whip', damage: 12, cooldown: 1.5 }] },
      { id: 'p_bloom', name: 'Bloomguard', series: PetSeries.Plant, baseLevel: 5, baseStats: { hp: 110, mp: 40, str: 16, agi: 10, acc: 14, luk: 8, atkMin: 8, atkMax: 14, hitRate: 24, dodgeRate: 10, element: 8 }, skills: [{ id: 'thorn_bash', name: 'Thorn Bash', damage: 18, cooldown: 2.0 }] },
      { id: 'p_oak', name: 'Oakshield', series: PetSeries.Plant, baseLevel: 12, baseStats: { hp: 160, mp: 50, str: 22, agi: 12, acc: 18, luk: 12, atkMin: 10, atkMax: 18, hitRate: 32, dodgeRate: 12, element: 14 }, skills: [{ id: 'root_bind', name: 'Root Bind', damage: 14, cooldown: 2.5 }] },
      { id: 'p_lotus', name: 'Lotus Sage', series: PetSeries.Plant, baseLevel: 20, baseStats: { hp: 130, mp: 70, str: 28, agi: 16, acc: 24, luk: 16, atkMin: 14, atkMax: 22, hitRate: 42, dodgeRate: 18, element: 20 }, skills: [{ id: 'petal_storm', name: 'Petal Storm', damage: 24, cooldown: 3.0 }] },
      { id: 'p_ancient', name: 'Ancient Treant', series: PetSeries.Plant, baseLevel: 35, baseStats: { hp: 250, mp: 100, str: 45, agi: 20, acc: 36, luk: 22, atkMin: 18, atkMax: 32, hitRate: 60, dodgeRate: 22, element: 32 }, skills: [{ id: 'nature_wrath', name: 'Nature Wrath', damage: 35, cooldown: 4.0 }] },

      // Dragon (🐉)
      { id: 'd_whelp', name: 'Drake Whelp', series: PetSeries.Dragon, baseLevel: 1, baseStats: { hp: 90, mp: 35, str: 14, agi: 10, acc: 12, luk: 5, atkMin: 8, atkMax: 16, hitRate: 22, dodgeRate: 10, element: 6 }, skills: [{ id: 'fire_breath', name: 'Fire Breath', damage: 15, cooldown: 1.5 }] },
      { id: 'd_wyrm', name: 'Storm Wyrm', series: PetSeries.Dragon, baseLevel: 8, baseStats: { hp: 120, mp: 45, str: 20, agi: 14, acc: 16, luk: 8, atkMin: 12, atkMax: 22, hitRate: 30, dodgeRate: 14, element: 10 }, skills: [{ id: 'thunder_claw', name: 'Thunder Claw', damage: 20, cooldown: 2.0 }] },
      { id: 'd_drake', name: 'Iron Drake', series: PetSeries.Dragon, baseLevel: 15, baseStats: { hp: 150, mp: 55, str: 28, agi: 16, acc: 22, luk: 12, atkMin: 16, atkMax: 28, hitRate: 38, dodgeRate: 16, element: 16 }, skills: [{ id: 'scale_shot', name: 'Scale Shot', damage: 22, cooldown: 1.8 }] },
      { id: 'd_elder', name: 'Elder Dragon', series: PetSeries.Dragon, baseLevel: 25, baseStats: { hp: 200, mp: 80, str: 40, agi: 22, acc: 32, luk: 16, atkMin: 22, atkMax: 38, hitRate: 52, dodgeRate: 22, element: 25 }, skills: [{ id: 'inferno', name: 'Inferno', damage: 30, cooldown: 3.5 }] },
      { id: 'd_ancient', name: 'Ancient Wyrm', series: PetSeries.Dragon, baseLevel: 40, baseStats: { hp: 300, mp: 120, str: 55, agi: 28, acc: 42, luk: 22, atkMin: 30, atkMax: 50, hitRate: 68, dodgeRate: 28, element: 38 }, skills: [{ id: 'dragon_rage', name: 'Dragon Rage', damage: 45, cooldown: 5.0 }] },

      // Beast (🦁)
      { id: 'b_cub', name: 'Lion Cub', series: PetSeries.Beast, baseLevel: 1, baseStats: { hp: 85, mp: 25, str: 13, agi: 12, acc: 11, luk: 7, atkMin: 7, atkMax: 13, hitRate: 20, dodgeRate: 12, element: 5 }, skills: [{ id: 'pounce', name: 'Pounce', damage: 13, cooldown: 1.2 }] },
      { id: 'b_wolf', name: 'Shadow Wolf', series: PetSeries.Beast, baseLevel: 6, baseStats: { hp: 100, mp: 35, str: 18, agi: 16, acc: 15, luk: 10, atkMin: 10, atkMax: 18, hitRate: 28, dodgeRate: 16, element: 8 }, skills: [{ id: 'fang_strike', name: 'Fang Strike', damage: 17, cooldown: 1.5 }] },
      { id: 'b_bear', name: 'Iron Bear', series: PetSeries.Beast, baseLevel: 14, baseStats: { hp: 180, mp: 45, str: 26, agi: 12, acc: 20, luk: 14, atkMin: 14, atkMax: 24, hitRate: 34, dodgeRate: 12, element: 15 }, skills: [{ id: 'maul', name: 'Maul', damage: 22, cooldown: 2.5 }] },
      { id: 'b_tiger', name: 'Thunder Tiger', series: PetSeries.Beast, baseLevel: 22, baseStats: { hp: 150, mp: 60, str: 35, agi: 24, acc: 28, luk: 18, atkMin: 20, atkMax: 34, hitRate: 48, dodgeRate: 24, element: 22 }, skills: [{ id: 'lightning_paw', name: 'Lightning Paw', damage: 28, cooldown: 2.0 }] },
      { id: 'b_king', name: 'Beast King', series: PetSeries.Beast, baseLevel: 38, baseStats: { hp: 260, mp: 90, str: 50, agi: 28, acc: 40, luk: 24, atkMin: 28, atkMax: 46, hitRate: 64, dodgeRate: 28, element: 35 }, skills: [{ id: 'king_roar', name: 'King Roar', damage: 40, cooldown: 4.0 }] },

      // Insect (🐛)
      { id: 'i_larva', name: 'Glow Larva', series: PetSeries.Insect, baseLevel: 1, baseStats: { hp: 60, mp: 20, str: 10, agi: 14, acc: 9, luk: 8, atkMin: 5, atkMax: 9, hitRate: 16, dodgeRate: 14, element: 4 }, skills: [{ id: 'acid_spit', name: 'Acid Spit', damage: 10, cooldown: 1.0 }] },
      { id: 'i_beetle', name: 'Shell Beetle', series: PetSeries.Insect, baseLevel: 5, baseStats: { hp: 90, mp: 30, str: 14, agi: 10, acc: 16, luk: 10, atkMin: 7, atkMax: 13, hitRate: 26, dodgeRate: 10, element: 7 }, skills: [{ id: 'shell_slam', name: 'Shell Slam', damage: 14, cooldown: 2.0 }] },
      { id: 'i_mantis', name: 'Blade Mantis', series: PetSeries.Insect, baseLevel: 12, baseStats: { hp: 80, mp: 40, str: 24, agi: 22, acc: 20, luk: 12, atkMin: 14, atkMax: 26, hitRate: 36, dodgeRate: 22, element: 12 }, skills: [{ id: 'slash', name: 'Cross Slash', damage: 20, cooldown: 1.5 }] },
      { id: 'i_spider', name: 'Web Spinner', series: PetSeries.Insect, baseLevel: 20, baseStats: { hp: 100, mp: 55, str: 22, agi: 18, acc: 24, luk: 16, atkMin: 12, atkMax: 20, hitRate: 40, dodgeRate: 18, element: 18 }, skills: [{ id: 'web_trap', name: 'Web Trap', damage: 16, cooldown: 2.5 }] },
      { id: 'i_queen', name: 'Hive Queen', series: PetSeries.Insect, baseLevel: 36, baseStats: { hp: 200, mp: 80, str: 40, agi: 24, acc: 36, luk: 20, atkMin: 22, atkMax: 38, hitRate: 58, dodgeRate: 26, element: 30 }, skills: [{ id: 'swarm', name: 'Swarm Strike', damage: 35, cooldown: 4.0 }] },

      // Metal (⚙)
      { id: 'm_gear', name: 'Gear Pup', series: PetSeries.Metal, baseLevel: 1, baseStats: { hp: 100, mp: 30, str: 12, agi: 8, acc: 13, luk: 5, atkMin: 6, atkMax: 12, hitRate: 20, dodgeRate: 8, element: 6 }, skills: [{ id: 'spark', name: 'Spark Bolt', damage: 11, cooldown: 1.5 }] },
      { id: 'm_sentinel', name: 'Sentinel', series: PetSeries.Metal, baseLevel: 7, baseStats: { hp: 130, mp: 40, str: 18, agi: 10, acc: 18, luk: 8, atkMin: 10, atkMax: 18, hitRate: 28, dodgeRate: 10, element: 10 }, skills: [{ id: 'shield_bash', name: 'Shield Bash', damage: 15, cooldown: 2.0 }] },
      { id: 'm_cannon', name: 'Steam Cannon', series: PetSeries.Metal, baseLevel: 15, baseStats: { hp: 140, mp: 55, str: 28, agi: 14, acc: 24, luk: 12, atkMin: 16, atkMax: 28, hitRate: 40, dodgeRate: 14, element: 16 }, skills: [{ id: 'cannon_blast', name: 'Cannon Blast', damage: 24, cooldown: 2.5 }] },
      { id: 'm_golem', name: 'Chrome Golem', series: PetSeries.Metal, baseLevel: 24, baseStats: { hp: 220, mp: 70, str: 32, agi: 10, acc: 28, luk: 14, atkMin: 16, atkMax: 26, hitRate: 44, dodgeRate: 10, element: 24 }, skills: [{ id: 'iron_fist', name: 'Iron Fist', damage: 28, cooldown: 3.0 }] },
      { id: 'm_titan', name: 'Mecha Titan', series: PetSeries.Metal, baseLevel: 40, baseStats: { hp: 320, mp: 110, str: 50, agi: 18, acc: 42, luk: 20, atkMin: 26, atkMax: 44, hitRate: 66, dodgeRate: 18, element: 36 }, skills: [{ id: 'overdrive', name: 'Overdrive', damage: 42, cooldown: 5.0 }] },

      // Mystery (🔮)
      { id: 'y_wisp', name: 'Arcane Wisp', series: PetSeries.Mystery, baseLevel: 1, baseStats: { hp: 65, mp: 50, str: 8, agi: 12, acc: 14, luk: 10, atkMin: 8, atkMax: 18, hitRate: 24, dodgeRate: 12, element: 8 }, skills: [{ id: 'magic_bolt', name: 'Magic Bolt', damage: 14, cooldown: 1.2 }] },
      { id: 'y_fairy', name: 'Moon Fairy', series: PetSeries.Mystery, baseLevel: 6, baseStats: { hp: 75, mp: 60, str: 12, agi: 16, acc: 18, luk: 14, atkMin: 12, atkMax: 22, hitRate: 32, dodgeRate: 16, element: 12 }, skills: [{ id: 'starfall', name: 'Starfall', damage: 18, cooldown: 1.8 }] },
      { id: 'y_owl', name: 'Sage Owl', series: PetSeries.Mystery, baseLevel: 13, baseStats: { hp: 100, mp: 75, str: 18, agi: 14, acc: 24, luk: 18, atkMin: 16, atkMax: 28, hitRate: 42, dodgeRate: 14, element: 18 }, skills: [{ id: 'mind_blast', name: 'Mind Blast', damage: 22, cooldown: 2.0 }] },
      { id: 'y_unicorn', name: 'Astral Unicorn', series: PetSeries.Mystery, baseLevel: 22, baseStats: { hp: 120, mp: 100, str: 24, agi: 18, acc: 30, luk: 22, atkMin: 22, atkMax: 38, hitRate: 52, dodgeRate: 20, element: 26 }, skills: [{ id: 'cosmic_ray', name: 'Cosmic Ray', damage: 30, cooldown: 3.0 }] },
      { id: 'y_phoenix', name: 'Void Phoenix', series: PetSeries.Mystery, baseLevel: 38, baseStats: { hp: 200, mp: 140, str: 42, agi: 26, acc: 44, luk: 28, atkMin: 34, atkMax: 56, hitRate: 72, dodgeRate: 28, element: 40 }, skills: [{ id: 'void_flame', name: 'Void Flame', damage: 48, cooldown: 5.0 }] },

      // Demon (😈)
      { id: 'e_imp', name: 'Shadow Imp', series: PetSeries.Demon, baseLevel: 1, baseStats: { hp: 70, mp: 35, str: 14, agi: 12, acc: 11, luk: 6, atkMin: 7, atkMax: 15, hitRate: 20, dodgeRate: 12, element: 5 }, skills: [{ id: 'dark_claw', name: 'Dark Claw', damage: 13, cooldown: 1.3 }] },
      { id: 'e_ghoul', name: 'Bone Ghoul', series: PetSeries.Demon, baseLevel: 8, baseStats: { hp: 110, mp: 45, str: 20, agi: 14, acc: 16, luk: 8, atkMin: 10, atkMax: 20, hitRate: 28, dodgeRate: 14, element: 10 }, skills: [{ id: 'soul_drain', name: 'Soul Drain', damage: 16, cooldown: 2.0 }] },
      { id: 'e_succubus', name: 'Night Witch', series: PetSeries.Demon, baseLevel: 16, baseStats: { hp: 95, mp: 65, str: 28, agi: 20, acc: 24, luk: 14, atkMin: 18, atkMax: 30, hitRate: 42, dodgeRate: 20, element: 16 }, skills: [{ id: 'hex', name: 'Hex Bolt', damage: 24, cooldown: 2.0 }] },
      { id: 'e_reaper', name: 'Grim Reaper', series: PetSeries.Demon, baseLevel: 26, baseStats: { hp: 140, mp: 80, str: 38, agi: 22, acc: 34, luk: 18, atkMin: 26, atkMax: 42, hitRate: 56, dodgeRate: 22, element: 28 }, skills: [{ id: 'death_sweep', name: 'Death Sweep', damage: 34, cooldown: 3.5 }] },
      { id: 'e_lord', name: 'Demon Lord', series: PetSeries.Demon, baseLevel: 42, baseStats: { hp: 280, mp: 130, str: 58, agi: 28, acc: 48, luk: 24, atkMin: 36, atkMax: 58, hitRate: 76, dodgeRate: 30, element: 42 }, skills: [{ id: 'hellfire', name: 'Hellfire', damage: 50, cooldown: 5.0 }] },

      // Bird (🐦)
      { id: 'r_sparrow', name: 'Wind Sparrow', series: PetSeries.Bird, baseLevel: 1, baseStats: { hp: 55, mp: 25, str: 10, agi: 16, acc: 12, luk: 8, atkMin: 5, atkMax: 11, hitRate: 20, dodgeRate: 16, element: 4 }, skills: [{ id: 'gust', name: 'Gust Strike', damage: 11, cooldown: 1.0 }] },
      { id: 'r_hawk', name: 'Storm Hawk', series: PetSeries.Bird, baseLevel: 5, baseStats: { hp: 70, mp: 35, str: 16, agi: 20, acc: 16, luk: 12, atkMin: 9, atkMax: 17, hitRate: 28, dodgeRate: 20, element: 7 }, skills: [{ id: 'dive_bomb', name: 'Dive Bomb', damage: 16, cooldown: 1.5 }] },
      { id: 'r_eagle', name: 'Thunder Eagle', series: PetSeries.Bird, baseLevel: 14, baseStats: { hp: 90, mp: 50, str: 24, agi: 26, acc: 22, luk: 16, atkMin: 14, atkMax: 26, hitRate: 40, dodgeRate: 26, element: 14 }, skills: [{ id: 'talon_rend', name: 'Talon Rend', damage: 21, cooldown: 1.8 }] },
      { id: 'r_gryphon', name: 'Golden Gryphon', series: PetSeries.Bird, baseLevel: 24, baseStats: { hp: 130, mp: 70, str: 34, agi: 30, acc: 30, luk: 20, atkMin: 20, atkMax: 36, hitRate: 52, dodgeRate: 30, element: 22 }, skills: [{ id: 'sky_fury', name: 'Sky Fury', damage: 28, cooldown: 2.5 }] },
      { id: 'r_roc', name: 'Celestial Roc', series: PetSeries.Bird, baseLevel: 40, baseStats: { hp: 220, mp: 100, str: 50, agi: 36, acc: 42, luk: 26, atkMin: 30, atkMax: 50, hitRate: 70, dodgeRate: 36, element: 38 }, skills: [{ id: 'tempest', name: 'Tempest', damage: 44, cooldown: 4.5 }] },
];
