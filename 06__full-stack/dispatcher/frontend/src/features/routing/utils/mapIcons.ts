import L from 'leaflet';

const createCustomIcon = (color: string, label: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="16" cy="15" r="7" fill="#FFFFFF"/>
      <text x="16" y="19" font-size="10" font-weight="bold" fill="${color}" text-anchor="middle">${label}</text>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
};

// 🔵 Blue for Origin / Current Location
export const originIcon = createCustomIcon('#2563EB', 'O');

// 🟢 Green for Pickup
export const pickupIcon = createCustomIcon('#16A34A', 'P');

// 🔴 Red for Dropoff
export const dropoffIcon = createCustomIcon('#DC2626', 'D');
