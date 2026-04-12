const service = require("./booking.service");
const appointmentsService = require("../appointments/appointments.service");
const {
  emitAppointmentChange,
} = require("../../realtime/appointmentEvents");
const pushService = require("../../services/push.service");

async function getSalon(req, res) {
  const org = await service.getOrgByBookingSlug(req.params.slug);
  if (!org) {
    return res.status(404).json({
      error:
        "Ovaj link ne postoji ili salon još nije uključio online rezervacije. Proveri adresu ili pitaj vlasnika da u Podešavanjima → Salon postavi isti kratak link.",
    });
  }
  const services = await service.listServices(org.id);
  const payload = service.publicSalonPayload(org);
  payload.services = services;
  res.json(payload);
}

async function getSlots(req, res) {
  const org = await service.getOrgByBookingSlug(req.params.slug);
  if (!org) {
    return res.status(404).json({
      error:
        "Ovaj link ne postoji ili salon još nije uključio online rezervacije.",
    });
  }
  const q = req.validatedQuery;
  const tz =
    q.timezone && String(q.timezone).trim()
      ? String(q.timezone).trim()
      : service.orgTimeZone(org);
  const data = await service.getAvailableSlots(
    org.id,
    q.service_id,
    q.date,
    tz
  );
  res.json(data);
}

async function book(req, res) {
  const org = await service.getOrgByBookingSlug(req.params.slug);
  if (!org) {
    return res.status(404).json({
      error:
        "Ovaj link ne postoji ili salon još nije uključio online rezervacije.",
    });
  }
  const { name, phone, email, service_id, start, timezone, staff_user_id } =
    req.body;
  const tz =
    timezone && String(timezone).trim()
      ? String(timezone).trim()
      : service.orgTimeZone(org);
  const result = await service.bookAppointment({
    org,
    serviceId: service_id,
    startIso: start,
    name,
    phone,
    email,
    timeZone: tz,
    staffUserId: staff_user_id,
  });
  let payload = null;
  try {
    payload = await appointmentsService.getById(result.appointment_id, org.id);
  } catch {
    payload = null;
  }
  emitAppointmentChange(org.id, {
    type: "appointments",
    event: "NEW_APPOINTMENT",
    ...(payload
      ? { payload, source: "public_booking" }
      : { id: result.appointment_id, source: "public_booking" }),
  });

  const labelTz =
    (org.settings?.timezone && String(org.settings.timezone).trim()) ||
    process.env.APP_TIMEZONE ||
    "Europe/Belgrade";
  const clientName =
    (payload && (payload.client_name || name)) || name || "Klijent";
  const serviceName =
    (payload && payload.service_name) || "Usluga";
  const whenLabel = payload
    ? new Date(payload.date).toLocaleString("sr-Latn-RS", {
        timeZone: labelTz,
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  setImmediate(() => {
    pushService
      .notifyOrganizationNewPublicBooking(org.id, {
        clientName,
        serviceName,
        whenLabel,
        staffUserId: payload?.staff_user_id ?? null,
      })
      .catch((e) => console.error("Staff push (new booking)", e));
  });

  res.status(201).json(result);
}

module.exports = { getSalon, getSlots, book };
