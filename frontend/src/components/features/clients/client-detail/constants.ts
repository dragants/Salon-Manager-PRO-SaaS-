export const CLIENT_CHART_MAX_FILES = 5;
export const CLIENT_CHART_MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ClientDetailCardTab =
  | "osnovno"
  | "loyalty"
  | "istorija"
  | "karton";

export const CLIENT_DETAIL_TABS: {
  id: ClientDetailCardTab;
  label: string;
}[] = [
  { id: "osnovno", label: "Osnovno" },
  { id: "loyalty", label: "Loyalty" },
  { id: "istorija", label: "Istorija dolazaka" },
  { id: "karton", label: "Karton / beleške" },
];
