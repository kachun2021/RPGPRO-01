export interface RuntimeSceneZoneGroup {
      sceneZoneId: string;
      runtimeZoneIds: number[];
      syntheticNeighbors?: string[];
}

const GROUPS: RuntimeSceneZoneGroup[] = [
      {
            sceneZoneId: 'starter_meadow',
            runtimeZoneIds: [130],
            syntheticNeighbors: ['misty_forest'],
      },
      {
            sceneZoneId: 'misty_forest',
            runtimeZoneIds: [1, 4, 5, 7, 8, 14, 15, 21, 50],
      },
      {
            sceneZoneId: 'echo_valley',
            runtimeZoneIds: [3, 6, 17, 23, 160, 161],
      },
      {
            sceneZoneId: 'iron_ridge',
            runtimeZoneIds: [2, 25, 52],
      },
      {
            sceneZoneId: 'coral_beach',
            runtimeZoneIds: [66, 112],
      },
      {
            sceneZoneId: 'ancient_ruins',
            runtimeZoneIds: [33, 35, 36, 38, 131, 238, 239, 240, 241, 242, 243],
      },
      {
            sceneZoneId: 'crystal_caves',
            runtimeZoneIds: [81, 82, 83, 84, 85, 86, 87, 244, 245],
      },
      {
            sceneZoneId: 'moonlit_grove',
            runtimeZoneIds: [69, 72, 73, 74, 75, 91, 92, 93, 94, 95, 100],
      },
      {
            sceneZoneId: 'baluk_farm',
            runtimeZoneIds: [183, 184, 185, 186, 213, 214, 251, 252],
      },
      {
            sceneZoneId: 'storm_coast',
            runtimeZoneIds: [192, 193, 194, 195, 196, 197, 198, 199],
      },
      {
            sceneZoneId: 'frost_peaks',
            runtimeZoneIds: [31, 115],
      },
      {
            sceneZoneId: 'sinan_ruins',
            runtimeZoneIds: [113, 114, 116, 117, 118, 181, 182],
      },
      {
            sceneZoneId: 'dark_hollow',
            runtimeZoneIds: [200, 201, 202, 203, 204, 205, 206, 207, 246, 247],
      },
      {
            sceneZoneId: 'thunder_plains',
            runtimeZoneIds: [187, 188, 189, 190, 191],
      },
      {
            sceneZoneId: 'training_ground',
            runtimeZoneIds: [96, 97, 98, 99, 208, 209, 210, 211, 212],
      },
      {
            sceneZoneId: 'lava_sanctum',
            runtimeZoneIds: [177, 180],
      },
      {
            sceneZoneId: 'sky_temple',
            runtimeZoneIds: [103, 104, 105, 106, 107, 108, 109, 110],
            syntheticNeighbors: ['beast_sky', 'dragon_sky', 'demon_sky', 'plant_sky', 'mystery_sky', 'bird_sky', 'insect_sky', 'machine_sky'],
      },
      {
            sceneZoneId: 'town_magilita',
            runtimeZoneIds: [57, 101],
      },
      {
            sceneZoneId: 'town_migrita',
            runtimeZoneIds: [59, 102],
      },
      {
            sceneZoneId: 'town_beheru',
            runtimeZoneIds: [60],
      },
      {
            sceneZoneId: 'town_helsper',
            runtimeZoneIds: [63],
      },
      {
            sceneZoneId: 'town_ludis',
            runtimeZoneIds: [67],
      },
      {
            sceneZoneId: 'town_bumai',
            runtimeZoneIds: [111],
      },
      {
            sceneZoneId: 'pk_arena',
            runtimeZoneIds: [70, 71, 171, 172, 174, 175, 176],
            syntheticNeighbors: ['town_magilita'],
      },
      {
            sceneZoneId: 'office_hub',
            runtimeZoneIds: [237, 255],
            syntheticNeighbors: ['town_bumai'],
      },
      {
            sceneZoneId: 'beast_sky',
            runtimeZoneIds: [39, 40, 41, 42, 43, 44, 45, 46],
      },
      {
            sceneZoneId: 'dragon_sky',
            runtimeZoneIds: [119, 120, 121, 122, 123, 124, 125, 126],
      },
      {
            sceneZoneId: 'demon_sky',
            runtimeZoneIds: [127, 128, 129, 132, 133, 134, 135, 136],
      },
      {
            sceneZoneId: 'plant_sky',
            runtimeZoneIds: [137, 138, 139, 140, 141, 142, 143, 144],
      },
      {
            sceneZoneId: 'mystery_sky',
            runtimeZoneIds: [145, 146, 147, 148, 149, 154, 155, 156],
      },
      {
            sceneZoneId: 'bird_sky',
            runtimeZoneIds: [162, 163, 164, 165, 166, 167, 168, 169],
      },
      {
            sceneZoneId: 'insect_sky',
            runtimeZoneIds: [215, 216, 217, 218, 219, 220, 221, 222],
      },
      {
            sceneZoneId: 'machine_sky',
            runtimeZoneIds: [223, 224, 225, 226, 227, 228, 229, 230],
      },
      {
            sceneZoneId: 'kambu_beast',
            runtimeZoneIds: [9, 10, 11],
            syntheticNeighbors: ['beast_sky'],
      },
      {
            sceneZoneId: 'kambu_dragon',
            runtimeZoneIds: [12],
            syntheticNeighbors: ['dragon_sky'],
      },
      {
            sceneZoneId: 'kambu_mystery',
            runtimeZoneIds: [13],
            syntheticNeighbors: ['mystery_sky'],
      },
      {
            sceneZoneId: 'house_dungeons',
            runtimeZoneIds: [150, 151, 152, 153],
      },
];

