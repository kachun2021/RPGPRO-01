export interface HeroArchetypeProfile {
      heroType: number;
      roleLabel: string;
      shortDesc: string;
      starterSkillIds: string[];
      starterPetIds: string[];
}

const ARCHETYPE_BY_TYPE: Record<number, HeroArchetypeProfile> = {
      0: {
            heroType: 0,
            roleLabel: '近戰先鋒',
            shortDesc: '血量穩定、容錯高，適合新手與長時間掛機。',
            starterSkillIds: ['slash', 'power_strike', 'counter', 'shield', 'bind'],
            starterPetIds: ['d_draco', 'b_beasco', 'm_metaco'],
      },
      1: {
            heroType: 1,
            roleLabel: '敏捷獵手',
            shortDesc: '節奏快、打點高，擅長清怪與迴避。',
            starterSkillIds: ['slash', 'whirlwind', 'stun', 'haste', 'steal'],
            starterPetIds: ['r_birdco', 'i_inseco', 'b_rabbo'],
      },
      2: {
            heroType: 2,
            roleLabel: '恢復支援',
            shortDesc: '治療與保命向，推圖穩定度高。',
            starterSkillIds: ['heal', 'group_heal', 'shield', 'detox', 'thorns'],
            starterPetIds: ['p_flowco', 'm_metaco', 'r_birdco'],
      },
      3: {
            heroType: 3,
            roleLabel: '元素術士',
            shortDesc: '爆發與範圍輸出高，但較吃技能節奏。',
            starterSkillIds: ['fire_bolt', 'ice_shard', 'thunder', 'weaken', 'poison'],
            starterPetIds: ['d_imon', 'r_birdco', 'i_inseco'],
      },
};

const FALLBACK_PROFILE: HeroArchetypeProfile = ARCHETYPE_BY_TYPE[0];

export function getHeroArchetypeProfile(heroType: number): HeroArchetypeProfile {
      const key = Number.isFinite(heroType) ? Math.floor(heroType) : 0;
      return ARCHETYPE_BY_TYPE[key] ?? FALLBACK_PROFILE;
}
