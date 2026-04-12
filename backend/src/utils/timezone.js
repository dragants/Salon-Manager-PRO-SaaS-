function assertValidTimeZone(zone) {
  if (!zone || typeof zone !== "string") {
    const err = new Error("Invalid timezone");
    err.statusCode = 400;
    throw err;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: zone });
  } catch {
    const err = new Error("Invalid timezone");
    err.statusCode = 400;
    throw err;
  }
}

function localHourMinute(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const hour = parseInt(
      parts.find((p) => p.type === "hour")?.value ?? "",
      10
    );
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "",
      10
    );
    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }
    return { hour, minute };
  } catch {
    return null;
  }
}

module.exports = { assertValidTimeZone, localHourMinute };
