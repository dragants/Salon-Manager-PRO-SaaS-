/**
 * Autor / nosilac prava na Salon Manager PRO: Dragan Saric
 *
 * Lokalni desktop launcher (Electron): pokreće stack iz roditeljskog repozitorijuma.
 *
 * v0.2.0 — Poboljšanja:
 *   - requestSingleInstanceLock (dupli start → fokus postojećeg prozora)
 *   - Sandbox + navigation guard + CSP (opciono SALON_DISABLE_CSP=1)
 *   - Filtrirane env varijable (ne ceo process.env; backend i dalje čita backend/.env preko dotenv)
 *   - Log rotacija 5 MB → .old + filtriranje osetljivih podataka
 *   - Detekcija zauzetih portova
 *   - Graceful shutdown: SIGTERM / taskkill, SIGKILL posle 8 s; docker compose down pri izlasku
 *   - Health check: eksponencijalni backoff 500 ms → max 3 s
 *   - Auto-restart backend/frontend posle 3 s ako padnu (code ≠ 0), uz isQuitting
 *
 * Portovi: SALON_API_PORT / SALON_BACKEND_PORT / PORT (API); SALON_WEB_PORT / SALON_FRONTEND_PORT (web).
 */

const { app, BrowserWindow, dialog, session, shell } = require("electron");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const net = require("net");

/* ═══════════════════════════════════════════════════════════
   SINGLE INSTANCE — spreči duple pokretanje
   ═══════════════════════════════════════════════════════════ */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

/* ═══════════════════════════════════════════════════════════
   KONFIGURACIJA
   ═══════════════════════════════════════════════════════════ */
const isWin = process.platform === "win32";
const repoRoot = process.env.SALON_REPO_ROOT
  ? path.resolve(process.env.SALON_REPO_ROOT)
  : path.resolve(__dirname, "..");

function parsePort(val, fallback) {
  const n = parseInt(String(val || ""), 10);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : fallback;
}

const CONFIG = {
  apiPort: parsePort(
    process.env.SALON_API_PORT || process.env.SALON_BACKEND_PORT || process.env.PORT,
    5000
  ),
  webPort: parsePort(process.env.SALON_WEB_PORT || process.env.SALON_FRONTEND_PORT, 3000),
  nextHost: "0.0.0.0",
  apiHealthTimeout: 120_000,
  webHealthTimeout: 180_000,
  killTimeout: 8_000,
  logMaxSize: 5 * 1024 * 1024,
  restartDelay: 3_000,
  windowWidth: 1280,
  windowHeight: 840,
};

const API_HEALTH = `http://127.0.0.1:${CONFIG.apiPort}/health`;
const WEB_ORIGIN = `http://127.0.0.1:${CONFIG.webPort}`;

/** @type {import('child_process').ChildProcess | null} */
let backendProc = null;
/** @type {import('child_process').ChildProcess | null} */
let frontendProc = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;
let isQuitting = false;

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

/* ═══════════════════════════════════════════════════════════
   LOG — rotacija 5 MB + .old + sanitizacija
   ═══════════════════════════════════════════════════════════ */
const LOG_PATH = path.join(repoRoot, ".salon-launcher.log");

const SENSITIVE_PATTERNS = [
  /password\s*[:=]\s*\S+/gi,
  /DATABASE_URL\s*[:=]\s*\S+/gi,
  /postgres(ql)?:\/\/[^\s"'<>]+/gi,
  /mysql:\/\/[^\s"'<>]+/gi,
  /mongodb(\+srv)?:\/\/[^\s"'<>]+/gi,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /SECRET\s*[:=]\s*\S+/gi,
  /TOKEN\s*[:=]\s*\S+/gi,
  /API_KEY\s*[:=]\s*\S+/gi,
  /api[_-]?key\s*[:=]\s*\S+/gi,
];

function sanitizeLogLine(text) {
  let sanitized = String(text);
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[***REDACTED***]");
  }
  return sanitized;
}

function rotateLogIfNeeded() {
  try {
    if (fs.existsSync(LOG_PATH)) {
      const stat = fs.statSync(LOG_PATH);
      if (stat.size > CONFIG.logMaxSize) {
        const backup = LOG_PATH + ".old";
        if (fs.existsSync(backup)) fs.unlinkSync(backup);
        fs.renameSync(LOG_PATH, backup);
      }
    }
  } catch {
    /* ignore */
  }
}

function log(...args) {
  const raw = args.join(" ");
  const safe = sanitizeLogLine(raw);
  const ts = new Date().toISOString();
  const line = `[${ts}] [launcher] ${safe}\n`;
  try {
    rotateLogIfNeeded();
    fs.appendFileSync(LOG_PATH, line);
  } catch {
    /* ignore */
  }
  console.log(`[launcher]`, safe);
}

/* ═══════════════════════════════════════════════════════════
   safeEnv — bez celog process.env; backend koristi dotenv u server.js
   ═══════════════════════════════════════════════════════════ */
function safeEnv(extra = {}) {
  const ALLOWED_KEYS = [
    "PATH",
    "PATHEXT",
    "HOME",
    "USERPROFILE",
    "HOMEDRIVE",
    "HOMEPATH",
    "USERNAME",
    "APPDATA",
    "LOCALAPPDATA",
    "TEMP",
    "TMP",
    "LANG",
    "LC_ALL",
    "SystemRoot",
    "SYSTEMROOT",
    "windir",
    "COMSPEC",
    "SHELL",
    "TERM",
    "USER",
    "LOGNAME",
    "XDG_RUNTIME_DIR",
    "NODE_ENV",
    "NODE_OPTIONS",
    "PORT",
    "SALON_REPO_ROOT",
    "SALON_API_PORT",
    "SALON_WEB_PORT",
    "SALON_BACKEND_PORT",
    "SALON_FRONTEND_PORT",
    "NEXT_PUBLIC_API_URL",
  ];
  const env = {};
  for (const key of ALLOWED_KEYS) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key.startsWith("SALON_") && env[key] === undefined) {
      env[key] = value;
    }
  }
  return { ...env, ...extra };
}

