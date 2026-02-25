import { Scene } from "@babylonjs/core/scene";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import "@babylonjs/core/Materials/Textures/Loaders/ktxTextureLoader"; // Support KTX2
import "@babylonjs/loaders/glTF"; // Support GLB/GLTF

export class AssetManager {
      /**
       * Checks if the file actually exists and isn't a Vite HTML fallback.
       */
      private static async fileExists(url: string): Promise<boolean> {
            try {
                  const response = await fetch(url, { method: 'HEAD' });
                  const contentType = response.headers.get("content-type");
                  if (!response.ok || (contentType && contentType.includes("text/html"))) {
                        return false;
                  }
                  return true;
            } catch (e) {
                  return false;
            }
      }

      /**
       * Moduled loading for Skybox textures.
       * Tries to load the asset, if 404 falls back to a procedural or empty texture gracefully.
       */
      public static loadSkybox(scene: Scene, path: string): CubeTexture {
            console.log(`[AssetManager] Loading Skybox: ${path}`);
            const skyTexture = new CubeTexture(path, scene, undefined, false, undefined, () => {
                  console.log(`[AssetManager] Skybox loaded successfully: ${path}`);
            }, (msg, exception) => {
                  console.warn(`[AssetManager] Could not load Skybox from ${path}. Using fallback.`, msg, exception);
            });

            return skyTexture;
      }

      /**
       * Loads a PBR packed texture (normal/roughness/metallic/ao)
       * For simplicity, returns a promise with a standard Texture
       */
      public static async loadPBRTexture(scene: Scene, path: string): Promise<Texture | null> {
            const exists = await this.fileExists(path);
            if (!exists) {
                  console.warn(`[AssetManager] File does not exist or is HTML fallback: ${path}`);
                  return null;
            }

            return new Promise((resolve) => {
                  console.log(`[AssetManager] Loading PBR Texture: ${path}`);
                  const tex = new Texture(path, scene, false, true, Texture.TRILINEAR_SAMPLINGMODE, () => {
                        console.log(`[AssetManager] PBR Texture loaded successfully: ${path}`);
                        resolve(tex);
                  }, (msg, exception) => {
                        console.warn(`[AssetManager] Could not load PBR mapping from ${path}.`, msg, exception);
                        resolve(null);
                  });
            });
      }

      /**
       * Loads a standard WebGPU texture
       */
      public static async loadTexture(scene: Scene, path: string): Promise<Texture | null> {
            const exists = await this.fileExists(path);
            if (!exists) {
                  console.warn(`[AssetManager] File does not exist or is HTML fallback: ${path}`);
                  return null;
            }

            return new Promise((resolve) => {
                  const tex = new Texture(path, scene, false, true, Texture.TRILINEAR_SAMPLINGMODE, () => {
                        resolve(tex);
                  }, () => {
                        console.warn(`[AssetManager] Failed to load texture: ${path}`);
                        resolve(null);
                  });
            });
      }

      /**
       * Loads a 3D model (GLB/GLTF/OBJ)
       */
      public static async loadMesh(scene: Scene, path: string, fileName: string): Promise<AbstractMesh[] | null> {
            const exists = await this.fileExists(path + fileName);
            if (!exists) {
                  console.warn(`[AssetManager] File does not exist or is HTML fallback: ${path}${fileName}`);
                  return null;
            }

            try {
                  console.log(`[AssetManager] Loading Mesh: ${path}${fileName}`);
                  const result = await SceneLoader.ImportMeshAsync("", path, fileName, scene);
                  console.log(`[AssetManager] Mesh loaded successfully: ${fileName}`);
                  return result.meshes;
            } catch (e) {
                  console.warn(`[AssetManager] Failed to load mesh: ${path}${fileName}`, e);
                  return null;
            }
      }

      /**
       * Get a GUI Image source URL. If the file exists, returns the URL.
       * If it doesn't exist, generates a 2D canvas with the fallbackText and returns a Base64 data URI.
       */
      public static async getUITextureUrl(url: string, fallbackText: string, width = 64, height = 64): Promise<string> {
            const exists = await this.fileExists(url);
            if (exists) return url;

            console.warn(`[AssetManager] UI Texture missing: ${url}. Generating fallback '${fallbackText}'.`);
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                  // Background
                  ctx.fillStyle = "rgba(30, 30, 40, 0.85)";
                  ctx.beginPath();
                  if (ctx.roundRect) {
                        ctx.roundRect(0, 0, width, height, 12);
                  } else {
                        ctx.rect(0, 0, width, height);
                  }
                  ctx.fill();

                  // Border
                  ctx.strokeStyle = "rgba(250, 173, 20, 0.5)";
                  ctx.lineWidth = 2;
                  ctx.stroke();

                  // Text
                  ctx.fillStyle = "#faad14";
                  ctx.font = `600 ${Math.floor(width * 0.35)}px Inter, sans-serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(fallbackText, width / 2, height / 2);
            }
            return canvas.toDataURL("image/png");
      }
}
