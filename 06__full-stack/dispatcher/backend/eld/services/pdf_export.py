import io
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Rect, Line, String
from ..models import DutyStatus


ROW_Y_INDEX = {
    DutyStatus.OFF_DUTY: 0,
    DutyStatus.SLEEPER_BERTH: 1,
    DutyStatus.DRIVING: 2,
    DutyStatus.ON_DUTY: 3,
}


def draw_fmcsa_grid(
    graph_data: List[Dict[str, Any]], width: float = 520, height: float = 140
) -> Drawing:
    """
    Generates a ReportLab Drawing object representing the standard 24-hour FMCSA grid.
    """
    d = Drawing(width, height)

    label_w = 110
    total_col_w = 40
    chart_w = width - label_w - total_col_w
    chart_h = height - 30  # Leave room for hour numbers at top & bottom

    chart_x = label_w
    chart_y = 15

    row_h = chart_h / 4.0

    # Grid background & border
    d.add(
        Rect(
            chart_x,
            chart_y,
            chart_w,
            chart_h,
            fillColor=colors.HexColor("#f8fafc"),
            strokeColor=colors.HexColor("#64748b"),
            strokeWidth=1,
        )
    )

    # Labels for rows
    labels = ["1. OFF DUTY", "2. SLEEPER BERTH", "3. DRIVING", "4. ON DUTY"]
    for i, lbl in enumerate(labels):
        # Y coordinate from bottom
        y_center = chart_y + chart_h - (i + 0.5) * row_h
        d.add(
            String(
                10,
                y_center - 4,
                lbl,
                fontName="Helvetica-Bold",
                fontSize=8,
                fillColor=colors.HexColor("#1e293b"),
            )
        )
        # Horizontal row divider line
        if i > 0:
            y_div = chart_y + chart_h - i * row_h
            d.add(
                Line(
                    chart_x,
                    y_div,
                    chart_x + chart_w,
                    y_div,
                    strokeColor=colors.HexColor("#cbd5e1"),
                    strokeWidth=0.5,
                )
            )

    # 24 Hour columns & ticks
    for hr in range(25):
        x = chart_x + (hr / 24.0) * chart_w
        # Major vertical line
        d.add(
            Line(
                x,
                chart_y,
                x,
                chart_y + chart_h,
                strokeColor=colors.HexColor("#e2e8f0" if hr % 2 != 0 else "#94a3b8"),
                strokeWidth=0.5 if hr % 2 != 0 else 1,
            )
        )

        # Hour numbers
        if hr % 2 == 0 or hr == 24:
            hr_str = "M" if hr in (0, 24) else ("N" if hr == 12 else str(hr))
            d.add(
                String(
                    x - 3,
                    chart_y + chart_h + 4,
                    hr_str,
                    fontName="Helvetica",
                    fontSize=7,
                    fillColor=colors.HexColor("#475569"),
                )
            )
            d.add(
                String(
                    x - 3,
                    chart_y - 10,
                    hr_str,
                    fontName="Helvetica",
                    fontSize=7,
                    fillColor=colors.HexColor("#475569"),
                )
            )

        # Half-hour tick marks
        if hr < 24:
            x_half = chart_x + ((hr + 0.5) / 24.0) * chart_w
            d.add(
                Line(
                    x_half,
                    chart_y + chart_h - 4,
                    x_half,
                    chart_y + chart_h,
                    strokeColor=colors.HexColor("#cbd5e1"),
                    strokeWidth=0.5,
                )
            )
            d.add(
                Line(
                    x_half,
                    chart_y,
                    x_half,
                    chart_y + 4,
                    strokeColor=colors.HexColor("#cbd5e1"),
                    strokeWidth=0.5,
                )
            )

    # Totals column label
    d.add(
        String(
            chart_x + chart_w + 8,
            chart_y + chart_h + 4,
            "HOURS",
            fontName="Helvetica-Bold",
            fontSize=7,
            fillColor=colors.HexColor("#475569"),
        )
    )

    # Calculate row totals
    row_totals = {
        DutyStatus.OFF_DUTY: 0.0,
        DutyStatus.SLEEPER_BERTH: 0.0,
        DutyStatus.DRIVING: 0.0,
        DutyStatus.ON_DUTY: 0.0,
    }
    for seg in graph_data:
        st = seg["status"]
        if st in row_totals:
            row_totals[st] += seg["duration"]

    for i, st in enumerate(
        [
            DutyStatus.OFF_DUTY,
            DutyStatus.SLEEPER_BERTH,
            DutyStatus.DRIVING,
            DutyStatus.ON_DUTY,
        ]
    ):
        y_center = chart_y + chart_h - (i + 0.5) * row_h
        tot_str = f"{row_totals[st]:.1f}"
        d.add(
            String(
                chart_x + chart_w + 10,
                y_center - 4,
                tot_str,
                fontName="Helvetica-Bold",
                fontSize=8,
                fillColor=colors.HexColor("#0f172a"),
            )
        )

    # Draw duty status blue timeline path
    prev_x = None
    prev_y = None

    for seg in graph_data:
        st = seg["status"]
        sh = seg["start_hour"]
        eh = seg["end_hour"]

        row_idx = ROW_Y_INDEX.get(st, 0)
        y = chart_y + chart_h - (row_idx + 0.5) * row_h

        x1 = chart_x + (sh / 24.0) * chart_w
        x2 = chart_x + (eh / 24.0) * chart_w

        if prev_x is not None and prev_y is not None:
            # Vertical transition line
            d.add(
                Line(
                    prev_x,
                    prev_y,
                    x1,
                    y,
                    strokeColor=colors.HexColor("#2563eb"),
                    strokeWidth=2.5,
                )
            )

        # Horizontal status line
        d.add(
            Line(x1, y, x2, y, strokeColor=colors.HexColor("#2563eb"), strokeWidth=2.5)
        )

        prev_x = x2
        prev_y = y

    return d


