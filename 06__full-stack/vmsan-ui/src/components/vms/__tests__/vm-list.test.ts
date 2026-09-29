import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VMList, VMListSkeleton, VMCardSkeleton } from "../vm-list";
import type { ClientVM } from "@/lib/api/types";

describe("VMList", () => {
  const mockVMs: ClientVM[] = [
    {
      id: "vm-alpha",
      status: "running",
      runtime: "base",
      vcpus: 2,
      memoryMiB: 512,
      age: "1h 20m",
    },
    {
      id: "vm-beta",
      status: "stopped",
      runtime: "node",
      vcpus: 1,
      memoryMiB: 256,
      age: "3h 40m",
    },
  ];

  it("renders loading skeleton grid when isLoading is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMList, { isLoading: true })
    );
    assert.match(html, /data-testid="vm-list-skeleton"/);
    assert.match(html, /data-slot="skeleton"/);
  });

  it("renders empty state when vms list is empty and not loading", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMList, { vms: [], isLoading: false })
    );
    assert.match(html, /No virtual machines found/i);
  });

  it("renders grid of VM cards when vms are provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMList, { vms: mockVMs, isLoading: false })
    );
    assert.match(html, /data-testid="vm-list-grid"/);
    assert.match(html, /vm-alpha/);
    assert.match(html, /vm-beta/);
    assert.match(html, /Running/);
    assert.match(html, /Stopped/);
    assert.match(html, /512 MiB/);
    assert.match(html, /256 MiB/);
  });

  it("VMListSkeleton renders requested number of skeletons", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMListSkeleton, { count: 3 })
    );
    const matches = html.match(/data-slot="card"/g);
    assert.equal(matches?.length, 3);
  });

  it("VMCardSkeleton renders skeleton placeholders", () => {
    const html = renderToStaticMarkup(
      React.createElement(VMCardSkeleton)
    );
    assert.match(html, /data-slot="card"/);
    assert.match(html, /data-slot="skeleton"/);
  });
});
