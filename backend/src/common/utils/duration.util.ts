export function durationToSeconds(duration: string): number {
  const match = duration.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error(`Noto‘g‘ri davomiylik formati: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Qo‘llab-quvvatlanmagan birlik: ${unit}`);
  }
}
