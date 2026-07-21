import math
import httpx
from dataclasses import dataclass, field
from typing import List, Dict, Any
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from routing.services.geocoding import GeocodingService
from routing.services.ors import ORSService

OFF_DUTY = "OFF"
SLEEPER_BERTH = "SB"
DRIVING = "D"
ON_DUTY_NOT_DRIVING = "ON"

DRIVING_LIMIT_HOURS = 11.0
ON_DUTY_WINDOW_HOURS = 14.0
BREAK_REQUIRED_AFTER_DRIVING_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
OFF_DUTY_RESET_HOURS = 10.0
CYCLE_LIMIT_HOURS = 70.0
FUEL_INTERVAL_MILES = 1000.0
FUEL_STOP_DURATION_HOURS = 0.5
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0
RESTART_DURATION_HOURS = 34.0

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
HEADERS = {"User-Agent": "DispatcherApp/1.0 (contact@dispatcher.app)"}


class TripPlanRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)


@dataclass
class Event:
    status: str
    start_hr: float
    end_hr: float
    start_mile: float
    end_mile: float
    label: str = ""


@dataclass
class SimResult:
    events: List[Event] = field(default_factory=list)
    stops: List[dict] = field(default_factory=list)
    cycle_hours_used_end: float = 0.0
    restart_required: bool = False
    total_on_duty_hours: float = 0.0
    total_driving_hours: float = 0.0


def simulate_trip(
    total_miles: float,
    total_drive_hours: float,
    current_cycle_used: float,
    pickup_mile: float = 0.0,
) -> SimResult:
    avg_speed = total_miles / total_drive_hours if total_drive_hours > 0 else 50.0

    result = SimResult()
    t = 0.0
    mile = 0.0
    cycle_used = current_cycle_used

    driving_today = 0.0
    on_duty_window_start = 0.0
    driving_since_break = 0.0
    miles_since_fuel = 0.0
    pickup_done = pickup_mile <= 1e-6

    def add_event(status_code, duration, label="", is_stop=False, stop_type=None):
        nonlocal t, mile, cycle_used, driving_today, driving_since_break
        if duration <= 0:
            return
        start_hr, start_mile = t, mile
        t += duration
        if status_code == DRIVING:
            mile += duration * avg_speed
            driving_today += duration
            driving_since_break += duration
            result.total_driving_hours += duration
        if status_code in (DRIVING, ON_DUTY_NOT_DRIVING):
            cycle_used += duration
            result.total_on_duty_hours += duration
        result.events.append(Event(status_code, start_hr, t, start_mile, mile, label))
        if is_stop:
            result.stops.append(
                {
                    "type": stop_type or status_code,
                    "label": label,
                    "mile": mile,
                    "clock_hr": t,
                }
            )

    if pickup_done:
        add_event(
            ON_DUTY_NOT_DRIVING,
            PICKUP_DURATION_HOURS,
            "Pickup (loading)",
            is_stop=True,
            stop_type="pickup",
        )
        on_duty_window_start = t

    safety = 0
    while mile < total_miles - 1e-6:
        safety += 1
        if safety > 800:
            break

        next_target = pickup_mile if not pickup_done else total_miles
        remaining_miles = next_target - mile
        remaining_drive_hours = remaining_miles / avg_speed

        on_duty_elapsed = t - on_duty_window_start
        hrs_left_in_window = ON_DUTY_WINDOW_HOURS - on_duty_elapsed
        hrs_left_driving = DRIVING_LIMIT_HOURS - driving_today
        hrs_left_before_break = BREAK_REQUIRED_AFTER_DRIVING_HOURS - driving_since_break
        hrs_left_before_fuel = (FUEL_INTERVAL_MILES - miles_since_fuel) / avg_speed

        if hrs_left_in_window <= 1e-6 or hrs_left_driving <= 1e-6:
            if cycle_used >= CYCLE_LIMIT_HOURS - 1e-6:
                add_event(
                    OFF_DUTY,
                    RESTART_DURATION_HOURS,
                    "34-hour restart",
                    is_stop=True,
                    stop_type="restart",
                )
                cycle_used = 0.0
                result.restart_required = True
            else:
                add_event(
                    OFF_DUTY,
                    OFF_DUTY_RESET_HOURS,
                    "Overnight rest (10 hr)",
                    is_stop=True,
                    stop_type="rest",
                )
            driving_today = 0.0
            driving_since_break = 0.0
            on_duty_window_start = t
            continue

        if hrs_left_before_break <= 1e-6 and remaining_drive_hours > 1e-6:
            chunk = min(BREAK_DURATION_HOURS, hrs_left_in_window)
            add_event(OFF_DUTY, chunk, "30-min break", is_stop=True, stop_type="break")
            driving_since_break = 0.0
            continue

        if remaining_drive_hours <= 1e-6:
            if not pickup_done:
                add_event(
                    ON_DUTY_NOT_DRIVING,
                    PICKUP_DURATION_HOURS,
                    "Pickup (loading)",
                    is_stop=True,
                    stop_type="pickup",
                )
                pickup_done = True
                on_duty_window_start = t
                continue
            else:
                break

        drive_chunk = min(
            remaining_drive_hours,
            hrs_left_in_window,
            hrs_left_driving,
            hrs_left_before_break,
            hrs_left_before_fuel if hrs_left_before_fuel > 1e-6 else 999,
        )
        drive_chunk = max(drive_chunk, 0.0)

        if drive_chunk <= 1e-6:
            add_event(
                OFF_DUTY,
                OFF_DUTY_RESET_HOURS,
                "Overnight rest (10 hr)",
                is_stop=True,
                stop_type="rest",
            )
            driving_today = 0.0
            driving_since_break = 0.0
            on_duty_window_start = t
            continue

        will_hit_fuel = (
            abs(drive_chunk - hrs_left_before_fuel) < 1e-6
            and hrs_left_before_fuel < remaining_drive_hours
        )
        add_event(DRIVING, drive_chunk, "Driving")
        miles_since_fuel += drive_chunk * avg_speed

        if will_hit_fuel and mile < total_miles - 1e-6:
            add_event(
                ON_DUTY_NOT_DRIVING,
                FUEL_STOP_DURATION_HOURS,
                "Fuel stop",
                is_stop=True,
                stop_type="fuel",
            )
            miles_since_fuel = 0.0

    add_event(
        ON_DUTY_NOT_DRIVING,
        DROPOFF_DURATION_HOURS,
        "Drop-off (unloading)",
        is_stop=True,
        stop_type="dropoff",
    )
    result.cycle_hours_used_end = cycle_used
    return result


