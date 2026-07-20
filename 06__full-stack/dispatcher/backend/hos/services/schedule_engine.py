from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from .hos_engine import HOSConfig, HOSEngine
from .cycle_engine import CycleEngine
from .fuel_engine import FuelEngine


class ScheduleEngine:
    """
    Main HOS Driving Schedule Generator.
    Transforms route distance, duration, and driver cycle hours into an ordered event timeline.
    """
    def __init__(self, config=HOSConfig):
        self.config = config
        self.hos_engine = HOSEngine(config)
        self.cycle_engine = CycleEngine(config)
        self.fuel_engine = FuelEngine(config)

    def generate_schedule(
        self,
        distance: float,
        duration: float,
        cycle_used: float,
        start_datetime: Optional[datetime] = None,
        origin_name: str = "Origin",
        pickup_name: str = "Pickup Location",
        dropoff_name: str = "Destination"
    ) -> Dict[str, Any]:
        """
        Generates an ordered timeline of HOS events.

        :param distance: Total distance in miles (or km)
        :param duration: Total estimated driving duration in hours
        :param cycle_used: Initial cycle hours used prior to trip (0..70)
        :param start_datetime: Schedule start time (defaults to today 08:00 UTC if None)
        :param origin_name: Start location description
        :param pickup_name: Pickup location description
        :param dropoff_name: Dropoff location description
        :return: Dict containing list of events, summary statistics, and final HOS status.
        """

        # Input validations
        if distance <= 0:
            raise ValueError("Distance must be greater than zero.")
        if duration <= 0:
            raise ValueError("Duration must be greater than zero.")
        
        valid_cycle, msg = self.cycle_engine.validate_cycle(cycle_used)
        if not valid_cycle:
            raise ValueError(msg)

        if start_datetime is None:
            now = datetime.now(timezone.utc)
            start_datetime = datetime(now.year, now.month, now.day, 8, 0, 0, tzinfo=timezone.utc)

        # Average driving speed (units / hour)
        avg_speed = distance / duration

        # Internal state tracking
        curr_time = start_datetime
        dist_covered = 0.0
        remaining_drive_hours = float(duration)
        
        drive_since_sleep = 0.0
        duty_since_sleep = 0.0
        drive_since_break = 0.0
        current_cycle_used = float(cycle_used)

        next_fuel_milestone = self.config.FUEL_INTERVAL_MILES

        events: List[Dict[str, Any]] = []
        order_counter = 1

        def add_event(event_type: str, hours: float, dist: float, location: str, notes: str):
            nonlocal curr_time, order_counter
            start_t = curr_time
            end_t = curr_time + timedelta(hours=hours)
            curr_time = end_t

            events.append({
                "order": order_counter,
                "type": event_type,
                "hours": round(hours, 2),
                "minutes": int(round(hours * 60)),
                "start_time": start_t.isoformat(),
                "end_time": end_t.isoformat(),
                "distance": round(dist, 2),
                "location": location,
                "notes": notes
            })
            order_counter += 1

        # 1. Pickup Event (1 hour on duty)
        pickup_duration = self.config.PICKUP_DURATION_HOURS
        duty_since_sleep += pickup_duration
        current_cycle_used += pickup_duration
        add_event("pickup", pickup_duration, 0.0, pickup_name, "Pickup cargo & pre-trip inspection")

        # 2. Main Driving Loop
        while remaining_drive_hours > 0.001:
            # Check cycle limit before driving
            if current_cycle_used >= self.config.CYCLE_MAX_HOURS:
                # Need 34h restart
                restart_dur = self.config.CYCLE_RESTART_HOURS
                add_event("off_duty", restart_dur, 0.0, "Rest Area", "34-Hour Weekly Cycle Restart")
                current_cycle_used = 0.0
                drive_since_sleep = 0.0
                duty_since_sleep = 0.0
                drive_since_break = 0.0

            # Calculate drive capacity until limits
            break_cap = max(0.0, self.config.BREAK_AFTER_DRIVE_HOURS - drive_since_break)
            sleep_drive_cap = max(0.0, self.config.MAX_DRIVING_HOURS - drive_since_sleep)
            sleep_duty_cap = max(0.0, self.config.MAX_DUTY_HOURS - duty_since_sleep)
            cycle_cap = max(0.0, self.config.CYCLE_MAX_HOURS - current_cycle_used)

            # Fuel stop capacity
            dist_to_fuel = max(0.0, next_fuel_milestone - dist_covered)
            fuel_cap = dist_to_fuel / avg_speed if avg_speed > 0 else 999.0

            # Find maximum allowed drive segment
            allowed_drive = min(
                break_cap,
                sleep_drive_cap,
                sleep_duty_cap,
                cycle_cap,
                fuel_cap,
                remaining_drive_hours
            )

            # If duty window or driving limit is exhausted before driving can occur, force a 10h sleep
            if allowed_drive <= 0.001:
                if sleep_drive_cap <= 0.001 or sleep_duty_cap <= 0.001:
                    sleep_dur = self.config.SLEEP_DURATION_HOURS
                    add_event("sleep", sleep_dur, 0.0, "Rest Area / Sleeper", "10-Hour Mandatory Sleeper Berth Rest")
                    drive_since_sleep = 0.0
                    duty_since_sleep = 0.0
                    drive_since_break = 0.0
                    continue
                elif break_cap <= 0.001:
                    break_dur = self.config.BREAK_DURATION_HOURS
                    add_event("break", break_dur, 0.0, "Rest Area", "30-Minute Mandatory Driving Break")
                    duty_since_sleep += break_dur
                    current_cycle_used += break_dur
                    drive_since_break = 0.0
                    continue

            # Drive segment
            segment_dist = allowed_drive * avg_speed
            add_event(
                "drive",
                allowed_drive,
                segment_dist,
                f"Mile {round(dist_covered + segment_dist, 1)}",
                f"Driving segment ({round(segment_dist, 1)} miles)"
            )

            # Update counters after drive segment
            dist_covered += segment_dist
            remaining_drive_hours -= allowed_drive
            drive_since_sleep += allowed_drive
            duty_since_sleep += allowed_drive
            drive_since_break += allowed_drive
            current_cycle_used += allowed_drive

            # Evaluate triggers after drive segment
            # A) Fuel milestone hit?
            if abs(dist_covered - next_fuel_milestone) < 0.1 or dist_covered > next_fuel_milestone:
                fuel_dur = self.config.FUEL_DURATION_HOURS
                add_event("fuel", fuel_dur, 0.0, f"Fuel Station (Mile {round(dist_covered, 1)})", "Refuel & 30-min Stop")
                duty_since_sleep += fuel_dur
                current_cycle_used += fuel_dur
                next_fuel_milestone += self.config.FUEL_INTERVAL_MILES

            # B) 11h driving or 14h duty window limit hit?
            if drive_since_sleep >= self.config.MAX_DRIVING_HOURS - 0.001 or duty_since_sleep >= self.config.MAX_DUTY_HOURS - 0.001:
                if remaining_drive_hours > 0.001:
                    sleep_dur = self.config.SLEEP_DURATION_HOURS
                    add_event("sleep", sleep_dur, 0.0, "Sleeper Berth", "10-Hour Sleeper Berth Rest")
                    drive_since_sleep = 0.0
                    duty_since_sleep = 0.0
                    drive_since_break = 0.0

            # C) 8h driving break limit hit?
            elif drive_since_break >= self.config.BREAK_AFTER_DRIVE_HOURS - 0.001:
                if remaining_drive_hours > 0.001:
                    break_dur = self.config.BREAK_DURATION_HOURS
                    add_event("break", break_dur, 0.0, "Rest Area", "30-Minute Mandatory Driving Break")
                    duty_since_sleep += break_dur
                    current_cycle_used += break_dur
                    drive_since_break = 0.0

        # 3. Dropoff Event (1 hour on duty)
        dropoff_duration = self.config.DROPOFF_DURATION_HOURS
        duty_since_sleep += dropoff_duration
        current_cycle_used += dropoff_duration
        add_event("dropoff", dropoff_duration, 0.0, dropoff_name, "Unload cargo & post-trip inspection")

        # Driver remaining status after trip
        status = self.hos_engine.calculate_remaining_hours(
            drive_since_sleep,
            duty_since_sleep,
            drive_since_break,
            current_cycle_used
        )

        return {
            "distance": round(distance, 2),
            "duration": round(duration, 2),
            "initial_cycle_used": round(cycle_used, 2),
            "final_cycle_used": round(current_cycle_used, 2),
            "total_trip_elapsed_hours": round((curr_time - start_datetime).total_seconds() / 3600.0, 2),
            "start_time": start_datetime.isoformat(),
            "end_time": curr_time.isoformat(),
            "status": status,
            "events": events
        }
