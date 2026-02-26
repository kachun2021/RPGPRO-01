import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3, Color3, Color4 } from "@babylonjs/core/Maths/math";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { AshParticleSystem } from "../particles/AshSystem";
import { CrimsonGrading } from "../shaders/CrimsonGrading";
import { HUD } from "../ui/HUD";
import { InputManager } from "../input/InputManager";
import { TouchJoystick } from "../input/TouchJoystick";
import { SwipeAttack } from "../input/SwipeAttack";
import { PortraitCamera } from "../input/PortraitCamera";
import { AssetManager } from "../core/AssetManager";
import { ProceduralWorld } from "../world/ProceduralWorld";
import { Player } from "../entities/Player";
import { CharacterPanel } from "../ui/CharacterPanel";
import { MonsterManager } from "../entities/MonsterManager";
import { CombatSystem } from "../combat/CombatSystem";
import { InventoryPanel } from "../ui/InventoryPanel";
import { ShopPanel } from "../ui/ShopPanel";


export class MainScene {
     private scene: Scene;
     private camera!: ArcRotateCamera;
     private hud!: HUD;
     private shadowGen!: ShadowGenerator;
     private inputManager!: InputManager;
     private joystick!: TouchJoystick;
     private swipeAttack!: SwipeAttack;
     private portraitCamera!: PortraitCamera;
     private world!: ProceduralWorld;
     private player!: Player;
     private characterPanel!: CharacterPanel;
     private inventoryPanel!: InventoryPanel;
     private shopPanel!: ShopPanel;
     private monsterManager!: MonsterManager;
     private combatSystem!: CombatSystem;

     constructor(
          private engine: AbstractEngine,
          private canvas: HTMLCanvasElement
     ) {
          this.scene = new Scene(this.engine);
          // Darker but not pure black — slight navy/indigo tint instead of pure red
          this.scene.clearColor = new Color4(0.02, 0.01, 0.04, 1);
          this.scene.ambientColor = new Color3(0.15, 0.1, 0.12);
          this.scene.fogMode = Scene.FOGMODE_EXP2;
          this.scene.fogDensity = 0.002;
          this.scene.fogColor = new Color3(0.08, 0.04, 0.06);
     }

