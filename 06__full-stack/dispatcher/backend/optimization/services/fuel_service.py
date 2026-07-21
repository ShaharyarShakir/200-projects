from typing import Dict, Any


class FuelService:
    """
    Service for commercial truck fuel planning and cost estimation.
    """

    DEFAULT_MPG = 6.5  # Miles per gallon for heavy-duty truck
    DEFAULT_TANK_CAPACITY_GALLONS = 150.0  # Gallons
    DEFAULT_RESERVE_PERCENT = 0.15  # Refuel when 15% tank remains
    DEFAULT_FUEL_PRICE_PER_GALLON = 3.85  # USD

    @classmethod
    def calculate_fuel_requirements(
        cls,
        distance_miles: float,
        mpg: float = DEFAULT_MPG,
        tank_capacity: float = DEFAULT_TANK_CAPACITY_GALLONS,
        reserve_percent: float = DEFAULT_RESERVE_PERCENT,
        avg_price_per_gallon: float = DEFAULT_FUEL_PRICE_PER_GALLON,
    ) -> Dict[str, Any]:
        """
        Calculates fuel stop intervals, total fuel volume needed, and estimated cost.
        """
        if mpg <= 0:
            mpg = cls.DEFAULT_MPG
        if distance_miles <= 0:
            distance_miles = 0.0

        effective_range_miles = tank_capacity * mpg * (1.0 - reserve_percent)
        gallons_needed = distance_miles / mpg
        estimated_cost = gallons_needed * avg_price_per_gallon
        fuel_stops_needed = int(distance_miles // effective_range_miles)

        return {
            "distance_miles": round(distance_miles, 1),
            "mpg": mpg,
            "tank_capacity_gallons": tank_capacity,
            "effective_fuel_range_miles": round(effective_range_miles, 1),
            "gallons_needed": round(gallons_needed, 1),
            "estimated_fuel_cost": round(estimated_cost, 2),
            "fuel_stops_needed": fuel_stops_needed,
            "avg_price_per_gallon": avg_price_per_gallon,
        }
