// Map / Route Tracking — Geo Utilities & Pipeline Implementation
// Spec: Exposing GPS route-tracking with noise cleaning, stop detection, and pagination.

export const DISTANCE_FILTER_OPTIONS = {
  minMovementMeters: 5,
  maxAccuracyMeters: 75,   // reject any fix noisier than 75m
  maxSpeedKmh: 120,        // reps drive; catches teleports, not real driving
};

export const ROUTE_GAP_MINUTES = 10; // gap this long => draw a break, not a line
export const MOVEMENT_GATE_OPTIONS = { minMoveFloorMeters: 15, accuracyK: 1.5 };

export const STOP_DETECTION_OPTIONS = {
  stopRadiusMeters: 40,
  stopRadiusAccuracyK: 1.0,
  stopRadiusMaxMeters: 100,
  stopMaxExtentMeters: 120,
  stopOutlierMaxMeters: 150,
  stopMinDurationMs: 3 * 60 * 1000, // 3 minutes minimum dwell
  stopMinPoints: 3,
  stopMaxConsecutiveOutliers: 2,
  stopMaxIntraGapMs: 15 * 60 * 1000,
  stopDurationPadCapMs: 30 * 1000,
  accuracyFloorMeters: 1,
};

export const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// accuracy == null MUST be a reject, not a pass
export const isDisplayablePoint = (p, maxAcc = DISTANCE_FILTER_OPTIONS.maxAccuracyMeters) =>
  !p.is_mock && p.accuracy != null && p.accuracy <= maxAcc;

// Rejects a fix whose implied speed from last accepted point > maxSpeedKmh
export const rejectSpeedOutliers = (points, maxSpeedKmh = DISTANCE_FILTER_OPTIONS.maxSpeedKmh) => {
  if (!points || points.length < 2) return points || [];
  const ZERO_DT_MAX_JUMP_METERS = 200;
  const accepted = [points[0]];
  let lastGood = points[0];
  let lastGoodTime = new Date(lastGood.timestamp).getTime();

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const t = new Date(p.timestamp).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(lastGoodTime) || t - lastGoodTime <= 0) {
      if (haversineMeters(lastGood.latitude, lastGood.longitude, p.latitude, p.longitude) <= ZERO_DT_MAX_JUMP_METERS) {
        accepted.push(p);
      }
      continue;
    }
    const dist = haversineMeters(lastGood.latitude, lastGood.longitude, p.latitude, p.longitude);
    const impliedKmh = (dist / ((t - lastGoodTime) / 1000)) * 3.6;
    if (impliedKmh <= maxSpeedKmh) {
      accepted.push(p);
      lastGood = p;
      lastGoodTime = t;
    }
  }
  return accepted;
};

// Collapses stationary dwells into synthetic Stop nodes to eliminate phantom stationary mileage
export const detectStops = (points, options = STOP_DETECTION_OPTIONS) => {
  if (!points || points.length < options.stopMinPoints) return points || [];

  const result = [];
  let i = 0;

  while (i < points.length) {
    let stopCluster = [points[i]];
    let consecutiveOutliers = 0;
    let j = i + 1;

    while (j < points.length) {
      const p = points[j];
      const firstT = new Date(stopCluster[0].timestamp).getTime();
      const currT = new Date(p.timestamp).getTime();

      if (currT - firstT > options.stopMaxIntraGapMs && stopCluster.length < options.stopMinPoints) {
        break;
      }

      // Inverse-variance weighted centroid
      let sumLat = 0, sumLon = 0, sumWeight = 0;
      for (const cp of stopCluster) {
        const acc = Math.max(cp.accuracy || 10, options.accuracyFloorMeters);
        const w = 1 / (acc * acc);
        sumLat += cp.latitude * w;
        sumLon += cp.longitude * w;
        sumWeight += w;
      }
      const centLat = sumLat / sumWeight;
      const centLon = sumLon / sumWeight;

      const dist = haversineMeters(centLat, centLon, p.latitude, p.longitude);
      const allowedRadius = Math.min(
        options.stopRadiusMaxMeters,
        options.stopRadiusMeters + options.stopRadiusAccuracyK * (p.accuracy || 10)
      );

      if (dist <= allowedRadius) {
        stopCluster.push(p);
        consecutiveOutliers = 0;
      } else {
        consecutiveOutliers++;
        if (consecutiveOutliers > options.stopMaxConsecutiveOutliers) {
          break;
        }
      }
      j++;
    }

    const firstT = new Date(stopCluster[0].timestamp).getTime();
    const lastT = new Date(stopCluster[stopCluster.length - 1].timestamp).getTime();
    const durationMs = lastT - firstT;

    if (stopCluster.length >= options.stopMinPoints && durationMs >= options.stopMinDurationMs) {
      let sumLat = 0, sumLon = 0, sumWeight = 0;
      for (const cp of stopCluster) {
        const acc = Math.max(cp.accuracy || 10, options.accuracyFloorMeters);
        const w = 1 / (acc * acc);
        sumLat += cp.latitude * w;
        sumLon += cp.longitude * w;
        sumWeight += w;
      }
      const centLat = sumLat / sumWeight;
      const centLon = sumLon / sumWeight;

      result.push({
        id: `stop_${stopCluster[0].id || i}`,
        latitude: centLat,
        longitude: centLon,
        isStop: true,
        arrivalTime: stopCluster[0].timestamp,
        departureTime: stopCluster[stopCluster.length - 1].timestamp,
        timestamp: stopCluster[0].timestamp,
        durationMs,
        pointCount: stopCluster.length,
        battery: stopCluster[stopCluster.length - 1].battery,
        speed: 0,
        accuracy: Math.round(Math.min(...stopCluster.map(c => c.accuracy || 10))),
      });
      i += stopCluster.length;
    } else {
      result.push(points[i]);
      i++;
    }
  }

  return result;
};

