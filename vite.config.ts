import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { interpretApiPlugin } from "./server/dev-plugin.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), interpretApiPlugin()],
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
  },
});
