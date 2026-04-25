/* eslint-disable no-console */
const { execSync } = require("node:child_process");

function uniq(arr) {
  return [...new Set(arr)];
}

function getPortsFromArgs() {
  const ports = process.argv
    .slice(2)
    .map((x) => Number.parseInt(String(x), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return uniq(ports);
}

function killWindowsByPorts(ports) {
  for (const port of ports) {
    const ps = [
      "$p=(Get-NetTCPConnection -LocalPort " + port + " -ErrorAction SilentlyContinue |",
      " Where-Object {$_.State -eq 'Listen'} |",
      " Select-Object -ExpandProperty OwningProcess);",
      " if($p){$p | Sort-Object -Unique | ForEach-Object {",
      "  try{ taskkill /PID $_ /F | Out-Null } catch {}",
      " }}",
    ].join("");

    try {
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, {
        stdio: "ignore",
      });
    } catch {
      // ignore
    }
  }
}

function killUnixByPorts(ports) {
  for (const port of ports) {
    try {
      const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString("utf8")
        .trim();
      if (!out) continue;
      const pids = uniq(out.split(/\s+/).filter(Boolean));
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        } catch {
          // ignore
        }
      }
    } catch {
      // lsof not installed or nothing is listening; ignore
    }
  }
}

function main() {
  const ports = getPortsFromArgs();
  if (ports.length === 0) {
    console.log("[free-ports] No ports provided.");
    return;
  }

  const platform = process.platform;
  if (platform === "win32") {
    killWindowsByPorts(ports);
    return;
  }
  killUnixByPorts(ports);
}

main();

