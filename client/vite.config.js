import { defineConfig } from "vite";

export default defineConfig({
  server: {
    historyApiFallback: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
