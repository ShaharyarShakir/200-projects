import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmDetailView } from "../vm-detail-view";
import type { ClientVM } from "@/lib/api/types";

describe("VmDetailView", () => {
  const mockRunningVM: ClientVM = {
    id: "vm-prod-01",
    status: "running",
    runtime: "node22",
    vcpus: 4,
    memoryMiB: 2048,
    diskSizeGB: 20,
    ipAddress: "172.16.0.2",
    networkPolicy: "allow-all",
    publishedPorts: ["80:8080/tcp", "443:8443/tcp"],
    createdAt: "2026-03-30T10:00:00.000Z",
    age: "5h 30m",
  };

  const mockStoppedVM: ClientVM = {
    id: "vm-staging-02",
    status: "stopped",
    runtime: "python3",
    vcpus: 2,
    memoryMiB: 1024,
    diskSizeGB: 10,
    ipAddress: null,
    networkPolicy: "none",
    publishedPorts: [],
    createdAt: "2026-03-29T10:00:00.000Z",
    age: "1d 5h",
  };

  it("renders loading skeleton state when initialVm is not provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmDetailView, {
        id: "vm-pending-load",
        fetchVmFn: async () => mockRunningVM,
      })
    );

    assert.match(html, /data-testid="vm-detail-skeleton"/);
    assert.match(html, /animate-pulse/);
    assert.doesNotMatch(html, /vm-prod-01/);
  });

  it("renders complete VM detail view when initialVm is provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmDetailView, {
        id: "vm-prod-01",
        initialVm: mockRunningVM,
      })
    );

    // Navigation and actions
    assert.match(html, /Virtual Machines/);
    assert.match(html, /Refresh/);
    assert.match(html, /href="\/"/);

    // Overview Card
    assert.match(html, /vm-prod-01/);
    assert.match(html, /Running/);
    assert.match(html, /node22/);
    assert.match(html, /Stop/);
    assert.match(html, /Delete/);

    // Resources Card
    assert.match(html, /4/);
    assert.match(html, /2048 MiB/);
    assert.match(html, /20 GB/);

    // Network Card
    assert.match(html, /allow-all/);
    assert.match(html, /172\.16\.0\.2/);
    assert.match(html, /80:8080\/tcp/);
    assert.match(html, /443:8443\/tcp/);

    // Metadata Card
    assert.match(html, /5h 30m/);

    // Interactive Terminal
    assert.match(html, /Interactive Terminal/);
    assert.match(html, /Terminal ready\. Enter a command below and press Enter\./);
    assert.match(html, /Enter shell command/);
  });

  it("renders stopped VM state with Start and Delete actions and disabled terminal", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmDetailView, {
        id: "vm-staging-02",
        initialVm: mockStoppedVM,
      })
    );

    assert.match(html, /vm-staging-02/);
    assert.match(html, /Stopped/);
    assert.match(html, /Start/);
    assert.match(html, /Delete/);
    assert.doesNotMatch(html, />Stop</);

    // Interactive Terminal with stopped status
    assert.match(html, /Interactive Terminal/);
    assert.match(html, /MicroVM is not running/);
    assert.match(html, /Terminal disabled \(MicroVM stopped\)/);
  });

  it("renders null-safe displays for sparse VM fields", () => {
    const sparseVM: ClientVM = {
      id: "vm-sparse",
      status: "unknown",
      runtime: null,
      vcpus: null,
      memoryMiB: null,
      diskSizeGB: null,
      ipAddress: null,
      networkPolicy: null,
      publishedPorts: [],
      createdAt: null,
      age: null,
    };

    const html = renderToStaticMarkup(
      React.createElement(VmDetailView, {
        id: "vm-sparse",
        initialVm: sparseVM,
      })
    );

    assert.match(html, /vm-sparse/);
    assert.match(html, /Unknown/);
    assert.doesNotMatch(html, />null</);
    assert.doesNotMatch(html, />undefined</);
    assert.doesNotMatch(html, />NaN</);
    assert.match(html, /—/);
  });

  describe("Lifecycle and Data Fetching Callbacks", () => {
    it("invokes custom onStart handler", async () => {
      let startedId: string | null = null;
      const handleStart = async (id: string) => {
        startedId = id;
      };

      const props = {
        id: "vm-test-start",
        initialVm: mockStoppedVM,
        onStart: handleStart,
      };

      await props.onStart(props.id);
      assert.equal(startedId, "vm-test-start");
    });

    it("invokes custom onStop handler", async () => {
      let stoppedId: string | null = null;
      const handleStop = async (id: string) => {
        stoppedId = id;
      };

      const props = {
        id: "vm-test-stop",
        initialVm: mockRunningVM,
        onStop: handleStop,
      };

      await props.onStop(props.id);
      assert.equal(stoppedId, "vm-test-stop");
    });

    it("invokes custom onDelete handler", async () => {
      let deletedId: string | null = null;
      const handleDelete = async (id: string) => {
        deletedId = id;
      };

      const props = {
        id: "vm-test-delete",
        initialVm: mockStoppedVM,
        onDelete: handleDelete,
      };

      await props.onDelete(props.id);
      assert.equal(deletedId, "vm-test-delete");
    });

    it("invokes custom onExecuteCommand handler", async () => {
      let executedId: string | null = null;
      let executedCommand: string | null = null;
      const handleExecute = async (id: string, req: { command: string }) => {
        executedId = id;
        executedCommand = req.command;
        return {
          exitCode: 0,
          stdout: "ok\n",
          stderr: "",
          durationMs: 10,
        };
      };

      const props = {
        id: "vm-test-exec",
        initialVm: mockRunningVM,
        onExecuteCommand: handleExecute,
      };

      const res = await props.onExecuteCommand(props.id, { command: "uptime" });
      assert.equal(executedId, "vm-test-exec");
      assert.equal(executedCommand, "uptime");
      assert.equal(res.stdout, "ok\n");
    });

    it("fetches detail using custom fetchVmFn helper", async () => {
      let fetchedId: string | null = null;
      const customFetch = async (id: string) => {
        fetchedId = id;
        return mockRunningVM;
      };

      const data = await customFetch("vm-custom-fetch");
      assert.equal(fetchedId, "vm-custom-fetch");
      assert.equal(data.id, "vm-prod-01");
    });
  });
});
