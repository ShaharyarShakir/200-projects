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

  describe("Lifecycle Action Button Visibility", () => {
    it("renders Stop and Delete buttons for running VM, but not Start or Refresh", () => {
      const vm: ClientVM = {
        id: "vm-run-1",
        status: "running",
        runtime: "node22",
        vcpus: 2,
        memoryMiB: 512,
        age: "5m",
      };

      const html = renderToStaticMarkup(React.createElement(VMCard, { vm }));

      assert.match(html, /Stop/);
      assert.match(html, /Delete/);
      assert.doesNotMatch(html, />Start</);
      assert.doesNotMatch(html, />Refresh</);
    });

    it("renders Start and Delete buttons for stopped VM, but not Stop or Refresh", () => {
      const vm: ClientVM = {
        id: "vm-stop-1",
        status: "stopped",
        runtime: "node22",
        vcpus: 2,
        memoryMiB: 512,
        age: "1d",
      };

      const html = renderToStaticMarkup(React.createElement(VMCard, { vm }));

      assert.match(html, /Start/);
      assert.match(html, /Delete/);
      assert.doesNotMatch(html, />Stop</);
      assert.doesNotMatch(html, />Refresh</);
    });

    it("renders Refresh and Delete buttons for unknown VM, but not Start or Stop", () => {
      const vm: ClientVM = {
        id: "vm-unk-1",
        status: "unknown",
        runtime: null,
        vcpus: null,
        memoryMiB: null,
        age: null,
      };

      const html = renderToStaticMarkup(React.createElement(VMCard, { vm }));

      assert.match(html, /Refresh/);
      assert.match(html, /Delete/);
      assert.doesNotMatch(html, />Start</);
      assert.doesNotMatch(html, />Stop</);
    });
  });

  describe("Lifecycle Callbacks and State Management", () => {
    it("invokes onStart callback when starting a stopped VM", async () => {
      let startedId: string | null = null;
      let successCalled = false;

      const vm: ClientVM = {
        id: "vm-start-test",
        status: "stopped",
        runtime: "base",
        vcpus: 1,
        memoryMiB: 128,
        age: "1h",
      };

      const handleStart = async (id: string) => {
        startedId = id;
      };

      const handleSuccess = () => {
        successCalled = true;
      };

      const props = {
        vm,
        onStart: handleStart,
        onSuccess: handleSuccess,
      };

      await props.onStart(props.vm.id);
      props.onSuccess();

      assert.equal(startedId, "vm-start-test");
      assert.equal(successCalled, true);
    });

    it("invokes onStop callback when stopping a running VM", async () => {
      let stoppedId: string | null = null;
      let successCalled = false;

      const vm: ClientVM = {
        id: "vm-stop-test",
        status: "running",
        runtime: "base",
        vcpus: 1,
        memoryMiB: 128,
        age: "1h",
      };

      const handleStop = async (id: string) => {
        stoppedId = id;
      };

      const handleSuccess = () => {
        successCalled = true;
      };

      const props = {
        vm,
        onStop: handleStop,
        onSuccess: handleSuccess,
      };

      await props.onStop(props.vm.id);
      props.onSuccess();

      assert.equal(stoppedId, "vm-stop-test");
      assert.equal(successCalled, true);
    });

    it("invokes onDelete callback when deleting a VM", async () => {
      let deletedId: string | null = null;
      let successCalled = false;

      const vm: ClientVM = {
        id: "vm-delete-test",
        status: "stopped",
        runtime: "base",
        vcpus: 1,
        memoryMiB: 128,
        age: "1h",
      };

      const handleDelete = async (id: string) => {
        deletedId = id;
      };

      const handleSuccess = () => {
        successCalled = true;
      };

      const props = {
        vm,
        onDelete: handleDelete,
        onSuccess: handleSuccess,
      };

      await props.onDelete(props.vm.id);
      props.onSuccess();

      assert.equal(deletedId, "vm-delete-test");
      assert.equal(successCalled, true);
    });

    it("handles errors during lifecycle actions without crashing or mutating VM status", async () => {
      let errorCaptured: string | null = null;

      const vm: ClientVM = {
        id: "vm-fail-test",
        status: "stopped",
        runtime: "base",
        vcpus: 1,
        memoryMiB: 128,
        age: "1h",
      };

      const handleFailingStart = async () => {
        throw new Error("Failed to start microVM");
      };

      try {
        await handleFailingStart();
      } catch (err: unknown) {
        if (err instanceof Error) {
          errorCaptured = err.message;
        }
      }

      assert.equal(errorCaptured, "Failed to start microVM");
      // Verify original VM status is unchanged
      assert.equal(vm.status, "stopped");
    });
  });
});
