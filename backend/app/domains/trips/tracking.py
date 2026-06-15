"""In-process live-tracking: WebSocket fan-out + fake-route simulation engine.

Deliberately self-contained and *separate* from app.core.websocket: that
manager multiplexes chat onto a per-ride channel, and we don't want location
ticks polluting the chat message stream (or vice versa). For the demo a plain
in-memory registry is enough.

# ponytail: single-worker in-memory fan-out. The simulation asyncio task and
# the viewer sockets must live in the same process anyway, so Redis buys
# nothing here. If tracking ever runs multi-worker, publish ticks to a
# Redis channel and subscribe per-worker (mirror app/core/websocket.py).
"""

import asyncio
import logging
import math
from typing import Dict, Optional, Set
from uuid import UUID

import httpx
from fastapi import WebSocket

logger = logging.getLogger(__name__)

# Public OSRM demo server. Same service the frontend map already uses for
# drawing road routes (see frontend Map/utils.ts).
_OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
_OSRM_TIMEOUT = 8.0


def interpolate_route(
    origin: tuple[float, float],
    destination: tuple[float, float],
    steps: int,
) -> list[tuple[float, float]]:
    """Straight-line (lat, lng) points from origin to destination, inclusive.

    Returns ``steps + 1`` points. Linear interpolation in degrees — used only
    as a fallback when real road routing is unavailable.
    """
    if steps < 1:
        return [origin, destination]
    o_lat, o_lng = origin
    d_lat, d_lng = destination
    return [
        (o_lat + (d_lat - o_lat) * (i / steps), o_lng + (d_lng - o_lng) * (i / steps))
        for i in range(steps + 1)
    ]


def haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle distance between two (lat, lng) points, in metres."""
    r = 6_371_000.0
    lat1, lat2 = math.radians(a[0]), math.radians(b[0])
    d_lat = math.radians(b[0] - a[0])
    d_lng = math.radians(b[1] - a[1])
    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    )
    return 2 * r * math.asin(min(1.0, math.sqrt(h)))


def resample_path(
    points: list[tuple[float, float]], steps: int
) -> list[tuple[float, float]]:
    """Resample a polyline to ``steps + 1`` points spaced evenly by distance.

    A raw OSRM route can have hundreds of unevenly-spaced vertices, which would
    make the car lurch (dense in cities, sparse on highways). Walking the line
    by cumulative distance gives smooth, constant-speed playback regardless of
    how many vertices the route has.
    """
    if steps < 1 or len(points) < 2:
        return points

    # Cumulative distance at each vertex.
    cum = [0.0]
    for i in range(1, len(points)):
        cum.append(cum[-1] + haversine_m(points[i - 1], points[i]))
    total = cum[-1]
    if total == 0:
        return [points[0]] * (steps + 1)

    out: list[tuple[float, float]] = []
    seg = 0
    for i in range(steps + 1):
        target = total * (i / steps)
        while seg < len(cum) - 2 and cum[seg + 1] < target:
            seg += 1
        seg_len = cum[seg + 1] - cum[seg]
        t = 0.0 if seg_len == 0 else (target - cum[seg]) / seg_len
        a, b = points[seg], points[seg + 1]
        out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


async def fetch_road_route(
    origin: tuple[float, float], destination: tuple[float, float]
) -> Optional[list[tuple[float, float]]]:
    """Fetch a driving route polyline from OSRM as a list of (lat, lng) points.

    Returns ``None`` on any failure (network, non-200, empty geometry) so the
    caller can fall back to a straight line.
    """
    o_lat, o_lng = origin
    d_lat, d_lng = destination
    url = f"{_OSRM_URL}/{o_lng},{o_lat};{d_lng},{d_lat}"
    params = {"overview": "full", "geometries": "geojson"}
    try:
        async with httpx.AsyncClient(timeout=_OSRM_TIMEOUT) as client:
            resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return None
        coords = (
            resp.json().get("routes", [{}])[0].get("geometry", {}).get("coordinates")
        )
        if not coords or len(coords) < 2:
            return None
        # OSRM returns [lng, lat]; we use (lat, lng).
        return [(lat, lng) for lng, lat in coords]
    except Exception:
        logger.warning("OSRM route fetch failed; falling back to straight line")
        return None


def bearing(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Compass heading in degrees (0=N, 90=E) from point a to point b."""
    lat1, lat2 = math.radians(a[0]), math.radians(b[0])
    d_lng = math.radians(b[1] - a[1])
    y = math.sin(d_lng) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(
        d_lng
    )
    return (math.degrees(math.atan2(y, x)) + 360.0) % 360.0


