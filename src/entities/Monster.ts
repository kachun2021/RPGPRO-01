import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { PetSeries, SERIES_COLORS } from '../pets/PetData';

export type MonsterBehavior = 'aggressive' | 'passive';

export interface MonsterDef {
      id: string;
      name: string;
      level: number;
      series: PetSeries;
      behavior: MonsterBehavior;
      respawnSec: number;
      isBoss: boolean;
      maxHp: number;
      atk: number;
      def: number;
      eggDropRate: number;
      eggPetId?: string;
      spawnWeight?: number;
}

export class Monster {
      public root: TransformNode;
      public mesh!: Mesh;
      public def: MonsterDef;
      public hp: number;
      public isDead = false;

      // Monster AI
      private _wanderTarget: Vector3;
      private _wanderTimer = 0;
      private _wanderDelay = 3 + Math.random() * 4; // 3-7s between moves
      private _moveSpeed: number;
      private _spawnPos: Vector3;
      private _aggroTarget: Vector3 | null = null;
      private _atkTimer = 0;
      private _provoked = false; // passive monsters become provoked when hit

      // DOM HP bar
      private _hpBar: HTMLDivElement | null = null;
      private _scene: Scene;
      private _deathTimer = 0;
      private _bossFxStarted = false;
      private _bossExplosion: Mesh | null = null;
      private _bossParticles: Mesh[] = [];
      private _bossParticleVel: Vector3[] = [];
      private _bossFxMat: StandardMaterial | null = null;

      constructor(scene: Scene, def: MonsterDef, position: Vector3, shadowGen: ShadowGenerator) {
            this._scene = scene;
            this.def = def;
            this.hp = def.maxHp;
            this._spawnPos = position.clone();
            this._wanderTarget = position.clone();
            this._moveSpeed = def.isBoss ? 1.5 : 2.0;

            this.root = new TransformNode('mon_' + def.id + '_' + Date.now(), scene);
            this.root.position.copyFrom(position);

            const scale = def.isBoss ? 2.0 : 1.0;
            const body = MeshBuilder.CreateSphere('mon_body', {
                  diameter: 0.8 * scale,
                  segments: 10,
            }, scene);
            body.position.y = 0.5 * scale;
            body.parent = this.root;

            // Small horn/antenna for visual distinction
            if (!def.isBoss) {
                  const horn = MeshBuilder.CreateCylinder('mon_horn', {
                        height: 0.3, diameterTop: 0, diameterBottom: 0.1,
                  }, scene);
                  horn.position.y = 1.0;
                  horn.parent = this.root;
            }

            const color = SERIES_COLORS[def.series];
            const mat = new PBRMaterial('mon_mat_' + def.id + '_' + Date.now(), scene);
            mat.albedoColor = color;
            mat.emissiveColor = color;
            mat.emissiveIntensity = def.isBoss ? 0.5 : 0.2;
            mat.roughness = 0.7;
            mat.metallic = 0.1;
            body.material = mat;

            // Apply material to horn too
            const horn = this.root.getChildMeshes().find(m => m.name === 'mon_horn');
            if (horn) horn.material = mat;

            shadowGen.addShadowCaster(body);
            body.receiveShadows = true;
            this.mesh = body;

            this._createHPBar();
      }

      private _createHPBar(): void {
            const bar = document.createElement('div');
            bar.className = this.def.isBoss ? 'monster-hp-bar boss' : 'monster-hp-bar';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'mon-hp-name';
            nameDiv.textContent = (this.def.isBoss ? '>> ' : '') + this.def.name + ' Lv.' + this.def.level;

            const track = document.createElement('div');
            track.className = 'mon-hp-track';
            const fill = document.createElement('div');
            fill.className = 'mon-hp-fill';
            fill.style.width = '100%';
            track.appendChild(fill);

            bar.appendChild(nameDiv);
            bar.appendChild(track);

            document.getElementById('ui-layer')?.appendChild(bar);
            this._hpBar = bar;
      }

      takeDamage(amount: number): boolean {
            if (this.isDead) return true;
            this.hp = Math.max(0, this.hp - amount);
            this._updateHPBar();
            // Passive monsters become provoked when hit
            if (!this._provoked && this.def.behavior === 'passive') {
                  this._provoked = true;
            }
            if (this.hp <= 0) {
                  this.isDead = true;
                  if (this.def.isBoss) {
                        this._startBossDeathFx();
                  }
                  return true;
            }
            return false;
      }

      private _updateHPBar(): void {
            if (!this._hpBar) return;
            const fill = this._hpBar.querySelector('.mon-hp-fill') as HTMLDivElement;
            if (fill) fill.style.width = ((this.hp / this.def.maxHp) * 100) + '%';
      }

      /** Update HP bar screen position */
      updateUI(screenX: number, screenY: number): void {
            if (!this._hpBar) return;
            this._hpBar.style.left = screenX + 'px';
            this._hpBar.style.top = (screenY - 20) + 'px';
            this._hpBar.style.display = this.isDead ? 'none' : 'block';
      }

      distanceTo(point: Vector3): number {
            return Vector3.Distance(this.root.position, point);
      }

      shouldAggro(playerPos: Vector3): boolean {
            if (this.isDead) return false;
            if (this.def.behavior !== 'aggressive') return false;
            return this.distanceTo(playerPos) < 8.0;
      }