class ELDPDFExporter:
    """
    Generates downloadable FMCSA-compliant Daily Log Sheet PDF documents using ReportLab.
    """

    def export_pdf(self, daily_logs: List[Dict[str, Any]]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            textColor=colors.HexColor("#1e293b"),
            alignment=0,
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#2563eb"),
        )

        header_label_style = ParagraphStyle(
            "HLabel",
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=8,
            textColor=colors.HexColor("#64748b"),
        )

        header_val_style = ParagraphStyle(
            "HVal",
            fontName="Helvetica",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#0f172a"),
        )

        table_header_style = ParagraphStyle(
            "TH",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#ffffff"),
        )

        table_cell_style = ParagraphStyle(
            "TC",
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1e293b"),
        )

        story = []

        for idx, log in enumerate(daily_logs):
            if idx > 0:
                story.append(PageBreak())

            d_info = log.get("driver_info", {})
            t_info = log.get("trip_info", {})
            summary = log.get("summary", {})

            # Title Header
            header_table_data = [
                [
                    Paragraph("FMCSA DRIVER'S DAILY LOG", title_style),
                    Paragraph(
                        f"DAY #{log.get('day_number')} &nbsp;|&nbsp; DATE: <b>{log.get('date')}</b>",
                        subtitle_style,
                    ),
                ]
            ]
            header_table = Table(header_table_data, colWidths=[300, 240])
            header_table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                    ]
                )
            )
            story.append(header_table)
            story.append(Spacer(1, 10))

            # Driver & Carrier Info Box
            info_data = [
                [
                    Paragraph("DRIVER NAME", header_label_style),
                    Paragraph("LICENSE NUMBER", header_label_style),
                    Paragraph("CARRIER NAME", header_label_style),
                    Paragraph("HOME TERMINAL", header_label_style),
                ],
                [
                    Paragraph(str(d_info.get("name", "N/A")), header_val_style),
                    Paragraph(str(d_info.get("license", "N/A")), header_val_style),
                    Paragraph(str(d_info.get("carrier", "N/A")), header_val_style),
                    Paragraph(
                        str(d_info.get("home_terminal", "N/A")), header_val_style
                    ),
                ],
                [
                    Paragraph("VEHICLE NUMBER", header_label_style),
                    Paragraph("TRAILER NUMBER", header_label_style),
                    Paragraph("ORIGIN", header_label_style),
                    Paragraph("DESTINATION", header_label_style),
                ],
                [
                    Paragraph(
                        str(d_info.get("vehicle_number", "N/A")), header_val_style
                    ),
                    Paragraph(
                        str(d_info.get("trailer_number", "N/A")), header_val_style
                    ),
                    Paragraph(str(t_info.get("origin", "N/A")), header_val_style),
                    Paragraph(str(t_info.get("dropoff", "N/A")), header_val_style),
                ],
            ]

            info_table = Table(info_data, colWidths=[135, 135, 135, 135])
            info_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                        (
                            "INNERGRID",
                            (0, 0),
                            (-1, -1),
                            0.5,
                            colors.HexColor("#cbd5e1"),
                        ),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            story.append(info_table)
            story.append(Spacer(1, 12))

            # 24-Hour Duty Status Graph Grid
            grid_drawing = draw_fmcsa_grid(
                log.get("graph_data", []), width=540, height=135
            )
            story.append(grid_drawing)
            story.append(Spacer(1, 14))

            # Daily Summary Banner
            summary_data = [
                [
                    Paragraph("TOTAL MILES", header_label_style),
                    Paragraph("DRIVING HOURS", header_label_style),
                    Paragraph("ON DUTY HOURS", header_label_style),
                    Paragraph("SLEEPER HOURS", header_label_style),
                    Paragraph("OFF DUTY HOURS", header_label_style),
                    Paragraph("CYCLE USED", header_label_style),
                ],
                [
                    Paragraph(
                        f"<b>{summary.get('total_distance', 0)} mi</b>",
                        header_val_style,
                    ),
                    Paragraph(
                        f"<b>{summary.get('driving_hours', 0)} h</b>", header_val_style
                    ),
                    Paragraph(
                        f"<b>{summary.get('duty_hours', 0)} h</b>", header_val_style
                    ),
                    Paragraph(
                        f"<b>{summary.get('sleeper_hours', 0)} h</b>", header_val_style
                    ),
                    Paragraph(
                        f"<b>{summary.get('off_duty_hours', 0)} h</b>", header_val_style
                    ),
                    Paragraph(
                        f"<b>{summary.get('cycle_used', 0)} h</b>", header_val_style
                    ),
                ],
            ]
            summary_table = Table(summary_data, colWidths=[90, 90, 90, 90, 90, 90])
            summary_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
                        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#bfdbfe")),
                        (
                            "INNERGRID",
                            (0, 0),
                            (-1, -1),
                            0.5,
                            colors.HexColor("#93c5fd"),
                        ),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            story.append(summary_table)
            story.append(Spacer(1, 14))

            # Duty Events Table
            events_header = [
                Paragraph("STATUS", table_header_style),
                Paragraph("START", table_header_style),
                Paragraph("END", table_header_style),
                Paragraph("DURATION", table_header_style),
                Paragraph("LOCATION", table_header_style),
                Paragraph("REMARKS / NOTES", table_header_style),
            ]

            events_rows = [events_header]

            for ev in log.get("duty_events", []):
                st_time = (
                    ev.get("start_time", "").split("T")[-1][:5]
                    if "T" in ev.get("start_time", "")
                    else ev.get("start_time", "")
                )
                end_time = (
                    ev.get("end_time", "").split("T")[-1][:5]
                    if "T" in ev.get("end_time", "")
                    else ev.get("end_time", "")
                )

                status_disp = ev.get("type", "").replace("_", " ")

                events_rows.append(
                    [
                        Paragraph(status_disp, table_cell_style),
                        Paragraph(st_time, table_cell_style),
                        Paragraph(end_time, table_cell_style),
                        Paragraph(f"{ev.get('duration', 0)} h", table_cell_style),
                        Paragraph(ev.get("location", ""), table_cell_style),
                        Paragraph(ev.get("notes", ""), table_cell_style),
                    ]
                )

            events_table = Table(events_rows, colWidths=[85, 45, 45, 55, 140, 170])
            events_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ]
                )
            )
            story.append(events_table)
            story.append(Spacer(1, 14))

            # Certification / Signature
            sig_data = [
                [
                    Paragraph(
                        "I CERTIFY THAT THESE ENTRIES ARE TRUE AND CORRECT:",
                        header_label_style,
                    ),
                    Paragraph(
                        "DRIVER SIGNATURE: _______________________", header_label_style
                    ),
                    Paragraph("DATE: ____________", header_label_style),
                ]
            ]
            sig_table = Table(sig_data, colWidths=[240, 200, 100])
            sig_table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ]
                )
            )
            story.append(sig_table)

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