def events_to_daily_logs(events: List[Event]) -> List[List[Dict[str, Any]]]:
    days: List[List[Dict[str, Any]]] = []

    def ensure_day(idx):
        while len(days) <= idx:
            days.append([])

    for ev in events:
        s, e = ev.start_hr, ev.end_hr
        while s < e - 1e-9:
            day_index = int(s // 24)
            day_start = day_index * 24
            day_end = day_start + 24
            seg_end = min(e, day_end)
            ensure_day(day_index)
            days[day_index].append(
                {
                    "status": ev.status,
                    "start": round(s - day_start, 4),
                    "end": round(seg_end - day_start, 4),
                    "label": ev.label,
                }
            )
            s = seg_end

    return days


def daily_totals(day_segments: List[Dict[str, Any]]) -> Dict[str, float]:
    totals = {OFF_DUTY: 0.0, SLEEPER_BERTH: 0.0, DRIVING: 0.0, ON_DUTY_NOT_DRIVING: 0.0}
    for seg in day_segments:
        totals[seg["status"]] += seg["end"] - seg["start"]
    return {k: round(v, 2) for k, v in totals.items()}


def point_at_mile(geometry, leg_start_mile, target_mile):
    def hav_miles(a, b):
        lat1, lon1 = a
        lat2, lon2 = b
        R = 3958.8
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlmb = math.radians(lon2 - lon1)
        h = (
            math.sin(dphi / 2) ** 2
            + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
        )
        return 2 * R * math.asin(min(1, math.sqrt(h)))

    cum = 0.0
    if not geometry:
        return None
    prev = geometry[0]
    if target_mile <= 0:
        return geometry[0]
    for pt in geometry[1:]:
        seg = hav_miles(prev, pt)
        if cum + seg >= target_mile:
            remain = target_mile - cum
            frac = remain / seg if seg > 0 else 0
            lat = prev[0] + (pt[0] - prev[0]) * frac
            lon = prev[1] + (pt[1] - prev[1]) * frac
            return [lat, lon]
        cum += seg
        prev = pt
    return geometry[-1]


def geocode_place(place: str) -> Dict[str, Any]:
    res = GeocodingService.search(place)
    if res and len(res) > 0:
        d = res[0]
        return {
            "lat": float(d["lat"]),
            "lon": float(d["lng"]),
            "display_name": d.get("display_name", place),
        }
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                NOMINATIM_URL,
                params={"q": place, "format": "json", "limit": 1},
                headers=HEADERS,
            )
            data = resp.json()
            if data and len(data) > 0:
                d = data[0]
                return {
                    "lat": float(d["lat"]),
                    "lon": float(d["lon"]),
                    "display_name": d.get("display_name", place),
                }
    except Exception:
        pass
    raise ValueError(f"Could not geocode location: {place}")


