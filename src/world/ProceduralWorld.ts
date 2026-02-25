import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AssetManager } from "../core/AssetManager";

interface Chunk {
      x: number;
      z: number;
      mesh: AbstractMesh;
}

/**
 * Procedural Open World system utilizing Chunk Loading
 * Attempts to load `chunk_lod.glb` and `ruins_*.ktx2` via AssetManager.
 * Emulates a Compute Shader based heightmap generator.
 */
export class ProceduralWorld {
      private chunks: Map<string, Chunk> = new Map();
      private chunkSize: number = 200;
      private renderDistance: number = 2; // Radius around player (e.g. 2 means 5x5 grid)

      private sharedMaterial: PBRMaterial | null = null;
      private lodMeshTemplate: AbstractMesh | null = null;

      constructor(private scene: Scene) {
            console.log("[ProceduralWorld] Initializing Open World Gen...");
            this.prepareAssets();
      }

      private async prepareAssets(): Promise<void> {
            // Setup shared material with placeholder KTX2 texture
            this.sharedMaterial = new PBRMaterial("chunkMat", this.scene);
            this.sharedMaterial.albedoColor = new Color3(0.12, 0.08, 0.09);
            this.sharedMaterial.roughness = 0.9;
            this.sharedMaterial.metallic = 0.05;

            const tex = await AssetManager.loadTexture(this.scene, "assets/textures/chunk/ruins_1.ktx2");
            if (tex) {
                  this.sharedMaterial.albedoTexture = tex;
                  this.sharedMaterial.albedoColor = new Color3(1, 1, 1);
            } else {
                  // Procedural fallback if texture missing
                  // Keep the base color
                  console.log("[ProceduralWorld] Using procedural fallback material for chunks");
            }

            // Attempt to load LOD mesh placeholder
            const meshes = await AssetManager.loadMesh(this.scene, "assets/models/", "chunk_lod.glb");
            if (meshes && meshes.length > 0) {
                  this.lodMeshTemplate = meshes[0];
                  this.lodMeshTemplate.setEnabled(false); // Hide the template
                  console.log("[ProceduralWorld] GLB LOD Mesh loaded successfully");
            } else {
                  console.log("[ProceduralWorld] Using procedural ground mesh fallback");
            }
      }

      public update(playerPosition: Vector3): void {
            const currentChunkX = Math.floor(playerPosition.x / this.chunkSize);
            const currentChunkZ = Math.floor(playerPosition.z / this.chunkSize);

            const activeKeys = new Set<string>();

            // Load new chunks
            for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
                  for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                        const cx = currentChunkX + x;
                        const cz = currentChunkZ + z;
                        const key = `${cx},${cz}`;
                        activeKeys.add(key);

                        if (!this.chunks.has(key)) {
                              this.generateChunk(cx, cz);
                        }
                  }
            }

            // Unload distant chunks
            for (const [key, chunk] of this.chunks.entries()) {
                  if (!activeKeys.has(key)) {
                        chunk.mesh.dispose();
                        this.chunks.delete(key);
                        // console.log(`[ProceduralWorld] Unloaded chunk ${key}`);
                  }
            }
      }

      private async generateChunk(cx: number, cz: number): Promise<void> {
            const key = `${cx},${cz}`;

            // Mark as generating so we don't start multiple times
            this.chunks.set(key, { x: cx, z: cz, mesh: new Mesh(`dummy_${key}`) });

            // Simulate Compute Shader map generation delay (e.g. 50ms per chunk data)
            await new Promise((resolve) => setTimeout(resolve, 50));

            let mesh: AbstractMesh;

            if (this.lodMeshTemplate) {
                  // Instantiate the GLB template
                  mesh = this.lodMeshTemplate.clone(`chunk_${key}`, null) as AbstractMesh;
                  mesh.setEnabled(true);
            } else {
                  // Procedural fallback Mesh
                  mesh = MeshBuilder.CreateGround(`chunk_${key}`, {
                        width: this.chunkSize,
                        height: this.chunkSize,
                        subdivisions: 16
                  }, this.scene);

                  // Apply pseudo-Compute Shader heightmap (Perlin noise approximation)
                  const positions = mesh.getVerticesData("position");
                  if (positions) {
                        for (let i = 0; i < positions.length; i += 3) {
                              const wx = positions[i] + (cx * this.chunkSize);
                              const wz = positions[i + 2] + (cz * this.chunkSize);
                              // Simple chaotic wave
                              const noise = Math.sin(wx * 0.02) * Math.cos(wz * 0.02) * 5.0 +
                                    Math.sin(wx * 0.1) * Math.cos(wz * 0.1) * 1.5;
                              positions[i + 1] = noise;
                        }
                        mesh.setVerticesData("position", positions);

                        // Force normal recomputation
                        const normals: number[] = [];
                        import("@babylonjs/core/Meshes/mesh.vertexData").then(({ VertexData }) => {
                              VertexData.ComputeNormals(positions, mesh.getIndices()!, normals);
                              mesh.setVerticesData("normal", normals);
                        });
                  }
            }

            mesh.position.x = cx * this.chunkSize;
            mesh.position.z = cz * this.chunkSize;

            // Offset height slightly so we don't instantly fly under existing placeholder assets
            mesh.position.y = -2;

            if (this.sharedMaterial) {
                  mesh.material = this.sharedMaterial;
            }

            // Replace the dummy 
            const existing = this.chunks.get(key);
            if (existing && existing.mesh.name.startsWith("dummy")) {
                  existing.mesh.dispose();
            }
            this.chunks.set(key, { x: cx, z: cz, mesh });

            // console.log(`[ProceduralWorld] Loaded chunk ${key}`);
      }
}
