const {
  subscribe,
  unsubscribe,
} = require("../../realtime/appointmentEvents");

function stream(req, res) {
  const orgId = req.user.orgId;

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write(": ok\n\n");

  subscribe(orgId, res);

  const ping = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(ping);
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(ping);
    unsubscribe(orgId, res);
  };

  req.on("close", cleanup);
  res.on("close", cleanup);
}

module.exports = { stream };
