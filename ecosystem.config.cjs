/**
 * PM2 production config for Salon Manager PRO (SaaS).
 *
 * Start:
 *   pm2 start ecosystem.config.cjs
 *
 * Notes:
 * - `backend` reads env from backend/.env via dotenv().
 * - `frontend` is Next.js; run `npm run build --prefix frontend` before starting.
 */

const path = require("path");

const ROOT = __dirname;
const LOG_DIR = path.join(ROOT, "logs");

const isWin = process.platform === "win32";
// On Windows PM2 can't reliably spawn `npm` directly → use `cmd /c ...`.
const baseRunner = isWin
  ? { script: "cmd", interpreter: "none" }
  : { script: "npm", interpreter: "none" };

module.exports = {
  apps: [
    {
      name: "salon-api",
      cwd: path.join(ROOT, "backend"),
      ...baseRunner,
      args: isWin ? "/c npm start" : "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
        // PORT/HOST/JWT_SECRET/DATABASE_URL/etc come from backend/.env
      },
      error_file: path.join(LOG_DIR, "api.error.log"),
      out_file: path.join(LOG_DIR, "api.out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "salon-web",
      cwd: path.join(ROOT, "frontend"),
      ...baseRunner,
      args: isWin ? "/c npm start" : "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "650M",
      env: {
        NODE_ENV: "production",
        // NEXT_PUBLIC_API_URL should be set in frontend env (.env.production or server env)
      },
      error_file: path.join(LOG_DIR, "web.error.log"),
      out_file: path.join(LOG_DIR, "web.out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};