def compute_route(coords: List[tuple]) -> Dict[str, Any]:
    coord_str = ";".join(f"{lon},{lat}" for lon, lat in coords)
    url = f"{OSRM_URL}/{coord_str}"
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                url,
                params={"overview": "full", "geometries": "geojson"},
                headers=HEADERS,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    distance_miles = route["distance"] / 1609.34
                    duration_hours = route["duration"] / 3600.0
                    geometry = [
                        [lat, lon] for lon, lat in route["geometry"]["coordinates"]
                    ]
                    legs = route.get("legs", [])
                    leg_miles = [leg["distance"] / 1609.34 for leg in legs]
                    return {
                        "distance_miles": distance_miles,
                        "duration_hours": duration_hours,
                        "geometry": geometry,
                        "leg_miles": leg_miles,
                    }
    except Exception:
        pass

    if len(coords) >= 3:
        origin = [coords[0][0], coords[0][1]]
        pickup = [coords[1][0], coords[1][1]]
        dropoff = [coords[2][0], coords[2][1]]
        ors_res = ORSService.calculate_route(origin, pickup, dropoff)
        dist_m = ors_res.get("distance", 0)
        dur_s = ors_res.get("duration", 0)
        dist_miles = dist_m / 1609.34
        dur_hours = dur_s / 3600.0
        geometry = ors_res.get("geometry", [])
        return {
            "distance_miles": dist_miles,
            "duration_hours": dur_hours,
            "geometry": geometry,
            "leg_miles": [dist_miles * 0.5, dist_miles * 0.5],
        }

    raise ValueError("Could not calculate route between specified locations.")


class TripPlanView(APIView):
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            current = geocode_place(data["current_location"])
            pickup = geocode_place(data["pickup_location"])
            dropoff = geocode_place(data["dropoff_location"])
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"error": "Geocoding service unavailable. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            route = compute_route(
                [
                    (current["lon"], current["lat"]),
                    (pickup["lon"], pickup["lat"]),
                    (dropoff["lon"], dropoff["lat"]),
                ]
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"error": "Routing service unavailable. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        total_miles = route["distance_miles"]
        total_drive_hours = route["duration_hours"]
        pickup_mile = route["leg_miles"][0] if route["leg_miles"] else 0.0

        sim = simulate_trip(
            total_miles=total_miles,
            total_drive_hours=total_drive_hours,
            current_cycle_used=data["current_cycle_used"],
            pickup_mile=pickup_mile,
        )

        stops_out = []
        for s in sim.stops:
            pt = point_at_mile(route["geometry"], 0, s["mile"])
            stops_out.append(
                {**s, "lat": pt[0] if pt else None, "lon": pt[1] if pt else None}
            )

        days = events_to_daily_logs(sim.events)
        daily_logs = []
        for i, day in enumerate(days):
            daily_logs.append(
                {
                    "day_number": i + 1,
                    "segments": day,
                    "totals": daily_totals(day),
                }
            )

        response = {
            "locations": {
                "current": current,
                "pickup": pickup,
                "dropoff": dropoff,
            },
            "route": {
                "distance_miles": round(total_miles, 1),
                "duration_hours": round(total_drive_hours, 2),
                "geometry": route["geometry"],
            },
            "stops": stops_out,
            "daily_logs": daily_logs,
            "summary": {
                "total_trip_hours": round(sim.events[-1].end_hr, 2)
                if sim.events
                else 0,
                "total_driving_hours": round(sim.total_driving_hours, 2),
                "total_on_duty_hours": round(sim.total_on_duty_hours, 2),
                "cycle_hours_used_start": data["current_cycle_used"],
                "cycle_hours_used_end": round(sim.cycle_hours_used_end, 2),
                "cycle_limit_hours": CYCLE_LIMIT_HOURS,
                "restart_required": sim.restart_required,
                "num_days": len(daily_logs),
                "fuel_stops": len([s for s in sim.stops if s["type"] == "fuel"]),
            },
        }
        return Response(response)
