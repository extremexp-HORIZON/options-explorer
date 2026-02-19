import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./","./client"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
    allowedHosts: ["ab4467af6026.ngrok-free.app"]
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
    },
  },
}));

