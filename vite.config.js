import { defineConfig } from "vite";

// base: "./" keeps asset paths relative, so the build works whether it's served
// from a user site (arkapatra31.github.io) or a project subpath
// (arkapatra31.github.io/arkapatra31/) on GitHub Pages.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
