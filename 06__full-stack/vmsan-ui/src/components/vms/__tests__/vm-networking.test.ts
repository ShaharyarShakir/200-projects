import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmNetworking } from "../vm-networking";
import type { ClientVM } from "@/lib/api/types";

describe("VmNetworking", () => {
  it("renders network policy, IP address, and honest placeholder for future interactive network controls", () => {
    const vm: ClientVM = {
      id: "vm-net-1",
      status: "running",
      runtime: "base",
      vcpus: 1,
      memoryMiB: 128,
      age: "1h",
      networkPolicy: "allow-all",
      ipAddress: "198.19.0.4",
      publishedPorts: ["8080:80", "3000:3000"],
    };

    const html = renderToStaticMarkup(
      React.createElement(VmNetworking, { vm })
    );

    assert.match(html, />Network Summary</);
    assert.match(html, />allow-all</);
    assert.match(html, />198.19.0.4</);
    assert.match(html, />8080:80</);
    assert.match(html, />3000:3000</);
    assert.match(html, />Interactive Network Management</);
    assert.match(html, /Interactive network policy modification.*available in a future networking update/);
  });
});