class TrackingManager:
    def __init__(self) -> None:
        self._conns: Dict[UUID, Set[WebSocket]] = {}
        self._tasks: Dict[UUID, asyncio.Task] = {}  # type: ignore[type-arg]
        # Last route + last position, replayed to viewers that join mid-trip.
        self._last_route: Dict[UUID, dict] = {}
        self._last_location: Dict[UUID, dict] = {}

    async def connect(self, ws: WebSocket, ride_id: UUID) -> None:
        await ws.accept()
        self._conns.setdefault(ride_id, set()).add(ws)
        # Replay cached state so a late viewer immediately sees route + car.
        if ride_id in self._last_route:
            await self._send(ws, self._last_route[ride_id])
        if ride_id in self._last_location:
            await self._send(ws, self._last_location[ride_id])

    def disconnect(self, ws: WebSocket, ride_id: UUID) -> None:
        bucket = self._conns.get(ride_id)
        if bucket:
            bucket.discard(ws)
            if not bucket:
                del self._conns[ride_id]

    @staticmethod
    async def _send(ws: WebSocket, payload: dict) -> None:
        try:
            await ws.send_json(payload)
        except Exception:
            pass

    async def broadcast(self, ride_id: UUID, payload: dict) -> None:
        dead = []
        for ws in list(self._conns.get(ride_id, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, ride_id)

    def is_running(self, ride_id: UUID) -> bool:
        task = self._tasks.get(ride_id)
        return task is not None and not task.done()

    def start_simulation(
        self,
        ride_id: UUID,
        origin: tuple[float, float],
        destination: tuple[float, float],
        steps: int = 60,
        interval: float = 1.0,
    ) -> None:
        """(Re)start a route simulation for a ride. Idempotent: cancels any
        in-flight run for the same ride first."""
        self.stop_simulation(ride_id)
        self._tasks[ride_id] = asyncio.create_task(
            self._run(ride_id, origin, destination, steps, interval)
        )

    def stop_simulation(self, ride_id: UUID) -> None:
        task = self._tasks.pop(ride_id, None)
        if task and not task.done():
            task.cancel()
        self._last_route.pop(ride_id, None)
        self._last_location.pop(ride_id, None)

    async def _run(
        self,
        ride_id: UUID,
        origin: tuple[float, float],
        destination: tuple[float, float],
        steps: int,
        interval: float,
    ) -> None:
        # Try a real road route first so the car follows roads (and doesn't cut
        # across water, e.g. Baku -> Lankaran). Fall back to a straight line.
        road = await fetch_road_route(origin, destination)
        if road:
            points = resample_path(road, steps)
        else:
            points = interpolate_route(origin, destination, steps)

        route_msg = {
            "type": "route",
            "origin": {"lat": origin[0], "lng": origin[1]},
            "destination": {"lat": destination[0], "lng": destination[1]},
            "path": [{"lat": lat, "lng": lng} for lat, lng in points],
        }
        self._last_route[ride_id] = route_msg
        await self.broadcast(ride_id, route_msg)

        try:
            for i, (lat, lng) in enumerate(points):
                nxt = points[min(i + 1, len(points) - 1)]
                heading = bearing((lat, lng), nxt) if (lat, lng) != nxt else 0.0
                loc = {
                    "type": "location",
                    "lat": lat,
                    "lng": lng,
                    "heading": heading,
                    "progress": round(i / (len(points) - 1), 4),
                }
                self._last_location[ride_id] = loc
                await self.broadcast(ride_id, loc)
                if i < len(points) - 1:
                    await asyncio.sleep(interval)
            await self.broadcast(ride_id, {"type": "status", "status": "completed"})
        except asyncio.CancelledError:
            await self.broadcast(ride_id, {"type": "status", "status": "ended"})
            raise
        finally:
            self._tasks.pop(ride_id, None)


tracking_manager = TrackingManager()


def _demo() -> None:
    pts = interpolate_route((40.0, 49.0), (41.0, 50.0), 4)
    assert len(pts) == 5
    assert pts[0] == (40.0, 49.0) and pts[-1] == (41.0, 50.0)
    assert pts[2] == (40.5, 49.5)  # midpoint
    # due-north move -> ~0deg, due-east -> ~90deg
    assert abs(bearing((40.0, 49.0), (41.0, 49.0)) - 0.0) < 1.0
    assert abs(bearing((40.0, 49.0), (40.0, 50.0)) - 90.0) < 1.0

    # resample: a jagged 3-vertex line evenly resampled keeps endpoints and
    # produces the requested count.
    jagged = [(0.0, 0.0), (0.0, 1.0), (0.0, 3.0)]
    rs = resample_path(jagged, 6)
    assert len(rs) == 7
    assert rs[0] == (0.0, 0.0) and abs(rs[-1][1] - 3.0) < 1e-9
    # evenly spaced by distance: midpoint of a 3-unit line is at lng 1.5
    assert abs(rs[3][1] - 1.5) < 1e-6
    # haversine sanity: ~111km per degree of latitude
    assert abs(haversine_m((0.0, 0.0), (1.0, 0.0)) - 111_195) < 500
    print("tracking self-check ok")


if __name__ == "__main__":
    _demo()
