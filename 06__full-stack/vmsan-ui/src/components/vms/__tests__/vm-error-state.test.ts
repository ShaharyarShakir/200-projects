import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VMErrorState } from "../vm-error-state";

describe("VMErrorState", () => {
  it("renders default error message when no error provided", () => {
    const html = renderToStaticMarkup(React.createElement(VMErrorState));
    assert.match(html, /Unable to load virtual machines/i);
    assert.match(html, /Failed to fetch virtual machines from the server/i);
    assert.match(html, /role="alert"/);
  });

  it("renders string error message correctly", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMErrorState, { error: "Network connection refused" })
    );
    assert.match(html, /Network connection refused/);
  });

  it("renders Error instance message correctly", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMErrorState, { error: new Error("Server timeout 504") })
    );
    assert.match(html, /Server timeout 504/);
  });

  it("renders retry button when onRetry is provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMErrorState, { onRetry: () => {} })
    );
    assert.match(html, /Retry/);
  });

  it("renders retrying state when isRetrying is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMErrorState, { onRetry: () => {}, isRetrying: true })
    );
    assert.match(html, /Retrying\.\.\./);
    assert.match(html, /disabled/);
  });
});