function ensureDeps() {
  const need = [
    path.join(repoRoot, "backend", "node_modules"),
    path.join(repoRoot, "frontend", "node_modules"),
  ];
  const missing = need.filter((p) => !fs.existsSync(p));
  if (missing.length) {
    dialog.showErrorBox(
      "Nedostaju zavisnosti",
      `U korenu projekta pokreni:\n\n` +
        `  cd "${repoRoot}"\n` +
        `  npm install --prefix backend\n` +
        `  npm install --prefix frontend\n\n` +
        `(ili kopiraj node_modules sa mašine gde je već instalirano).`
    );
    app.quit();
    return false;
  }
  return true;
}

function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (err) => {
      const e = /** @type {NodeJS.ErrnoException} */ (err);
      if (e.code === "EADDRINUSE") resolve(false);
      else reject(err);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

/* ═══════════════════════════════════════════════════════════
   DOCKER
   ═══════════════════════════════════════════════════════════ */
function tryDockerUp() {
  return new Promise((resolve) => {
    const composeFile = path.join(repoRoot, "docker-compose.yml");
    if (!fs.existsSync(composeFile)) {
      log("docker-compose.yml nije pronađen — preskačem Docker.");
      return resolve();
    }
    const child = spawn("docker", ["compose", "up", "-d"], {
      cwd: repoRoot,
      shell: isWin,
      windowsHide: true,
      stdio: "ignore",
      env: safeEnv(),
    });
    child.on("error", () => {
      log("Docker nije dostupan ili nije u PATH — nastavljam (baza mora već raditi).");
      resolve();
    });
    child.on("close", (code) => {
      log(`docker compose up -d završio sa kodom ${code}`);
      resolve();
    });
  });
}

function tryDockerDown() {
  const composeFile = path.join(repoRoot, "docker-compose.yml");
  if (!fs.existsSync(composeFile)) return;
  try {
    execSync("docker compose down", {
      cwd: repoRoot,
      timeout: 15_000,
      windowsHide: true,
      stdio: "ignore",
      env: safeEnv(),
    });
    log("docker compose down — kontejneri zaustavljeni.");
  } catch {
    log("docker compose down — nije uspeo (možda Docker nije pokrenut).");
  }
}

/* ═══════════════════════════════════════════════════════════
   HEALTH — eksponencijalni backoff 500 ms → 3 s
   ═══════════════════════════════════════════════════════════ */
function waitForHttpOk(url, maxMs = 120_000) {
  const start = Date.now();
  let interval = 500;

  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", () => retry());
      req.setTimeout(3000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - start > maxMs) {
        reject(
          new Error(`Timeout čekajući ${url} (${Math.round(maxMs / 1000)}s)`)
        );
        return;
      }
      setTimeout(tick, interval);
      interval = Math.min(Math.floor(interval * 1.5), 3000);
    };

    tick();
  });
}

/* ═══════════════════════════════════════════════════════════
   CHILD — start, auto-restart, kill (SIGTERM → force posle 8 s)
   ═══════════════════════════════════════════════════════════ */
function scheduleBackendRestart() {
  if (isQuitting) return;
  log(`Backend pao — pokušavam restart za ${CONFIG.restartDelay / 1000}s...`);
  setTimeout(() => {
    if (isQuitting) return;
    try {
      startBackend();
    } catch (e) {
      log("Backend restart neuspeo:", /** @type {Error} */ (e).message);
    }
  }, CONFIG.restartDelay);
}

