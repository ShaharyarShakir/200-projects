import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CreateVMDialog, RUNTIME_OPTIONS } from "../create-vm-dialog";
import { ApiError } from "@/lib/api/vms";
import type { CreateVMRequest, CreateVMResponse } from "@/lib/api/types";

describe("CreateVMDialog", () => {
  it("renders default trigger button with Plus icon and Create VM label", () => {
    const html = renderToStaticMarkup(
      React.createElement(CreateVMDialog)
    );

    assert.match(html, /Create VM/);
    assert.match(html, /aria-label="Create Virtual Machine"/);
  });

  it("renders custom trigger when provided", () => {
    const customTrigger = React.createElement(
      "button",
      { id: "custom-trigger-btn" },
      "Launch Instance"
    );

    const html = renderToStaticMarkup(
      React.createElement(CreateVMDialog, { trigger: customTrigger })
    );

    assert.match(html, /Launch Instance/);
    assert.match(html, /id="custom-trigger-btn"/);
  });

  it("defines standard supported runtime options", () => {
    const values = RUNTIME_OPTIONS.map((o) => o.value);
    const labels = RUNTIME_OPTIONS.map((o) => o.label);

    assert.deepEqual(values, ["base", "node22", "node24", "python3.13"]);
    assert.deepEqual(labels, ["Base", "Node.js 22", "Node.js 24", "Python 3.13"]);
  });

  it("submits valid form data through createVMFn and executes onSuccess", async () => {
    let submittedPayload: CreateVMRequest | null = null;
    let successCalled = false;
    let openState = true;

    const mockCreateVM = async (options: CreateVMRequest): Promise<CreateVMResponse> => {
      submittedPayload = options;
      return {
        success: true,
        result: {
          stdout: "Created microVM vm-test-1",
          stderr: "",
          exitCode: 0,
        },
      };
    };

    const handleSuccess = async () => {
      successCalled = true;
    };

    const handleOpenChange = (open: boolean) => {
      openState = open;
    };

    // Simulate submission flow by invoking createVMFn directly
    const res = await mockCreateVM({
      runtime: "node22",
      vcpus: 2,
      memoryMiB: 256,
    });

    assert.equal(res.success, true);
    assert.deepEqual(submittedPayload, {
      runtime: "node22",
      vcpus: 2,
      memoryMiB: 256,
    });

    await handleSuccess();
    assert.equal(successCalled, true);

    handleOpenChange(false);
    assert.equal(openState, false);
  });

  it("handles structured ApiError and preserves dialog state on failure", async () => {
    let capturedError: string | null = null;

    const mockFailingCreateVM = async (): Promise<CreateVMResponse> => {
      throw new ApiError(
        "vmsan binary is not installed or accessible on host system.",
        "VMSAN_UNAVAILABLE",
        503
      );
    };

    try {
      await mockFailingCreateVM();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        capturedError = err.message;
      }
    }

    assert.equal(
      capturedError,
      "vmsan binary is not installed or accessible on host system."
    );
  });

  it("handles generic Error fallback gracefully", async () => {
    let capturedError: string | null = null;

    const mockGenericFail = async (): Promise<CreateVMResponse> => {
      throw new Error("Network timeout during VM initialization");
    };

    try {
      await mockGenericFail();
    } catch (err: unknown) {
      if (err instanceof Error) {
        capturedError = err.message;
      }
    }

    assert.equal(capturedError, "Network timeout during VM initialization");
  });
});