const RUNTIME_TO_SCENE = new Map<number, string>();
const SCENE_TO_RUNTIME = new Map<string, number[]>();
const SCENE_TO_SYNTHETIC_NEIGHBORS = new Map<string, string[]>();

for (const group of GROUPS) {
      SCENE_TO_RUNTIME.set(group.sceneZoneId, [...group.runtimeZoneIds].sort((a, b) => a - b));
      if (Array.isArray(group.syntheticNeighbors) && group.syntheticNeighbors.length > 0) {
            SCENE_TO_SYNTHETIC_NEIGHBORS.set(group.sceneZoneId, Array.from(new Set(group.syntheticNeighbors)));
      }
      for (const runtimeZoneId of group.runtimeZoneIds) {
            if (RUNTIME_TO_SCENE.has(runtimeZoneId)) {
                  throw new Error(`[RuntimeZoneSceneMap] Duplicate runtime zone mapping for ${runtimeZoneId}`);
            }
            RUNTIME_TO_SCENE.set(runtimeZoneId, group.sceneZoneId);
      }
}

export function getExplicitSceneZoneIdForRuntimeZoneId(runtimeZoneId: number): string | null {
      return RUNTIME_TO_SCENE.get(Math.floor(runtimeZoneId)) ?? null;
}

export function listExplicitRuntimeZoneIdsForSceneZone(sceneZoneId: string): number[] {
      return [...(SCENE_TO_RUNTIME.get(sceneZoneId) ?? [])];
}

export function listExplicitRuntimeSceneZoneGroups(): RuntimeSceneZoneGroup[] {
      return GROUPS.map((group) => ({
            sceneZoneId: group.sceneZoneId,
            runtimeZoneIds: [...group.runtimeZoneIds],
            syntheticNeighbors: group.syntheticNeighbors ? [...group.syntheticNeighbors] : undefined,
      }));
}

export function listSyntheticSceneNeighbors(sceneZoneId: string): string[] {
      return [...(SCENE_TO_SYNTHETIC_NEIGHBORS.get(sceneZoneId) ?? [])];
}

export function countExplicitRuntimeSceneMappings(): number {
      return RUNTIME_TO_SCENE.size;
}
