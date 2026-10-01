import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmResourcesCard } from "../vm-resources-card";
import { VmNetworkCard } from "../vm-network-card";
import type { ClientVM } from "@/lib/api/types";

const mockVm: ClientVM = {
  id: "vm-test-123",
  status: "running",
  runtime: "base",
  vcpus: 4,
  memoryMiB: 1024,
  diskSizeGb: 20,
  createdAt: "2026-09-29T10:00:00.000Z",
  age: "2 days",
  networkPolicy: "allow-all",
  ipAddress: "192.168.127.2",
  publishedPorts: [
    { hostPort: 8080, guestPort: 80, protocol: "tcp" },
    { hostPort: 2222, guestPort: 22, protocol: "tcp" },
  ],
};

describe("VmResourcesCard", () => {
  it("renders resources formatted correctly", () => {
    const html = renderToStaticMarkup(React.createElement(VmResourcesCard, { vm: mockVm }));
    assert.match(html, /Resource Allocation/);
    assert.match(html, /4/);
    assert.match(html, /1024 MiB/);
    assert.match(html, /20 GB/);
  });

  it("handles null/undefined resource values safely", () => {
    const emptyVm: ClientVM = {
      id: "vm-test-null",
      status: "stopped",
      runtime: null,
      vcpus: null,
      memoryMiB: null,
      diskSizeGb: null,
      age: null,
    };
    const html = renderToStaticMarkup(React.createElement(VmResourcesCard, { vm: emptyVm }));
    assert.match(html, /—/);
  });
});

describe("VmNetworkCard", () => {
  it("renders network policy, IP, and published ports correctly", () => {
    const html = renderToStaticMarkup(React.createElement(VmNetworkCard, { vm: mockVm }));
    assert.match(html, /Network Summary/);
    assert.match(html, /allow-all/);
    assert.match(html, /192\.168\.127\.2/);
    assert.match(html, /8080:80\/tcp/);
    assert.match(html, /2222:22\/tcp/);
  });

  it("handles null/undefined network configuration gracefully", () => {
    const noNetVm: ClientVM = {
      id: "vm-no-net",
      status: "stopped",
      runtime: null,
      vcpus: null,
      memoryMiB: null,
      age: null,
    };
    const html = renderToStaticMarkup(React.createElement(VmNetworkCard, { vm: noNetVm }));
    assert.match(html, /Network Summary/);
    assert.match(html, /None/);
  });
});