function scheduleFrontendRestart() {
  if (isQuitting) return;
  log(`Frontend pao — pokušavam restart za ${CONFIG.restartDelay / 1000}s...`);
  setTimeout(() => {
    if (isQuitting) return;
    try {
      startFrontend();
    } catch (e) {
      log("Frontend restart neuspeo:", /** @type {Error} */ (e).message);
    }
  }, CONFIG.restartDelay);
}

function startBackend() {
  const backendDir = path.join(repoRoot, "backend");
  const serverJs = path.join(backendDir, "src", "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(`Nema ${serverJs}`);
  }

  backendProc = spawn(isWin ? "node.exe" : "node", ["src/server.js"], {
    cwd: backendDir,
    env: safeEnv({
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: String(CONFIG.apiPort),
    }),
    windowsHide: true,
    stdio: "pipe",
  });

  backendProc.stdout?.on("data", (d) => log("[api]", d.toString().trimEnd()));
  backendProc.stderr?.on("data", (d) => log("[api:err]", d.toString().trimEnd()));
  backendProc.on("error", (e) => log("Backend spawn error:", e.message));

  backendProc.on("close", (code) => {
    log(`Backend process exited (code ${code})`);
    if (!isQuitting && code !== 0) scheduleBackendRestart();
  });
}

function startFrontend() {
  const frontendDir = path.join(repoRoot, "frontend");
  const nextBin = path.join(frontendDir, "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(nextBin)) {
    throw new Error(`Nema Next.js u ${nextBin} — npm install u frontend.`);
  }

  const built = fs.existsSync(path.join(frontendDir, ".next", "BUILD_ID"));
  const wp = String(CONFIG.webPort);
  const args = built
    ? [nextBin, "start", "--hostname", CONFIG.nextHost, "--port", wp]
    : [nextBin, "dev", "--hostname", CONFIG.nextHost, "--port", wp, "--webpack"];

  frontendProc = spawn(isWin ? "node.exe" : "node", args, {
    cwd: frontendDir,
    env: safeEnv({
      NODE_ENV: built ? "production" : "development",
      PORT: wp,
    }),
    windowsHide: true,
    stdio: "pipe",
  });

  frontendProc.stdout?.on("data", (d) => log("[web]", d.toString().trimEnd()));
  frontendProc.stderr?.on("data", (d) => log("[web:err]", d.toString().trimEnd()));
  frontendProc.on("error", (e) => log("Frontend spawn error:", e.message));

  frontendProc.on("close", (code) => {
    log(`Frontend process exited (code ${code})`);
    if (!isQuitting && code !== 0) scheduleFrontendRestart();
  });

  try {
    const lanScript = path.join(repoRoot, "scripts", "lan-ipv4.cjs");
    if (fs.existsSync(lanScript)) {
      const { printSalonLanUrls } = require(lanScript);
      log(
        `Next sluša na ${CONFIG.nextHost}:${CONFIG.webPort} — na telefonu: http://<IP>:${CONFIG.webPort}`
      );
      printSalonLanUrls(CONFIG.webPort, CONFIG.apiPort);
    } else {
      log("scripts/lan-ipv4.cjs nije pronađen — LAN URL-ovi neće biti ispisani.");
    }
  } catch (e) {
    log("LAN skripta:", String(/** @type {Error} */ (e).message || e));
  }
}

function killChild(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.killed) {
      resolve();
      return;
    }

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      resolve();
    };

    const forceKillTimer = setTimeout(() => {
      try {
        if (isWin && proc.pid) {
          spawn("taskkill", ["/PID", String(proc.pid), "/T", "/F"], {
            shell: true,
            windowsHide: true,
            stdio: "ignore",
          });
        } else if (!proc.killed) {
          proc.kill("SIGKILL");
        }
      } catch {
        /* ignore */
      }
      done();
    }, CONFIG.killTimeout);

    proc.once("close", () => {
      clearTimeout(forceKillTimer);
      done();
    });

    try {
      if (isWin && proc.pid) {
        spawn("taskkill", ["/PID", String(proc.pid), "/T"], {
          shell: true,
          windowsHide: true,
          stdio: "ignore",
        });
      } else {
        proc.kill("SIGTERM");
      }
    } catch (e) {
      log("killChild graceful:", /** @type {Error} */ (e).message);
      clearTimeout(forceKillTimer);
      done();
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   Sigurnost — CSP + navigacija (samo lokalni web origin)
   ═══════════════════════════════════════════════════════════ */
function isAllowedNavigationUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const okHost = u.hostname === "127.0.0.1" || u.hostname === "localhost";
    if (!okHost) return false;
    const p = u.port || (u.protocol === "http:" ? "80" : "443");
    return String(CONFIG.webPort) === p;
  } catch {
    return false;
  }
}