// Thins residual jitter in transit runs using an accuracy-SCALED gate
export const thinTransitPoints = (points, options = MOVEMENT_GATE_OPTIONS) => {
  if (!points || points.length < 2) return points || [];
  const result = [points[0]];
  let lastGood = points[0];

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.isStop) {
      result.push(p);
      lastGood = p;
      continue;
    }

    const dist = haversineMeters(lastGood.latitude, lastGood.longitude, p.latitude, p.longitude);
    const minGate = options.minMoveFloorMeters + options.accuracyK * (p.accuracy || 10);
    if (dist >= minGate || i === points.length - 1) {
      result.push(p);
      lastGood = p;
    }
  }
  return result;
};

// THE Pipeline: 1. displayable -> 2. rejectSpeedOutliers -> 3. detectStops -> 4. thinTransitPoints
export const cleanRouteForDisplay = (rawPoints) => {
  if (!rawPoints || rawPoints.length === 0) return [];
  const ordered = [...rawPoints].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const displayable = ordered.filter((p) => isDisplayablePoint(p));
  const noTeleports = rejectSpeedOutliers(displayable);
  const withStops = detectStops(noTeleports, STOP_DETECTION_OPTIONS);
  return thinTransitPoints(withStops, MOVEMENT_GATE_OPTIONS);
};

// Sums cleaned points into total distance in KM
export const sumRouteDistanceKm = (points, maxGapMinutes = ROUTE_GAP_MINUTES) => {
  if (!points || points.length < 2) return 0;
  const maxGapMs = maxGapMinutes * 60 * 1000;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a.accuracy == null || b.accuracy == null) continue;
    const aEnd = new Date(a.departureTime || a.timestamp).getTime();
    const bStart = new Date(b.arrivalTime || b.timestamp).getTime();
    if (bStart - aEnd > maxGapMs) continue;
    const d = haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
    if (d >= DISTANCE_FILTER_OPTIONS.minMovementMeters) total += d;
  }
  return total / 1000;
};

// Splits cleaned route into IN->MID / MID->OUT legs at mid_time
export const splitLegsAtMid = (points, midTime) => {
  if (!points || !points.length || !midTime) return { leg1Points: points || [], leg2Points: [] };
  const midMs = new Date(midTime).getTime();
  const pointTime = (p) => new Date(p.arrivalTime || p.timestamp).getTime();
  const splitIdx = points.findIndex((p) => pointTime(p) > midMs);
  if (splitIdx === -1) return { leg1Points: points, leg2Points: [] };
  if (splitIdx === 0) return { leg1Points: [], leg2Points: points };
  return { leg1Points: points.slice(0, splitIdx + 1), leg2Points: points.slice(splitIdx) };
};

// Splits a route into DRAWABLE segments wherever points are > ROUTE_GAP_MINUTES apart
export const splitRouteByTimeGap = (points, maxGapMinutes = ROUTE_GAP_MINUTES) => {
  if (!points || !points.length) return [];
  const segments = [];
  let current = [points[0]];
  const maxGapMs = maxGapMinutes * 60 * 1000;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const prevTime = new Date(prev.departureTime ?? prev.timestamp).getTime();
    const currTime = new Date(points[i].timestamp).getTime();
    if (currTime - prevTime > maxGapMs) {
      segments.push(current);
      current = [points[i]];
    } else {
      current.push(points[i]);
    }
  }
  segments.push(current);
  return segments;
};

// Builds Google Maps direction path URL with waypoints sampling up to 20 points
export const buildGoogleMapsRouteUrl = (logs) => {
  if (!logs || logs.length === 0) return null;
  const validCoords = logs
    .filter((l) => l.latitude != null && l.longitude != null && !isNaN(parseFloat(l.latitude)) && !isNaN(parseFloat(l.longitude)))
    .map((l) => `${parseFloat(l.latitude)},${parseFloat(l.longitude)}`);

  if (validCoords.length === 0) return null;
  if (validCoords.length === 1) return `https://www.google.com/maps?q=${validCoords[0]}`;

  let sampled = validCoords;
  if (validCoords.length > 20) {
    const step = (validCoords.length - 1) / 19;
    sampled = [];
    for (let i = 0; i < 20; i++) {
      const idx = Math.min(Math.round(i * step), validCoords.length - 1);
      sampled.push(validCoords[idx]);
    }
  }

  const waypoints = sampled.join("/");
  return `https://www.google.com/maps/dir/${waypoints}`;
};

// Section 4: Paginated Location Logs Fetcher (1000 rows max per query limit bypass)
export async function fetchAllLocationLogs(supabase, { sessionId, personName, date, columns = '*' }) {
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from('location_logs')
      .select(columns)
      .order('timestamp', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (sessionId && personName && date) {
      query = query
        .eq('person_name', personName)
        .eq('date', date)
        .or(`tracking_session_id.eq.${sessionId},tracking_session_id.is.null`);
    } else {
      if (sessionId) query = query.eq('tracking_session_id', sessionId);
      if (personName) query = query.eq('person_name', personName);
      if (date) query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return all;
}
