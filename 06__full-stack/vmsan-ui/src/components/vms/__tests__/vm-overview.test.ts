import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmOverview } from "../vm-overview";
import type { ClientVM } from "@/lib/api/types";

describe("VmOverview", () => {
  const sampleVm: ClientVM = {
    id: "vm-ovw-123",
    status: "running",
    runtime: "python3.13",
    vcpus: 2,
    memoryMiB: 512,
    diskSizeGb: 15,
    age: "4h",
    networkPolicy: "deny-all",
    ipAddress: "198.19.0.2",
    createdAt: "2026-10-01T12:00:00.000Z",
  };

  it("renders compute resources, network summary, metadata, and quick action links", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmOverview, {
        vm: sampleVm,
      })
    );

    // Resources
    assert.match(html, />Resource Allocation</);
    assert.match(html, />2</);
    assert.match(html, />512 MiB</);
    assert.match(html, />15 GB</);

    // Network
    assert.match(html, />Network Summary</);
    assert.match(html, />deny-all</);
    assert.match(html, />198.19.0.2</);

    // Metadata
    assert.match(html, />Metadata &amp; Environment</);
    assert.match(html, />python3.13</);
    assert.match(html, />vm-ovw-123</);

    // Quick actions
    assert.match(html, /href="\/vms\/vm-ovw-123\/terminal"/);
    assert.match(html, /href="\/vms\/vm-ovw-123\/files"/);
  });
});
