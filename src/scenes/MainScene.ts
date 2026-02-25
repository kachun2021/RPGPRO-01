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

     constructor(
          private engine: AbstractEngine,
          private canvas: HTMLCanvasElement
     ) {
          this.scene = new Scene(this.engine);
          this.scene.clearColor = new Color4(0.04, 0, 0.03, 1);
          this.scene.ambientColor = new Color3(0.05, 0.01, 0.02);
          this.scene.fogMode = Scene.FOGMODE_EXP2;
          this.scene.fogDensity = 0.006;
          this.scene.fogColor = new Color3(0.12, 0.02, 0.04);
     }

     public async init(): Promise<void> {
          console.log("[Scene] Setting up camera...");
          this.setupCamera();

          console.log("[Scene] Setting up lighting...");
          this.setupLighting();

          console.log("[Scene] Creating skybox...");
          this.createSkybox();

          console.log("[Scene] Initializing Procedural Chunk World...");
          this.world = new ProceduralWorld(this.scene);

          console.log("[Scene] Creating god rays...");
          try {
               this.createGodRays();
          } catch (e) {
               console.warn("[Scene] God rays failed (non-fatal):", e);
          }

          console.log("[Scene] Creating atmospheric props...");
          this.createAtmosphericProps();

          console.log("[Scene] Creating ash particles...");
          try {
               AshParticleSystem.create(this.scene);
          } catch (e) {
               console.warn("[Scene] Ash particles failed (non-fatal):", e);
          }

          console.log("[Scene] Applying crimson grading...");
          try {
               CrimsonGrading.apply(this.scene, this.camera);
          } catch (e) {
               console.warn("[Scene] Crimson grading failed (non-fatal):", e);
          }

          console.log("[Scene] Setting up post-processing...");
          try {
               this.setupPostProcessing();
          } catch (e) {
               console.warn("[Scene] Post-processing failed (non-fatal):", e);
          }

          console.log("[Scene] Creating HUD...");
          this.hud = new HUD(this.scene);

          console.log("[Scene] Setting up input system...");
          try {
               this.inputManager = new InputManager(this.scene);
               this.joystick = new TouchJoystick(this.scene, this.inputManager);
               this.swipeAttack = new SwipeAttack(this.scene, this.inputManager);
               this.portraitCamera = new PortraitCamera(this.scene, this.camera, this.joystick);
          } catch (e) {
               console.warn("[Scene] Input system failed (non-fatal):", e);
          }

          console.log("[Scene] Init complete ✓");

          // Ensure scene is ready
          await this.scene.whenReadyAsync();
          console.log("[Scene] Scene ready ✓");
     }

     private setupCamera(): void {
          this.camera = new ArcRotateCamera(
               "mainCam",
               -Math.PI / 2,    // alpha - behind character
               Math.PI / 3.2,   // beta - slightly above
               25,              // radius
               new Vector3(0, 3, 0),
               this.scene
          );
          this.camera.lowerRadiusLimit = 10;
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
          // Ambient — bright enough to see everything
          const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
          ambient.intensity = 0.45;
          ambient.diffuse = new Color3(0.4, 0.15, 0.18);
          ambient.groundColor = new Color3(0.12, 0.04, 0.06);

          // Blood Moon directional (main shadow caster)
          const moonLight = new DirectionalLight("moonLight", new Vector3(-0.5, -1, 0.3), this.scene);
          moonLight.intensity = 2.0;
          moonLight.diffuse = new Color3(0.85, 0.2, 0.15);
          moonLight.specular = new Color3(1, 0.3, 0.2);
          moonLight.position = new Vector3(20, 40, -20);

          // Shadow generator
          this.shadowGen = new ShadowGenerator(1024, moonLight);
          this.shadowGen.useBlurExponentialShadowMap = true;
          this.shadowGen.blurKernel = 16;
          this.shadowGen.darkness = 0.4;

          // Crimson rim point light
          const rimLight = new PointLight("rimLight", new Vector3(0, 15, -10), this.scene);
          rimLight.intensity = 1.2;
          rimLight.diffuse = new Color3(1, 0.2, 0.12);
          rimLight.range = 80;

          // Secondary fill light for ground visibility
          const fillLight = new PointLight("fillLight", new Vector3(0, 8, 0), this.scene);
          fillLight.intensity = 0.5;
          fillLight.diffuse = new Color3(0.6, 0.12, 0.1);
          fillLight.range = 50;
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

          // Dark sky gradient
          const grad = ctx.createLinearGradient(0, 0, 0, size);
          grad.addColorStop(0, "#020005");
          grad.addColorStop(0.3, "#050010");
          grad.addColorStop(0.6, "#120008");
          grad.addColorStop(0.85, "#1a0510");
          grad.addColorStop(1, "#2a0815");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);

          // Subtle stars
          for (let i = 0; i < 120; i++) {
               const x = Math.random() * size;
               const y = Math.random() * size * 0.6;
               const r = Math.random() * 1.5 + 0.3;
               const brightness = Math.random() * 0.4 + 0.1;
               ctx.fillStyle = `rgba(255, ${180 + Math.random() * 75}, ${160 + Math.random() * 95}, ${brightness})`;
               ctx.beginPath();
               ctx.arc(x, y, r, 0, Math.PI * 2);
               ctx.fill();
          }

          return Texture.LoadFromDataString("skyGradient", canvas.toDataURL(), this.scene);
     }

     private createGround(): void {
          const ground = MeshBuilder.CreateGround("ground", {
               width: 200,
               height: 200,
               subdivisions: 64,
          }, this.scene);

          const groundMat = new PBRMaterial("groundMat", this.scene);
          groundMat.albedoColor = new Color3(0.06, 0.04, 0.045);
          groundMat.metallic = 0.1;
          groundMat.roughness = 0.92;
          groundMat.emissiveColor = new Color3(0.02, 0.005, 0.008);
          groundMat.ambientColor = new Color3(0.03, 0.01, 0.015);

          // Asynchronously load darkstone PBR from AssetManager (normal, metallic workflow mapping)
          AssetManager.loadPBRTexture(this.scene, "assets/textures/ground/darkstone.ktx2").then((tex) => {
               if (tex && tex.name !== "") {
                    tex.uScale = 30;
                    tex.vScale = 30;
                    groundMat.bumpTexture = tex; // Treating it as bump map or multi-map packed
                    groundMat.bumpTexture.level = 0.8;
               } else {
                    // Fallback normal map logic
                    const bumpTex = this.createProceduralNormalMap();
                    if (bumpTex) {
                         groundMat.bumpTexture = bumpTex;
                         bumpTex.uScale = 30;
                         bumpTex.vScale = 30;
                         groundMat.bumpTexture.level = 0.6;
                    }
               }
          });

          ground.material = groundMat;
          ground.receiveShadows = true;

          // Scatter dark gothic props
          this.scatterProps();
     }

     private createProceduralNormalMap(): Texture | null {
          const size = 512;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;

          const imageData = ctx.createImageData(size, size);
          for (let y = 0; y < size; y++) {
               for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;
                    const n1 = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.5 + 0.5;
                    const n2 = Math.sin(x * 0.13 + 1.7) * Math.cos(y * 0.11 + 2.3) * 0.3;
                    const n3 = Math.random() * 0.2;
                    const val = (n1 + n2 + n3) * 0.5;
                    imageData.data[i] = 128 + (val - 0.5) * 60;
                    imageData.data[i + 1] = 128 + (val - 0.5) * 60;
                    imageData.data[i + 2] = 200 + Math.random() * 55;
                    imageData.data[i + 3] = 255;
               }
          }
          ctx.putImageData(imageData, 0, 0);
          return Texture.LoadFromDataString("groundNormal", canvas.toDataURL(), this.scene);
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
               mat.albedoColor = new Color3(0.04, 0.03, 0.035);
               mat.metallic = 0.05;
               mat.roughness = 0.95;
               mat.emissiveColor = new Color3(0.01, 0.003, 0.005);
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
               mat.albedoColor = new Color3(0.05 + Math.random() * 0.03, 0.03, 0.035);
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
               mat.albedoColor = new Color3(0.035, 0.025, 0.03);
               mat.metallic = 0.1;
               mat.roughness = 0.9;
               mat.emissiveColor = new Color3(0.008, 0.002, 0.004);
               arch.material = mat;
               this.shadowGen.addShadowCaster(arch);
          }
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
               1.0,
               this.camera,
               godRayEmitter,
               60,
               Texture.BILINEAR_SAMPLINGMODE,
               this.engine,
               false
          );
          godRays.exposure = 0.25;
          godRays.decay = 0.97;
          godRays.weight = 0.5;
          godRays.density = 0.8;
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
               fogMat.emissiveColor = new Color3(0.15, 0.02, 0.04);
               fogMat.alpha = 0.06 + Math.random() * 0.06;
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
               mat.emissiveColor = new Color3(0.04, 0.008, 0.015);
               mat.diffuseColor = new Color3(0, 0, 0);
               mat.specularColor = new Color3(0, 0, 0);
               mtn.material = mat;
          }
     }

     private setupPostProcessing(): void {
          const pipeline = new DefaultRenderingPipeline("defaultPipeline", true, this.scene, [this.camera]);

          // Bloom — lighter, to not bleed into UI
          pipeline.bloomEnabled = true;
          pipeline.bloomThreshold = 0.6;
          pipeline.bloomWeight = 0.15;
          pipeline.bloomKernel = 32;
          pipeline.bloomScale = 0.3;

          // Chromatic aberration — DISABLED (destroys text clarity)
          pipeline.chromaticAberrationEnabled = false;

          // Film grain — very subtle
          pipeline.grainEnabled = true;
          pipeline.grain.intensity = 8;
          pipeline.grain.animated = true;

          // Vignette — softer
          pipeline.imageProcessing.vignetteEnabled = true;
          pipeline.imageProcessing.vignetteWeight = 1.0;
          pipeline.imageProcessing.vignetteColor = new Color4(0.06, 0, 0.02, 1);
          pipeline.imageProcessing.vignetteStretch = 0.4;

          // Tone mapping & exposure (ACES)
          pipeline.imageProcessing.toneMappingEnabled = true;
          pipeline.imageProcessing.toneMappingType = 1;
          pipeline.imageProcessing.exposure = 1.5;
          pipeline.imageProcessing.contrast = 1.2;

          // Color curves
          pipeline.imageProcessing.colorCurvesEnabled = true;

          // Glow layer — reduced to not haze over everything
          const glow = new GlowLayer("glow", this.scene);
          glow.intensity = 0.3;
          glow.blurKernelSize = 16;
     }

     public render(): void {
          if (this.world && this.camera) {
               // Assuming player model is at camera target, feed target position to the chunk manager
               this.world.update(this.camera.target);
          }
          this.scene.render();
     }

     public getScene(): Scene {
          return this.scene;
     }
}
