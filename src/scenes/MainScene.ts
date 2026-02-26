import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
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

      constructor(
            private readonly engine: AbstractEngine,
            private readonly canvas: HTMLCanvasElement
      ) { }

      async init(): Promise<void> {
            // ── Scene ───────────────────────────────────────────
            this._scene = new Scene(this.engine);
            this._scene.clearColor = new Color4(0.03, 0, 0.06, 1);
            Registry.scene = this._scene;
            Registry.engine = this.engine;

            // ── Light ───────────────────────────────────────────
            const light = new HemisphericLight(
                  "ambientLight", new Vector3(0, 1, 0), this._scene
            );
            light.intensity = 1.0;
            light.diffuse = new Color3(0.65, 0.45, 0.95);   // 明亮紫藍調
            light.groundColor = new Color3(0.15, 0.05, 0.25); // 暗紫補光提亮

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

            // TODO: Prompt 4 will add BarrierSystem + PhantomPresence + ZoneEffects
      }

      private _buildSkybox(): void {
            const skybox = MeshBuilder.CreateBox("skyBox", { size: 2000 }, this._scene);
            const skyMat = new StandardMaterial("skyMat", this._scene);
            skyMat.backFaceCulling = false;
            skyMat.disableLighting = true;
            skyMat.emissiveColor = new Color3(0.06, 0.02, 0.12); // 深紫但可見
            skybox.material = skyMat;
            skybox.metadata = { isPlaceholder: true, specId: "skybox_cubetexture" };
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

                  // Camera follow
                  this._camera.update(this._player.position, dt);

                  // HUD + compass refresh (every 3 frames)
                  if (this._scene.getFrameId() % 3 === 0) {
                        this._hud.update();
                        this._compass.update();
                  }

                  this._scene.render();
            });
      }

      dispose(): void {
            this._joystick?.dispose();
            this._hud?.dispose();
            this._omniOrb?.dispose();
            this._compass?.dispose();
            this._camera?.dispose();
            this._chunkLoader?.dispose();
            this._player?.dispose();
            this._scene?.dispose();
      }
}
