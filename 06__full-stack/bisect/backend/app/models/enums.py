import enum


class StrEnum(str, enum.Enum):
    """Base string enum for readable serialized representation."""

    def __str__(self) -> str:
        return self.value


class RunStatus(StrEnum):
    """Lifecycle status states for an automated repair run."""

    PENDING = "PENDING"
    CLONING = "CLONING"
    RUNNING_TESTS = "RUNNING_TESTS"
    ANALYZING = "ANALYZING"
    PATCHING = "PATCHING"
    APPLYING = "APPLYING"
    CREATING_PR = "CREATING_PR"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class StepType(StrEnum):
    """Types of discrete execution steps within a run."""

    CLONE = "CLONE"
    RUN_TESTS = "RUN_TESTS"
    ANALYZE_FAILURE = "ANALYZE_FAILURE"
    GENERATE_PATCH = "GENERATE_PATCH"
    APPLY_PATCH = "APPLY_PATCH"
    CREATE_PR = "CREATE_PR"


class StepStatus(StrEnum):
    """Execution status for a single run step."""

    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
