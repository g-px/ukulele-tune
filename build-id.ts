import { execSync } from "node:child_process";

/** Short commit id baked into the bundle so a user can tell which build they run. */
export function buildId(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}
