// Syntax-checks every JavaScript file of the frontend (fails the build on the first error).
const { readdirSync } = require("fs");
const { spawnSync } = require("child_process");
const files = readdirSync("js").filter((f) => f.endsWith(".js")).map((f) => "js/" + f);
let failed = false;
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { failed = true; console.error("✗ " + f + "\n" + r.stderr); }
  else console.log("✓ " + f);
}
process.exit(failed ? 1 : 0);
