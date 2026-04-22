/**
 * `next start` mora imati unapred urađen `next build` (.next/...).
 * Ako fali, jednom automatski pokreće build da `npm start` ne padne sa ENOENT.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const frontendDir = path.join(__dirname, "..", "frontend");
const manifest = path.join(frontendDir, ".next", "prerender-manifest.json");

if (fs.existsSync(manifest)) {
  process.exit(0);
}

console.log(
  "\n[frontend] Nema production builda (folder .next). Pokrećem `npm run build` u frontend/ …\n" +
    "    (Kasnije: ručno `cd frontend && npm run build` pre `npm start`, ili za razvoj koristi `npm run dev`.)\n"
);
const r = spawnSync("npm", ["run", "build"], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});
if (r.error) {
  console.error(r.error);
  process.exit(1);
}
process.exit(r.status === 0 || r.status === null ? 0 : r.status);
