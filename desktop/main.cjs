/**
 * Autor / nosilac prava na Salon Manager PRO: Dragan Saric
 *
 * Lokalni desktop launcher (Electron): pokreće stack iz roditeljskog repozitorijuma.
 *
 * Preduslov na drugom PC-u: Node.js LTS, Docker Desktop (za PostgreSQL iz docker-compose),
 * u korenu repoa: npm install u backend i frontend, docker compose up bar jednom,
 * po želji: npm run build u frontend (inače koristi se `next dev`).
 *
 * Pokretanje: iz ovog foldera `npm start`, ili iz korena `npm run desktop`.
 * Napomena: spakovan jedan .exe preko electron-builder NE sadrži ceo projekat — za prenos
 * i dalje treba ceo folder repozitorijuma + node_modules; .exe je samo „prozorčic“ koji pali servere.
 */

const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const isWin = process.platform === "win32";
const repoRoot = process.env.SALON_REPO_ROOT
  ? path.resolve(process.env.SALON_REPO_ROOT)
  : path.resolve(__dirname, "..");

const API_HEALTH = "http://127.0.0.1:5000/health";
const WEB_ORIGIN = "http://127.0.0.1:3000";

/** @type {import('child_process').ChildProcess | null} */
let backendProc = null;
/** @type {import('child_process').ChildProcess | null} */
let frontendProc = null;

function log(...args) {
  const line = `[launcher] ${args.join(" ")}\n`;
  try {
    fs.appendFileSync(path.join(repoRoot, ".salon-launcher.log"), line);
  } catch {
    /* ignore */
  }
  console.log(...args);
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

function waitForHttpOk(url, maxMs = 120_000, intervalMs = 400) {
  const start = Date.now();
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
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > maxMs) {
        reject(new Error(`Timeout čekajući ${url}`));
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

function startBackend() {
  const backendDir = path.join(repoRoot, "backend");
  const serverJs = path.join(backendDir, "src", "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(`Nema ${serverJs}`);
  }
  backendProc = spawn(isWin ? "node.exe" : "node", ["src/server.js"], {
    cwd: backendDir,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "development" },
    windowsHide: true,
    stdio: "pipe",
  });
  backendProc.stdout?.on("data", (d) => log("[api]", d.toString().trimEnd()));
  backendProc.stderr?.on("data", (d) => log("[api err]", d.toString().trimEnd()));
  backendProc.on("error", (e) => log("Backend spawn error:", e.message));
  backendProc.on("close", (code) => log("Backend process exited", code));
}

function startFrontend() {
  const frontendDir = path.join(repoRoot, "frontend");
  const nextBin = path.join(frontendDir, "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(nextBin)) {
    throw new Error(`Nema Next.js u ${nextBin} — npm install u frontend.`);
  }
  const built = fs.existsSync(path.join(frontendDir, ".next", "BUILD_ID"));
  const args = built
    ? [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3000"]
    : [
        nextBin,
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3000",
        "--webpack",
      ];
  frontendProc = spawn(isWin ? "node.exe" : "node", args, {
    cwd: frontendDir,
    env: {
      ...process.env,
      NODE_ENV: built ? "production" : "development",
    },
    windowsHide: true,
    stdio: "pipe",
  });
  frontendProc.stdout?.on("data", (d) => log("[web]", d.toString().trimEnd()));
  frontendProc.stderr?.on("data", (d) => log("[web err]", d.toString().trimEnd()));
  frontendProc.on("error", (e) => log("Frontend spawn error:", e.message));
  frontendProc.on("close", (code) => log("Frontend process exited", code));
}

function killChild(proc) {
  if (!proc || proc.killed) return;
  try {
    if (isWin && proc.pid) {
      spawn("taskkill", ["/PID", String(proc.pid), "/T", "/F"], {
        shell: true,
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      proc.kill("SIGTERM");
    }
  } catch (e) {
    log("killChild:", e.message);
  }
}

async function bootstrap() {
  if (!ensureDeps()) return;

  log("Repo root:", repoRoot);
  await tryDockerUp();
  await new Promise((r) => setTimeout(r, 1500));

  startBackend();
  try {
    await waitForHttpOk(API_HEALTH, 120_000);
  } catch (e) {
    dialog.showErrorBox(
      "API ne odgovara",
      `Backend na5000 nije dostupan.\n\n` +
        `Proveri da li je PostgreSQL pokrenut (npr. docker compose up -d u:\n${repoRoot})\n\n` +
        String(e.message)
    );
    killChild(backendProc);
    app.quit();
    return;
  }

  startFrontend();
  try {
    await waitForHttpOk(WEB_ORIGIN, 180_000);
  } catch (e) {
    dialog.showErrorBox(
      "Frontend ne odgovara",
      `Next na 3000 nije dostupan.\n\n` +
        `Ako prvi put pokrećeš na ovom PC-u, u folderu frontend uradi:\n` +
        `  npm install\n  npm run build\n\n` +
        String(e.message)
    );
    killChild(frontendProc);
    killChild(backendProc);
    app.quit();
    return;
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await win.loadURL(WEB_ORIGIN);
}

app.whenReady().then(() => {
  bootstrap().catch((err) => {
    log("bootstrap error:", err);
    dialog.showErrorBox("Launcher", String(err.message || err));
    app.quit();
  });
});

app.on("window-all-closed", () => {
  killChild(frontendProc);
  killChild(backendProc);
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  killChild(frontendProc);
  killChild(backendProc);
});
