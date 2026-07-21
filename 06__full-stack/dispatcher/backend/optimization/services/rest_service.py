from typing import Dict, Any


class RestService:
    """
    Service for FMCSA HOS Rest Area and Sleeper Berth planning.
    """

    MAX_DRIVE_BEFORE_BREAK_HOURS = 8.0
    MANDATORY_BREAK_HOURS = 0.5  # 30 mins
    MAX_DAILY_DRIVE_HOURS = 11.0
    MANDATORY_SLEEP_HOURS = 10.0  # 10 hours
    MAX_CYCLE_HOURS = 70.0
    CYCLE_RESTART_HOURS = 34.0

    @classmethod
    def analyze_rest_needs(
        cls,
        driving_duration_hours: float,
        current_cycle_used: float = 0.0,
        avg_speed_mph: float = 55.0,
    ) -> Dict[str, Any]:
        """
        Determines how many 30-min breaks, 10-hr sleep rests, and 34-hr restarts are required.
        """
        breaks_30m = int(driving_duration_hours // cls.MAX_DRIVE_BEFORE_BREAK_HOURS)
        sleeps_10h = int(driving_duration_hours // cls.MAX_DAILY_DRIVE_HOURS)

        cycle_remaining = max(0.0, cls.MAX_CYCLE_HOURS - current_cycle_used)
        restarts_needed = 1 if driving_duration_hours > cycle_remaining else 0

        # Milestone distances in miles
        break_milestones_miles = [
            round((i + 1) * cls.MAX_DRIVE_BEFORE_BREAK_HOURS * avg_speed_mph, 1)
            for i in range(breaks_30m)
        ]

        sleep_milestones_miles = [
            round((i + 1) * cls.MAX_DAILY_DRIVE_HOURS * avg_speed_mph, 1)
            for i in range(sleeps_10h)
        ]

        return {
            "driving_duration_hours": round(driving_duration_hours, 2),
            "breaks_30m_needed": breaks_30m,
            "sleeps_10h_needed": sleeps_10h,
            "restarts_needed": restarts_needed,
            "break_milestones_miles": break_milestones_miles,
            "sleep_milestones_miles": sleep_milestones_miles,
        }
