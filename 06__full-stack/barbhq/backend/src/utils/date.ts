export const isValidDate = (date: unknown): boolean => {
  if (date instanceof Date) return !isNaN(date.getTime());
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  return false;
};

export const formatDateISO = (date: Date = new Date()): string => {
  return date.toISOString();
};
