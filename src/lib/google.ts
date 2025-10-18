import fs from "node:fs";
import path from "node:path";
import { OAuth2Client } from "google-auth-library";

/* ストレージ */
const VAR_DIR = path.join(process.cwd(), "var", "config");
const GOOGLE_CONF = path.join(VAR_DIR, "google.json");

function readJSON<T=any>(p:string, fb:T):T {
  try { return JSON.parse(fs.readFileSync(p,"utf-8")); } catch { return fb; }
}
function writeJSON(p:string, v:any) {
  fs.mkdirSync(path.dirname(p), {recursive:true});
  fs.writeFileSync(p, JSON.stringify(v, null, 2), "utf-8");
}

/* OAuth2 client */
export function getOAuth(): OAuth2Client {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
  const cfg = readJSON(GOOGLE_CONF, {});
  if (cfg?.tokens?.refresh_token) client.setCredentials(cfg.tokens);
  return client;
}

export function saveTokens(tokens:any) {
  const cfg = readJSON(GOOGLE_CONF, {});
  cfg.tokens = { ...cfg.tokens, ...tokens };
  writeJSON(GOOGLE_CONF, cfg);
}

export function setGaProperty(propertyId:string) {
  const cfg = readJSON(GOOGLE_CONF, {});
  cfg.ga = { ...(cfg.ga||{}), propertyId };
  writeJSON(GOOGLE_CONF, cfg);
}
export function setGscSite(siteUrl:string) {
  const cfg = readJSON(GOOGLE_CONF, {});
  cfg.gsc = { ...(cfg.gsc||{}), siteUrl };
  writeJSON(GOOGLE_CONF, cfg);
}

export function getGoogleConfig() {
  return readJSON(GOOGLE_CONF, {});
}