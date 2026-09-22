import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.enums import RunStatus, StepStatus, StepType
from app.models.repository import Repository
from app.models.run import Run, RunStep
from app.models.user import User


@pytest.mark.asyncio
async def test_create_and_query_user(db_session: AsyncSession) -> None:
    """Test creating and retrieving a User."""
    user = User(
        github_user_id=123456,
        github_username="octocat",
        avatar_url="https://github.com/images/error/octocat_happy.gif",
        encrypted_token="encrypted_secret_token",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert isinstance(user.id, uuid.UUID)
    assert user.github_user_id == 123456
    assert user.github_username == "octocat"
    assert user.created_at is not None
    assert user.updated_at is not None

    # Query back
    result = await db_session.execute(
        select(User).where(User.github_user_id == 123456)
    )
    retrieved = result.scalars().first()
    assert retrieved is not None
    assert retrieved.id == user.id


@pytest.mark.asyncio
async def test_repository_and_relationships(db_session: AsyncSession) -> None:
    """Test Repository entity with foreign key and User relationship."""
    user = User(github_user_id=987654, github_username="devuser")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    repo = Repository(
        owner_id=user.id,
        github_repo_id=555111,
        full_name="devuser/sample-repo",
        default_branch="main",
        clone_url="https://github.com/devuser/sample-repo.git",
        is_private=False,
    )
    db_session.add(repo)
    await db_session.commit()
    await db_session.refresh(repo)

    assert isinstance(repo.id, uuid.UUID)
    assert repo.owner_id == user.id
    assert repo.default_branch == "main"
    assert repo.is_private is False


@pytest.mark.asyncio
async def test_run_and_run_step_lifecycle(db_session: AsyncSession) -> None:
    """Test Run state transitions and RunStep chronological entries."""
    user = User(github_user_id=112233, github_username="runner_user")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    repo = Repository(
        owner_id=user.id,
        github_repo_id=998877,
        full_name="runner_user/target-repo",
        clone_url="https://github.com/runner_user/target-repo.git",
    )
    db_session.add(repo)
    await db_session.commit()
    await db_session.refresh(repo)

    # 1. Create Run in PENDING
    run = Run(
        repository_id=repo.id,
        branch_name="bisect/fix-1",
        status=RunStatus.PENDING,
        max_retries=3,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    assert run.status == RunStatus.PENDING
    assert run.retry_count == 0
    assert run.max_retries == 3

    # 2. Add Step 1: CLONE
    step1 = RunStep(
        run_id=run.id,
        sequence=1,
        step_type=StepType.CLONE,
        status=StepStatus.COMPLETED,
        duration_ms=450.25,
        stdout="Cloning repository...",
    )
    db_session.add(step1)

    # 3. Add Step 2: RUN_TESTS
    step2 = RunStep(
        run_id=run.id,
        sequence=2,
        step_type=StepType.RUN_TESTS,
        status=StepStatus.FAILED,
        duration_ms=1200.50,
        stderr="AssertionError: 2 != 3 in test_math.py:12",
    )
    db_session.add(step2)

    # Transition run status
    run.status = RunStatus.ANALYZING
    db_session.add(run)
    await db_session.commit()

    # Query steps
    result = await db_session.execute(
        select(RunStep).where(RunStep.run_id == run.id).order_by(RunStep.sequence)
    )
    steps = result.scalars().all()
    assert len(steps) == 2
    assert steps[0].step_type == StepType.CLONE
    assert steps[0].status == StepStatus.COMPLETED
    assert steps[1].step_type == StepType.RUN_TESTS
    assert steps[1].status == StepStatus.FAILED


@pytest.mark.asyncio
async def test_cascade_delete(db_session: AsyncSession) -> None:
    """Test that deleting a repository or run cascades correctly."""
    user = User(github_user_id=445566, github_username="cascade_user")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    repo = Repository(
        owner_id=user.id,
        github_repo_id=332211,
        full_name="cascade_user/cascade-repo",
        clone_url="https://github.com/cascade_user/cascade-repo.git",
    )
    db_session.add(repo)
    await db_session.commit()
    await db_session.refresh(repo)

    run = Run(repository_id=repo.id, branch_name="main")
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    step = RunStep(
        run_id=run.id,
        sequence=1,
        step_type=StepType.RUN_TESTS,
        status=StepStatus.COMPLETED,
    )
    db_session.add(step)
    await db_session.commit()

    # Delete repository
    await db_session.delete(repo)
    await db_session.commit()

    # Verify run and step are cascade deleted
    run_query = await db_session.execute(select(Run).where(Run.id == run.id))
    assert run_query.scalars().first() is None

    step_query = await db_session.execute(select(RunStep).where(RunStep.id == step.id))
    assert step_query.scalars().first() is None
