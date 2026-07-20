from .hos_engine import HOSConfig


class CycleEngine:
    """
    Handles driver 70-hour / 8-day cycle calculations and validation.
    """
    def __init__(self, config=HOSConfig):
        self.config = config

    def validate_cycle(self, cycle_used: float) -> tuple[bool, str]:
        """
        Validates whether current cycle used is within valid bounds (0 to 70 hours).
        """
        if cycle_used < 0:
            return False, "Cycle hours cannot be negative."
        if cycle_used > self.config.CYCLE_MAX_HOURS:
            return False, f"Cycle hours cannot exceed max limit of {self.config.CYCLE_MAX_HOURS} hours."
        return True, ""

    def get_remaining_cycle(self, cycle_used: float) -> float:
        """
        Calculates remaining cycle hours available.
        """
        return max(0.0, round(self.config.CYCLE_MAX_HOURS - cycle_used, 2))

    def needs_restart(self, cycle_used: float) -> bool:
        """
        Determines if a 34-hour restart is required.
        """
        return cycle_used >= self.config.CYCLE_MAX_HOURS
