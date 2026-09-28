import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VMCard } from "../vm-card";
import type { ClientVM } from "@/lib/api/types";

describe("VMCard", () => {
  it("renders complete microVM details correctly", () => {
    const vm: ClientVM = {
      id: "vm-test123",
      status: "running",
      runtime: "base",
      vcpus: 2,
      memoryMiB: 256,
      age: "2h 15m",
    };

    const html = renderToStaticMarkup(React.createElement(VMCard, { vm }));

    assert.match(html, /vm-test123/);
    assert.match(html, /Running/);
    assert.match(html, /base/);
    assert.match(html, /2/);
    assert.match(html, /256 MiB/);
    assert.match(html, /2h 15m/);
  });

  it("renders null/missing resource fields safely as em dashes", () => {
    const vm: ClientVM = {
      id: "vm-sparse456",
      status: "unknown",
      runtime: null,
      vcpus: null,
      memoryMiB: null,
      age: null,
    };

    const html = renderToStaticMarkup(React.createElement(VMCard, { vm }));

    assert.match(html, /vm-sparse456/);
    assert.match(html, /Unknown/);
    assert.doesNotMatch(html, />null</);
    assert.doesNotMatch(html, />undefined</);
    assert.doesNotMatch(html, />NaN</);
    assert.match(html, /—/);
  });
});
