from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from ..models import DailyLog, DutyEvent, DutyStatus


HOS_TO_DUTY_STATUS = {
    "pickup": DutyStatus.ON_DUTY,
    "drive": DutyStatus.DRIVING,
    "break": DutyStatus.OFF_DUTY,
    "fuel": DutyStatus.ON_DUTY,
    "sleep": DutyStatus.SLEEPER_BERTH,
    "dropoff": DutyStatus.ON_DUTY,
    "off_duty": DutyStatus.OFF_DUTY,
}


def parse_datetime(val: Any) -> datetime:
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val
    dt = datetime.fromisoformat(str(val))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


class ELDLogGenerator:
    """
    Engine for generating FMCSA 24-hour Daily Log Sheets from an HOS schedule.
    """

    @staticmethod
    def map_event_type(hos_type: str) -> str:
        return HOS_TO_DUTY_STATUS.get(hos_type, DutyStatus.OFF_DUTY)

    def generate_daily_logs(
        self,
        events: List[Dict[str, Any]],
        trip=None,
        driver_info: Optional[Dict[str, Any]] = None,
        trip_info: Optional[Dict[str, Any]] = None,
        initial_cycle_used: float = 0.0,
        persist: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Splits timeline events into calendar days, ensures 24.0 hours per day,
        creates DailyLog and DutyEvent records (or returns dicts if persist=False).
        """
        if not events:
            return []

        default_driver = {
            "name": "John Doe",
            "license": "DL-987654321",
            "carrier": "Apex Logistics Inc.",
            "home_terminal": "Chicago, IL",
            "vehicle_number": "Truck #402",
            "trailer_number": "TR-881",
        }
        if driver_info:
            default_driver.update(driver_info)

        default_trip = {
            "origin": "Origin",
            "pickup": "Pickup Location",
            "dropoff": "Destination",
            "distance": 0.0,
            "duration": 0.0,
        }
        if trip_info:
            default_trip.update(trip_info)
        elif trip:
            default_trip.update(
                {
                    "origin": trip.current_location_name or trip.current_location,
                    "pickup": trip.pickup_name or trip.pickup_location,
                    "dropoff": trip.dropoff_name or trip.dropoff_location,
                    "distance": round((trip.distance_meters or 0) / 1609.34, 1),
                    "duration": round((trip.duration_seconds or 0) / 3600.0, 1),
                }
            )

        # 1. Parse timestamps for all input events
        parsed_events = []
        for e in events:
            st = parse_datetime(e["start_time"])
            et = parse_datetime(e["end_time"])
            orig_dur = (et - st).total_seconds() / 3600.0
            parsed_events.append(
                {
                    "hos_type": e.get("type", "off_duty"),
                    "status": self.map_event_type(e.get("type", "off_duty")),
                    "start_time": st,
                    "end_time": et,
                    "duration": orig_dur,
                    "distance": float(e.get("distance", 0.0)),
                    "location": e.get("location", ""),
                    "notes": e.get("notes", ""),
                }
            )

        parsed_events.sort(key=lambda x: x["start_time"])

        first_dt = parsed_events[0]["start_time"]
        last_dt = parsed_events[-1]["end_time"]

        # Day 1 starts at 00:00:00 on the date of the first event
        curr_day_start = datetime(
            first_dt.year, first_dt.month, first_dt.day, 0, 0, 0, tzinfo=timezone.utc
        )
        final_day_end = datetime(
            last_dt.year, last_dt.month, last_dt.day, 0, 0, 0, tzinfo=timezone.utc
        ) + timedelta(days=1)

        daily_results = []
        day_number = 1
        running_cycle_used = float(initial_cycle_used)

        if trip and persist:
            DailyLog.objects.filter(trip=trip).delete()

        while curr_day_start < final_day_end:
            curr_day_end = curr_day_start + timedelta(days=1)

            # Collect overlapping segments for this calendar day
            day_segments = []
            for pe in parsed_events:
                seg_st = max(pe["start_time"], curr_day_start)
                seg_et = min(pe["end_time"], curr_day_end)
                if seg_st < seg_et:
                    seg_dur = (seg_et - seg_st).total_seconds() / 3600.0
                    dist_prop = 0.0
                    if pe["duration"] > 0 and pe["distance"] > 0:
                        dist_prop = pe["distance"] * (seg_dur / pe["duration"])

                    day_segments.append(
                        {
                            "status": pe["status"],
                            "hos_type": pe["hos_type"],
                            "start_time": seg_st,
                            "end_time": seg_et,
                            "duration": round(seg_dur, 4),
                            "distance": round(dist_prop, 2),
                            "location": pe["location"],
                            "notes": pe["notes"],
                        }
                    )

            day_segments.sort(key=lambda x: x["start_time"])

            # Pad unassigned time gaps with OFF_DUTY to complete 24.0 hours
            padded_segments = []
            cursor = curr_day_start

            for seg in day_segments:
                if seg["start_time"] > cursor:
                    gap_dur = (seg["start_time"] - cursor).total_seconds() / 3600.0
                    padded_segments.append(
                        {
                            "status": DutyStatus.OFF_DUTY,
                            "hos_type": "off_duty",
                            "start_time": cursor,
                            "end_time": seg["start_time"],
                            "duration": round(gap_dur, 4),
                            "distance": 0.0,
                            "location": "Off Duty",
                            "notes": "Off duty rest",
                        }
                    )
                padded_segments.append(seg)
                cursor = seg["end_time"]

            if cursor < curr_day_end:
                gap_dur = (curr_day_end - cursor).total_seconds() / 3600.0
                padded_segments.append(
                    {
                        "status": DutyStatus.OFF_DUTY,
                        "hos_type": "off_duty",
                        "start_time": cursor,
                        "end_time": curr_day_end,
                        "duration": round(gap_dur, 4),
                        "distance": 0.0,
                        "location": "Off Duty",
                        "notes": "Off duty rest",
                    }
                )

            # Calculate daily totals
            driving_h = 0.0
            duty_h = 0.0
            sleeper_h = 0.0
            off_duty_h = 0.0
            day_distance = 0.0
            fuel_stops_count = 0
            rest_stops_count = 0

            graph_data = []

            for seg in padded_segments:
                d_h = seg["duration"]
                st_code = seg["status"]
                ht = seg["hos_type"]

                if st_code == DutyStatus.DRIVING:
                    driving_h += d_h
                    day_distance += seg["distance"]
                elif st_code == DutyStatus.ON_DUTY:
                    duty_h += d_h
                elif st_code == DutyStatus.SLEEPER_BERTH:
                    sleeper_h += d_h
                    rest_stops_count += 1
                elif st_code == DutyStatus.OFF_DUTY:
                    off_duty_h += d_h
                    if ht in ["break", "sleep"]:
                        rest_stops_count += 1

                if ht == "fuel":
                    fuel_stops_count += 1

                # Graph line coordinates: start_hour and end_hour from 0.0 to 24.0
                sh = (seg["start_time"] - curr_day_start).total_seconds() / 3600.0
                eh = (seg["end_time"] - curr_day_start).total_seconds() / 3600.0
                graph_data.append(
                    {
                        "status": st_code,
                        "start_hour": round(sh, 4),
                        "end_hour": round(eh, 4),
                        "duration": round(d_h, 2),
                        "location": seg["location"],
                        "notes": seg["notes"],
                    }
                )

                # Update 34-hour restart logic for cycle hours
                if ht == "off_duty" and d_h >= 34.0:
                    running_cycle_used = 0.0

            # Accumulate on-duty + driving into running cycle
            running_cycle_used += driving_h + duty_h

            summary_data = {
                "driving_hours": round(driving_h, 2),
                "duty_hours": round(duty_h, 2),
                "sleeper_hours": round(sleeper_h, 2),
                "off_duty_hours": round(off_duty_h, 2),
                "total_hours": round(driving_h + duty_h + sleeper_h + off_duty_h, 2),
                "total_distance": round(day_distance, 2),
                "fuel_stops": fuel_stops_count,
                "rest_stops": rest_stops_count,
                "cycle_used": round(running_cycle_used, 2),
            }

            daily_log_dict = {
                "day_number": day_number,
                "date": curr_day_start.date().isoformat(),
                "total_distance": round(day_distance, 2),
                "driving_hours": round(driving_h, 2),
                "duty_hours": round(duty_h, 2),
                "sleeper_hours": round(sleeper_h, 2),
                "off_duty_hours": round(off_duty_h, 2),
                "cycle_hours": round(running_cycle_used, 2),
                "graph_data": graph_data,
                "summary": summary_data,
                "driver_info": default_driver,
                "trip_info": default_trip,
                "duty_events": [
                    {
                        "type": seg["status"],
                        "start_time": seg["start_time"].isoformat(),
                        "end_time": seg["end_time"].isoformat(),
                        "duration": round(seg["duration"], 2),
                        "location": seg["location"],
                        "notes": seg["notes"],
                    }
                    for seg in padded_segments
                ],
            }

            if persist and trip:
                log_obj = DailyLog.objects.create(
                    trip=trip,
                    day_number=day_number,
                    date=curr_day_start.date(),
                    total_distance=round(day_distance, 2),
                    driving_hours=round(driving_h, 2),
                    duty_hours=round(duty_h, 2),
                    sleeper_hours=round(sleeper_h, 2),
                    off_duty_hours=round(off_duty_h, 2),
                    cycle_hours=round(running_cycle_used, 2),
                    graph_data=graph_data,
                    summary=summary_data,
                    driver_info=default_driver,
                    trip_info=default_trip,
                )
                daily_log_dict["id"] = str(log_obj.id)

                duty_event_objs = []
                for seg in padded_segments:
                    duty_event_objs.append(
                        DutyEvent(
                            daily_log=log_obj,
                            type=seg["status"],
                            start_time=seg["start_time"],
                            end_time=seg["end_time"],
                            duration=round(seg["duration"], 2),
                            location=seg["location"],
                            notes=seg["notes"],
                        )
                    )
                DutyEvent.objects.bulk_create(duty_event_objs)

            daily_results.append(daily_log_dict)

            day_number += 1
            curr_day_start = curr_day_end

        return daily_results
