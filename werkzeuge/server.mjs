/* Lokaler Server wie auf Netlify: liefert die Dateien des Repos, /api/holen (Link einfügen) und /api/hosen (Sammlung).
   node werkzeuge/server.mjs [Port]   → http://localhost:8888/app/index.html
   Hinter einem Proxy (Cloud-Umgebung): NODE_USE_ENV_PROXY=1 node werkzeuge/server.mjs
   Für Tests: HOLEN_LOKAL=1 erlaubt Links auf diesen Rechner (sonst gesperrt). */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import holen from "../netlify/functions/holen.mjs";
import hosen from "../netlify/functions/hosen.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Sammlung der Hosen (wie Netlify Blobs) lokal in einem Ordner, der nicht ins Repo kommt
if (!process.env.HOSEN_DIR) process.env.HOSEN_DIR = path.join(ROOT, ".hosen-lokal");
const TYP = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".mjs": "application/javascript", ".json": "application/json",
  ".css": "text/css", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif",
  ".wasm": "application/wasm", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".heic": "image/heic", ".task": "application/octet-stream", ".tflite": "application/octet-stream" };

export function starte(port = 8888) {
  const srv = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (u.pathname === "/api/hosen") {
        const body = ["PUT", "POST"].includes(req.method) ? await new Promise((ok, no) => { const t = []; req.on("data", d => t.push(d)); req.on("end", () => ok(Buffer.concat(t))); req.on("error", no); }) : undefined;
        const r = await hosen(new Request(u.href, { method: req.method, headers: req.headers, body }));
        res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      if (u.pathname === "/api/holen") {
        const r = await holen(new Request(u.href, { headers: req.headers }));
        res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      let p = path.normalize(path.join(ROOT, decodeURIComponent(u.pathname)));
      // nur innerhalb des Repos (ein Nachbarordner wie „Brand-Scan-alt“ fängt auch mit ROOT an), nichts aus .git
      if ((p !== ROOT && !p.startsWith(ROOT + path.sep)) || p.split(path.sep).includes(".git")) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
      if (!fs.existsSync(p)) { res.writeHead(404); res.end("nicht gefunden"); return; }
      // Testseiten können einen Shop-Fehler nachstellen: Dateien mit .403 im Namen antworten mit 403
      const status = /\.403\./.test(p) ? 403 : 200;
      res.writeHead(status, { "content-type": TYP[path.extname(p).toLowerCase()] || "application/octet-stream" });
      fs.createReadStream(p).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e && e.message)); }
  });
  // nur auf diesem Rechner erreichbar (sonst könnte jeder im WLAN die Dateien des Repos lesen)
  return new Promise(ok => srv.listen(port, "localhost", () => ok(srv)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = +process.argv[2] || 8888;
  await starte(port);
  console.log(`http://localhost:${port}/app/index.html`);
}
