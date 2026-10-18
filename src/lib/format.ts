const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const nairaKobo = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-NG");

/** ₦7,000 */
export const formatNaira = (n: number, withKobo = false) => (withKobo ? nairaKobo : naira).format(n);

/** ₦1.84m / ₦640k, for dense dashboards */
export function formatNairaShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}bn`;
  if (abs >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}m`;
  if (abs >= 10_000) return `₦${Math.round(n / 1000)}k`;
  return formatNaira(n);
}

export const formatNumber = (n: number) => num.format(n);

export const formatPercent = (n: number, digits = 1) => `${n.toFixed(digits).replace(/\.0$/, "")}%`;

const toDate = (d: string | Date) => (typeof d === "string" ? new Date(d) : d);

/** Tue 6 Oct */
export const formatDay = (d: string | Date) =>
  toDate(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** 6 Oct 2026 */
export const formatDate = (d: string | Date) =>
  toDate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Tuesday */
export const formatWeekday = (d: string | Date) => toDate(d).toLocaleDateString("en-GB", { weekday: "long" });

/** 07:42 */
export const formatTime = (d: string | Date) =>
  toDate(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** 6 Oct, 07:42 */
export const formatDateTime = (d: string | Date) => `${formatDate(d).replace(/ \d{4}$/, "")}, ${formatTime(d)}`;

/** "3 days ago", "in 2 hours" relative to the demo clock */
export function formatRelative(d: string | Date, now: Date = DEMO_NOW): string {
  const diff = toDate(d).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const min = 60_000, hr = 60 * min, day = 24 * hr;
  if (abs < hr) return rtf.format(Math.round(diff / min), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hr), "hour");
  if (abs < 30 * day) return rtf.format(Math.round(diff / day), "day");
  return formatDate(d);
}

/** The demo's "now": Monday 5 October 2026, 08:12 in Uyo (WAT, UTC+1). */
export const DEMO_NOW = new Date("2026-10-05T08:12:00+01:00");

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

export const pluralize = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;
