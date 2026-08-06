// Lit les secrets d'un fichier local et les pousse sur le Worker Cloudflare
// correspondant via `wrangler secret put`. À relancer si les secrets
// disparaissent côté Cloudflare (cas déjà rencontré après une resynchro GitHub)
// plutôt que de les ressaisir à la main.
//
//   node scripts/push-secrets.js              -> Worker prod, lit .dev.vars
//   node scripts/push-secrets.js --env dev    -> Worker parccours-dev, lit .dev.vars.dev

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const SECRET_KEYS = ["AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "ONE_MIN_AI_API_KEY"];

const envIndex = process.argv.indexOf("--env");
const cfEnv = envIndex !== -1 ? process.argv[envIndex + 1] : null;

// Convention wrangler : `.dev.vars.<env>` pour un environnement nommé.
const varsFile = cfEnv ? `.dev.vars.${cfEnv}` : ".dev.vars";
const varsPath = path.join(__dirname, "..", varsFile);

if (!fs.existsSync(varsPath)) {
  console.error(`Fichier introuvable : ${varsFile}`);
  process.exit(1);
}

const values = {};
for (const line of fs.readFileSync(varsPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  values[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

console.log(`Source : ${varsFile}`);
console.log(`Cible  : ${cfEnv ? `Worker de l'environnement "${cfEnv}"` : "Worker de production"}\n`);

for (const key of SECRET_KEYS) {
  const value = values[key];
  if (!value) {
    console.warn(`${key} ignoré : aucune valeur dans ${varsFile}`);
    continue;
  }

  console.log(`Envoi de ${key}...`);
  const args = ["wrangler", "secret", "put", key];
  if (cfEnv) {
    args.push("--env", cfEnv);
  }

  const result = spawnSync("npx", args, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`Échec de l'envoi de ${key}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nTerminé.");
