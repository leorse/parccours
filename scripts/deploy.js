// Déploiement manuel des Workers (les builds automatiques git sont désactivés).
//
//   node scripts/deploy.js dev    -> Worker parccours-dev
//   node scripts/deploy.js prod   -> Worker parccours (garde-fous + confirmation)
//
// Lancé via deploy-dev.bat / deploy-prod.bat.

const { execFileSync, spawnSync } = require("child_process");
const readline = require("readline");
const crypto = require("crypto");

// Alphabet sans caractères ambigus (0/O, 1/I/L) : le code est retapé à la main.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const PROD_BRANCH = "main";

function fail(message) {
  console.error(`\nDéploiement annulé : ${message}\n`);
  process.exit(1);
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    fail(`la commande "${command} ${args.join(" ")}" a échoué`);
  }
}

function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function checkProdGuards() {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== PROD_BRANCH) {
    fail(`la prod ne se déploie que depuis "${PROD_BRANCH}" (branche courante : "${branch}")`);
  }

  const dirty = git("status", "--porcelain");
  if (dirty) {
    console.error("\nFichiers modifiés ou non suivis :");
    console.error(dirty);
    fail("le working tree n'est pas propre");
  }

  // Sans ce fetch, la comparaison se ferait avec un origin/main périmé
  // et le garde-fou ne servirait à rien.
  console.log(`Récupération de origin/${PROD_BRANCH}...`);
  run("git", ["fetch", "origin", PROD_BRANCH]);

  const local = git("rev-parse", "HEAD");
  const remote = git("rev-parse", `origin/${PROD_BRANCH}`);
  if (local !== remote) {
    fail(`la branche locale diffère de origin/${PROD_BRANCH} (commits non poussés ou en retard)`);
  }

  const lastCommit = git("log", "-1", "--pretty=format:%h  %s  (%an, %ar)");
  const code = generateCode();

  console.log("\n─────────────────────────────────────────────");
  console.log("  DÉPLOIEMENT EN PRODUCTION");
  console.log("─────────────────────────────────────────────");
  console.log(`  Worker  : parccours`);
  console.log(`  Branche : ${branch}`);
  console.log(`  Commit  : ${lastCommit}`);
  console.log("─────────────────────────────────────────────");

  const answer = await ask(`\nPour confirmer, saisis ce code : ${code}\n> `);
  if (answer.trim().toUpperCase() !== code) {
    fail("code de confirmation incorrect");
  }
}

async function main() {
  const target = process.argv[2];

  if (target !== "prod" && target !== "dev") {
    console.error("Usage : node scripts/deploy.js <prod|dev>");
    process.exit(1);
  }

  if (target === "prod") {
    await checkProdGuards();
  } else {
    console.log("\nDéploiement sur le Worker de dev (parccours-dev).\n");
  }

  run("npx", ["opennextjs-cloudflare", "build"]);

  // Sans --env, wrangler cible le Worker racine, c'est-à-dire la PROD.
  const deployArgs = ["wrangler", "deploy"];
  if (target === "dev") {
    deployArgs.push("--env", "dev");
  }
  run("npx", deployArgs);

  console.log(`\nDéploiement ${target} terminé.\n`);
}

main();
