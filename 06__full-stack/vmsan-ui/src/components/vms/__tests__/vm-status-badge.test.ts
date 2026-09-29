import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VMStatusBadge, getStatusConfig } from "../vm-status-badge";

describe("VMStatusBadge", () => {
  describe("getStatusConfig", () => {
    it("returns correct configuration for running status", () => {
      const config = getStatusConfig("running");
      assert.equal(config.label, "Running");
      assert.match(config.dotClass, /bg-emerald-500/);
    });

    it("returns correct configuration for stopped status", () => {
      const config = getStatusConfig("stopped");
      assert.equal(config.label, "Stopped");
      assert.match(config.dotClass, /bg-zinc-400/);
    });

    it("returns correct configuration for unknown status", () => {
      const config = getStatusConfig("unknown");
      assert.equal(config.label, "Unknown");
      assert.match(config.dotClass, /bg-amber-500/);
    });

    it("falls back to Unknown for arbitrary/unrecognized statuses", () => {
      const config = getStatusConfig("rebooting");
      assert.equal(config.label, "Unknown");
      assert.match(config.dotClass, /bg-amber-500/);
    });
  });

  describe("Rendering", () => {
    it("renders running badge with accessible text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "running" }));
      assert.match(html, /Running/);
      assert.match(html, /bg-emerald-500/);
      assert.match(html, /aria-hidden="true"/);
    });

    it("renders stopped badge with text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "stopped" }));
      assert.match(html, /Stopped/);
      assert.match(html, /bg-zinc-400/);
    });

    it("renders unknown badge with fallback text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "unknown" }));
      assert.match(html, /Unknown/);
      assert.match(html, /bg-amber-500/);
    });
  });
});
