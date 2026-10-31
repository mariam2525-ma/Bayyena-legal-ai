// Validates the 8 n8n workflow exports: valid JSON, has nodes/connections, every
// webhook node declares a path, pinData is empty, and no raw JWT or personal email is committed.
const { readdirSync, readFileSync } = require("fs");
const JWT = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;
const EMAIL_LEAK =
  /\b[A-Z0-9._%+-]+@(?:gmail|googlemail|yahoo|outlook|hotmail|live|icloud|me|protonmail|proton|aol|zoho)\.(?:com|co\.uk|me|io)\b/i;
let failed = false;
const files = readdirSync("n8n")
  .filter((x) => x.endsWith(".json"))
  .sort();
if (files.length !== 8) {
  console.error("✗ Expected 8 workflows in n8n/, found " + files.length);
  failed = true;
}
for (const f of files) {
  const raw = readFileSync("n8n/" + f, "utf8");
  try {
    const wf = JSON.parse(raw);
    if (!Array.isArray(wf.nodes) || !wf.connections)
      throw new Error("missing nodes/connections");
    for (const n of wf.nodes)
      if (/\.webhook$/.test(n.type) && !n.parameters.path)
        throw new Error("webhook without path: " + n.name);
    if (JWT.test(raw))
      throw new Error(
        "contains a JWT/session token — redact before committing",
      );
    if (EMAIL_LEAK.test(raw))
      throw new Error(
        "contains a personal email address — redact before committing",
      );
    if (wf.pinData && Object.keys(wf.pinData).length > 0)
      throw new Error("contains non-empty pinData — clear before committing");
    console.log("✓ " + f + " (" + wf.nodes.length + " nodes)");
  } catch (e) {
    failed = true;
    console.error("✗ " + f + ": " + e.message);
  }
}
process.exit(failed ? 1 : 0);
