import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmConsoleSidebar, CONSOLE_NAV_ITEMS } from "../vm-console-sidebar";

describe("VmConsoleSidebar", () => {
  it("renders all 7 navigation items with correct hrefs for a given VM ID", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmConsoleSidebar, {
        vmId: "vm-alpha-123",
      })
    );

    assert.match(html, /aria-label="VM Console Navigation"/);
    assert.match(html, /href="\/vms\/vm-alpha-123"/);
    assert.match(html, /href="\/vms\/vm-alpha-123\/terminal"/);
    assert.match(html, /href="\/vms\/vm-alpha-123\/storage"/);
    assert.match(html, /href="\/vms\/vm-alpha-123\/networking"/);
    assert.match(html, /href="\/vms\/vm-alpha-123\/files"/);
    assert.match(html, /href="\/vms\/vm-alpha-123\/snapshots"/);
    assert.match(html, /href="\/vms\/vm-alpha-123\/settings"/);

    assert.match(html, />Overview</);
    assert.match(html, />Terminal</);
    assert.match(html, />Storage</);
    assert.match(html, />Networking</);
    assert.match(html, />Files</);
    assert.match(html, />Snapshots</);
    assert.match(html, />Settings</);
  });

  it("marks Overview as active when currentPath matches base VM URL", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmConsoleSidebar, {
        vmId: "vm-test-1",
        currentPath: "/vms/vm-test-1",
      })
    );

    assert.match(
      html,
      /<a[^>]*aria-current="page"[^>]*href="\/vms\/vm-test-1"[^>]*>/
    );
    assert.doesNotMatch(
      html,
      /<a[^>]*aria-current="page"[^>]*href="\/vms\/vm-test-1\/terminal"[^>]*>/
    );
  });

  it("marks Terminal as active when currentPath matches terminal subroute", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmConsoleSidebar, {
        vmId: "vm-test-1",
        currentPath: "/vms/vm-test-1/terminal",
      })
    );

    assert.match(
      html,
      /<a[^>]*aria-current="page"[^>]*href="\/vms\/vm-test-1\/terminal"[^>]*>/
    );
    assert.doesNotMatch(
      html,
      /<a[^>]*aria-current="page"[^>]*href="\/vms\/vm-test-1"[^>]*>.*Overview/
    );
  });

  it("marks Storage, Networking, Files, Snapshots, Settings when navigated to respective routes", () => {
    for (const item of CONSOLE_NAV_ITEMS) {
      const targetPath = `/vms/vm-test-1${item.pathSuffix}`;
      const html = renderToStaticMarkup(
        React.createElement(VmConsoleSidebar, {
          vmId: "vm-test-1",
          currentPath: targetPath,
        })
      );

      const escaped = targetPath.replace(/\//g, "\\/");
      assert.match(
        html,
        new RegExp(`<a[^>]*aria-current="page"[^>]*href="${escaped}"[^>]*>`)
      );
    }
  });
});
