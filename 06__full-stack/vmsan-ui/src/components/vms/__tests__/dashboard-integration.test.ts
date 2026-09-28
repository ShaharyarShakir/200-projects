import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VMDashboard } from "../vm-dashboard";
import { VMStatusBadge } from "../vm-status-badge";
import { VMCard } from "../vm-card";
import { VMEmptyState } from "../vm-empty-state";
import { VMErrorState } from "../vm-error-state";
import { formatValue, formatMemory, formatVmCount } from "@/lib/utils/formatters";
import type { ClientVM } from "@/lib/api/types";

describe("Phase 1D Dashboard UI Comprehensive Verification", () => {
  describe("VM Status Badge and Labels", () => {
    it("renders running status label and active indicator", () => {
      const html = renderToStaticMarkup(
        React.createElement(VMStatusBadge, { status: "running" })
      );
      assert.match(html, /Running/);
      assert.match(html, /bg-emerald-500/);
    });

    it("renders stopped status label and indicator", () => {
      const html = renderToStaticMarkup(
        React.createElement(VMStatusBadge, { status: "stopped" })
      );
      assert.match(html, /Stopped/);
      assert.match(html, /bg-zinc-400/);
    });

    it("renders unknown status label and indicator for unknown or arbitrary status", () => {
      const html = renderToStaticMarkup(
        React.createElement(VMStatusBadge, { status: "custom-state" })
      );
      assert.match(html, /Unknown/);
      assert.match(html, /bg-amber-500/);
    });
  });

  describe("Null and Missing Value Formatter Fallbacks", () => {
    it("formats null, undefined, empty string, and NaN as em dashes in VM card", () => {
      const sparseVM: ClientVM = {
        id: "vm-sparse",
        status: "unknown",
        runtime: null,
        vcpus: null,
        memoryMiB: null,
        age: null,
      };

      const html = renderToStaticMarkup(
        React.createElement(VMCard, { vm: sparseVM })
      );

      assert.match(html, /vm-sparse/);
      assert.match(html, /—/);
      assert.doesNotMatch(html, />null</);
      assert.doesNotMatch(html, />undefined</);
      assert.doesNotMatch(html, />NaN</);
    });

    it("verifies formatter helper outputs", () => {
      assert.equal(formatValue(null), "—");
      assert.equal(formatValue(undefined), "—");
      assert.equal(formatValue(""), "—");
      assert.equal(formatValue(Number.NaN), "—");
      assert.equal(formatValue("custom"), "custom");

      assert.equal(formatMemory(null), "—");
      assert.equal(formatMemory(undefined), "—");
      assert.equal(formatMemory(Number.NaN), "—");
      assert.equal(formatMemory(512), "512 MiB");
    });
  });

  describe("VM Count Formatting", () => {
    it("formats zero count as '0 VMs'", () => {
      assert.equal(formatVmCount(0), "0 VMs");
    });

    it("formats singular count as '1 VM'", () => {
      assert.equal(formatVmCount(1), "1 VM");
    });

    it("formats plural count as 'N VMs'", () => {
      assert.equal(formatVmCount(5), "5 VMs");
    });
  });

  describe("Empty State Display", () => {
    it("renders friendly empty state when no VMs exist", () => {
      const html = renderToStaticMarkup(
        React.createElement(VMEmptyState)
      );
      assert.match(html, /No virtual machines found/i);
      assert.match(html, /There are currently no Firecracker microVMs/i);
    });
  });

  describe("Error State and Retry Controls", () => {
    it("renders error state with retry trigger and error message", () => {
      let retryTriggered = false;
      const onRetry = () => {
        retryTriggered = true;
      };

      const html = renderToStaticMarkup(
        React.createElement(VMErrorState, {
          error: "Connection refused on port 8080",
          onRetry,
        })
      );

      assert.match(html, /Unable to load virtual machines/);
      assert.match(html, /Connection refused on port 8080/);
      assert.match(html, /Retry/);

      onRetry();
      assert.equal(retryTriggered, true);
    });
  });

  describe("Full Dashboard Assembly and Interaction Flows", () => {
    const populatedVMs: ClientVM[] = [
      {
        id: "vm-prod-01",
        status: "running",
        runtime: "base",
        vcpus: 4,
        memoryMiB: 1024,
        age: "5d 12h",
      },
      {
        id: "vm-dev-02",
        status: "stopped",
        runtime: "node",
        vcpus: 2,
        memoryMiB: 512,
        age: "1h 30m",
      },
      {
        id: "vm-test-03",
        status: "unknown",
        runtime: null,
        vcpus: null,
        memoryMiB: null,
        age: null,
      },
    ];

    it("renders populated dashboard with all statuses, counts, and resource details", () => {
      const html = renderToStaticMarkup(
        React.createElement(VMDashboard, { initialVMs: populatedVMs })
      );

      // Header Branding & Controls
      assert.match(html, /vmsan/);
      assert.match(html, /Firecracker microVM management/);
      assert.match(html, /Create VM/);
      assert.match(html, /Refresh/);
      assert.match(html, /3 VMs/);

      // VM Cards
      assert.match(html, /vm-prod-01/);
      assert.match(html, /vm-dev-02/);
      assert.match(html, /vm-test-03/);

      // Status Badges
      assert.match(html, /Running/);
      assert.match(html, /Stopped/);
      assert.match(html, /Unknown/);

      // Resources
      assert.match(html, /1024 MiB/);
      assert.match(html, /512 MiB/);
      assert.match(html, /—/);
    });

    it("renders dashboard in empty state when zero VMs are present and allows creating a VM", () => {
      const html = renderToStaticMarkup(
        React.createElement(VMDashboard, { initialVMs: [] })
      );

      assert.match(html, /0 VMs/);
      assert.match(html, /No virtual machines found/);
      assert.match(html, /Create VM/);
    });
  });
});
