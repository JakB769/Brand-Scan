// Nach jedem erfolgreichen Netlify-Deploy: alle Dateien der App (avatar/koerper.js usw.) auf der eben veröffentlichten Adresse prüfen.
// Fehlt eine Datei oder ist sie veraltet, wird der Deploy im Netlify-Protokoll rot markiert (werkzeuge/live-pruefung.mjs).
import { execFileSync } from 'child_process';
export const onSuccess = async ({ utils }) => {
  const url = process.env.CONTEXT === 'production' ? process.env.URL : (process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL);
  if (!url) return console.log('live-pruefung: keine Adresse, übersprungen');
  await new Promise(r => setTimeout(r, 5000));   // CDN kurz nachziehen lassen
  try { execFileSync(process.execPath, ['werkzeuge/live-pruefung.mjs', url], { stdio: 'inherit' }); }
  catch { utils.build.failPlugin(`Live-Prüfung fehlgeschlagen: auf ${url} fehlen Dateien oder sind veraltet (Protokoll oben)`); }
};
