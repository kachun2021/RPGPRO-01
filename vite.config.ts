import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
     resolve: {
          alias: {
               "@": resolve(__dirname, "src"),
          },
     },
     server: {
          port: 3000,
          open: false,
     },
     build: {
          target: "ES2022",
          sourcemap: true,
          rollupOptions: {
               output: {
                    manualChunks(id) {
                         if (id.includes("node_modules")) {
                              if (id.includes("@babylonjs")) return "vendor-babylon";
                              return "vendor";
                         }
                         if (id.includes("RuntimeEconomyCombatSource")) return "runtime-economy-combat";
                         if (id.includes("RuntimeEconomyCommerceSource")) return "runtime-economy-commerce";
                         if (id.includes("RuntimeEconomyShared")) return "runtime-economy-shared";
                         if (id.includes("RuntimeOpsSource")) return "runtime-ops-loader";
                         if (id.endsWith(".json") && /[\\/]src[\\/]data[\\/]runtime[\\/]/.test(id)) {
                              if (id.includes("world.spawn.zone_templates")) return "runtime-world-combat-data";
                              if (id.includes("world.spawn.json")) return "runtime-world-panel-data";
                              if (id.includes("world.topology")) return "runtime-world-core-data";
                              if (id.includes("fusion.runtime")) return "runtime-fusion-data";
                              if (id.includes("economy.combat.core")) return "runtime-economy-combat-core-data";
                              if (id.includes("economy.combat.ext")) return "runtime-economy-combat-ext-data";
                              if (id.includes("economy.combat")) return "runtime-economy-combat-data";
                              if (id.includes("economy.commerce")) return "runtime-economy-commerce-data";
                               if (id.includes("economy")) return "runtime-economy-data";
                               if (id.includes("progression")) return "runtime-progression-data";
                               if (id.includes("ops")) return "runtime-ops-data";
                              if (
                                   id.includes("data.health") ||
                                   id.includes("reference.repairs") ||
                                   id.includes("save_schema") ||
                                   id.includes("_manifest")
                              ) {
                                   return "runtime-meta-data";
                              }
                              return "runtime-data";
                         }
                         if (id.endsWith("list_pets.json")) return "runtime-fusion-data";
                         return undefined;
                    },
               },
          },
     },
});
