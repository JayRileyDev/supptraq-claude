import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    allowedHosts: [
    "4d65-2001-56a-f548-5600-69b3-1d6d-d853-4f61.ngrok-free.app"
    ]
  }
});
