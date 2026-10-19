export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates the great-circle forward azimuth bearing (in degrees, 0 to 360)
 * from a user coordinate to the Kaaba in Makkah.
 */
export function calculateQiblaBearing(userLat: number, userLng: number): number {
  const phi1 = toRadians(userLat);
  const phi2 = toRadians(KAABA_COORDINATES.latitude);
  const deltaLambda = toRadians(KAABA_COORDINATES.longitude - userLng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  return Math.round(bearing * 10) / 10;
}

/**
 * Calculates great-circle distance between user coordinates and the Kaaba in kilometers
 * using the Haversine formula.
 */
export function calculateDistanceToKaaba(userLat: number, userLng: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRadians(KAABA_COORDINATES.latitude - userLat);
  const dLng = toRadians(KAABA_COORDINATES.longitude - userLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(KAABA_COORDINATES.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Returns cardinal direction (e.g. "N", "NE", "ENE", etc.) for a given degree bearing.
 */
export function getCardinalDirection(bearing: number): string {
  const cardinals = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return cardinals[index];
}
