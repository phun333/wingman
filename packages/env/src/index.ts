import path from "path";
import fs from "fs";

function findRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, "bunfig.toml"))) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) throw new Error("Could not find monorepo root");
  return findRoot(parent);
}

const root = findRoot(process.cwd());
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

export const ENV = {
  CONVEX_URL: process.env.CONVEX_URL!,
  PORT_API: Number(process.env.PORT_API || 3001),
  PORT_WEB: Number(process.env.PORT_WEB || 3000),
} as const;
