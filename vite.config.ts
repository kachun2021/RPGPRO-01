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
          open: true,
     },
     build: {
          target: "ES2022",
          sourcemap: true,
          rollupOptions: {
               output: {
                    manualChunks: {
                         babylon: [
                              "@babylonjs/core",
                              "@babylonjs/gui",
                              "@babylonjs/materials",
                              "@babylonjs/loaders",
                         ],
                         firebase: ["firebase"],
                    },
               },
          },
     },
});
