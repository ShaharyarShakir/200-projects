import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider, useTheme, themeInitScript } from "../theme-provider";
import { ThemeToggle } from "../theme-toggle";

function ConsumerComponent() {
  const { theme, resolvedTheme } = useTheme();
  return React.createElement(
    "div",
    { "data-testid": "theme-consumer" },
    `Current: ${theme}, Resolved: ${resolvedTheme}`
  );
}

describe("Theme System", () => {
  describe("ThemeProvider & useTheme", () => {
    it("renders children with default system theme in SSR", () => {
      const html = renderToStaticMarkup(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(ConsumerComponent)
        )
      );
      assert.match(html, /Current: system/);
      assert.match(html, /Resolved: dark/);
    });

    it("accepts custom defaultTheme", () => {
      const html = renderToStaticMarkup(
        React.createElement(
          ThemeProvider,
          { defaultTheme: "light" },
          React.createElement(ConsumerComponent)
        )
      );
      assert.match(html, /Current: light/);
    });

    it("useTheme returns default fallback context when used outside ThemeProvider", () => {
      const html = renderToStaticMarkup(React.createElement(ConsumerComponent));
      assert.match(html, /Current: system/);
      assert.match(html, /Resolved: dark/);
    });
  });

  describe("ThemeToggle", () => {
    it("renders toggle button with accessible label", () => {
      const html = renderToStaticMarkup(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(ThemeToggle)
        )
      );
      assert.match(html, /Select theme mode/);
      assert.match(html, /Toggle theme/);
    });
  });

  describe("themeInitScript", () => {
    it("contains valid FOUC prevention logic for localStorage and media queries", () => {
      assert.match(themeInitScript, /vmsan-theme/);
      assert.match(themeInitScript, /prefers-color-scheme: dark/);
      assert.match(themeInitScript, /data-theme/);
      assert.match(themeInitScript, /classList\.add\('dark'\)/);
      assert.match(themeInitScript, /classList\.remove\('dark'\)/);
    });
  });
});
