# Tasks

## 1. Action Models and Schemas

- [x] 1.1 Implement structured Pydantic models for `RunCommandAction`, `InspectFileAction`, `FinishAction`, and `AgentAction` envelope in `backend/app/schemas/actions.py` and verify with unit tests in `backend/tests/test_agent_actions.py`
- [x] 1.2 Implement `ActionResult` models (`CommandActionResult`, `InspectFileActionResult`, `ActionErrorResult`) in `backend/app/schemas/actions.py` and verify serialization and deserialization in tests

## 2. Action Parsing and Validation

- [x] 2.1 Implement `ActionParser` in `backend/app/services/agent/parser.py` supporting markdown JSON block extraction and robust syntax error reporting, and verify with tests for fenced JSON, raw JSON, and corrupted text
- [x] 2.2 Implement action validation rules in `backend/app/services/agent/validator.py` ensuring command safety, workspace path constraints for file inspection, and rejection of disallowed action types, and verify with unit tests

## 3. Sandboxed Action Dispatcher

- [x] 3.1 Implement `ActionDispatcher` in `backend/app/services/agent/dispatcher.py` to route validated actions to the `Sandbox` interface (`run_command` via `sandbox.execute`, `inspect_file` via container file read), and verify with mock sandbox tests
- [x] 3.2 Add execution error handling in `ActionDispatcher` to normalize command exit codes, timeouts, and missing files into structured `ActionResult` objects, and verify with error simulation tests

## 4. Agent Execution Loop Coordinator

- [x] 4.1 Define `LoopConfig`, `LoopStep`, and `LoopResult` models in `backend/app/schemas/actions.py` or `backend/app/schemas/agent.py` and verify configuration defaults
- [x] 4.2 Implement `AgentExecutionLoop` in `backend/app/services/agent/loop.py` managing system prompt setup, conversation state, LLM invocations, action parsing, validation, sandbox execution, and feedback message formatting
- [x] 4.3 Implement bounded loop termination logic in `AgentExecutionLoop` (finish action, max iteration limits, consecutive error limit, timeout), and verify with async unit tests

## 5. End-to-End Integration and Verification

- [x] 5.1 Implement comprehensive integration tests in `backend/tests/test_agent_execution_loop.py` simulating multi-turn agent problem-solving scenarios (file inspection, command execution, error recovery, finish)
- [x] 5.2 Execute full test suite via `pytest` to confirm 100% test pass rate across backend models, agent provider, sandbox, and execution loop components
