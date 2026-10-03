import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  VmConsoleLayoutClient,
  useVmConsole,
} from "../vm-console-layout-client";
import type { ClientVM } from "@/lib/api/types";

function MockChild() {
  const { vm } = useVmConsole();
  return React.createElement(
    "div",
    { id: "mock-child" },
    `Child rendered for ${vm.id} (${vm.runtime})`
  );
}

describe("VmConsoleLayoutClient", () => {
  const sampleVm: ClientVM = {
    id: "vm-layout-test",
    status: "running",
    runtime: "node24",
    vcpus: 4,
    memoryMiB: 1024,
    diskSizeGb: 20,
    age: "3d",
  };

  it("renders console header, sidebar, and children when initialVm is provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        VmConsoleLayoutClient,
        {
          id: "vm-layout-test",
          initialVm: sampleVm,
        },
        React.createElement(MockChild)
      )
    );

    // Header checks
    assert.match(html, /vm-layout-test/);
    assert.match(html, /Virtual Machines/);
    assert.match(html, /node24/);

    // Sidebar checks
    assert.match(html, /aria-label="VM Console Navigation"/);
    assert.match(html, />Overview</);
    assert.match(html, />Terminal</);
    assert.match(html, />Storage</);
    assert.match(html, />Networking</);
    assert.match(html, />Files</);
    assert.match(html, />Snapshots</);
    assert.match(html, />Settings</);

    // Child consumer check
    assert.match(html, /Child rendered for vm-layout-test \(node24\)/);
  });

  it("renders skeleton loading state when initialVm is not provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        VmConsoleLayoutClient,
        {
          id: "vm-loading-test",
        },
        React.createElement(MockChild)
      )
    );

    assert.doesNotMatch(html, /Child rendered for/);
  });
});
