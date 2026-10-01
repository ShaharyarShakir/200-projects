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
      assert.equal(config.badgeVariant, "outline");
    });

    it("returns correct configuration for stopped status", () => {
      const config = getStatusConfig("stopped");
      assert.equal(config.label, "Stopped");
      assert.match(config.dotClass, /bg-zinc-400/);
      assert.equal(config.badgeVariant, "secondary");
    });

    it("returns correct configuration for starting status", () => {
      const config = getStatusConfig("starting");
      assert.equal(config.label, "Starting");
      assert.match(config.dotClass, /bg-blue-500/);
      assert.equal(config.badgeVariant, "outline");
    });

    it("returns correct configuration for stopping status", () => {
      const config = getStatusConfig("stopping");
      assert.equal(config.label, "Stopping");
      assert.match(config.dotClass, /bg-amber-500/);
      assert.equal(config.badgeVariant, "outline");
    });

    it("returns correct configuration for creating status", () => {
      const config = getStatusConfig("creating");
      assert.equal(config.label, "Creating");
      assert.match(config.dotClass, /bg-sky-500/);
      assert.equal(config.badgeVariant, "outline");
    });

    it("returns correct configuration for error status", () => {
      const config = getStatusConfig("error");
      assert.equal(config.label, "Error");
      assert.match(config.dotClass, /bg-rose-500/);
      assert.equal(config.badgeVariant, "destructive");
    });

    it("returns correct configuration for unknown status", () => {
      const config = getStatusConfig("unknown");
      assert.equal(config.label, "Unknown");
      assert.match(config.dotClass, /bg-amber-500/);
      assert.equal(config.badgeVariant, "outline");
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
      assert.match(html, /aria-label="Status: Running"/);
    });

    it("renders stopped badge with text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "stopped" }));
      assert.match(html, /Stopped/);
      assert.match(html, /bg-zinc-400/);
      assert.match(html, /aria-label="Status: Stopped"/);
    });

    it("renders starting badge with text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "starting" }));
      assert.match(html, /Starting/);
      assert.match(html, /bg-blue-500/);
      assert.match(html, /aria-label="Status: Starting"/);
    });

    it("renders stopping badge with text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "stopping" }));
      assert.match(html, /Stopping/);
      assert.match(html, /bg-amber-500/);
      assert.match(html, /aria-label="Status: Stopping"/);
    });

    it("renders creating badge with text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "creating" }));
      assert.match(html, /Creating/);
      assert.match(html, /bg-sky-500/);
      assert.match(html, /aria-label="Status: Creating"/);
    });

    it("renders error badge with text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "error" }));
      assert.match(html, /Error/);
      assert.match(html, /bg-rose-500/);
      assert.match(html, /aria-label="Status: Error"/);
    });

    it("renders unknown badge with fallback text and dot indicator", () => {
      const html = renderToStaticMarkup(React.createElement(VMStatusBadge, { status: "unknown" }));
      assert.match(html, /Unknown/);
      assert.match(html, /bg-amber-500/);
      assert.match(html, /aria-label="Status: Unknown"/);
    });
  });
});

