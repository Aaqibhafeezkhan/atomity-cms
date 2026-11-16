// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

// jsdom has no layout, so every element reports zero rects and our
// "is it visible?" filter would skip everything. Pretend elements are visible.
beforeEach(() => {
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(
    () => [{}] as unknown as DOMRectList,
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderModal(onClose = vi.fn()) {
  render(
    <Modal title="Test dialog" onClose={onClose} footer={<button>Footer</button>}>
      <input type="file" hidden aria-label="hidden file" />
      <button>First</button>
      <button>Second</button>
    </Modal>,
  );
  return onClose;
}

const pressTab = (shiftKey = false) =>
  fireEvent.keyDown(document, { key: "Tab", shiftKey });

describe("Modal focus management : Issue #5", () => {
  it("moves focus into the dialog on open, skipping the hidden file input", () => {
    renderModal();
    // Not the file input, and not the Close button in the header.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "First" }));
  });

  it("wraps Tab from the last control back to the first", () => {
    renderModal();
    const first = screen.getByRole("button", { name: "Close" });
    screen.getByRole("button", { name: "Footer" }).focus();

    pressTab();

    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab from the first control to the last", () => {
    renderModal();
    screen.getByRole("button", { name: "Close" }).focus();

    pressTab(true);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Footer" }));
  });

  it("pulls focus back inside if it is somewhere outside the dialog", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    renderModal();
    outside.focus();

    pressTab();

    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    outside.remove();
  });

  it("closes on Escape", () => {
    const onClose = renderModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the opener when it closes", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = render(
      <Modal title="Test dialog" onClose={vi.fn()}>
        <button>Inside</button>
      </Modal>,
    );
    unmount();

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("wraps Shift+Tab to the last control when focus is on the dialog container", () => {
    // Buttons-only content, like the content-type picker.
    render(
      <Modal title="Test dialog" onClose={vi.fn()} footer={<button>Footer</button>}>
        <button>First</button>
        <button>Second</button>
      </Modal>,
    );
    screen.getByRole("dialog").focus();

    pressTab(true);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Footer" }));
  });

  it("ignores controls that are actually hidden when wrapping Tab", () => {
    // Override the "everything is visible" mock for this test only: an element
    // inside a [hidden] ancestor (or hidden itself) has no layout box, as in a browser.
    vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (this: Element) {
      return (this.closest("[hidden]") ? [] : [{}]) as unknown as DOMRectList;
    });

    render(
      <Modal
        title="Test dialog"
        onClose={vi.fn()}
        footer={
          <>
            <button>Footer</button>
            <button hidden>Ghost</button>
          </>
        }
      >
        <button>First</button>
      </Modal>,
    );
    screen.getByRole("button", { name: "Footer" }).focus();

    pressTab();

    // Footer is the last visible control, so Tab wraps to the first one (Close).
  // If hidden controls were not filtered out, Tab would move focus to Ghost
// instead of wrapping to the first visible control.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));
  });
});