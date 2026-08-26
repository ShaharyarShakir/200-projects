from langgraph.graph import StateGraph, START, END

from app.ai.graph.nodes import (
    planner_node,
    writer_node,
    validator_node,
    persist_node,
)
from app.ai.graph.state import StoryGenerationState


def route_validation(state: StoryGenerationState) -> str:
    """Routes based on validation errors and retry limits."""
    errors = state.get("validation_errors", [])
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 2)

    if errors and retry_count < max_retries:
        return "writer"
    return "persist"


def build_story_graph():
    builder = StateGraph(StoryGenerationState)

    builder.add_node("planner", planner_node)
    builder.add_node("writer", writer_node)
    builder.add_node("validator", validator_node)
    builder.add_node("persist", persist_node)

    builder.add_edge(START, "planner")
    builder.add_edge("planner", "writer")
    builder.add_edge("writer", "validator")

    builder.add_conditional_edges(
        "validator",
        route_validation,
        {
            "writer": "writer",
            "persist": "persist",
        },
    )

    builder.add_edge("persist", END)

    return builder.compile()


story_graph = build_story_graph()
