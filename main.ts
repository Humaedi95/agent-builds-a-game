// agent-builds-a-game: entrypoint for the make.fun bounty
// "The agent builds a game from one prompt".
// Copies POST.json from this repository to $MAKEFUN_OUTPUT_DIR/POST.json.
// Standard library only, no network, no wall clock, no files outside the repo.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? ".";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";

const repoRoot = resolve(botDir);
const source = join(repoRoot, "POST.json");
const targetDir = resolve(outputDir);
const target = join(targetDir, "POST.json");

// Read first so a broken POST.json fails loudly instead of being copied blind.
const parsed: unknown = JSON.parse(readFileSync(source, "utf8"));
if (
  typeof parsed !== "object" ||
  parsed === null ||
  typeof (parsed as { url?: unknown }).url !== "string"
) {
  throw new Error("POST.json must be a JSON object with a string url");
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
