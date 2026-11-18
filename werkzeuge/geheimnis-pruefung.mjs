/* Sucht in allen Dateien des Repos nach API-Schlüsseln, Tokens und privaten Schlüsseln: node werkzeuge/geheimnis-pruefung.mjs
   Läuft als erster Schritt von „npm test“. Schlägt Alarm, bevor ein Schlüssel auf GitHub landet.
   Schlüssel (z. B. für den 3D-Dienst oder SHOPIFY_API_SECRET) gehören nur in Umgebungsvariablen des Servers
   (Netlify: Site settings → Environment variables), nie in app/index.html oder eine andere Datei im Repo. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const MUSTER = [
  [/shp(at|ss|ca|pa)_[0-9a-f]{32}/, "Shopify-Token"],
  [/sk-(ant-|proj-)?[A-Za-z0-9_-]{20,}/, "API-Schlüssel (OpenAI/Anthropic-Stil)"],
  [/tsk_[A-Za-z0-9_-]{20,}/, "Tripo-Schlüssel"],
  [/AKIA[0-9A-Z]{16}/, "AWS-Schlüssel"],
  [/AIza[0-9A-Za-z_-]{35}/, "Google-API-Schlüssel"],
  [/gh[pousr]_[A-Za-z0-9]{36}/, "GitHub-Token"],
  [/nfp_[A-Za-z0-9]{36}/, "Netlify-Token"],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "privater Schlüssel"],
  [/(api[_-]?key|secret|token|passwort|password)["']?\s*[:=]\s*["'][A-Za-z0-9_\-+/]{24,}["']/i, "Schlüssel als fester Wert im Code"],
];
const BINAER = /\.(jpe?g|png|webp|heic|gif|glb|bin|pdf|mp4|ico|woff2?)$/i;

const dateien = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { encoding: "utf8" }).split("\n").filter(f => f && !BINAER.test(f));
const funde = [];
for (const f of dateien) {
  let text; try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
  if (text.length > 5e6) continue;
  text.split("\n").forEach((zeile, i) => {
    for (const [re, art] of MUSTER) if (re.test(zeile)) funde.push(`${f}:${i + 1}  ${art}`);
  });
}
for (const f of dateien.filter(f => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".example"))) funde.push(`${f}  .env-Datei im Repo`);
if (funde.length) { console.log("FEHLER Mögliche Geheimnisse gefunden:\n  " + funde.join("\n  ")); process.exit(1); }
console.log(`ok     keine Schlüssel oder Tokens in ${dateien.length} Dateien`);
