import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';

export class AssetLoader {
      /**
       * Load a texture with fallback to a solid color if file not found.
       */
      static loadTexture(path: string, scene: Scene, fallbackColor?: Color3): Texture {
            const tex = new Texture(path, scene, false, true, Texture.TRILINEAR_SAMPLINGMODE,
                  () => { /* loaded */ },
                  () => {
                        console.warn(`[AssetLoader] Texture not found: ${path}, using fallback`);
                  }
            );
            return tex;
      }

      /**
       * Load a generated image icon from assets/icons/
       */
      static loadIcon(filename: string, scene: Scene): Texture {
            return this.loadTexture(`assets/icons/${filename}`, scene);
      }

      /**
       * Load a generated image texture from assets/textures/
       */
      static loadTerrainTexture(filename: string, scene: Scene): Texture {
            return this.loadTexture(`assets/textures/${filename}`, scene);
      }

      /**
       * Create a simple PBR material with a fallback color.
       */
      static createFallbackMaterial(name: string, color: Color3, scene: Scene): PBRMaterial {
            const mat = new PBRMaterial(name, scene);
            mat.albedoColor = color;
            mat.roughness = 0.8;
            mat.metallic = 0.0;
            return mat;
      }
}
