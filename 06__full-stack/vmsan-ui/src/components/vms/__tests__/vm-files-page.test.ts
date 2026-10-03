import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmFileBrowser } from "../vm-file-browser";

describe("VmFilesSubRoute", () => {
  it("renders file explorer header, actions, and offline state when VM is stopped", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmFileBrowser, {
        vmId: "vm-files-1",
        status: "stopped",
      })
    );

    assert.match(html, /Filesystem Explorer/);
    assert.match(html, /Filesystem unavailable while the VM is not running/);
    assert.match(html, /status:.*stopped/);
    assert.match(html, /Refresh/);
    assert.match(html, /Upload/);
    assert.match(html, /New Folder/);
  });

  it("renders file explorer ready state when VM is running", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmFileBrowser, {
        vmId: "vm-files-1",
        status: "running",
      })
    );

    assert.match(html, /Filesystem Explorer/);
    assert.doesNotMatch(html, /Filesystem unavailable while the VM is not running/);
  });
});