function setupSecurity() {
  if (process.env.SALON_DISABLE_CSP === "1") {
    log("CSP onemogućen (SALON_DISABLE_CSP=1).");
    return;
  }

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith(WEB_ORIGIN)) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }
    const api = `http://127.0.0.1:${CONFIG.apiPort}`;
    const web = `http://127.0.0.1:${CONFIG.webPort}`;
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${web} ${api}`,
      "font-src 'self' data:",
      `connect-src 'self' ${web} ${api} http://localhost:${CONFIG.apiPort} ws: wss:`,
      "frame-ancestors 'none'",
    ].join("; ");
    const responseHeaders = { ...details.responseHeaders };
    const keys = Object.keys(responseHeaders);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === "content-security-policy") {
        delete responseHeaders[keys[i]];
        break;
      }
    }
    responseHeaders["Content-Security-Policy"] = [csp];
    callback({ responseHeaders });
  });
}

function attachWindowGuards(win) {
  win.webContents.on("will-navigate", (event, url) => {
    if (isAllowedNavigationUrl(url)) return;
    event.preventDefault();
    shell.openExternal(url).catch(() => {});
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigationUrl(url)) return { action: "allow" };
    shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });
}

/* ═══════════════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════════════ */
async function bootstrap() {
  if (!ensureDeps()) return;

  log("=== Salon Manager PRO Launcher v0.2.0 ===");
  log("Repo root:", repoRoot);
  log(
    `Portovi: API=${CONFIG.apiPort}, Web=${CONFIG.webPort} (SALON_API_PORT / SALON_BACKEND_PORT / SALON_WEB_PORT / SALON_FRONTEND_PORT)`
  );

  const apiPortFree = await isPortFree(CONFIG.apiPort);
  const webPortFree = await isPortFree(CONFIG.webPort);

  if (!apiPortFree || !webPortFree) {
    const busy = [];
    if (!apiPortFree) busy.push(`${CONFIG.apiPort} (API)`);
    if (!webPortFree) busy.push(`${CONFIG.webPort} (Web)`);

    dialog.showErrorBox(
      "Portovi su zauzeti",
      `Sledeći portovi su već u upotrebi: ${busy.join(", ")}.\n\n` +
        `Zatvori aplikaciju koja ih koristi, ili podesi npr.:\n` +
        `  SALON_API_PORT=5001\n  SALON_WEB_PORT=3001\n` +
        `  (ili SALON_BACKEND_PORT / SALON_FRONTEND_PORT)`
    );
    app.quit();
    return;
  }

  setupSecurity();

  await tryDockerUp();
  await new Promise((r) => setTimeout(r, 1500));

  startBackend();
  try {
    await waitForHttpOk(API_HEALTH, CONFIG.apiHealthTimeout);
    log("Backend dostupan.");
  } catch (e) {
    dialog.showErrorBox(
      "API ne odgovara",
      `Backend na portu ${CONFIG.apiPort} nije dostupan.\n\n` +
        `Proveri da li je PostgreSQL pokrenut (npr. docker compose up -d u:\n${repoRoot})\n\n` +
        String(/** @type {Error} */ (e).message || e)
    );
    await killChild(backendProc);
    app.quit();
    return;
  }

  startFrontend();
  try {
    await waitForHttpOk(WEB_ORIGIN, CONFIG.webHealthTimeout);
    log("Frontend dostupan.");
  } catch (e) {
    dialog.showErrorBox(
      "Frontend ne odgovara",
      `Next na portu ${CONFIG.webPort} nije dostupan.\n\n` +
        `Ako prvi put pokrećeš na ovom PC-u, u folderu frontend uradi:\n` +
        `  npm install\n  npm run build\n\n` +
        String(/** @type {Error} */ (e).message || e)
    );
    await killChild(frontendProc);
    await killChild(backendProc);
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: CONFIG.windowWidth,
    height: CONFIG.windowHeight,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
    },
  });

  attachWindowGuards(mainWindow);

  await mainWindow.loadURL(WEB_ORIGIN);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* ═══════════════════════════════════════════════════════════
   GRACEFUL SHUTDOWN
   ═══════════════════════════════════════════════════════════ */
async function cleanup() {
  if (isQuitting) return;
  isQuitting = true;

  log("Gasim child procese...");
  await Promise.all([killChild(frontendProc), killChild(backendProc)]);

  if (process.env.SALON_DOCKER_DOWN !== "0") {
    tryDockerDown();
  }

  log("Cleanup završen.");
}

/* ═══════════════════════════════════════════════════════════
   APP LIFECYCLE
   ═══════════════════════════════════════════════════════════ */
app.whenReady().then(() => {
  bootstrap().catch((err) => {
    log("bootstrap error:", err);
    dialog.showErrorBox("Launcher", String(err.message || err));
    app.quit();
  });
});

app.on("window-all-closed", async () => {
  await cleanup();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    await cleanup();
    app.quit();
  }
});
