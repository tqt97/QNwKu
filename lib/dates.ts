export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function getZonedParts(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}

export function dateToLocalInput(value: string) {
  const parts = getZonedParts(new Date(value));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function localInputToISO(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('Ngày giờ chưa hợp lệ.');
  const [, year, month, day, hour, minute] = match;
  const localAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const represented = getZonedParts(new Date(localAsUtc));
  const representedAsUtc = Date.UTC(Number(represented.year), Number(represented.month) - 1, Number(represented.day), Number(represented.hour), Number(represented.minute));
  const offset = representedAsUtc - localAsUtc;
  const instant = new Date(localAsUtc - offset);
  const roundTrip = getZonedParts(instant);
  if (roundTrip.year !== year || roundTrip.month !== month || roundTrip.day !== day || roundTrip.hour !== hour || roundTrip.minute !== minute) {
    throw new Error('Giờ này không hợp lệ trong múi giờ Việt Nam.');
  }
  return instant.toISOString();
}

export function formatAppDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: APP_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatAppTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: APP_TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function formatAppMonth(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: APP_TIME_ZONE, month: 'short' }).format(new Date(value)).replace('.', '');
}

export function formatAppDay(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: APP_TIME_ZONE, day: 'numeric' }).format(new Date(value));
}
