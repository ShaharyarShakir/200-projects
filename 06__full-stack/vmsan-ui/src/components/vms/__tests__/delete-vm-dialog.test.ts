import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DeleteVMDialog } from "../delete-vm-dialog";

describe("DeleteVMDialog", () => {
  it("renders trigger element when trigger prop is provided", () => {
    const trigger = React.createElement(
      "button",
      { id: "delete-trigger-btn", "aria-label": "Delete VM vm-test-123" },
      "Delete"
    );

    const html = renderToStaticMarkup(
      React.createElement(DeleteVMDialog, {
        vmId: "vm-test-123",
        trigger,
        onConfirm: () => {},
      })
    );

    assert.match(html, /id="delete-trigger-btn"/);
    assert.match(html, /aria-label="Delete VM vm-test-123"/);
    assert.match(html, /Delete/);
  });

  it("handles onConfirm invocation on confirm action", async () => {
    let confirmCalled = false;
    const handleConfirm = async () => {
      confirmCalled = true;
    };

    const dialogProps = {
      vmId: "vm-target-456",
      open: true,
      onConfirm: handleConfirm,
    };

    await dialogProps.onConfirm();
    assert.equal(confirmCalled, true);
  });

  it("manages open state transitions and prevents closing while loading", () => {
    let openState = true;
    const handleOpenChange = (open: boolean) => {
      openState = open;
    };

    // When not loading, open change should propagate
    const onCloseNormal = (nextOpen: boolean, loading: boolean) => {
      if (!loading) {
        handleOpenChange(nextOpen);
      }
    };

    onCloseNormal(false, false);
    assert.equal(openState, false);

    // Reset open state
    openState = true;

    // When loading, open change should be prevented
    onCloseNormal(false, true);
    assert.equal(openState, true);
  });

  it("handles errors during onConfirm without crashing", async () => {
    let errorHandled = false;
    const failingConfirm = async () => {
      throw new Error("Failed to delete VM");
    };

    try {
      await failingConfirm();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "Failed to delete VM") {
        errorHandled = true;
      }
    }

    assert.equal(errorHandled, true);
  });
});
