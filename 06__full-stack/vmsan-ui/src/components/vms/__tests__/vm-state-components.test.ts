import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmDetailSkeleton } from "../vm-detail-skeleton";
import { VmNotFound } from "../vm-not-found";
import { VmDetailError } from "../vm-detail-error";

describe("VmDetailSkeleton", () => {
  it("renders status role with accessible loading text", () => {
    const html = renderToStaticMarkup(React.createElement(VmDetailSkeleton));
    assert.match(html, /role="status"/);
    assert.match(html, /aria-label="Loading virtual machine details\.\.\."/);
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /animate-pulse/);
  });
});

describe("VmNotFound", () => {
  it("renders 404 message and back link", () => {
    const html = renderToStaticMarkup(React.createElement(VmNotFound, { vmId: "vm-missing-1" }));
    assert.match(html, /Virtual machine not found/);
    assert.match(html, /vm-missing-1/);
    assert.match(html, /Back to Virtual Machines/);
    assert.match(html, /href="\/"/);
  });
});

describe("VmDetailError", () => {
  it("renders error message, retry button and back link", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmDetailError, {
        error: "Manager service unavailable",
        vmId: "vm-err-1",
        onRetry: () => {},
      })
    );
    assert.match(html, /Failed to load virtual machine/);
    assert.match(html, /Manager service unavailable/);
    assert.match(html, /Retry/);
    assert.match(html, /Back to Virtual Machines/);
    assert.match(html, /href="\/"/);
  });
});
