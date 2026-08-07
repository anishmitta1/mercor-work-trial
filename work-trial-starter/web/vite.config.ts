import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you serve the CSV/Parquet from disk during dev, `fs.allow` lets Vite read
// the sibling ../data folder. (Or copy data into web/public, or fetch from your
// own backend — your call.)
export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: [".."] } },
});
