// Convex Hull & Geospatial Utilities for FireCast AI

export function computeConvexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 2) return points;

  // Sort points lexicographically (by lon, then by lat)
  const sorted = [...points].sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);

  // 2D cross product of OA and OB vectors
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  };

  // Build lower hull
  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build upper hull
  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Concatenate lower and upper hulls (excluding duplicates)
  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);
  
  // Close the polygon ring
  if (hull.length > 0) {
    hull.push(hull[0]);
  }
  return hull;
}

// Generate wind-driven spread ellipse polygon
export function generateWindSpreadHull(
  baseHull: [number, number][],
  centerLat: number,
  centerLon: number,
  windDirectionDeg: number, // Direction wind is blowing from (e.g. 168° S)
  windSpeedKmh: number,
  horizonHours: number
): [number, number][] {
  // Wind blows towards: (windDirectionDeg + 180) % 360
  const headingDeg = (windDirectionDeg + 180) % 360;
  const headingRad = (headingDeg * Math.PI) / 180;

  const spreadDistanceKm = (windSpeedKmh * 0.08 + 0.3) * horizonHours;
  const deltaLat = (spreadDistanceKm * Math.cos(headingRad)) / 111.0;
  const deltaLon = (spreadDistanceKm * Math.sin(headingRad)) / (111.0 * Math.cos((centerLat * Math.PI) / 180));

  // Expand and project hull forward
  const expanded: [number, number][] = [];
  const expansionFactor = 1 + (horizonHours === 6 ? 0.35 : 0.7);

  for (const pt of baseHull) {
    const lonDiff = pt[0] - centerLon;
    const latDiff = pt[1] - centerLat;
    expanded.push([
      centerLon + lonDiff * expansionFactor + deltaLon,
      centerLat + latDiff * expansionFactor + deltaLat,
    ]);
  }

  return computeConvexHull(expanded);
}
