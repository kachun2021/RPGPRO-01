import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Registry } from "../core/Registry";
import { Player } from "../entities/Player";
import { HUD } from "../ui/HUD";
import { OmniOrb } from "../ui/OmniOrb";
import { MiniCompass } from "../ui/MiniCompass";
import { TouchJoystick } from "../input/TouchJoystick";
import { PortraitCamera } from "../input/PortraitCamera";
import { WorldManager } from "../world/WorldManager";
import { ChunkLoader } from "../world/ChunkLoader";
import { BarrierSystem } from "../world/BarrierSystem";
import { PhantomPresence } from "../world/PhantomPresence";
import { ZoneEffects } from "../world/ZoneEffects";
import { PvPZoneVisuals } from "../world/PvPZoneVisuals";

export class MainScene {
      private _scene!: Scene;
      private _player!: Player;
      private _hud!: HUD;
      private _omniOrb!: OmniOrb;
      private _compass!: MiniCompass;
      private _joystick!: TouchJoystick;
      private _camera!: PortraitCamera;
      private _worldManager!: WorldManager;
      private _chunkLoader!: ChunkLoader;
      private _barrierSystem!: BarrierSystem;
      private _phantom!: PhantomPresence;
      private _zoneEffects!: ZoneEffects;
      private _pvpVisuals!: PvPZoneVisuals;

      constructor(
            private readonly engine: AbstractEngine,
            private readonly canvas: HTMLCanvasElement
      ) { }

      async init(): Promise<void> {
            // ── Scene ───────────────────────────────────────────
            this._scene = new Scene(this.engine);
            this._scene.clearColor = new Color4(0.04, 0.01, 0.09, 1); // 深紫，比純黑明顯
            Registry.scene = this._scene;
            Registry.engine = this.engine;

            // ── Ambient Light ──────────────────────────────────
            const light = new HemisphericLight(
                  "ambientLight", new Vector3(0, 1, 0), this._scene
            );
            light.intensity = 1.1;                              // 稍微提亮
            light.diffuse = new Color3(0.7, 0.5, 1.0);         // 更明亮的紫白調
            light.groundColor = new Color3(0.2, 0.08, 0.3);    // 暗紫補光從地面反射
            light.specular = new Color3(0.3, 0.2, 0.5);        // 增加材質閃亮感

            // ── Directional Light (月光) — 提供陰影立體感 ─────────
            const moonLight = new DirectionalLight(
                  "moonLight", new Vector3(-0.5, -1, -0.5), this._scene
            );
            moonLight.intensity = 0.6;                         // 月光強度
            moonLight.diffuse = new Color3(0.55, 0.45, 0.85);  // 冷紫月光
            moonLight.specular = new Color3(0.2, 0.15, 0.4);

            // ── Skybox ──────────────────────────────────────────
            this._buildSkybox();

            // ── Player ──────────────────────────────────────────
            this._player = new Player(this._scene);

            // ── World (6 zones + chunks) ────────────────────────
            this._worldManager = new WorldManager();
            this._worldManager.init();
            this._chunkLoader = new ChunkLoader(this._scene);

            // ── Camera ──────────────────────────────────────────
            this._camera = new PortraitCamera(this._scene, this.canvas);
            this._scene.activeCamera = this._camera.camera;

            // ── Input ───────────────────────────────────────────
            this._joystick = new TouchJoystick();
            this._joystick.init();

            // ── UI ──────────────────────────────────────────────
            this._hud = new HUD();
            this._hud.init();

            this._omniOrb = new OmniOrb();
            this._omniOrb.init();

            this._compass = new MiniCompass();
            this._compass.init();

            // ── P4: Barrier + Phantom + ZoneEffects + PvP visuals ───
            this._barrierSystem = new BarrierSystem(this._scene);
            this._barrierSystem.init();

            this._phantom = new PhantomPresence(this._scene);
            this._phantom.init();

            this._zoneEffects = new ZoneEffects(this._scene);

            this._pvpVisuals = new PvPZoneVisuals();
            this._pvpVisuals.init();

            // TODO: Prompt 5 will add CombatSystem + SkillManager + Monsters
      }

      private _buildSkybox(): void {
            // ── 主天空盒 ──────────────────────────────────────
            const skybox = MeshBuilder.CreateBox("skyBox", { size: 1800 }, this._scene);
            const skyMat = new StandardMaterial("skyMat", this._scene);
            skyMat.backFaceCulling = false;
            skyMat.disableLighting = true;
            // 深紫色天空 — 明顯可見，帶有神秘感
            skyMat.emissiveColor = new Color3(0.10, 0.03, 0.22);
            skybox.material = skyMat;
            skybox.metadata = { isPlaceholder: true, specId: "skybox_cubetexture" };

            // ── 星星層（程序化點光源群） ─────────────────────────
            this._buildStarfield();

            // ── 月亮（平面 billboard） ────────────────────────────
            this._buildMoon();
      }

