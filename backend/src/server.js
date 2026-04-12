/** Izvorni autor / nosilac prava na ovaj kod: Dragan Saric */
require("./config/env");
const app = require("./app");
const { PORT, HOST } = require("./config/env");
const { startRemindersCron } = require("./jobs/reminders.job");
const { printSalonLanUrls } = require("../../scripts/lan-ipv4.cjs");

app.listen(PORT, HOST, () => {
  console.log(`Salon Manager PRO — autor izvornog koda: Dragan Saric`);
  console.log(`Server listening on http://${HOST}:${PORT}`);
  printSalonLanUrls(3000, PORT);
  startRemindersCron();
});
