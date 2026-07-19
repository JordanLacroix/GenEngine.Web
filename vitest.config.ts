import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Même alias que `tsconfig.json` : sans lui, un module testé qui importe une
  // valeur — et pas seulement un type — via `@/…` reste irrésolu à l'exécution.
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    coverage: { reporter: ["text", "json", "html"] },
  },
});