      /** 程序化星空 — 300顆隨機白點在天球內側（用 createInstance 確保相容性） */
      private _buildStarfield(): void {
            const count = 300;
            // 簡單偽隨機
            const rng = (s: number): number => {
                  s = (s ^ (s >> 13)) * 1274126177;
                  s = s ^ (s >> 16);
                  return (s & 0x7fffffff) / 0x7fffffff;
            };

            // 基礎星星 mesh（只渲染一次，後續全是 instance）
            const star = MeshBuilder.CreateSphere("starBase", { diameter: 2.8, segments: 2 }, this._scene);
            const starMat = new StandardMaterial("starMat", this._scene);
            starMat.disableLighting = true;
            starMat.emissiveColor = new Color3(0.95, 0.88, 1.0); // 藍白星光
            star.material = starMat;
            // 隱藏原始 mesh，只顯示 instances
            star.setEnabled(false);

            for (let i = 0; i < count; i++) {
                  const r = rng(i * 7 + 1);
                  const theta = rng(i * 7 + 2) * Math.PI * 2;
                  const phi = Math.acos(1 - rng(i * 7 + 3) * 0.85); // upper hemisphere
                  const rad = 800 + rng(i * 7 + 4) * 50;

                  const x = rad * Math.sin(phi) * Math.cos(theta);
                  const y = Math.abs(rad * Math.cos(phi)) + 50; // always above horizon
                  const z = rad * Math.sin(phi) * Math.sin(theta);

                  // Size variation for depth illusion
                  const sz = 0.5 + rng(i * 7 + 5) * 1.8;

                  const inst = star.createInstance(`star_${i}`);
                  inst.position.set(x, y, z);
                  inst.scaling.setAll(sz);
                  inst.setEnabled(true);
            }
      }

      /** 月亮 billboard — 明亮可見，帶光暈 */
      private _buildMoon(): void {
            const moon = MeshBuilder.CreateDisc("moon", { radius: 18, tessellation: 32 }, this._scene);
            moon.position = new Vector3(-300, 450, -600);
            moon.billboardMode = 7; // BILLBOARD_ALL

            const moonMat = new StandardMaterial("moonMat", this._scene);
            moonMat.disableLighting = true;
            moonMat.emissiveColor = new Color3(0.85, 0.78, 1.0);  // 帶紫的月白光
            moon.material = moonMat;

            // 月暈光圈（外圈半透明）
            const halo = MeshBuilder.CreateDisc("moonHalo", { radius: 32, tessellation: 32 }, this._scene);
            halo.position = new Vector3(-300, 450, -601);
            halo.billboardMode = 7;
            const haloMat = new StandardMaterial("moonHaloMat", this._scene);
            haloMat.disableLighting = true;
            haloMat.emissiveColor = new Color3(0.4, 0.3, 0.7);
            haloMat.alpha = 0.25;
            halo.material = haloMat;
      }

      render(): void {
            this.engine.runRenderLoop(() => {
                  const dt = this._scene.getEngine().getDeltaTime() / 1000;

                  // Input → Player
                  const dir = this._joystick.getDirection();
                  this._player.setMoveDirection(dir);
                  this._player.update(dt);

                  // World systems
                  this._chunkLoader.update();
                  this._worldManager.update();
                  this._barrierSystem.update();
                  this._phantom.update(dt);
                  this._zoneEffects.update();

                  // Camera follow
                  this._camera.update(this._player.position, dt);

                  // HUD + compass + PvP refresh (every 3 frames)
                  if (this._scene.getFrameId() % 3 === 0) {
                        this._hud.update();
                        this._compass.update();
                        this._pvpVisuals.update();
                  }

                  this._scene.render();
            });
      }

      dispose(): void {
            this._joystick?.dispose();
            this._hud?.dispose();
            this._omniOrb?.dispose();
            this._compass?.dispose();
            this._pvpVisuals?.dispose();
            this._zoneEffects?.dispose();
            this._phantom?.dispose();
            this._barrierSystem?.dispose();
            this._camera?.dispose();
            this._chunkLoader?.dispose();
            this._player?.dispose();
            this._scene?.dispose();
      }
}
