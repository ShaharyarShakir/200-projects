class HOSConfig:
    """
    FMCSA Hours of Service (HOS) rules configuration.
    All properties are configurable constants.
    """

    MAX_DRIVING_HOURS = 11.0  # Max driving hours before 10 consecutive hours off
    MAX_DUTY_HOURS = 14.0  # Max duty window hours before driving is prohibited
    BREAK_AFTER_DRIVE_HOURS = 8.0  # Mandatory 30-min break after 8h driving
    BREAK_DURATION_HOURS = 0.5  # 30 minutes
    SLEEP_DURATION_HOURS = 10.0  # 10 hours sleeper berth / off-duty rest
    CYCLE_MAX_HOURS = 70.0  # 70 hours maximum in 8 days
    CYCLE_DAYS = 8  # 8 days
    CYCLE_RESTART_HOURS = 34.0  # 34 hours off-duty restart
    FUEL_INTERVAL_MILES = 1000.0  # Fuel stop required every 1,000 miles
    FUEL_DURATION_HOURS = 0.5  # 30 minutes for fuel stop
    PICKUP_DURATION_HOURS = 1.0  # 1 hour pickup (on-duty)
    DROPOFF_DURATION_HOURS = 1.0  # 1 hour dropoff (on-duty)


class HOSEngine:
    """
    HOS rules engine evaluating driving limits and remaining hours.
    """

    def __init__(self, config=HOSConfig):
        self.config = config

    def calculate_remaining_hours(
        self,
        drive_since_sleep: float,
        duty_since_sleep: float,
        drive_since_break: float,
        cycle_used: float,
    ) -> dict:
        """
        Returns remaining hours for driving, duty window, break requirement, and cycle.
        """
        remaining_drive = max(
            0.0, round(self.config.MAX_DRIVING_HOURS - drive_since_sleep, 2)
        )
        remaining_duty = max(
            0.0, round(self.config.MAX_DUTY_HOURS - duty_since_sleep, 2)
        )
        remaining_until_break = max(
            0.0, round(self.config.BREAK_AFTER_DRIVE_HOURS - drive_since_break, 2)
        )
        remaining_cycle = max(0.0, round(self.config.CYCLE_MAX_HOURS - cycle_used, 2))

        # Maximum allowed continuous driving before any rule requires a pause
        max_allowed_drive_now = min(
            remaining_drive, remaining_duty, remaining_until_break, remaining_cycle
        )

        return {
            "remaining_drive": remaining_drive,
            "remaining_duty": remaining_duty,
            "remaining_until_break": remaining_until_break,
            "remaining_cycle": remaining_cycle,
            "max_allowed_drive_now": max(0.0, round(max_allowed_drive_now, 2)),
        }
