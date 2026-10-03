import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmConsoleHeader } from "../vm-console-header";
import type { ClientVM } from "@/lib/api/types";

describe("VmConsoleHeader", () => {
  const sampleVm: ClientVM = {
    id: "vm-test-head-1",
    status: "running",
    runtime: "node22",
    vcpus: 2,
    memoryMiB: 512,
    diskSizeGb: 10,
    age: "1h 30m",
  };

  it("renders VM ID, status badge, runtime, and back link to dashboard", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmConsoleHeader, {
        vm: sampleVm,
      })
    );

    assert.match(html, /vm-test-head-1/);
    assert.match(html, /Running/);
    assert.match(html, /node22/);
    assert.match(html, /Virtual Machines/);
    assert.match(html, /href="\/"/);
  });

  it("renders Stop button when VM is running", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmConsoleHeader, {
        vm: sampleVm,
      })
    );

    assert.match(html, /Stop/);
    assert.match(html, /Delete/);
    assert.doesNotMatch(html, />Start</);
  });

  it("renders Start button when VM is stopped", () => {
    const stoppedVm: ClientVM = {
      ...sampleVm,
      status: "stopped",
    };

    const html = renderToStaticMarkup(
      React.createElement(VmConsoleHeader, {
        vm: stoppedVm,
      })
    );

    assert.match(html, /Start/);
    assert.match(html, /Delete/);
    assert.doesNotMatch(html, />Stop</);
  });

  it("renders Refresh button when onRefresh callback is provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmConsoleHeader, {
        vm: sampleVm,
        onRefresh: async () => {},
      })
    );

    assert.match(html, /Refresh/);
    assert.match(html, /aria-label="Refresh VM data"/);
  });
});
