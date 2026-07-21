from typing import List, Dict, Any
from ..models import DutyStatus


ROW_Y_MAP = {
    DutyStatus.OFF_DUTY: 0,
    DutyStatus.SLEEPER_BERTH: 1,
    DutyStatus.DRIVING: 2,
    DutyStatus.ON_DUTY: 3,
}


class ELDGraphRenderer:
    """
    Renders 24-hour FMCSA Duty Status Graph Grids as clean SVG elements or ReportLab vector commands.
    """

    @staticmethod
    def generate_svg_elements(
        graph_data: List[Dict[str, Any]], width: float = 800, height: float = 200
    ) -> Dict[str, Any]:
        """
        Calculates normalized SVG path coordinates for the 4 duty status rows:
        Row 0: OFF_DUTY
        Row 1: SLEEPER_BERTH
        Row 2: DRIVING
        Row 3: ON_DUTY
        """
        margin_left = 100
        margin_right = 30
        margin_top = 30
        margin_bottom = 40

        chart_w = width - margin_left - margin_right
        chart_h = height - margin_top - margin_bottom

        row_height = chart_h / 4.0

        def get_x(hour: float) -> float:
            return margin_left + (hour / 24.0) * chart_w

        def get_y(status: str) -> float:
            row_idx = ROW_Y_MAP.get(status, 0)
            # Center line of row
            return margin_top + (row_idx + 0.5) * row_height

        path_commands = []
        prev_y = None
        prev_x = None

        for seg in graph_data:
            st = seg["status"]
            sh = seg["start_hour"]
            eh = seg["end_hour"]

            x1 = get_x(sh)
            x2 = get_x(eh)
            y = get_y(st)

            if prev_y is not None and prev_x is not None:
                # Vertical transition line
                path_commands.append(f"M {prev_x:.2f} {prev_y:.2f} L {x1:.2f} {y:.2f}")

            # Horizontal status line segment
            path_commands.append(f"M {x1:.2f} {y:.2f} L {x2:.2f} {y:.2f}")

            prev_x = x2
            prev_y = y

        return {
            "path_d": " ".join(path_commands),
            "width": width,
            "height": height,
            "margin_left": margin_left,
            "margin_right": margin_right,
            "margin_top": margin_top,
            "margin_bottom": margin_bottom,
            "chart_width": chart_w,
            "chart_height": chart_h,
            "row_height": row_height,
        }
