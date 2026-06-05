import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  scrollIntoViewWithKeyboardOffset,
  keepInputVisibleOnMobile,
  focusAndKeepVisible,
} from "$lib/utils/mobile-focus";

// Mock DOM environment for browser APIs
const mockGetBoundingClientRect = vi.fn();

describe("mobile-focus", () => {
  // Mock DOM elements and methods
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Mock window and document
    global.window = {
      scrollTo: vi.fn(),
      pageYOffset: 0,
      pageXOffset: 0,
      ontouchstart: undefined,
      setTimeout: vi.fn((fn) => {
        fn();
        return 1;
      }),
      clearTimeout: vi.fn(),
    } as unknown as Window & typeof globalThis;

    global.document = {
      createElement: vi.fn().mockReturnValue({
        focus: vi.fn(),
        getBoundingClientRect: mockGetBoundingClientRect,
      }),
      documentElement: {
        scrollTop: 0,
        scrollLeft: 0,
      },
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as unknown as Document;

    global.navigator = {
      maxTouchPoints: 0,
    } as unknown as Navigator;

    // Create a mock element
    mockElement = document.createElement("input") as HTMLElement;
    mockElement.focus = vi.fn();

    // Mock element methods
    mockGetBoundingClientRect.mockReturnValue({
      top: 100,
      left: 50,
      bottom: 150,
      right: 200,
      width: 150,
      height: 50,
      x: 50,
      y: 100,
      toJSON: () => {},
    });
  });

  afterEach(() => {
    // Clean up
    vi.clearAllMocks();
  });

  describe("scrollIntoViewWithKeyboardOffset", () => {
    it("should scroll element into view with default offset", () => {
      scrollIntoViewWithKeyboardOffset(mockElement);

      expect(window.scrollTo).toHaveBeenCalledWith({
        left: 50,
        top: 100,
        behavior: "smooth",
      });
    });

    it("should scroll element into view with custom offset", () => {
      scrollIntoViewWithKeyboardOffset(mockElement, 200);

      expect(window.scrollTo).toHaveBeenCalledWith({
        left: 50,
        top: -100, // 100 (element top) - 200 (offset)
        behavior: "smooth",
      });
    });
  });

  describe("keepInputVisibleOnMobile", () => {
    it("should not scroll on non-touch devices", () => {
      // Mock non-touch device
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 0,
        writable: true,
      });

      // Ensure ontouchstart is not defined
      delete window.ontouchstart;

      keepInputVisibleOnMobile(mockElement);

      // Should not call scrollTo on non-touch devices
      expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it("should scroll on touch devices", () => {
      // Mock touch device
      window.ontouchstart = vi.fn();
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 2,
        writable: true,
      });

      keepInputVisibleOnMobile(mockElement);

      // Should call scrollTo on touch devices
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  describe("focusAndKeepVisible", () => {
    it("should focus element and keep it visible", () => {
      // Mock non-touch device
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 0,
        writable: true,
      });

      // Ensure ontouchstart is not defined
      delete window.ontouchstart;

      focusAndKeepVisible(mockElement);

      // Should call focus
      expect(mockElement.focus).toHaveBeenCalled();

      // Should not call scrollTo on non-touch devices
      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });
});
