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
  if (from && to) {
    data = await service.getByDateRange(req.user.orgId, from, to, timezone);
  } else if (day) {
    data = await service.getByDay(req.user.orgId, day, timezone);
  } else {
    data = await service.getAll(req.user.orgId);
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
  const data = await service.update(id, req.body, req.user.orgId);
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
