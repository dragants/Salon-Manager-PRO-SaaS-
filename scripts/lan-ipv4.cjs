const os = require("os");

/** @returns {string[]} */
function getLanIpv4Addresses() {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      const v4 = iface.family === "IPv4" || iface.family === 4;
      if (!v4 || iface.internal) continue;
      const a = iface.address;
      if (a.startsWith("169.254.")) continue;
      ips.push(a);
    }
  }
  return ips;
}

/**
 * @param {number} [webPort]
 * @param {number} [apiPort]
 */
function printSalonLanUrls(webPort = 3000, apiPort = 5000) {
  const ips = getLanIpv4Addresses();
  console.log("");
  console.log(
    "[LAN] Na telefonu/drugom PC-u otvori URL sa IP ispod — u browseru NE koristi 0.0.0.0."
  );
  if (ips.length === 0) {
    console.log(
      "[LAN] Nije nađena javna LAN IPv4 (Ethernet/Wi‑Fi). Proveri konekciju ili `ipconfig`."
    );
    console.log("");
    return;
  }
  for (const ip of ips) {
    console.log(
      `[LAN] Web http://${ip}:${webPort}   |   API http://${ip}:${apiPort}/health`
    );
  }
  console.log("");
}

module.exports = { getLanIpv4Addresses, printSalonLanUrls };

if (require.main === module) {
  printSalonLanUrls();
}
