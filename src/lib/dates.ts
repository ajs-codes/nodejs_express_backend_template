export function addDurationToDate(duration: string, from = new Date()): Date {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const result = new Date(from);

  switch (unit) {
    case 's':
      result.setSeconds(result.getSeconds() + value);
      break;
    case 'm':
      result.setMinutes(result.getMinutes() + value);
      break;
    case 'h':
      result.setHours(result.getHours() + value);
      break;
    case 'd':
      result.setDate(result.getDate() + value);
      break;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }

  return result;
}

export function isExpired(date: Date): boolean {
  return date.getTime() <= Date.now();
}