     public async init(): Promise<void> {
          this.setupCamera();

          this.setupLighting();

          this.createSkybox();


          this.player = new Player(this.scene);
          this.player.setPosition(new Vector3(0, 0, 0));
          // Point camera at player's torso/head
          this.camera.target = this.player.root.position.clone();
          this.camera.target.y += 1.8;

          // Create a simple visible floor ground that's always there
          this.createVisibleGround();

          this.world = new ProceduralWorld(this.scene);


          try {
               this.createGodRays(); // Restored
          } catch (e) {
               console.warn("[Scene] God rays failed (non-fatal):", e);
          }


          this.createAtmosphericProps();


          try {
               AshParticleSystem.create(this.scene);
          } catch (e) {
               console.warn("[Scene] Ash particles failed (non-fatal):", e);
          }


          try {
               // Minimal intensity for atmosphere without crushing visibility or perf
               CrimsonGrading.apply(this.scene, this.camera, 0.05);
          } catch (e) {
               console.warn("[Scene] Crimson grading failed (non-fatal):", e);
          }


          try {
               this.setupPostProcessing();
          } catch (e) {
               console.warn("[Scene] Post-processing failed (non-fatal):", e);
          }


          try {
               this.inputManager = new InputManager(this.scene);
               this.joystick = new TouchJoystick(this.scene);
               this.swipeAttack = new SwipeAttack(this.scene, this.inputManager);
               this.portraitCamera = new PortraitCamera(this.scene, this.camera, this.joystick, this.inputManager);
               // Connect player to joystick movement
               if (this.player) {
                    this.portraitCamera.setPlayerTarget(this.player.root);
                    // Wire up walking animation
                    this.portraitCamera.onMovingChanged = (moving: boolean) => {
                         if (this.player) this.player.setMoving(moving);
                    };
               }
          } catch (e) {
               console.warn("[Scene] Input system failed (non-fatal):", e);
          }


          this.hud = new HUD(this.scene);


          this.characterPanel = new CharacterPanel(this.scene, this.player);

          // Wire HUD Character button to toggle CharacterPanel
          this.hud.onCharacterButton = () => {
               if (this.inventoryPanel.getIsOpen()) this.inventoryPanel.hide();
               if (this.shopPanel.getIsOpen()) this.shopPanel.hide();
               this.characterPanel.toggle();
          };

          // Build UI Panels and wire buttons
          this.inventoryPanel = new InventoryPanel(this.scene, this.player.inventory, this.player);
          this.shopPanel = new ShopPanel(this.scene, this.player, this.player.inventory);

          this.hud.onInventoryButton = () => {
               if (this.characterPanel.getIsOpen()) this.characterPanel.hide();
               if (this.shopPanel.getIsOpen()) this.shopPanel.hide();
               this.inventoryPanel.toggle();
          };

          this.hud.onShopButton = () => {
               if (this.characterPanel.getIsOpen()) this.characterPanel.hide();
               if (this.inventoryPanel.getIsOpen()) this.inventoryPanel.hide();
               this.shopPanel.toggle();
          };

          // Bind player stats to HUD dynamic updates
          this.player.onStatsChanged.add((stats) => {
               this.hud.updateFromStats(stats);
          });
          // Initial HUD update from player stats
          this.hud.updateFromStats(this.player.getStats());

          // ── Phase 5: Monster AI & Combat System ──

          try {
               this.monsterManager = new MonsterManager(this.scene);
               this.combatSystem = new CombatSystem(this.scene, this.monsterManager, this.player);

               // Wire swipe attacks → combat system (legacy gesture)
               this.inputManager.onSwipeAttack.add((swipe) => {
                    const playerPos = this.player.getPosition();
                    this.combatSystem.processSwipeAttack(playerPos, swipe.direction, 4);
               });

               // Wire HUD skill buttons → SkillSystem
               this.hud.onSkillUse.add((skillId) => {
                    this.combatSystem.skillSystem.useSkill(skillId);
               });

               // Wire HUD AUTO toggle → CombatSystem auto-battle
               this.hud.onAutoBattleToggle.add((active) => {
                    this.combatSystem.autoBattle = active;

               });

               // Wire item collection → HUD update (via player.onStatsChanged already bound)
               this.combatSystem.onItemCollected.add((reward) => {

               });


          } catch (e) {
               console.warn("[Scene] Monster/Combat setup failed (non-fatal):", e);
          }



          // Ensure scene is ready
          await this.scene.whenReadyAsync();

     }

     private setupCamera(): void {
          this.camera = new ArcRotateCamera(
               "mainCam",
               -Math.PI / 2,    // alpha - behind character
               Math.PI / 3.2,   // beta - slightly above
               18,              // radius - closer to see character
               new Vector3(0, 2, 0),
               this.scene
          );
          this.camera.lowerRadiusLimit = 8;
          this.camera.upperRadiusLimit = 50;
          this.camera.lowerBetaLimit = 0.3;
          this.camera.upperBetaLimit = Math.PI / 2.2;
          this.camera.angularSensibilityX = 3000;
          this.camera.angularSensibilityY = 3000;
          this.camera.panningSensibility = 0;
          this.camera.attachControl(this.canvas, true);
          this.camera.wheelPrecision = 30;
          this.camera.pinchPrecision = 40;
          this.camera.inertia = 0.85;
     }

