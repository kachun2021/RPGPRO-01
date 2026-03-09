import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { PointerInfo } from '@babylonjs/core/Events/pointerEvents';

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

const NPC_TYPE_ICONS: Record<NPCType, string> = {
      merchant: '🛒', skill_master: '📖', quest: '❗', pet_trader: '🔄',
};

const NPC_TYPE_LABELS: Record<NPCType, string> = {
      merchant: '補給商店',
      skill_master: '技能導師',
      quest: '主線任務',
      pet_trader: '寵物交換',
};

const NPC_INTERACT_LABELS: Record<NPCType, string> = {
      merchant: '購買補給',
      skill_master: '學習技能',
      quest: '接取任務',
      pet_trader: '查看換寵',
};

/** All NPC definitions (no 合成師 — fusion is in UI) */
export const NPC_DEFS: NPCDef[] = [
      {
            id: 'npc_merchant', name: '商人 老王', type: 'merchant', position: new Vector3(16, 0, -2), color: NPC_TYPE_COLORS.merchant, zoneId: 'starter_meadow',
            dialogue: ['歡迎光臨！', '新手先帶幾瓶 HP 藥水再出村，比較安全。', '買完補給再往草原前方練功吧。']
      },
      {
            id: 'npc_skill_master', name: '技能導師 李風', type: 'skill_master', position: new Vector3(-16, 0, 6), color: NPC_TYPE_COLORS.skill_master, zoneId: 'starter_meadow',
            dialogue: ['想學新技能嗎？', '你的開局技能已經配置好了，先熟悉戰鬥節奏。', '等你清完村長的委託，再來找我精進。']
      },
      {
            id: 'npc_quest_01', name: '村長 趙伯', type: 'quest', position: new Vector3(0, 0, -14), color: NPC_TYPE_COLORS.quest, zoneId: 'starter_meadow',
            dialogue: ['冒險者你好！', '先接下委託，到前方草原清理 5 隻擾民怪物。', '藥水不夠就先去找商人老王補給，再回來報告。']
      },
      {
            id: 'npc_pet_trader', name: '換寵商人 阿暗', type: 'pet_trader', position: new Vector3(-14, 0, -14), color: NPC_TYPE_COLORS.pet_trader, zoneId: 'starter_meadow',
            dialogue: ['我收集稀有寵物！', '用你的寵物跟我交換吧！', '公平交易，絕不吃虧！']
      },
];

/**
 * NPC — 3D entity with billboard marker + click-to-interact prompt bubble.
 * 
 * Market standard design:
 * - Billboard icon (❗/🛒/📖/🔄) always visible above NPC head
 * - When player is within 3m: show small "💬 對話" prompt bubble near NPC
 * - Player clicks the prompt bubble OR the NPC mesh to open dialogue
 * - Dialogue does NOT auto-open on proximity
 */
export class NPC {
      readonly def: NPCDef;
      readonly root: TransformNode;
      readonly mesh: Mesh;
      private _marker!: HTMLDivElement;
      private _promptBubble!: HTMLDivElement;
      private _scene: Scene;
      private _inRange = false;
      private _extraMeshes: Mesh[] = [];
      private _materials: StandardMaterial[] = [];

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
            this.mesh.position.y = 1.0;
            this.mesh.isPickable = true; // Enable click picking
            this.mesh.metadata = { npcId: def.id }; // Tag for click detection

            const mat = new StandardMaterial(`npc_mat_${def.id}`, scene);
            mat.diffuseColor = def.color;
            mat.emissiveColor = def.color.scale(0.3);
            mat.specularColor = Color3.Black();
            this.mesh.material = mat;
            this._materials.push(mat);

            const head = MeshBuilder.CreateSphere(`npc_head_${def.id}`, {
                  diameter: 0.72,
                  segments: 10,
            }, scene);
            head.parent = this.root;
            head.position.y = 2.08;
            const headMat = new StandardMaterial(`npc_head_mat_${def.id}`, scene);
            headMat.diffuseColor = new Color3(
                  Math.min(1, def.color.r * 0.3 + 0.72),
                  Math.min(1, def.color.g * 0.3 + 0.66),
                  Math.min(1, def.color.b * 0.3 + 0.62),
            );
            headMat.specularColor = Color3.Black();
            head.material = headMat;
            this._materials.push(headMat);
            this._extraMeshes.push(head);

            const baseDisc = MeshBuilder.CreateCylinder(`npc_disc_${def.id}`, {
                  diameter: 2.1,
                  height: 0.05,
                  tessellation: 20,
            }, scene);
            baseDisc.parent = this.root;
            baseDisc.position.y = 0.03;
            baseDisc.isPickable = false;
            const baseMat = new StandardMaterial(`npc_disc_mat_${def.id}`, scene);
            baseMat.diffuseColor = def.color.scale(0.85);
            baseMat.emissiveColor = def.color.scale(0.35);
            baseMat.alpha = 0.55;
            baseMat.disableLighting = true;
            baseDisc.material = baseMat;
            this._materials.push(baseMat);
            this._extraMeshes.push(baseDisc);

