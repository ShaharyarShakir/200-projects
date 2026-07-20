from .hos_engine import HOSConfig


class FuelEngine:
    """
    Handles fuel stop calculations based on trip mileage.
    """
    def __init__(self, config=HOSConfig):
        self.config = config

    def calculate_fuel_stops(self, total_distance: float) -> list[float]:
        """
        Returns a list of mile markers where fuel stops should occur.
        Rule: Fuel every 1,000 miles.
        """
        interval = self.config.FUEL_INTERVAL_MILES
        if total_distance <= 0 or interval <= 0:
            return []

        num_stops = int(total_distance // interval)
        # Avoid fuel stop exactly at destination end point
        stops = [i * interval for i in range(1, num_stops + 1) if i * interval < total_distance]
        return stops

    def distance_to_next_fuel(self, current_distance: float, next_milestone: float) -> float:
        """
        Returns distance remaining until the next fuel milestone.
        """
        return max(0.0, next_milestone - current_distance)
