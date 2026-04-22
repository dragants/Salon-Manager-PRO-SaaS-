/** Podkomponente i hook za karticu klijenta — za ponovnu upotrebu izvan Dialog-a. */
export {
  CLIENT_CHART_MAX_FILES,
  CLIENT_CHART_MAX_FILE_BYTES,
  CLIENT_DETAIL_TABS,
  type ClientDetailCardTab,
} from "./constants";
export { ClientInsightsAside } from "./client-insights-aside";
export { ClientDetailTabBar } from "./client-detail-tab-bar";
export { ClientDetailTabLoyalty } from "./client-detail-tab-loyalty";
export { ClientDetailTabAppointments } from "./client-detail-tab-appointments";
export { ClientDetailTabBasics } from "./client-detail-tab-basics";
export { ClientDetailTabChart } from "./client-detail-tab-chart";
export { useClientDetailSheet } from "./use-client-detail-sheet";