     private setupLighting(): void {
          // ── Hemispheric ambient — the KEY light for overall visibility ──
          const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
          ambient.intensity = 1.4;
          // Desaturated warm+cool — NOT pure red
          ambient.diffuse = new Color3(0.7, 0.55, 0.6);
          ambient.groundColor = new Color3(0.35, 0.22, 0.28);
          ambient.specular = new Color3(0.35, 0.3, 0.35);

          // ── Blood Moon directional (main shadow caster) ──
          const moonLight = new DirectionalLight("moonLight", new Vector3(-0.5, -1, 0.3), this.scene);
          moonLight.intensity = 1.8;
          moonLight.diffuse = new Color3(0.9, 0.35, 0.25);
          moonLight.specular = new Color3(1, 0.4, 0.3);
          moonLight.position = new Vector3(20, 40, -20);

          // Shadow generator
          this.shadowGen = new ShadowGenerator(512, moonLight);
          this.shadowGen.useBlurExponentialShadowMap = true;
          this.shadowGen.blurKernel = 8;
          this.shadowGen.darkness = 0.35;

          // ── Crimson fill light (near player area) ──
          const fillLight = new PointLight("fillLight", new Vector3(0, 10, 0), this.scene);
          fillLight.intensity = 1.0;
          fillLight.diffuse = new Color3(0.8, 0.45, 0.35);
          fillLight.range = 60;

          // ── Secondary cool accent for contrast ──
          const coolFill = new PointLight("coolFill", new Vector3(5, 6, -8), this.scene);
          coolFill.intensity = 0.4;
          coolFill.diffuse = new Color3(0.3, 0.35, 0.6);
          coolFill.range = 40;
     }

     private createSkybox(): void {
          const skybox = MeshBuilder.CreateBox("skybox", { size: 500 }, this.scene);
          const skyMat = new StandardMaterial("skyMat", this.scene);
          skyMat.backFaceCulling = false;
          skyMat.disableLighting = true;
          skyMat.diffuseColor = new Color3(0, 0, 0);
          skyMat.specularColor = new Color3(0, 0, 0);

          // Use AssetManager to load skybox texture seamlessly
          const reflectionTex = AssetManager.loadSkybox(this.scene, "assets/textures/skybox/bloodmoon.ktx2");
          reflectionTex.coordinatesMode = Texture.SKYBOX_MODE;
          skyMat.reflectionTexture = reflectionTex;

          // Procedural gradient skybox with stars
          skyMat.emissiveTexture = this.createSkyGradientTexture();
          skybox.material = skyMat;
          skybox.infiniteDistance = true;
          skybox.renderingGroupId = 0;

          // Blood Moon sphere in the sky
          const moon = MeshBuilder.CreateSphere("bloodMoon", { diameter: 25, segments: 32 }, this.scene);
          moon.position = new Vector3(-60, 80, -100);
          const moonMat = new StandardMaterial("moonMat", this.scene);
          moonMat.disableLighting = true;
          moonMat.emissiveColor = new Color3(0.85, 0.12, 0.08);
          moonMat.diffuseColor = new Color3(0, 0, 0);
          moonMat.specularColor = new Color3(0, 0, 0);
          moon.material = moonMat;

          // Moon halo (outer glow)
          const halo = MeshBuilder.CreateDisc("moonHalo", { radius: 22, tessellation: 64 }, this.scene);
          halo.position = moon.position.clone();
          halo.billboardMode = 7;
          const haloMat = new StandardMaterial("haloMat", this.scene);
          haloMat.disableLighting = true;
          haloMat.emissiveColor = new Color3(0.6, 0.05, 0.03);
          haloMat.alpha = 0.25;
          haloMat.diffuseColor = new Color3(0, 0, 0);
          haloMat.specularColor = new Color3(0, 0, 0);
          halo.material = haloMat;

          // Inner halo
          const innerHalo = MeshBuilder.CreateDisc("moonInnerHalo", { radius: 15, tessellation: 64 }, this.scene);
          innerHalo.position = moon.position.clone();
          innerHalo.billboardMode = 7;
          const innerHaloMat = new StandardMaterial("innerHaloMat", this.scene);
          innerHaloMat.disableLighting = true;
          innerHaloMat.emissiveColor = new Color3(0.9, 0.1, 0.06);
          innerHaloMat.alpha = 0.15;
          innerHaloMat.diffuseColor = new Color3(0, 0, 0);
          innerHaloMat.specularColor = new Color3(0, 0, 0);
          innerHalo.material = innerHaloMat;
     }

     private createSkyGradientTexture(): Texture {
          const size = 512;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d")!;

          // Dark sky gradient — deeper mixed colours (indigo → dark wine → horizon glow)
          const grad = ctx.createLinearGradient(0, 0, 0, size);
          grad.addColorStop(0, "#020008");
          grad.addColorStop(0.25, "#060012");
          grad.addColorStop(0.5, "#100010");
          grad.addColorStop(0.75, "#1a0818");
          grad.addColorStop(0.9, "#2a0c1a");
          grad.addColorStop(1, "#351222");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);

