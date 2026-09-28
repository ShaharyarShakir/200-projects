import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VMDashboard } from "../vm-dashboard";
import type { ClientVM } from "@/lib/api/types";

describe("VMDashboard", () => {
  const mockVMs: ClientVM[] = [
    {
      id: "vm-101",
      status: "running",
      runtime: "base",
      vcpus: 1,
      memoryMiB: 128,
      age: "10m",
    },
    {
      id: "vm-102",
      status: "stopped",
      runtime: "python",
      vcpus: 2,
      memoryMiB: 512,
      age: "2d",
    },
  ];

  it("renders dashboard header with vmsan title, create vm button, and refresh button", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMDashboard, { initialVMs: mockVMs })
    );

    assert.match(html, /vmsan/);
    assert.match(html, /Firecracker microVM management/i);
    assert.match(html, /Create VM/);
    assert.match(html, /Refresh/);
    assert.match(html, /2 VMs/);
  });

  it("renders VM list when initialVMs has items", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMDashboard, { initialVMs: mockVMs })
    );

    assert.match(html, /vm-101/);
    assert.match(html, /vm-102/);
    assert.match(html, /Running/);
    assert.match(html, /Stopped/);
    assert.match(html, /128 MiB/);
    assert.match(html, /512 MiB/);
  });

  it("renders empty state when initialVMs is empty", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMDashboard, { initialVMs: [] })
    );

    assert.match(html, /0 VMs/);
    assert.match(html, /No virtual machines found/i);
  });

  it("renders loading skeletons when initialVMs is undefined", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMDashboard, {
        fetchVMsFn: async () => mockVMs,
      })
    );

    assert.match(html, /Loading VMs\.\.\./);
    assert.match(html, /data-testid="vm-list-skeleton"/);
  });
});
