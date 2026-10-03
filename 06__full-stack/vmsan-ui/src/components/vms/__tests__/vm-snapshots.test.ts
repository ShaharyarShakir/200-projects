import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmSnapshots } from "../vm-snapshots";
import type { ClientVM } from "@/lib/api/types";

describe("VmSnapshots", () => {
  it("renders honest placeholder explaining snapshots are reserved for future phase", () => {
    const vm: ClientVM = {
      id: "vm-snap-1",
      status: "running",
      runtime: "base",
      vcpus: 1,
      memoryMiB: 128,
      age: "2d",
    };

    const html = renderToStaticMarkup(
      React.createElement(VmSnapshots, { vm })
    );

    assert.match(html, /MicroVM Snapshots/);
    assert.match(html, /Future Phase Feature/);
    assert.match(html, /Snapshot management, point-in-time memory dumps, and disk state rollback will be available in a future update/);
  });
});
