import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VMEmptyState } from "../vm-empty-state";

describe("VMEmptyState", () => {
  it("renders empty state headline and description", () => {
    const html = renderToStaticMarkup(React.createElement(VMEmptyState));
    assert.match(html, /No virtual machines found/i);
    assert.match(html, /no firecracker microvms/i);
  });
});
