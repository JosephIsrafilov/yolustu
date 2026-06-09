/**
 * Generates a quadratic bezier curve between two points to simulate a natural flight/driving route path on the map.
 */
export function getCurvedPath(origin: [number, number], dest: [number, number], numPoints: number = 40): [number, number][] {
  const [lat1, lon1] = origin;
  const [lat2, lon2] = dest;

  // Create an offset perpendicular to the line to serve as the control point
  const latOffset = (lat2 - lat1) * 0.15;
  const lonOffset = -(lon2 - lon1) * 0.15;

  const controlLat = (lat1 + lat2) / 2 + lonOffset;
  const controlLon = (lon1 + lon2) / 2 + latOffset;

  const curve: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const currentLat = Math.pow(1 - t, 2) * lat1 + 2 * (1 - t) * t * controlLat + Math.pow(t, 2) * lat2;
    const currentLon = Math.pow(1 - t, 2) * lon1 + 2 * (1 - t) * t * controlLon + Math.pow(t, 2) * lon2;
    curve.push([currentLat, currentLon]);
  }
  return curve;
}
