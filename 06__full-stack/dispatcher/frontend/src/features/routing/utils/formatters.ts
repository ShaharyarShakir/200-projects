export const formatDistance = (meters: number): string => {
  if (!meters || meters <= 0) return '0 km';
  const km = meters / 1000;
  return km >= 10 ? `${Math.round(km).toLocaleString()} km` : `${km.toFixed(1)} km`;
};

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
};

export const calculateAverageSpeed = (distanceMeters: number, durationSeconds: number): string => {
  if (!distanceMeters || !durationSeconds || durationSeconds <= 0) return '0 km/h';
  const km = distanceMeters / 1000;
  const hours = durationSeconds / 3600;
  const speed = km / hours;
  return `${Math.round(speed)} km/h`;
};

export const calculateETA = (durationSeconds: number): string => {
  if (!durationSeconds || durationSeconds <= 0) return 'N/A';
  const now = new Date();
  const arrival = new Date(now.getTime() + durationSeconds * 1000);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[arrival.getDay()];

  let hours = arrival.getHours();
  const minutes = arrival.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12

  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

  return `${dayName} ${hours}:${minutesStr} ${ampm}`;
};
