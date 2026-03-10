import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { SSAO2RenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';

// Side effects - required for shadows, post-processing, SSAO
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';
import '@babylonjs/core/Rendering/prePassRendererSceneComponent';
import '@babylonjs/core/Rendering/geometryBufferRendererSceneComponent';

import type { EngineManager } from '../core/EngineManager';
import { Registry } from '../core/Registry';
import { getSmokeProfileFromQuery, shouldUseReducedRenderQuality } from '../core/RuntimeLaunchFlags';

export class MainScene {
      public scene!: Scene;
      public camera!: ArcRotateCamera;
      public sun!: DirectionalLight;
      public shadowGenerator!: ShadowGenerator;

      private _engineManager: EngineManager;

      constructor(engineManager: EngineManager) {
            this._engineManager = engineManager;
      }

      async build(): Promise<void> {
            const reducedRenderMode = shouldUseReducedRenderQuality();
            const smokeProfile = getSmokeProfileFromQuery();
            this.scene = new Scene(this._engineManager.engine);
            this.scene.clearColor = new Color4(0.04, 0.055, 0.1, 1); // #0A0E1A

            // --- Camera ---
            this.camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.1, 14, new Vector3(0, 0.5, 0), this.scene);
            this.camera.lowerBetaLimit = 0.5;
            this.camera.upperBetaLimit = 1.4;
            this.camera.lowerRadiusLimit = 8;
            this.camera.upperRadiusLimit = 25;
            this.camera.panningSensibility = 0; // disable pan
            this.camera.attachControl(this._engineManager.canvas, true);
            // Only right-click rotate (cast needed — property exists at runtime)
            (this.camera.inputs.attached.pointers as any).buttons = [1];

            // --- Shadow Generator (needs a temporary light, ZoneRenderer will create the real one) ---
            this.sun = new DirectionalLight('main_sun', new Vector3(-0.5, -1, -0.3), this.scene);
            this.sun.intensity = 1.8;
            this.sun.diffuse = new Color3(1.0, 0.95, 0.85);
            this.sun.position = new Vector3(30, 50, 30);

            const shadowMapSize = reducedRenderMode ? 768 : 2048;
            this.shadowGenerator = new ShadowGenerator(shadowMapSize, this.sun);
            this.shadowGenerator.usePercentageCloserFiltering = !reducedRenderMode;
            this.shadowGenerator.filteringQuality = reducedRenderMode
                  ? ShadowGenerator.QUALITY_LOW
                  : ShadowGenerator.QUALITY_MEDIUM;

            // PBR environment
            this.scene.ambientColor = new Color3(0.25, 0.25, 0.3);

            // NOTE: Ground + Zone lights are now created by ZoneRenderer per-zone.
            // ZoneManager.buildInitialZone() must be called after this.

            // --- Post-Processing Pipeline ---
            if (!reducedRenderMode) {
                  const pipeline = new DefaultRenderingPipeline('pipeline', true, this.scene, [this.camera]);

                  pipeline.bloomEnabled = true;
                  pipeline.bloomThreshold = 0.7;
                  pipeline.bloomWeight = 0.3;
                  pipeline.bloomKernel = 64;
                  pipeline.fxaaEnabled = true;
                  pipeline.imageProcessingEnabled = true;
                  pipeline.imageProcessing.toneMappingEnabled = true;
                  pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
                  pipeline.imageProcessing.exposure = 1.2;
                  pipeline.imageProcessing.contrast = 1.2;
            } else {
                  this.scene.imageProcessingConfiguration.toneMappingEnabled = false;
                  this.scene.imageProcessingConfiguration.exposure = 1.0;
                  this.scene.imageProcessingConfiguration.contrast = 1.0;
            }

            // Register
            Registry.scene = this.scene;
            this._engineManager.scene = this.scene;

            if (reducedRenderMode) {
                  console.log(`[MainScene] Reduced render mode active${smokeProfile ? ` (${smokeProfile})` : ''}: light shadow + postprocess disabled`);
            } else {
                  console.log('[MainScene] Scene shell built: camera + shadow + bloom + ACES (terrain via ZoneRenderer)');
            }
      }

      private _createSkyGradient(): void {
            // Sky sphere — render INSIDE face only, behind everything
            const sky = MeshBuilder.CreateSphere('sky', {
                  diameter: 500, segments: 16,
                  sideOrientation: 1, // BACKSIDE — render interior
            }, this.scene);
            const skyMat = new PBRMaterial('skyMat', this.scene);
            skyMat.albedoColor = new Color3(0.15, 0.2, 0.35);
            skyMat.emissiveColor = new Color3(0.08, 0.12, 0.25);
            skyMat.roughness = 1.0;
            skyMat.metallic = 0.0;
            skyMat.disableLighting = true;
            skyMat.disableDepthWrite = true;
            sky.material = skyMat;
            sky.isPickable = false;
            sky.infiniteDistance = true;
            sky.renderingGroupId = 0;
      }

      private _createMarkers(): void {
            // 4 emissive pillars at corners — confirms scene is rendering
            const colors = [
                  new Color3(0.3, 0.8, 0.4),   // green
                  new Color3(0.9, 0.6, 0.2),   // gold
                  new Color3(0.3, 0.5, 0.9),   // blue
                  new Color3(0.8, 0.3, 0.5),   // pink
            ];
            const positions = [
                  new Vector3(-5, 1, -5),
                  new Vector3(5, 1, -5),
                  new Vector3(-5, 1, 5),
                  new Vector3(5, 1, 5),
            ];

            for (let i = 0; i < 4; i++) {
                  const pillar = MeshBuilder.CreateCylinder(`marker_${i}`, {
                        height: 2, diameter: 0.6,
                  }, this.scene);
                  pillar.position = positions[i];

                  const mat = new PBRMaterial(`markerMat_${i}`, this.scene);
                  mat.albedoColor = colors[i];
                  mat.emissiveColor = colors[i].scale(0.4);
                  mat.roughness = 0.5;
                  mat.metallic = 0.1;
                  pillar.material = mat;

                  this.shadowGenerator.addShadowCaster(pillar);
                  pillar.receiveShadows = true;
            }
      }

      dispose(): void {
            this.scene.dispose();
      }
}
