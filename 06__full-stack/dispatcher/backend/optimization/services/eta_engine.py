from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional


class ETAEngine:
    """
    Recalculates arrival and departure timestamps for stops along a route timeline.
    """

    @staticmethod
    def calculate_timestamps(
        stops: List[Dict[str, Any]],
        start_datetime: Optional[datetime] = None,
        avg_speed_mph: float = 55.0,
    ) -> Dict[str, Any]:
        """
        Populates arrival_time and departure_time for each stop dict in stops list.
        """
        if start_datetime is None:
            now = datetime.now(timezone.utc)
            start_datetime = datetime(
                now.year, now.month, now.day, 8, 0, 0, tzinfo=timezone.utc
            )

        curr_time = start_datetime
        prev_dist = 0.0

        for stop in stops:
            dist = stop.get("distance_from_start", 0.0)
            segment_dist = max(0.0, dist - prev_dist)
            driving_hours = segment_dist / avg_speed_mph if avg_speed_mph > 0 else 0.0

            arrival_t = curr_time + timedelta(hours=driving_hours)
            stop_duration_h = float(stop.get("duration", 0.5))
            departure_t = arrival_t + timedelta(hours=stop_duration_h)

            stop["arrival_time"] = arrival_t.isoformat()
            stop["departure_time"] = departure_t.isoformat()

            curr_time = departure_t
            prev_dist = dist

        total_elapsed_hours = (curr_time - start_datetime).total_seconds() / 3600.0

        return {
            "start_time": start_datetime.isoformat(),
            "end_time": curr_time.isoformat(),
            "total_elapsed_hours": round(total_elapsed_hours, 2),
            "stops": stops,
        }
