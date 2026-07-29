// Reads secret values from .dev.vars and pushes them to the deployed
// Cloudflare Worker via `wrangler secret put`. Run this after any secret
// disappears (known issue: reconnecting/syncing the GitHub integration on
// Workers Builds can wipe secrets) instead of retyping them by hand.
//
// Usage: node scripts/push-secrets.js

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const SECRET_KEYS = ["AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "ONE_MIN_AI_API_KEY"];

const devVarsPath = path.join(__dirname, "..", ".dev.vars");
const content = fs.readFileSync(devVarsPath, "utf8");

const values = {};
for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  values[key] = value;
}

for (const key of SECRET_KEYS) {
  const value = values[key];
  if (!value) {
    console.warn(`Skipping ${key}: no value found in .dev.vars`);
    continue;
  }

  console.log(`Pushing ${key}...`);
  const result = spawnSync("npx", ["wrangler", "secret", "put", key], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`Failed to push ${key}`);
    process.exit(result.status ?? 1);
  }
}

console.log("Done.");
