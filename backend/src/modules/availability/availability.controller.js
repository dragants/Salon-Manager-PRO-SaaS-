const service = require("./availability.service");

async function getAvailability(req, res) {
  const q = req.validatedQuery;
  const data = await service.getSlots(req.user.orgId, {
    day: q.day,
    service_id: q.service_id,
    staff_user_id: q.staff_user_id,
  });
  res.json(data);
}

module.exports = { getAvailability };