      // ── Monster AI: Wander + Aggro ──

      /** Monster AI update — random wandering + aggressive chase */
      updateAI(dt: number, playerPos: Vector3): number {
            if (this.isDead) return 0;

            let damageToPlayer = 0;

            // Chase player if aggressive or provoked (passive that was hit)
            const shouldChase = this.def.behavior === 'aggressive'
                  ? this.distanceTo(playerPos) < 8.0
                  : this._provoked;

            if (shouldChase) {
                  const dir = playerPos.subtract(this.root.position);
                  dir.y = 0;
                  const dist = dir.length();

                  if (dist > 2.0) {
                        // Move toward player
                        const move = dir.normalizeToNew().scaleInPlace(this._moveSpeed * dt);
                        this.root.position.addInPlace(move);
                        // Face player
                        this.root.rotation.y = Math.atan2(dir.x, dir.z);
                  }

                  // Attack player if in melee range
                  this._atkTimer -= dt;
                  if (dist < 2.5 && this._atkTimer <= 0) {
                        this._atkTimer = 2.0; // attack every 2s
                        damageToPlayer = this.def.atk;
                  }
            } else {
                  // Random wandering
                  this._wanderTimer -= dt;
                  if (this._wanderTimer <= 0) {
                        this._wanderTimer = this._wanderDelay;
                        this._wanderDelay = 3 + Math.random() * 4;
                        // Pick a new wander target within 5m of spawn
                        this._wanderTarget = this._spawnPos.add(new Vector3(
                              (Math.random() - 0.5) * 10,
                              0,
                              (Math.random() - 0.5) * 10,
                        ));
                  }

                  // Move toward wander target
                  const dir = this._wanderTarget.subtract(this.root.position);
                  dir.y = 0;
                  const dist = dir.length();
                  if (dist > 0.5) {
                        const speed = this._moveSpeed * 0.5; // wander slower
                        const move = dir.normalizeToNew().scaleInPlace(speed * dt);
                        this.root.position.addInPlace(move);
                        this.root.rotation.y = Math.atan2(dir.x, dir.z);
                  }
            }

            // Passive monsters retaliate: handled by CombatLoop (they get targeted)

            return damageToPlayer;
      }

      updateDeath(dt: number): boolean {
            this._deathTimer += dt;
            const duration = this.def.isBoss ? 1.0 : 0.5;
            const t = Math.min(this._deathTimer / duration, 1.0);
            const s = 1.0 - t;
            this.root.scaling.setAll(s);
            if (this.def.isBoss) {
                  this._updateBossDeathFx(dt, t);
            }
            if (t >= 1.0) {
                  this._disposeBossDeathFx();
            }
            return t >= 1.0;
      }

      private _startBossDeathFx(): void {
            if (this._bossFxStarted) return;
            this._bossFxStarted = true;

            const gold = SERIES_COLORS[PetSeries.Beast];
            const mat = new StandardMaterial(`boss_fx_${Date.now()}`, this._scene);
            mat.diffuseColor = gold;
            mat.emissiveColor = gold.scale(1.2);
            mat.alpha = 0.9;
            this._bossFxMat = mat;

            const center = this.root.position.add(new Vector3(0, 1.2, 0));

            const explosion = MeshBuilder.CreateSphere(`boss_explosion_${Date.now()}`, {
                  diameter: 0.5,
                  segments: 8,
            }, this._scene);
            explosion.position.copyFrom(center);
            explosion.material = mat;
            this._bossExplosion = explosion;

            for (let i = 0; i < 22; i++) {
                  const p = MeshBuilder.CreateSphere(`boss_particle_${i}_${Date.now()}`, {
                        diameter: 0.14,
                        segments: 4,
                  }, this._scene);
                  p.position.copyFrom(center);
                  p.material = mat;

                  const dir = new Vector3(
                        Math.random() - 0.5,
                        Math.random() * 0.8 + 0.2,
                        Math.random() - 0.5,
                  ).normalize();
                  const speed = 3 + Math.random() * 3.5;
                  this._bossParticles.push(p);
                  this._bossParticleVel.push(dir.scale(speed));
            }
      }

      private _updateBossDeathFx(dt: number, t: number): void {
            const alpha = Math.max(0, 0.9 * (1.0 - t));
            if (this._bossFxMat) this._bossFxMat.alpha = alpha;

            if (this._bossExplosion) {
                  const scale = 1 + t * 6;
                  this._bossExplosion.scaling.setAll(scale);
            }

            for (let i = 0; i < this._bossParticles.length; i++) {
                  const mesh = this._bossParticles[i];
                  const vel = this._bossParticleVel[i];
                  vel.y -= 6 * dt;
                  mesh.position.addInPlace(vel.scale(dt));
                  mesh.scaling.setAll(Math.max(0.15, 1 - t * 0.8));
            }
      }

      private _disposeBossDeathFx(): void {
            this._bossExplosion?.dispose();
            this._bossExplosion = null;

            for (const p of this._bossParticles) p.dispose();
            this._bossParticles.length = 0;
            this._bossParticleVel.length = 0;

            this._bossFxMat?.dispose();
            this._bossFxMat = null;
      }

      dispose(): void {
            this._hpBar?.remove();
            this._disposeBossDeathFx();
            this.root.dispose(false, true);
      }
}
