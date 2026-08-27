import logging

from app.models.caption import Caption
from app.models.qa import QACategory, QASeverity
from app.qa.models import QAIssue

logger = logging.getLogger(__name__)


def check_captions_quality(captions: list[Caption], total_duration_ms: int = 60000) -> list[QAIssue]:
    """Validates subtitle and dialogue overlay caption bounds, empty text, and overlaps."""
    issues: list[QAIssue] = []

    if not captions:
        issues.append(
            QAIssue(
                category=QACategory.CAPTIONS,
                severity=QASeverity.WARNING,
                code="NO_CAPTIONS",
                message="Video timeline has no captions.",
                repairable=True,
            )
        )
        return issues

    sorted_caps = sorted(captions, key=lambda c: c.start_ms)

    for i, cap in enumerate(sorted_caps):
        if not cap.text or not cap.text.strip():
            issues.append(
                QAIssue(
                    category=QACategory.CAPTIONS,
                    severity=QASeverity.ERROR,
                    code="EMPTY_CAPTION",
                    message=f"Caption entry starting at {cap.start_ms}ms is empty.",
                    repairable=True,
                )
            )

        if cap.start_ms < 0 or cap.end_ms > total_duration_ms + 1000:
            issues.append(
                QAIssue(
                    category=QACategory.CAPTIONS,
                    severity=QASeverity.ERROR,
                    code="CAPTION_OUT_OF_BOUNDS",
                    message=f"Caption '{cap.text[:20]}...' ({cap.start_ms}ms - {cap.end_ms}ms) is outside video duration ({total_duration_ms}ms).",
                    repairable=True,
                )
            )

        if cap.end_ms <= cap.start_ms:
            issues.append(
                QAIssue(
                    category=QACategory.CAPTIONS,
                    severity=QASeverity.ERROR,
                    code="INVALID_CAPTION_TIMING",
                    message=f"Caption '{cap.text[:20]}...' end time ({cap.end_ms}ms) <= start time ({cap.start_ms}ms).",
                    repairable=True,
                )
            )

        if i > 0:
            prev = sorted_caps[i - 1]
            if cap.start_ms < prev.end_ms - 50:
                issues.append(
                    QAIssue(
                        category=QACategory.CAPTIONS,
                        severity=QASeverity.WARNING,
                        code="CAPTION_OVERLAP",
                        message=f"Caption '{cap.text[:20]}...' overlaps with previous caption '{prev.text[:20]}...'.",
                        repairable=True,
                    )
                )

    return issues
