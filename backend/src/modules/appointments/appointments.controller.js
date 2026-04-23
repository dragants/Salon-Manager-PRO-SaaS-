const service = require("./appointments.service");
const { sendBookingNotifications } = require("./appointments.notify");
const { yyyyMmDdInTimeZone } = require("../../utils/dateTz");
const {
  emitAppointmentChange,
} = require("../../realtime/appointmentEvents");

async function getAll(req, res) {
  let { day, from, to, timezone } = req.validatedQuery;
  if (day === "today") {
    const resolved = yyyyMmDdInTimeZone(timezone);
    if (!resolved) {
      return res.status(400).json({ error: "Could not resolve today for timezone" });
    }
    day = resolved;
  }
  let data;
  const onlyOwnStaffUserId =
    req.onlyOwnStaffUserId != null ? Number(req.onlyOwnStaffUserId) : null;
  if (from && to) {
    data = await service.getByDateRange(
      req.user.orgId,
      from,
      to,
      timezone,
      onlyOwnStaffUserId
    );
  } else if (day) {
    data = await service.getByDay(
      req.user.orgId,
      day,
      timezone,
      onlyOwnStaffUserId
    );
  } else {
    data = await service.getAll(req.user.orgId, onlyOwnStaffUserId);
  }
  res.json(data);
}

async function getById(req, res) {
  const data = await service.getById(req.validatedParams.id, req.user.orgId);
  res.json(data);
}

async function create(req, res) {
  const sendSms = req.body.send_sms === true;
  const sendWhatsApp = req.body.send_whatsapp === true;
  const sendEmail = req.body.send_email === true;

  const row = await service.create(req.body, req.user.orgId);

  const notifications = await sendBookingNotifications(req.user.orgId, row, {
    sendSms,
    sendWhatsApp,
    sendEmail,
  });

  emitAppointmentChange(req.user.orgId, {
    type: "appointments",
    event: "NEW_APPOINTMENT",
    payload: row,
  });

  res.status(201).json({ appointment: row, notifications });
}

async function update(req, res) {
  const { id } = req.validatedParams;

  // Dobavi stari status pre update-a (za detekciju prelaza na completed)
  let oldStatus = null;
  if (req.body.status === "completed") {
    try {
      const existing = await service.getById(id, req.user.orgId);
      oldStatus = existing.status;
    } catch (_) {
      // pass — getById baca 404 ako ne postoji, update će isto
    }
  }

  const data = await service.update(id, req.body, req.user.orgId);

  // Automatska potrošnja materijala kada se termin prvi put označi kao završen
  if (
    req.body.status === "completed" &&
    oldStatus !== "completed" &&
    data.service_id
  ) {
    try {
      const suppliesService = require("../supplies/supplies.service");
      await suppliesService.autoConsumeForAppointment(
        req.user.orgId,
        req.user.userId,
        data.id,
        data.service_id
      );
    } catch (e) {
      // Ne blokiraj update ako auto-consume ne uspe
      console.warn("[auto-consume] Greška pri automatskoj potrošnji:", e.message);
    }
  }

  emitAppointmentChange(req.user.orgId, {
    type: "appointments",
    event: "UPDATE_APPOINTMENT",
    payload: data,
  });
  res.json(data);
}

async function remove(req, res) {
  const id = req.validatedParams.id;
  await service.remove(id, req.user.orgId, req.user.userId);
  emitAppointmentChange(req.user.orgId, {
    type: "appointments",
    event: "DELETE_APPOINTMENT",
    payload: { id: Number(id) },
  });
  res.status(204).send();
}

module.exports = { getAll, getById, create, update, remove };
