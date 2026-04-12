const cron = require("node-cron");
const pool = require("../config/db");
const {
  fetchDueReminders,
  fetchDueDayBeforeRemindersForOrg,
  processReminderRow,
} = require("../modules/appointments/appointments.notify");
const { localHourMinute } = require("../utils/timezone");

const TWO_HOUR_WINDOW = {
  start: "1 hour 35 minutes",
  end: "2 hours 25 minutes",
};

const TWENTY_FOUR_HOUR_WINDOW = {
  start: "23 hours 35 minutes",
  end: "24 hours 25 minutes",
};

function clampHour(n) {
  if (Number.isNaN(n) || n < 0 || n > 23) {
    return 17;
  }
  return n;
}

function defaultDayBeforeHour() {
  return clampHour(parseInt(process.env.REMINDER_DAY_BEFORE_HOUR || "17", 10));
}

function appTimeZone() {
  return process.env.APP_TIMEZONE || "Europe/Belgrade";
}

function orgEffectiveTimeZone(settings) {
  const s = settings && typeof settings === "object" ? settings : {};
  const raw = s.timezone;
  if (raw && String(raw).trim()) {
    return String(raw).trim();
  }
  return appTimeZone();
}

function orgTargetDayBeforeHour(settings) {
  const r = settings?.reminders || {};
  const raw = r.dayBeforeHour;
  if (raw != null && raw !== "") {
    const n = parseInt(String(raw), 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 23) {
      return n;
    }
  }
  return defaultDayBeforeHour();
}

async function runDayBeforeRemindersPerOrganization() {
  const orgRes = await pool.query(`SELECT id, settings FROM organizations`);
  for (const org of orgRes.rows) {
    const settings = org.settings || {};
    const reminders = settings.reminders || {};
    if (reminders.dayBefore === false) {
      continue;
    }

    const tz = orgEffectiveTimeZone(settings);
    const hm = localHourMinute(tz);
    if (hm === null) {
      console.error("Day-before: invalid timezone for org", org.id, tz);
      continue;
    }
    if (hm.minute !== 0) {
      continue;
    }

    const targetHour = orgTargetDayBeforeHour(settings);
    if (hm.hour !== targetHour) {
      continue;
    }

    let rows;
    try {
      rows = await fetchDueDayBeforeRemindersForOrg(org.id, tz);
    } catch (e) {
      console.error(
        `Day-before fetch failed for org ${org.id}`,
        e
      );
      continue;
    }

    for (const row of rows) {
      try {
        await processReminderRow(
          {
            ...row,
            day_before_send_hour: targetHour,
            org_timezone: tz,
          },
          "reminder_day_before"
        );
      } catch (e) {
        console.error(
          `Reminder reminder_day_before failed for appointment ${row.id}`,
          e
        );
      }
    }
  }
}

async function runTwoHourReminders() {
  const rows = await fetchDueReminders(
    "reminder_2h",
    TWO_HOUR_WINDOW.start,
    TWO_HOUR_WINDOW.end,
    "two_hour"
  );
  for (const row of rows) {
    try {
      await processReminderRow(row, "reminder_2h");
    } catch (e) {
      console.error(`Reminder reminder_2h failed for appointment ${row.id}`, e);
    }
  }
}

async function runTwentyFourHourReminders() {
  const rows = await fetchDueReminders(
    "reminder_24h",
    TWENTY_FOUR_HOUR_WINDOW.start,
    TWENTY_FOUR_HOUR_WINDOW.end,
    "twenty_four_hour_custom"
  );
  for (const row of rows) {
    try {
      await processReminderRow(row, "reminder_24h");
    } catch (e) {
      console.error(
        `Reminder reminder_24h failed for appointment ${row.id}`,
        e
      );
    }
  }
}

function startRemindersCron() {
  if (process.env.REMINDERS_ENABLED === "false") {
    console.log("Reminders cron disabled (REMINDERS_ENABLED=false)");
    return;
  }

  cron.schedule("* * * * *", async () => {
    try {
      await runDayBeforeRemindersPerOrganization();
    } catch (e) {
      console.error("Day-before reminder cron failed", e);
    }
  });

  cron.schedule("*/5 * * * *", async () => {
    try {
      await runTwoHourReminders();
      await runTwentyFourHourReminders();
    } catch (e) {
      console.error("2h / 24h reminder cron tick failed", e);
    }
  });

  console.log(
    "Reminders: day-before every minute (per-org TZ + hour); ~2h + ~24h every 5 min. Channels: SMS (Twilio per org/env), WhatsApp (Meta .env), e-mail (SMTP) per org reminders.*"
  );
}

module.exports = {
  startRemindersCron,
  runDayBeforeRemindersPerOrganization,
  runTwoHourReminders,
  runTwentyFourHourReminders,
};
