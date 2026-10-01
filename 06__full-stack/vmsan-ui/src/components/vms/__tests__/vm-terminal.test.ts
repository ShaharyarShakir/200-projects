import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VmTerminal, type TerminalEntry } from "../vm-terminal";

describe("VmTerminal", () => {
  it("renders terminal header with VM ID and clear button", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmTerminal, {
        vmId: "vm-1691d65a",
        status: "running",
      })
    );
    assert.match(html, /Interactive Terminal/);
    assert.match(html, /vm-1691d65a/);
    assert.match(html, /Clear/);
    assert.match(html, /Run/);
  });

  it("renders warning banner when microVM is not running", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmTerminal, {
        vmId: "vm-1691d65a",
        status: "stopped",
      })
    );
    assert.match(html, /MicroVM is not running/);
    assert.match(html, /status:.*stopped/);
    assert.match(html, /Terminal disabled \(MicroVM stopped\)/);
    assert.match(html, /disabled=""/);
  });

  it("renders terminal ready state when microVM is running and entries are empty", () => {
    const html = renderToStaticMarkup(
      React.createElement(VmTerminal, {
        vmId: "vm-1691d65a",
        status: "running",
      })
    );
    assert.match(html, /Terminal ready\. Enter a command below and press Enter\./);
    assert.doesNotMatch(html, /MicroVM is not running/);
  });

  it("renders initial command entries with stdout and exit codes", () => {
    const entries: TerminalEntry[] = [
      {
        id: "entry-1",
        command: "uname -a",
        stdout: "Linux microvm 6.1.0-custom",
        exitCode: 0,
        durationMs: 45,
        status: "success",
        timestamp: new Date(),
      },
      {
        id: "entry-2",
        command: "cat /invalid/path",
        stderr: "cat: /invalid/path: No such file or directory",
        exitCode: 1,
        durationMs: 12,
        status: "error",
        timestamp: new Date(),
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(VmTerminal, {
        vmId: "vm-1691d65a",
        status: "running",
        initialEntries: entries,
      })
    );

    assert.match(html, /uname -a/);
    assert.match(html, /Linux microvm 6\.1\.0-custom/);
    assert.match(html, /exit 0/);
    assert.match(html, /45ms/);

    assert.match(html, /cat \/invalid\/path/);
    assert.match(html, /cat: \/invalid\/path: No such file or directory/);
    assert.match(html, /exit 1/);
    assert.match(html, /12ms/);
  });

  it("renders error state when command execution encounters a client/network failure", () => {
    const entries: TerminalEntry[] = [
      {
        id: "entry-err",
        command: "sleep 100",
        error: "Command execution timed out after 30000ms",
        status: "timed_out",
        timestamp: new Date(),
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(VmTerminal, {
        vmId: "vm-1691d65a",
        status: "running",
        initialEntries: entries,
      })
    );

    assert.match(html, /sleep 100/);
    assert.match(html, /Command execution timed out after 30000ms/);
  });
});
