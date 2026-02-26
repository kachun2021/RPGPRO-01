import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

interface Chunk {
      x: number;
      z: number;
      mesh: AbstractMesh;
}

/**
 * Procedural Open World system — Chunk-based terrain
 * Uses StandardMaterial with procedural texture for guaranteed visibility.
 * Heightmap via sine-wave noise approximation.
 */
export class ProceduralWorld {
      private chunks: Map<string, Chunk> = new Map();
      private chunkSize: number = 64;
      private renderDistance: number = 2;

      private sharedMaterial: StandardMaterial | null = null;

      constructor(private scene: Scene) {

            this.prepareAssets();
      }

      private prepareAssets(): void {
            // StandardMaterial: high emissive ensures ground is visible
            this.sharedMaterial = new StandardMaterial("chunkMat", this.scene);
            this.sharedMaterial.diffuseColor = new Color3(0.45, 0.3, 0.35);
            this.sharedMaterial.specularColor = new Color3(0.15, 0.1, 0.12);
            this.sharedMaterial.emissiveColor = new Color3(0.12, 0.06, 0.08);
            this.sharedMaterial.backFaceCulling = true;

            // Procedural grid texture for visual ground reference and movement perception
            const texSize = 256;
            const dynTex = new DynamicTexture("groundTex", texSize, this.scene, true);
            const ctx = dynTex.getContext();

            // Base earth fill — moderately bright for visibility
            ctx.fillStyle = "#3d2830";
            ctx.fillRect(0, 0, texSize, texSize);

            // Subtle grid lines for depth/movement perception
            ctx.strokeStyle = "rgba(180, 100, 110, 0.3)";
            ctx.lineWidth = 1;
            const gridStep = texSize / 16;
            for (let i = 0; i <= 16; i++) {
                  const pos = i * gridStep;
                  ctx.beginPath();
                  ctx.moveTo(pos, 0);
                  ctx.lineTo(pos, texSize);
                  ctx.stroke();
                  ctx.beginPath();
                  ctx.moveTo(0, pos);
                  ctx.lineTo(texSize, pos);
                  ctx.stroke();
            }

            // Noise patches for terrain variation
            for (let i = 0; i < 300; i++) {
                  const x = Math.random() * texSize;
                  const y = Math.random() * texSize;
                  const r = 2 + Math.random() * 8;
                  const brightness = Math.floor(20 + Math.random() * 30);
                  ctx.fillStyle = `rgba(${brightness + 15}, ${brightness}, ${brightness + 5}, 0.4)`;
                  ctx.beginPath();
                  ctx.arc(x, y, r, 0, Math.PI * 2);
                  ctx.fill();
            }

            // Cracks / detail lines
            ctx.strokeStyle = "rgba(100, 50, 60, 0.15)";
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 40; i++) {
                  ctx.beginPath();
                  const sx = Math.random() * texSize;
                  const sy = Math.random() * texSize;
                  ctx.moveTo(sx, sy);
                  ctx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80);
                  ctx.stroke();
            }

            dynTex.update();
            this.sharedMaterial.diffuseTexture = dynTex;
            (this.sharedMaterial.diffuseTexture as DynamicTexture).uScale = 4;
            (this.sharedMaterial.diffuseTexture as DynamicTexture).vScale = 4;


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
                  }
            }
      }

      private async generateChunk(cx: number, cz: number): Promise<void> {
            const key = `${cx},${cz}`;

            // Mark as generating so we don't start multiple times
            this.chunks.set(key, { x: cx, z: cz, mesh: new Mesh(`dummy_${key}`) });

            // Simulate Compute Shader map generation delay
            await new Promise((resolve) => setTimeout(resolve, 30));

            // Procedural ground mesh
            const mesh = MeshBuilder.CreateGround(`chunk_${key}`, {
                  width: this.chunkSize,
                  height: this.chunkSize,
                  subdivisions: 6
            }, this.scene);

            // Apply heightmap (Perlin noise approximation)
            const positions = mesh.getVerticesData("position");
            if (positions) {
                  for (let i = 0; i < positions.length; i += 3) {
                        const wx = positions[i] + (cx * this.chunkSize);
                        const wz = positions[i + 2] + (cz * this.chunkSize);
                        // Multi-octave noise for natural terrain (flattened for now to avoid clipping)
                        const noise =
                              (Math.sin(wx * 0.015) * Math.cos(wz * 0.015) * 3.5 +
                                    Math.sin(wx * 0.06) * Math.cos(wz * 0.06) * 1.2 +
                                    Math.sin(wx * 0.12 + 1.7) * Math.cos(wz * 0.12 + 0.3) * 0.4) * 0.1;
                        positions[i + 1] = noise;
                  }
                  mesh.setVerticesData("position", positions);

                  // Recompute normals synchronously (no dynamic import)
                  const normals: number[] = [];
                  VertexData.ComputeNormals(positions, mesh.getIndices()!, normals);
                  mesh.setVerticesData("normal", normals);
            }

            mesh.position.x = cx * this.chunkSize;
            mesh.position.z = cz * this.chunkSize;
            mesh.position.y = 0; // Align exactly with player feet

            if (this.sharedMaterial) {
                  mesh.material = this.sharedMaterial;
            }
            mesh.receiveShadows = true;

            // Replace the dummy
            const existing = this.chunks.get(key);
            if (existing && existing.mesh.name.startsWith("dummy")) {
                  existing.mesh.dispose();
            }
            this.chunks.set(key, { x: cx, z: cz, mesh });
      }
}
