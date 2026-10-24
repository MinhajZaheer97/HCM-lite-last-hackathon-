// Timezone helpers. All "today"/late decisions use the COMPANY timezone
// from settings — never the server's or the browser's local zone.

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// { dateISO: 'YYYY-MM-DD', minutes: since midnight, weekday: 0–6, time: 'HH:MM' }
export function zonedParts(date, tz) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    dateISO: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(hour) * 60 + Number(parts.minute),
    weekday: WEEKDAY_INDEX[parts.weekday],
    time: `${hour}:${parts.minute}`,
  };
}

function tzOffsetMs(date, tz) {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(
    Number(p.dateISO.slice(0, 4)),
    Number(p.dateISO.slice(5, 7)) - 1,
    Number(p.dateISO.slice(8, 10)),
    Math.floor(p.minutes / 60),
    p.minutes % 60
  );
  return asUtc - date.getTime();
}

// Convert a wall-clock 'YYYY-MM-DD HH:MM' in tz to a UTC ISO timestamp.
export function zonedToUtcISO(dateISO, time, tz) {
  const naive = Date.parse(`${dateISO}T${time}:00Z`);
  let ts = naive;
  for (let i = 0; i < 2; i++) ts = naive - tzOffsetMs(new Date(ts), tz);
  return new Date(ts).toISOString();
}

export function minutesFromTime(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}
