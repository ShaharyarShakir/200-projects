import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmMetadataCard } from "../vm-metadata-card";
import type { ClientVM } from "@/lib/api/types";

const mockVm: ClientVM = {
  id: "vm-test-metadata",
  status: "running",
  runtime: "base",
  vcpus: 2,
  memoryMiB: 512,
  diskSizeGb: 10,
  createdAt: "2026-09-29T10:00:00.000Z",
  age: "1d 4h",
};

describe("VmMetadataCard", () => {
  it("renders creation date, age, runtime and ID correctly", () => {
    const html = renderToStaticMarkup(React.createElement(VmMetadataCard, { vm: mockVm }));
    assert.match(html, /Metadata &amp; Environment/);
    assert.match(html, /2026/);
    assert.match(html, /1d 4h/);
    assert.match(html, /base/);
    assert.match(html, /vm-test-metadata/);
  });

  it("handles null/undefined metadata gracefully", () => {
    const emptyVm: ClientVM = {
      id: "vm-test-empty",
      status: "stopped",
      runtime: null,
      vcpus: null,
      memoryMiB: null,
      diskSizeGb: null,
      createdAt: null,
      age: null,
    };
    const html = renderToStaticMarkup(React.createElement(VmMetadataCard, { vm: emptyVm }));
    assert.match(html, /—/);
  });
});
