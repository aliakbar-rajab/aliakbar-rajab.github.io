import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { JSDOM } from "jsdom";
import React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const scrollCalls = [];
let prefersReducedMotion = false;
dom.window.Element.prototype.scrollIntoView = function scrollIntoView(options) {
  scrollCalls.push({ id: this.id, options });
};
dom.window.matchMedia = (query) => ({
  media: query,
  matches:
    query === "(prefers-reduced-motion: reduce)" && prefersReducedMotion,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

const { act, cleanup, render, screen, waitFor } = await import(
  "@testing-library/react"
);
const App = (await import("../app/App.tsx")).default;

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const addRoot = (initialCategory) => {
  const root = document.createElement("div");
  root.id = "root";
  if (initialCategory) root.dataset.initialCategory = initialCategory;
  document.body.append(root);
};

afterEach(() => {
  cleanup();
  document.getElementById("root")?.remove();
  scrollCalls.length = 0;
  prefersReducedMotion = false;
});

test("a direct category route activates its tab and scrolls to prices", async () => {
  addRoot("beam");
  render(React.createElement(App));
  await settle();

  assert.equal(
    screen.getByRole("tab", { name: "تیرآهن" }).getAttribute("aria-selected"),
    "true",
  );
  await waitFor(() => {
    assert.deepEqual(scrollCalls, [
      {
        id: "prices",
        options: { behavior: "smooth", block: "start" },
      },
    ]);
  });
  await waitFor(() => assert.ok(screen.getAllByRole("table").length > 0));
});

test("the homepage keeps its default tab and does not auto-scroll", async () => {
  addRoot();
  render(React.createElement(App));
  await settle();

  assert.equal(
    screen.getByRole("tab", { name: "میلگرد" }).getAttribute("aria-selected"),
    "true",
  );
  assert.deepEqual(scrollCalls, []);
  await waitFor(() => assert.ok(screen.getAllByRole("table").length > 0));
});

test("a direct category route respects reduced-motion scrolling", async () => {
  prefersReducedMotion = true;
  addRoot("rebar");
  render(React.createElement(App));
  await settle();

  await waitFor(() => {
    assert.deepEqual(scrollCalls, [
      {
        id: "prices",
        options: { behavior: "auto", block: "start" },
      },
    ]);
  });
  await waitFor(() => assert.ok(screen.getAllByRole("table").length > 0));
});
