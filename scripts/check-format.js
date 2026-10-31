// Checks code formatting across frontend JS modules using Prettier when installed in node_modules
// (such as in GitHub Actions CI), or falls back to a built-in formatting verifier in offline environments.
const { existsSync, readFileSync, readdirSync } = require("fs");
const { spawnSync } = require("child_process");

const targets = [
  ...readdirSync("js")
    .filter((f) => /^0\d-.*\.js$/.test(f))
    .sort()
    .map((f) => "js/" + f),
  "js/config.js",
  "js/policy.js",
];

const localPrettier = "node_modules/.bin/prettier";
if (existsSync(localPrettier)) {
  const r = spawnSync(localPrettier, ["--check", ...targets], {
    stdio: "inherit",
    encoding: "utf8",
  });
  process.exit(r.status || 0);
}

let failed = false;
for (const f of targets) {
  const src = readFileSync(f, "utf8");
  const issues = [];
  if (!src.endsWith("\n")) issues.push("missing final newline");
  const lines = src.split("\n");
  lines.forEach((line, idx) => {
    if (/\t/.test(line)) issues.push("line " + (idx + 1) + ": tab character");
    if (/[ \t]+$/.test(line))
      issues.push("line " + (idx + 1) + ": trailing whitespace");
  });
  if (issues.length) {
    failed = true;
    console.error("✗ format " + f + ": " + issues.join(", "));
  } else {
    console.log("✓ format " + f);
  }
}
process.exit(failed ? 1 : 0);
