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
                         if (id.endsWith(".json") && /[\\/]src[\\/]data[\\/]runtime[\\/]/.test(id)) {
                              return "runtime-data";
                         }
                         return undefined;
                    },
               },
          },
     },
});
