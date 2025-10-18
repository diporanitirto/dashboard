const JAKARTA_TIMEZONE = 'Asia/Jakarta';
const JAKARTA_OFFSET = '+07:00';

type JakartaParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: JAKARTA_TIMEZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: JAKARTA_TIMEZONE,
  weekday: 'short',
});

const fullDisplayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: JAKARTA_TIMEZONE,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const compactDisplayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: JAKARTA_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function extractJakartaParts(date: Date): JakartaParts {
  const parts = dateTimeFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

export function getFridayArchiveWindow(baseDate = new Date()) {
  const parts = extractJakartaParts(baseDate);
  const weekday = weekdayFormatter.format(baseDate).toLowerCase();
  const isFriday = weekday.startsWith('fri');

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
  const nowMs = Date.parse(`${isoDate}T${parts.hour}:${parts.minute}:${parts.second}.000${JAKARTA_OFFSET}`);
  const cutoffMs = Date.parse(`${isoDate}T15:00:00.000${JAKARTA_OFFSET}`);

  const eligible = isFriday && nowMs >= cutoffMs;

  const rangeStartUtc = new Date(`${isoDate}T00:00:00.000${JAKARTA_OFFSET}`).toISOString();
  const rangeEndUtc = new Date(`${isoDate}T23:59:59.999${JAKARTA_OFFSET}`).toISOString();

  return {
    eligible,
    isoDate,
    rangeStartUtc,
    rangeEndUtc,
  };
}

export function formatArchiveFullLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000${JAKARTA_OFFSET}`);
  return fullDisplayFormatter.format(date);
}

export function formatArchiveCompactLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000${JAKARTA_OFFSET}`);
  return compactDisplayFormatter.format(date);
}

export { JAKARTA_TIMEZONE, JAKARTA_OFFSET };
