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
      baseStats: { hp: number; atk: number; def: number; spd: number };
      skills: PetSkillDef[];
      baseLevel: number;
}

/** 40 pet definitions — 5 per series */
export const PET_DEFS: PetDef[] = [
      // Plant (🌿)
      { id: 'p_sprout', name: 'Sproutling', series: PetSeries.Plant, baseLevel: 1, baseStats: { hp: 80, atk: 8, def: 6, spd: 5 }, skills: [{ id: 'vine_whip', name: 'Vine Whip', damage: 12, cooldown: 1.5 }] },
      { id: 'p_bloom', name: 'Bloomguard', series: PetSeries.Plant, baseLevel: 5, baseStats: { hp: 110, atk: 10, def: 10, spd: 4 }, skills: [{ id: 'thorn_bash', name: 'Thorn Bash', damage: 18, cooldown: 2.0 }] },
      { id: 'p_oak', name: 'Oakshield', series: PetSeries.Plant, baseLevel: 12, baseStats: { hp: 160, atk: 12, def: 18, spd: 3 }, skills: [{ id: 'root_bind', name: 'Root Bind', damage: 14, cooldown: 2.5 }] },
      { id: 'p_lotus', name: 'Lotus Sage', series: PetSeries.Plant, baseLevel: 20, baseStats: { hp: 130, atk: 16, def: 12, spd: 6 }, skills: [{ id: 'petal_storm', name: 'Petal Storm', damage: 24, cooldown: 3.0 }] },
      { id: 'p_ancient', name: 'Ancient Treant', series: PetSeries.Plant, baseLevel: 35, baseStats: { hp: 250, atk: 20, def: 25, spd: 2 }, skills: [{ id: 'nature_wrath', name: 'Nature Wrath', damage: 35, cooldown: 4.0 }] },

      // Dragon (🐉)
      { id: 'd_whelp', name: 'Drake Whelp', series: PetSeries.Dragon, baseLevel: 1, baseStats: { hp: 90, atk: 12, def: 5, spd: 6 }, skills: [{ id: 'fire_breath', name: 'Fire Breath', damage: 15, cooldown: 1.5 }] },
      { id: 'd_wyrm', name: 'Storm Wyrm', series: PetSeries.Dragon, baseLevel: 8, baseStats: { hp: 120, atk: 16, def: 8, spd: 5 }, skills: [{ id: 'thunder_claw', name: 'Thunder Claw', damage: 20, cooldown: 2.0 }] },
      { id: 'd_drake', name: 'Iron Drake', series: PetSeries.Dragon, baseLevel: 15, baseStats: { hp: 150, atk: 20, def: 14, spd: 4 }, skills: [{ id: 'scale_shot', name: 'Scale Shot', damage: 22, cooldown: 1.8 }] },
      { id: 'd_elder', name: 'Elder Dragon', series: PetSeries.Dragon, baseLevel: 25, baseStats: { hp: 200, atk: 28, def: 16, spd: 5 }, skills: [{ id: 'inferno', name: 'Inferno', damage: 30, cooldown: 3.5 }] },
      { id: 'd_ancient', name: 'Ancient Wyrm', series: PetSeries.Dragon, baseLevel: 40, baseStats: { hp: 300, atk: 35, def: 20, spd: 6 }, skills: [{ id: 'dragon_rage', name: 'Dragon Rage', damage: 45, cooldown: 5.0 }] },

      // Beast (🦁)
      { id: 'b_cub', name: 'Lion Cub', series: PetSeries.Beast, baseLevel: 1, baseStats: { hp: 85, atk: 10, def: 7, spd: 7 }, skills: [{ id: 'pounce', name: 'Pounce', damage: 13, cooldown: 1.2 }] },
      { id: 'b_wolf', name: 'Shadow Wolf', series: PetSeries.Beast, baseLevel: 6, baseStats: { hp: 100, atk: 14, def: 8, spd: 8 }, skills: [{ id: 'fang_strike', name: 'Fang Strike', damage: 17, cooldown: 1.5 }] },
      { id: 'b_bear', name: 'Iron Bear', series: PetSeries.Beast, baseLevel: 14, baseStats: { hp: 180, atk: 16, def: 16, spd: 3 }, skills: [{ id: 'maul', name: 'Maul', damage: 22, cooldown: 2.5 }] },
      { id: 'b_tiger', name: 'Thunder Tiger', series: PetSeries.Beast, baseLevel: 22, baseStats: { hp: 150, atk: 24, def: 12, spd: 9 }, skills: [{ id: 'lightning_paw', name: 'Lightning Paw', damage: 28, cooldown: 2.0 }] },
      { id: 'b_king', name: 'Beast King', series: PetSeries.Beast, baseLevel: 38, baseStats: { hp: 260, atk: 32, def: 22, spd: 7 }, skills: [{ id: 'king_roar', name: 'King Roar', damage: 40, cooldown: 4.0 }] },

      // Insect (🐛)
      { id: 'i_larva', name: 'Glow Larva', series: PetSeries.Insect, baseLevel: 1, baseStats: { hp: 60, atk: 7, def: 4, spd: 9 }, skills: [{ id: 'acid_spit', name: 'Acid Spit', damage: 10, cooldown: 1.0 }] },
      { id: 'i_beetle', name: 'Shell Beetle', series: PetSeries.Insect, baseLevel: 5, baseStats: { hp: 90, atk: 9, def: 14, spd: 5 }, skills: [{ id: 'shell_slam', name: 'Shell Slam', damage: 14, cooldown: 2.0 }] },
      { id: 'i_mantis', name: 'Blade Mantis', series: PetSeries.Insect, baseLevel: 12, baseStats: { hp: 80, atk: 18, def: 6, spd: 10 }, skills: [{ id: 'slash', name: 'Cross Slash', damage: 20, cooldown: 1.5 }] },
      { id: 'i_spider', name: 'Web Spinner', series: PetSeries.Insect, baseLevel: 20, baseStats: { hp: 100, atk: 14, def: 10, spd: 8 }, skills: [{ id: 'web_trap', name: 'Web Trap', damage: 16, cooldown: 2.5 }] },
      { id: 'i_queen', name: 'Hive Queen', series: PetSeries.Insect, baseLevel: 36, baseStats: { hp: 200, atk: 25, def: 18, spd: 7 }, skills: [{ id: 'swarm', name: 'Swarm Strike', damage: 35, cooldown: 4.0 }] },

      // Metal (⚙)
      { id: 'm_gear', name: 'Gear Pup', series: PetSeries.Metal, baseLevel: 1, baseStats: { hp: 100, atk: 9, def: 10, spd: 4 }, skills: [{ id: 'spark', name: 'Spark Bolt', damage: 11, cooldown: 1.5 }] },
      { id: 'm_sentinel', name: 'Sentinel', series: PetSeries.Metal, baseLevel: 7, baseStats: { hp: 130, atk: 12, def: 15, spd: 3 }, skills: [{ id: 'shield_bash', name: 'Shield Bash', damage: 15, cooldown: 2.0 }] },
      { id: 'm_cannon', name: 'Steam Cannon', series: PetSeries.Metal, baseLevel: 15, baseStats: { hp: 140, atk: 20, def: 12, spd: 5 }, skills: [{ id: 'cannon_blast', name: 'Cannon Blast', damage: 24, cooldown: 2.5 }] },
      { id: 'm_golem', name: 'Chrome Golem', series: PetSeries.Metal, baseLevel: 24, baseStats: { hp: 220, atk: 18, def: 22, spd: 2 }, skills: [{ id: 'iron_fist', name: 'Iron Fist', damage: 28, cooldown: 3.0 }] },
      { id: 'm_titan', name: 'Mecha Titan', series: PetSeries.Metal, baseLevel: 40, baseStats: { hp: 320, atk: 30, def: 30, spd: 3 }, skills: [{ id: 'overdrive', name: 'Overdrive', damage: 42, cooldown: 5.0 }] },

      // Mystery (🔮)
      { id: 'y_wisp', name: 'Arcane Wisp', series: PetSeries.Mystery, baseLevel: 1, baseStats: { hp: 65, atk: 12, def: 4, spd: 8 }, skills: [{ id: 'magic_bolt', name: 'Magic Bolt', damage: 14, cooldown: 1.2 }] },
      { id: 'y_fairy', name: 'Moon Fairy', series: PetSeries.Mystery, baseLevel: 6, baseStats: { hp: 75, atk: 16, def: 5, spd: 9 }, skills: [{ id: 'starfall', name: 'Starfall', damage: 18, cooldown: 1.8 }] },
      { id: 'y_owl', name: 'Sage Owl', series: PetSeries.Mystery, baseLevel: 13, baseStats: { hp: 100, atk: 20, def: 10, spd: 7 }, skills: [{ id: 'mind_blast', name: 'Mind Blast', damage: 22, cooldown: 2.0 }] },
      { id: 'y_unicorn', name: 'Astral Unicorn', series: PetSeries.Mystery, baseLevel: 22, baseStats: { hp: 120, atk: 26, def: 12, spd: 8 }, skills: [{ id: 'cosmic_ray', name: 'Cosmic Ray', damage: 30, cooldown: 3.0 }] },
      { id: 'y_phoenix', name: 'Void Phoenix', series: PetSeries.Mystery, baseLevel: 38, baseStats: { hp: 200, atk: 38, def: 15, spd: 9 }, skills: [{ id: 'void_flame', name: 'Void Flame', damage: 48, cooldown: 5.0 }] },

      // Demon (😈)
      { id: 'e_imp', name: 'Shadow Imp', series: PetSeries.Demon, baseLevel: 1, baseStats: { hp: 70, atk: 11, def: 5, spd: 7 }, skills: [{ id: 'dark_claw', name: 'Dark Claw', damage: 13, cooldown: 1.3 }] },
      { id: 'e_ghoul', name: 'Bone Ghoul', series: PetSeries.Demon, baseLevel: 8, baseStats: { hp: 110, atk: 14, def: 9, spd: 5 }, skills: [{ id: 'soul_drain', name: 'Soul Drain', damage: 16, cooldown: 2.0 }] },
      { id: 'e_succubus', name: 'Night Witch', series: PetSeries.Demon, baseLevel: 16, baseStats: { hp: 95, atk: 22, def: 7, spd: 8 }, skills: [{ id: 'hex', name: 'Hex Bolt', damage: 24, cooldown: 2.0 }] },
      { id: 'e_reaper', name: 'Grim Reaper', series: PetSeries.Demon, baseLevel: 26, baseStats: { hp: 140, atk: 30, def: 10, spd: 7 }, skills: [{ id: 'death_sweep', name: 'Death Sweep', damage: 34, cooldown: 3.5 }] },
      { id: 'e_lord', name: 'Demon Lord', series: PetSeries.Demon, baseLevel: 42, baseStats: { hp: 280, atk: 40, def: 18, spd: 6 }, skills: [{ id: 'hellfire', name: 'Hellfire', damage: 50, cooldown: 5.0 }] },

      // Bird (🐦)
      { id: 'r_sparrow', name: 'Wind Sparrow', series: PetSeries.Bird, baseLevel: 1, baseStats: { hp: 55, atk: 9, def: 3, spd: 10 }, skills: [{ id: 'gust', name: 'Gust Strike', damage: 11, cooldown: 1.0 }] },
      { id: 'r_hawk', name: 'Storm Hawk', series: PetSeries.Bird, baseLevel: 5, baseStats: { hp: 70, atk: 13, def: 5, spd: 11 }, skills: [{ id: 'dive_bomb', name: 'Dive Bomb', damage: 16, cooldown: 1.5 }] },
      { id: 'r_eagle', name: 'Thunder Eagle', series: PetSeries.Bird, baseLevel: 14, baseStats: { hp: 90, atk: 18, def: 8, spd: 12 }, skills: [{ id: 'talon_rend', name: 'Talon Rend', damage: 21, cooldown: 1.8 }] },
      { id: 'r_gryphon', name: 'Golden Gryphon', series: PetSeries.Bird, baseLevel: 24, baseStats: { hp: 130, atk: 24, def: 12, spd: 10 }, skills: [{ id: 'sky_fury', name: 'Sky Fury', damage: 28, cooldown: 2.5 }] },
      { id: 'r_roc', name: 'Celestial Roc', series: PetSeries.Bird, baseLevel: 40, baseStats: { hp: 220, atk: 34, def: 16, spd: 11 }, skills: [{ id: 'tempest', name: 'Tempest', damage: 44, cooldown: 4.5 }] },
];