            this._createMarker();
            this._createPromptBubble();
      }

      /** Billboard icon always visible above NPC head */
      private _createMarker(): void {
            this._marker = document.createElement('div');
            this._marker.className = 'npc-marker';
            this._marker.dataset.npcType = this.def.type;
            this._marker.innerHTML = `
                  <div class="npc-marker-role">${NPC_TYPE_LABELS[this.def.type]}</div>
                  <div class="npc-marker-icon">${NPC_TYPE_ICONS[this.def.type]}</div>
                  <div class="npc-marker-name">${this.def.name}</div>
            `;
            document.getElementById('ui-layer')?.appendChild(this._marker);
      }

      /** Small clickable prompt bubble — only shown when player is in range */
      private _createPromptBubble(): void {
            this._promptBubble = document.createElement('div');
            this._promptBubble.className = 'npc-prompt';
            this._promptBubble.dataset.npcType = this.def.type;
            this._promptBubble.innerHTML = `${NPC_TYPE_ICONS[this.def.type]} ${NPC_INTERACT_LABELS[this.def.type]}`;
            this._promptBubble.classList.add('is-hidden', 'is-clickable');
            document.getElementById('ui-layer')?.appendChild(this._promptBubble);
      }

      get promptBubble(): HTMLDivElement { return this._promptBubble; }
      get inRange(): boolean { return this._inRange; }

      /** Update billboard + prompt positions to screen coords */
      updateBillboard(scene: Scene, playerPos: Vector3): void {
            if (!scene.activeCamera) {
                  this._marker.style.display = 'none';
                  this._promptBubble.classList.add('is-hidden');
                  return;
            }

            const engine = scene.getEngine();
            const cam = scene.activeCamera;
            const viewport = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

            // Billboard above head
            const headPos = this.root.position.add(new Vector3(0, 2.8, 0));
            const screenHead = Vector3.Project(headPos, Matrix.IdentityReadOnly, scene.getTransformMatrix(), viewport);

            if (screenHead.z < 0 || screenHead.z > 1) {
                  this._marker.style.display = 'none';
                  this._promptBubble.classList.add('is-hidden');
                  this._inRange = false;
                  return;
            }

            // Show billboard icon
            this._marker.style.display = 'block';
            this._marker.style.left = `${screenHead.x}px`;
            this._marker.style.top = `${screenHead.y}px`;

            // Check range for prompt bubble
            const dx = this.root.position.x - playerPos.x;
            const dz = this.root.position.z - playerPos.z;
            this._inRange = Math.sqrt(dx * dx + dz * dz) < 4.25;

            if (this._inRange) {
                  // Show prompt bubble at NPC body level
                  const bodyPos = this.root.position.add(new Vector3(0, 2.25, 0));
                  const screenBody = Vector3.Project(bodyPos, Matrix.IdentityReadOnly, scene.getTransformMatrix(), viewport);
                  this._promptBubble.classList.remove('is-hidden');
                  this._promptBubble.style.left = `${screenBody.x}px`;
                  this._promptBubble.style.top = `${screenBody.y}px`;
            } else {
                  this._promptBubble.classList.add('is-hidden');
            }
      }

      dispose(): void {
            for (const mesh of this._extraMeshes) mesh.dispose();
            this.mesh.dispose();
            this.root.dispose();
            for (const material of this._materials) material.dispose();
            this._marker.remove();
            this._promptBubble.remove();
      }
}

/**
 * NPCManager — Manages all NPCs. Click-to-interact, NOT auto-trigger.
 */
export class NPCManager {
      private _scene: Scene;
      private _npcs: NPC[] = [];
      private _onInteract: ((npc: NPC) => void) | null = null;
      private _pointerObserver: Observer<PointerInfo> | null = null;

      set onInteract(cb: ((npc: NPC) => void) | null) { this._onInteract = cb; }

      constructor(scene: Scene) {
            this._scene = scene;
      }

      /** Spawn NPCs for a given zone */
      spawnForZone(zoneId: string): void {
            this.despawnAll();
            const defs = NPC_DEFS.filter(d => d.zoneId === zoneId);
            for (const def of defs) {
                  const npc = new NPC(this._scene, def);
                  // Click on prompt bubble → interact
                  npc.promptBubble.addEventListener('click', () => {
                        this._onInteract?.(npc);
                  });
                  this._npcs.push(npc);
            }
            if (this._npcs.length <= 0) return;

            // Also support clicking on NPC mesh directly
            this._pointerObserver = this._scene.onPointerObservable.add((info) => {
                  if (info.type !== 4) return; // POINTERDOWN = 4
                  const hit = info.pickInfo;
                  if (!hit?.hit || !hit.pickedMesh?.metadata?.npcId) return;
                  const npc = this._npcs.find(n => n.def.id === hit.pickedMesh!.metadata.npcId);
                  if (npc && npc.inRange) {
                        this._onInteract?.(npc);
                  }
            });
      }

      /** Update billboard positions — NO auto-trigger */
      update(_dt: number, playerPos: Vector3): void {
            for (const npc of this._npcs) {
                  npc.updateBillboard(this._scene, playerPos);
            }
      }

      /** Get NPC positions for minimap radar */
      getPositions(): { x: number; z: number; type: string }[] {
            return this._npcs.map(n => ({
                  x: n.root.position.x,
                  z: n.root.position.z,
                  type: n.def.type,
            }));
      }

      getNpcById(npcId: string): NPC | null {
            return this._npcs.find((npc) => npc.def.id === npcId) ?? null;
      }

      despawnAll(): void {
            this._detachPointerObserver();
            for (const npc of this._npcs) npc.dispose();
            this._npcs = [];
      }

      private _detachPointerObserver(): void {
            if (!this._pointerObserver) return;
            this._scene.onPointerObservable.remove(this._pointerObserver);
            this._pointerObserver = null;
      }

      dispose(): void {
            this._detachPointerObserver();
            this.despawnAll();
      }
}
