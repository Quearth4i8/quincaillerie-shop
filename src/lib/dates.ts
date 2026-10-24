/** Tunisia is UTC+1 all year (no DST). */
const TUNIS_OFFSET = "+01:00";

function tunisDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(d); // YYYY-MM-DD
}

/** ISO timestamp of today's midnight in Tunis */
export function startOfTodayTunis() {
  return new Date(`${tunisDate()}T00:00:00${TUNIS_OFFSET}`).toISOString();
}

export function daysAgoIso(days: number) {
  const d = new Date(`${tunisDate()}T00:00:00${TUNIS_OFFSET}`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export { tunisDate };
