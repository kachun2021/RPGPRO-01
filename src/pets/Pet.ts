import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { PetSeries, SERIES_COLORS, type PetDef, type Gender } from './PetData';

/** Stone Age 8-dimension stats */
export interface PetStats {
      hp: number; maxHp: number;
      mp: number; maxMp: number;
      str: number; agi: number; acc: number; luk: number;
      atkMin: number; atkMax: number;
      hitRate: number; dodgeRate: number; element: number;
      level: number; exp: number;
}

/** Follow offsets for 3 active pets */
const FOLLOW_OFFSETS = [
      new Vector3(-1.5, 0, -1),
      new Vector3(1.5, 0, -1),
      new Vector3(0, 0, -2),
];

export class Pet {
      public root: TransformNode;
      public def: PetDef;
      public stats: PetStats;
      public gender: Gender;
      public slotIndex = -1; // -1 = not active
      public nickname: string; // editable display name
      public isDead = false;

      private _scene: Scene;
      private _seriesColor: Color3;

      constructor(scene: Scene, def: PetDef, gender: Gender, shadowGen: ShadowGenerator) {
            this._scene = scene;
            this.def = def;
            this.gender = gender;
            this.nickname = def.name;
            this._seriesColor = SERIES_COLORS[def.series];

            // Stats from base (8-dimension)
            const b = def.baseStats;
            this.stats = {
                  hp: b.hp, maxHp: b.hp,
                  mp: b.mp, maxMp: b.mp,
                  str: b.str, agi: b.agi, acc: b.acc, luk: b.luk,
                  atkMin: b.atkMin, atkMax: b.atkMax,
                  hitRate: b.hitRate, dodgeRate: b.dodgeRate, element: b.element,
                  level: def.baseLevel, exp: 0,
            };

            // Root
            this.root = new TransformNode(`pet_${def.id}`, scene);
            this.root.position = Vector3.Zero();

            // Body sphere
            const body = MeshBuilder.CreateSphere(`pet_body_${def.id}`, {
                  diameter: 0.6, segments: 12,
            }, scene);
            body.position.y = 0.4;
            body.parent = this.root;

            // Head sphere
            const head = MeshBuilder.CreateSphere(`pet_head_${def.id}`, {
                  diameter: 0.3, segments: 10,
            }, scene);
            head.position.y = 0.8;
            head.parent = this.root;

            // PBR with emissive glow
            const mat = new PBRMaterial(`petMat_${def.id}`, scene);
            mat.albedoColor = this._seriesColor;
            mat.emissiveColor = this._seriesColor.scale(0.3);
            mat.roughness = 0.5;
            mat.metallic = 0.15;
            mat.directIntensity = 1.5;
            mat.ambientColor = new Color3(0.2, 0.2, 0.3);
            body.material = mat;
            head.material = mat;

            // Shadows
            shadowGen.addShadowCaster(body);
            shadowGen.addShadowCaster(head);

            // Start hidden
            this.root.setEnabled(false);
      }

      /** Follow player at slot offset */
      update(dt: number, playerPos: Vector3): void {
            if (this.slotIndex < 0 || this.slotIndex >= FOLLOW_OFFSETS.length) return;

            const offset = FOLLOW_OFFSETS[this.slotIndex];
            const target = playerPos.add(offset);
            target.y = 0;

            Vector3.LerpToRef(this.root.position, target, Math.min(4 * dt, 1), this.root.position);
      }

      activate(slotIndex: number): void {
            this.slotIndex = slotIndex;
            this.root.setEnabled(true);
      }

      deactivate(): void {
            this.slotIndex = -1;
            this.root.setEnabled(false);
      }

      get isActive(): boolean {
            return this.slotIndex >= 0;
      }

      /** Display name (nickname or default) */
      get displayName(): string {
            return this.nickname || this.def.name;
      }

      /** Kill pet (fainted) */
      kill(): void {
            this.isDead = true;
            this.stats.hp = 0;
      }

      /** Revive pet to full HP */
      revive(): void {
            this.isDead = false;
            this.stats.hp = this.stats.maxHp;
      }

      /** Revival cost = level * 10 gold */
      get revivalCost(): number {
            return this.stats.level * 10;
      }

      dispose(): void {
            this.root.dispose(false, true);
      }
}
