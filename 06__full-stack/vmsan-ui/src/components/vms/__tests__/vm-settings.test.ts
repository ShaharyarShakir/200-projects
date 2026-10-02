import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmSettings } from "../vm-settings";
import type { ClientVM } from "@/lib/api/types";

describe("VmSettings", () => {
  it("renders instance configuration attributes, enforced sandbox badge, and danger zone delete action", () => {
    const vm: ClientVM = {
      id: "vm-cfg-1",
      status: "running",
      runtime: "node22",
      vcpus: 2,
      memoryMiB: 256,
      age: "3h",
      createdAt: "2026-10-01T10:00:00.000Z",
    };

    const html = renderToStaticMarkup(
      React.createElement(VmSettings, { vm })
    );

    assert.match(html, /Instance Configuration/);
    assert.match(html, /vm-cfg-1/);
    assert.match(html, /node22/);
    assert.match(html, /Sandbox Security/);
    assert.match(html, /Enforced \(Jailer\)/);
    assert.match(html, /Danger Zone/);
    assert.match(html, /Delete this MicroVM/);
    assert.match(html, /Delete Instance/);
  });
});