          // Subtle stars
          for (let i = 0; i < 200; i++) {
               const x = Math.random() * size;
               const y = Math.random() * size * 0.7;
               const r = Math.random() * 1.5 + 0.3;
               const brightness = Math.random() * 0.5 + 0.15;
               ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, ${180 + Math.random() * 75}, ${brightness})`;
               ctx.beginPath();
               ctx.arc(x, y, r, 0, Math.PI * 2);
               ctx.fill();
          }

          return Texture.LoadFromDataString("skyGradient", canvas.toDataURL(), this.scene);
     }

     private createGodRays(): void {
          const godRayEmitter = MeshBuilder.CreateSphere("godRayEmitter", { diameter: 3, segments: 16 }, this.scene);
          godRayEmitter.position = new Vector3(-60, 80, -100);
          const emitterMat = new StandardMaterial("godRayEmitterMat", this.scene);
          emitterMat.disableLighting = true;
          emitterMat.emissiveColor = new Color3(0.9, 0.15, 0.08);
          emitterMat.diffuseColor = new Color3(0, 0, 0);
          emitterMat.specularColor = new Color3(0, 0, 0);
          godRayEmitter.material = emitterMat;

          const godRays = new VolumetricLightScatteringPostProcess(
               "godRays",
               0.5,
               this.camera,
               godRayEmitter,
               40,
               Texture.BILINEAR_SAMPLINGMODE,
               this.engine,
               false
          );
          godRays.exposure = 0.18;
          godRays.decay = 0.97;
          godRays.weight = 0.35;
          godRays.density = 0.6;
     }

     private createAtmosphericProps(): void {
          // Ground fog planes
          for (let i = 0; i < 10; i++) {
               const fog = MeshBuilder.CreatePlane(`fogPlane_${i}`, {
                    width: 40 + Math.random() * 20,
                    height: 3 + Math.random() * 3,
               }, this.scene);
               fog.position.y = 0.3 + Math.random() * 1.5;
               fog.position.x = (Math.random() - 0.5) * 100;
               fog.position.z = (Math.random() - 0.5) * 100;
               fog.rotation.y = Math.random() * Math.PI * 2;
               fog.billboardMode = 2;

               const fogMat = new StandardMaterial(`fogMat_${i}`, this.scene);
               fogMat.disableLighting = true;
               fogMat.emissiveColor = new Color3(0.12, 0.05, 0.08);
               fogMat.alpha = 0.05 + Math.random() * 0.05;
               fogMat.diffuseColor = new Color3(0, 0, 0);
               fogMat.specularColor = new Color3(0, 0, 0);
               fog.material = fogMat;
          }

          // Distant mountain silhouettes
          for (let i = 0; i < 8; i++) {
               const mtn = MeshBuilder.CreateCylinder(`mountain_${i}`, {
                    height: 15 + Math.random() * 30,
                    diameterTop: 0.5 + Math.random() * 3,
                    diameterBottom: 12 + Math.random() * 15,
                    tessellation: 5 + Math.floor(Math.random() * 4),
               }, this.scene);

               const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
               const dist = 80 + Math.random() * 20;
               mtn.position.x = Math.cos(angle) * dist;
               mtn.position.z = Math.sin(angle) * dist;
               mtn.position.y = 5;

               const mat = new StandardMaterial(`mtnMat_${i}`, this.scene);
               mat.disableLighting = true;
               mat.emissiveColor = new Color3(0.04, 0.015, 0.025);
               mat.diffuseColor = new Color3(0, 0, 0);
               mat.specularColor = new Color3(0, 0, 0);
               mtn.material = mat;
          }

          // Scatter gothic props (pillars, rocks, arches)
          this.scatterProps();
     }

     private scatterProps(): void {
          // Dark gothic pillars
          for (let i = 0; i < 12; i++) {
               const height = 3 + Math.random() * 8;
               const pillar = MeshBuilder.CreateCylinder(`pillar_${i}`, {
                    height,
                    diameterTop: 0.3 + Math.random() * 0.5,
                    diameterBottom: 0.8 + Math.random() * 0.6,
                    tessellation: 8,
               }, this.scene);

               const angle = Math.random() * Math.PI * 2;
               const dist = 15 + Math.random() * 60;
               pillar.position.x = Math.cos(angle) * dist;
               pillar.position.z = Math.sin(angle) * dist;
               pillar.position.y = height / 2;
               pillar.rotation.x = (Math.random() - 0.5) * 0.15;
               pillar.rotation.z = (Math.random() - 0.5) * 0.15;

               const mat = new PBRMaterial(`pillarMat_${i}`, this.scene);
               mat.albedoColor = new Color3(0.08, 0.06, 0.07);
               mat.metallic = 0.05;
               mat.roughness = 0.95;
               mat.emissiveColor = new Color3(0.01, 0.005, 0.008);
               pillar.material = mat;
               this.shadowGen.addShadowCaster(pillar);
          }

          // Boulders
          for (let i = 0; i < 20; i++) {
               const rock = MeshBuilder.CreateSphere(`rock_${i}`, {
                    diameter: 0.5 + Math.random() * 2.5,
                    segments: 6,
               }, this.scene);

               const angle = Math.random() * Math.PI * 2;
               const dist = 5 + Math.random() * 70;
               rock.position.x = Math.cos(angle) * dist;
               rock.position.z = Math.sin(angle) * dist;
               rock.position.y = 0.2 + Math.random() * 0.3;
               rock.scaling.y = 0.4 + Math.random() * 0.6;
               rock.rotation.y = Math.random() * Math.PI * 2;

               const mat = new PBRMaterial(`rockMat_${i}`, this.scene);
               mat.albedoColor = new Color3(0.1 + Math.random() * 0.05, 0.07, 0.08);
               mat.metallic = 0.0;
               mat.roughness = 0.98;
               rock.material = mat;
               this.shadowGen.addShadowCaster(rock);
          }

          // Gothic arches
          for (let i = 0; i < 5; i++) {
               const arch = MeshBuilder.CreateTorus(`arch_${i}`, {
                    diameter: 5 + Math.random() * 4,
                    thickness: 0.5 + Math.random() * 0.3,
                    tessellation: 24,
               }, this.scene);

               const angle = Math.random() * Math.PI * 2;
               const dist = 20 + Math.random() * 40;
               arch.position.x = Math.cos(angle) * dist;
               arch.position.z = Math.sin(angle) * dist;
               arch.position.y = 2 + Math.random() * 3;
               arch.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
               arch.rotation.z = (Math.random() - 0.5) * 0.2;

               const mat = new PBRMaterial(`archMat_${i}`, this.scene);
               mat.albedoColor = new Color3(0.07, 0.05, 0.06);
               mat.metallic = 0.1;
               mat.roughness = 0.9;
               mat.emissiveColor = new Color3(0.01, 0.003, 0.006);
               arch.material = mat;
               this.shadowGen.addShadowCaster(arch);
          }
     }

     private setupPostProcessing(): void {
          const pipeline = new DefaultRenderingPipeline("defaultPipeline", true, this.scene, [this.camera]);

          // Bloom — minimal to avoid UI bleed and save GPU
          pipeline.bloomEnabled = true;
          pipeline.bloomThreshold = 0.8;
          pipeline.bloomWeight = 0.06;
          pipeline.bloomKernel = 16;
          pipeline.bloomScale = 0.25;

          // Chromatic aberration — DISABLED (destroys text clarity)
          pipeline.chromaticAberrationEnabled = false;

          // Film grain — DISABLED (biggest source of UI text blur)
          pipeline.grainEnabled = false;

          // Vignette — minimal (CrimsonGrading already adds one)
          pipeline.imageProcessing.vignetteEnabled = true;
          pipeline.imageProcessing.vignetteWeight = 0.25;
          pipeline.imageProcessing.vignetteColor = new Color4(0.04, 0.01, 0.03, 1);
          pipeline.imageProcessing.vignetteStretch = 0.5;

          // Tone mapping & exposure (ACES)
          pipeline.imageProcessing.toneMappingEnabled = true;
          pipeline.imageProcessing.toneMappingType = 1;
          pipeline.imageProcessing.exposure = 1.5;
          pipeline.imageProcessing.contrast = 1.15;

          // Color curves
          pipeline.imageProcessing.colorCurvesEnabled = true;

          // Glow layer — lowered for perf and clarity
          const glow = new GlowLayer("glow", this.scene);
          glow.intensity = 0.1;
          glow.blurKernelSize = 4;
     }

     private createVisibleGround(): void {
          // Large ground plane with bright procedural texture
          const ground = MeshBuilder.CreateGround("baseGround", {
               width: 600, height: 600, subdivisions: 16
          }, this.scene);
          ground.position.y = -0.5; // Slightly below procedural chunks to prevent Z-fighting
          ground.receiveShadows = true;

          const mat = new StandardMaterial("baseGroundMat", this.scene);
          mat.diffuseColor = new Color3(0.45, 0.28, 0.32);
          mat.specularColor = new Color3(0.08, 0.06, 0.07);
          // HIGH emissive to survive all post-processing layers
          mat.emissiveColor = new Color3(0.22, 0.1, 0.14);

          // Procedural grid texture for movement perception
          const texSize = 512;
          const dynTex = new DynamicTexture("groundGridTex", texSize, this.scene, true);
          const ctx = dynTex.getContext();

          // Base earth tone
          ctx.fillStyle = "#3d2228";
          ctx.fillRect(0, 0, texSize, texSize);

          // Grid lines — visible enough to perceive movement
          ctx.strokeStyle = "rgba(200, 120, 130, 0.35)";
          ctx.lineWidth = 1.5;
          const gridStep = texSize / 16;
          for (let i = 0; i <= 16; i++) {
               const pos = i * gridStep;
               ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, texSize); ctx.stroke();
               ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(texSize, pos); ctx.stroke();
          }

          // Noise splotches for terrain variation
          for (let i = 0; i < 250; i++) {
               const x = Math.random() * texSize;
               const y = Math.random() * texSize;
               const r = 2 + Math.random() * 10;
               const b = Math.floor(30 + Math.random() * 40);
               ctx.fillStyle = `rgba(${b + 20}, ${b}, ${b + 8}, 0.35)`;
               ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          }

          // Crack detail
          ctx.strokeStyle = "rgba(120, 60, 70, 0.2)";
          ctx.lineWidth = 0.5;
          for (let i = 0; i < 30; i++) {
               ctx.beginPath();
               const sx = Math.random() * texSize;
               const sy = Math.random() * texSize;
               ctx.moveTo(sx, sy);
               ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
               ctx.stroke();
          }

          dynTex.update();
          mat.diffuseTexture = dynTex;
          (mat.diffuseTexture as DynamicTexture).uScale = 6;
          (mat.diffuseTexture as DynamicTexture).vScale = 6;

          ground.material = mat;
          this.shadowGen.addShadowCaster(ground);

     }

     public render(): void {
          const dt = this.engine.getDeltaTime() / 1000;

          // Update player animation
          if (this.player) {
               this.player.update(dt);
          }

          // Update monster AI & NPCs
          if (this.monsterManager && this.player) {
               const pPos = this.player.getPosition();
               this.monsterManager.update(dt, pPos);
          }

          // Update combat system (monster attacks + drops + auto-battle)
          if (this.combatSystem) {
               this.combatSystem.update(dt);

               // Update HUD skill cooldown overlays
               const skills = ["atk", "dodge", "skill1", "skill2", "ult"];
               for (const id of skills) {
                    const state = this.combatSystem.skillSystem.getSkillState(id);
                    this.hud.updateSkillCooldown(id, state.cooldownRemaining, state.cooldownTotal);
               }
          }

          if (this.world && this.camera) {
               const playerPos = this.player ? this.player.getPosition() : this.camera.target;
               this.world.update(playerPos);
          }
          this.scene.render();
     }

     public getScene(): Scene {
          return this.scene;
     }
}
