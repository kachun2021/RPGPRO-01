import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

export interface PlayerStats {
      hp: number; maxHp: number;
      mp: number; maxMp: number;
      atk: number; def: number;
      level: number; exp: number;
      gold: number; diamond: number;
}

export class Player {
      public root: TransformNode;
      public mesh!: Mesh;
      public stats: PlayerStats;
      public speed = 6.0;

      private _scene: Scene;
      private _moveDirection = Vector3.Zero();

      constructor(scene: Scene, shadowGenerator: ShadowGenerator) {
            this._scene = scene;

            // Root node
            this.root = new TransformNode('player_root', scene);
            this.root.position = new Vector3(0, 0, 0);

            // Body capsule (normal human proportion, 1.8 unit tall)
            const body = MeshBuilder.CreateCapsule('player_body', {
                  height: 1.4,
                  radius: 0.25,
            }, scene);
            body.position.y = 0.9;
            body.parent = this.root;

            // Head sphere
            const head = MeshBuilder.CreateSphere('player_head', {
                  diameter: 0.4,
                  segments: 12,
            }, scene);
            head.position.y = 1.75;
            head.parent = this.root;

            // PBR material — deep blue armor
            const mat = new PBRMaterial('playerMat', scene);
            mat.albedoColor = new Color3(0.3, 0.35, 0.5);
            mat.roughness = 0.6;
            mat.metallic = 0.3;
            mat.emissiveColor = new Color3(0.05, 0.08, 0.15);
            mat.directIntensity = 1.5;
            mat.ambientColor = new Color3(0.2, 0.2, 0.3);
            body.material = mat;
            head.material = mat;

            // Shadow
            shadowGenerator.addShadowCaster(body);
            shadowGenerator.addShadowCaster(head);
            body.receiveShadows = true;

            this.mesh = body;

            // Default stats
            this.stats = {
                  hp: 100, maxHp: 100,
                  mp: 50, maxMp: 50,
                  atk: 10, def: 5,
                  level: 1, exp: 0,
                  gold: 500, diamond: 10,
            };
      }

      get position(): Vector3 {
            return this.root.position;
      }

      setMoveDirection(dir: Vector3): void {
            if (dir.lengthSquared() > 0.01) {
                  this._moveDirection.copyFrom(dir.normalizeToNew());
            } else {
                  this._moveDirection.set(0, 0, 0);
            }
      }

      update(dt: number): void {
            if (this._moveDirection.lengthSquared() > 0.01) {
                  const move = this._moveDirection.scale(this.speed * dt);
                  this.root.position.addInPlace(move);

                  // Rotate to face movement direction
                  const angle = Math.atan2(this._moveDirection.x, this._moveDirection.z);
                  this.root.rotation.y = angle;
            }
      }

      dispose(): void {
            this.root.dispose(false, true);
      }
}
