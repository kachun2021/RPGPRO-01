import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

export type NPCType = 'merchant' | 'skill_master' | 'quest' | 'pet_trader';

export interface NPCDef {
      id: string;
      name: string;
      type: NPCType;
      position: Vector3;
      color: Color3;
      dialogue: string[];
      zoneId: string;
}

const NPC_TYPE_COLORS: Record<NPCType, Color3> = {
      merchant: new Color3(0.2, 0.7, 0.3),
      skill_master: new Color3(0.3, 0.4, 0.9),
      quest: new Color3(0.9, 0.7, 0.2),
      pet_trader: new Color3(0.8, 0.3, 0.6),
};

/** All NPC definitions (no 合成師 — fusion is in UI) */
export const NPC_DEFS: NPCDef[] = [
      {
            id: 'npc_merchant', name: '商人 老王', type: 'merchant', position: new Vector3(5, 0, 3), color: NPC_TYPE_COLORS.merchant, zoneId: 'starter_meadow',
            dialogue: ['歡迎光臨！', '需要買點什麼嗎？', '今天有特價哦！']
      },
      {
            id: 'npc_skill_master', name: '技能導師 李風', type: 'skill_master', position: new Vector3(-5, 0, 8), color: NPC_TYPE_COLORS.skill_master, zoneId: 'starter_meadow',
            dialogue: ['想學新技能嗎？', '修煉需要時間和金幣。', '集中精神，跟我練！']
      },
      {
            id: 'npc_quest_01', name: '村長 趙伯', type: 'quest', position: new Vector3(3, 0, -5), color: NPC_TYPE_COLORS.quest, zoneId: 'starter_meadow',
            dialogue: ['冒險者你好！', '附近的怪物越來越多了...', '能幫忙清理一下嗎？']
      },
      {
            id: 'npc_pet_trader', name: '換寵商人 阿暗', type: 'pet_trader', position: new Vector3(-8, 0, -3), color: NPC_TYPE_COLORS.pet_trader, zoneId: 'starter_meadow',
            dialogue: ['我收集稀有寵物！', '用你的寵物跟我交換吧！', '公平交易，絕不吃虧！']
      },
];

/**
 * NPC — 3D entity in the world with billboard marker and collision detection.
 */
export class NPC {
      readonly def: NPCDef;
      readonly root: TransformNode;
      readonly mesh: Mesh;
      private _marker!: HTMLDivElement;
      private _scene: Scene;

      constructor(scene: Scene, def: NPCDef) {
            this._scene = scene;
            this.def = def;

            this.root = new TransformNode(`npc_${def.id}`, scene);
            this.root.position.copyFrom(def.position);

            // Body — taller capsule shape
            this.mesh = MeshBuilder.CreateCapsule(`npc_body_${def.id}`, {
                  height: 2.2, radius: 0.4, tessellation: 12, subdivisions: 1,
            }, scene);
            this.mesh.parent = this.root;
            this.mesh.position.y = 1.1;

            const mat = new StandardMaterial(`npc_mat_${def.id}`, scene);
            mat.diffuseColor = def.color;
            mat.emissiveColor = def.color.scale(0.3);
            mat.specularColor = Color3.Black();
            this.mesh.material = mat;

            // DOM billboard marker
            this._createMarker();
      }

      private _createMarker(): void {
            this._marker = document.createElement('div');
            this._marker.className = 'npc-marker';
            this._marker.innerHTML = `
                  <div class="npc-marker-icon">${this.def.type === 'quest' ? '❗' : this.def.type === 'pet_trader' ? '🔄' : this.def.type === 'merchant' ? '🛒' : '📖'}</div>
                  <div class="npc-marker-name">${this.def.name}</div>
            `;
            document.getElementById('ui-layer')?.appendChild(this._marker);
      }

      /** Update billboard position to screen coords */
      updateBillboard(scene: Scene): void {
            if (!scene.activeCamera) { this._marker.style.display = 'none'; return; }
            const engine = scene.getEngine();
            const cam = scene.activeCamera;
            const viewport = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            const worldPos = this.root.position.add(new Vector3(0, 2.8, 0));

            const pos = Vector3.Project(
                  worldPos,
                  Matrix.IdentityReadOnly,
                  scene.getTransformMatrix(),
                  viewport,
            );

            if (pos.z < 0 || pos.z > 1) {
                  this._marker.style.display = 'none';
                  return;
            }

            this._marker.style.display = 'block';
            this._marker.style.left = `${pos.x}px`;
            this._marker.style.top = `${pos.y}px`;
      }

      /** Check if player is within interaction range */
      isInRange(playerPos: Vector3, range: number = 3): boolean {
            const dx = this.root.position.x - playerPos.x;
            const dz = this.root.position.z - playerPos.z;
            return Math.sqrt(dx * dx + dz * dz) < range;
      }

      dispose(): void {
            this.mesh.dispose();
            this.root.dispose();
            this._marker.remove();
      }
}

/**
 * NPCManager — Manages all NPCs in the current zone.
 */
export class NPCManager {
      private _scene: Scene;
      private _npcs: NPC[] = [];
      private _onInteract: ((npc: NPC) => void) | null = null;
      private _interactCooldown = 0;

      set onInteract(cb: ((npc: NPC) => void) | null) { this._onInteract = cb; }

      constructor(scene: Scene) {
            this._scene = scene;
      }

      /** Spawn NPCs for a given zone */
      spawnForZone(zoneId: string): void {
            this.despawnAll();
            const defs = NPC_DEFS.filter(d => d.zoneId === zoneId);
            for (const def of defs) {
                  this._npcs.push(new NPC(this._scene, def));
            }
      }

      /** Update billboards and check proximity */
      update(dt: number, playerPos: Vector3): void {
            this._interactCooldown = Math.max(0, this._interactCooldown - dt);

            for (const npc of this._npcs) {
                  npc.updateBillboard(this._scene);

                  if (this._interactCooldown <= 0 && npc.isInRange(playerPos)) {
                        this._interactCooldown = 2; // 2s cooldown between interactions
                        this._onInteract?.(npc);
                  }
            }
      }

      despawnAll(): void {
            for (const npc of this._npcs) npc.dispose();
            this._npcs = [];
      }

      dispose(): void { this.despawnAll(); }
}
