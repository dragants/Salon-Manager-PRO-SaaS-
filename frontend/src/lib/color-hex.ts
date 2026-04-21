/**
 * Parsira #RGB ili #RRGGBB u "R G B" za CSS var u formatu kao Tailwind/shadcn (--primary).
 */
export function hexToRgbSpaceSeparated(hex: string): string | null {
  const t = hex.trim();
  const m6 = /^#?([0-9a-f]{6})$/i.exec(t);
  if (m6) {
    const n = parseInt(m6[1], 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  }
  const m3 = /^#?([0-9a-f]{3})$/i.exec(t);
  if (m3) {
    const s = m3[1];
    const r = parseInt(s[0] + s[0], 16);
    const g = parseInt(s[1] + s[1], 16);
    const b = parseInt(s[2] + s[2], 16);
    return `${r} ${g} ${b}`;
  }
  return null;
}
