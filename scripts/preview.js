// Preview local (Wrangler dev + bindings Cloudflare) d'un des deux environnements.
//
//   node scripts/preview.js prod   -> bindings du Worker racine (parccours), équivalent à `npm run preview`
//   node scripts/preview.js dev    -> bindings du Worker parccours-dev (--env dev)
//
// Sans cet --env, `opennextjs-cloudflare preview` cible toujours les bindings
// de la racine (donc la prod) même quand on veut prévisualiser le dev.

const { spawnSync } = require("child_process");

function run(command, args, extraEnv) {
  console.log(`\n> ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const target = process.argv[2];

  if (target !== "prod" && target !== "dev") {
    console.error("Usage : node scripts/preview.js <prod|dev>");
    process.exit(1);
  }

  run("npx", ["opennextjs-cloudflare", "build"], { APP_ENV: target });

  const previewArgs = ["opennextjs-cloudflare", "preview"];
  if (target === "dev") {
    previewArgs.push("--env", "dev");
  }
  run("npx", previewArgs);
}

main();
