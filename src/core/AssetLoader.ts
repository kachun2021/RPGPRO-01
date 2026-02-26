import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";

/**
 * Static asset loading utilities.
 * All methods have graceful fallback — 404 / load errors never crash the game.
 */
export class AssetLoader {
      /**
       * Check if a URL is reachable (HEAD request).
       */
      static async fileExists(url: string): Promise<boolean> {
            try {
                  const res = await fetch(url, { method: "HEAD" });
                  return res.ok;
            } catch {
                  return false;
            }
      }

      /**
       * Load a GLB / GLTF mesh.
       * Returns [] on failure so callers can fall back to placeholders.
       */
      static async loadGLB(
            scene: Scene,
            path: string,
            fileName: string
      ): Promise<AbstractMesh[]> {
            try {
                  const exists = await AssetLoader.fileExists(path + fileName);
                  if (!exists) {
                        console.warn(`[AssetLoader] GLB not found: ${path}${fileName}`);
                        return [];
                  }
                  const result = await SceneLoader.ImportMeshAsync(
                        "",
                        path,
                        fileName,
                        scene
                  );
                  return result.meshes;
            } catch (err) {
                  console.warn(`[AssetLoader] GLB load failed: ${path}${fileName}`, err);
                  return [];
            }
      }

      /**
       * Load a texture.
       * Returns null on failure.
       */
      static async loadTexture(
            scene: Scene,
            url: string
      ): Promise<Texture | null> {
            try {
                  const exists = await AssetLoader.fileExists(url);
                  if (!exists) {
                        console.warn(`[AssetLoader] Texture not found: ${url}`);
                        return null;
                  }
                  return new Texture(url, scene);
            } catch (err) {
                  console.warn(`[AssetLoader] Texture load failed: ${url}`, err);
                  return null;
            }
      }
}
