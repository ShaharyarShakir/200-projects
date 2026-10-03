import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmStorage } from "../vm-storage";
import type { ClientVM } from "@/lib/api/types";

describe("VmStorage", () => {
  it("renders storage allocated capacity (e.g. 10 GB) and honest usage telemetry notice", () => {
    const vm: ClientVM = {
      id: "vm-storage-1",
      status: "running",
      runtime: "base",
      vcpus: 1,
      memoryMiB: 128,
      diskSizeGb: 10,
      age: "10m",
    };

    const html = renderToStaticMarkup(
      React.createElement(VmStorage, { vm })
    );

    assert.match(html, /Root Storage Volume/);
    assert.match(html, /10 GB/);
    assert.match(html, /\/dev\/vda/);
    assert.match(html, /ext4/);
    assert.match(html, /Disk Usage Telemetry/);
    assert.match(html, /Granular live disk usage information.*unavailable/);
  });

  it("handles null or missing diskSize gracefully with em dash", () => {
    const vm: ClientVM = {
      id: "vm-storage-2",
      status: "running",
      runtime: "base",
      vcpus: 1,
      memoryMiB: 128,
      age: "10m",
    };

    const html = renderToStaticMarkup(
      React.createElement(VmStorage, { vm })
    );

    assert.match(html, /—/);
    assert.doesNotMatch(html, />null</);
    assert.doesNotMatch(html, />undefined</);
  });
});
