import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmOverviewCard } from "../vm-overview-card";
import type { ClientVM } from "@/lib/api/types";

const mockVm: ClientVM = {
  id: "vm-test-123",
  status: "running",
  runtime: "base",
  vcpus: 2,
  memoryMiB: 512,
  diskSizeGb: 10,
  createdAt: "2026-09-29T10:00:00.000Z",
  age: "1d 2h",
};

describe("VmOverviewCard", () => {
  it("renders VM ID, status badge, and runtime environment", () => {
    const html = renderToStaticMarkup(React.createElement(VmOverviewCard, { vm: mockVm }));

    assert.match(html, /vm-test-123/);
    assert.match(html, /Running/);
    assert.match(html, /base/);
    assert.match(html, /Copy/);
  });

  it("renders Stop button for running status", () => {
    const html = renderToStaticMarkup(React.createElement(VmOverviewCard, { vm: mockVm }));
    assert.match(html, /Stop/);
    assert.match(html, /Delete VM/);
  });

  it("renders Start button for stopped status", () => {
    const stoppedVm: ClientVM = { ...mockVm, status: "stopped" };
    const html = renderToStaticMarkup(React.createElement(VmOverviewCard, { vm: stoppedVm }));
    assert.match(html, /Start/);
    assert.match(html, /Delete VM/);
  });

  it("renders Refresh button for unknown status", () => {
    const unknownVm: ClientVM = { ...mockVm, status: "unknown" };
    const html = renderToStaticMarkup(React.createElement(VmOverviewCard, { vm: unknownVm }));
    assert.match(html, /Refresh/);
  });

  it("renders loading state when actionState is active", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmOverviewCard, { vm: mockVm, actionState: "stopping", isLoading: true })
    );
    assert.match(html, /Stopping\.\.\./);
  });
});
