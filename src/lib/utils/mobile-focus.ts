/**
 * Mobile focus helper for keeping input fields visible above the keyboard
 */

/**
 * Scrolls the element into view with options to ensure it's visible above the keyboard
 * @param element The element to scroll into view
 * @param offset Additional offset to apply (useful for keyboard height)
 */
export function scrollIntoViewWithKeyboardOffset(
  element: HTMLElement,
  offset: number = 0,
): void {
  try {
    // Get the element's position relative to the viewport
    const elementRect = element.getBoundingClientRect();

    // Check if elementRect is valid
    if (
      !elementRect ||
      typeof elementRect.left !== "number" ||
      typeof elementRect.top !== "number"
    ) {
      console.warn(
        "Invalid element rectangle in scrollIntoViewWithKeyboardOffset",
      );
      return;
    }

    // Calculate the position to scroll to, accounting for the offset
    const scrollTop =
      window.pageYOffset ||
      (document.documentElement ? document.documentElement.scrollTop : 0);
    const scrollLeft =
      window.pageXOffset ||
      (document.documentElement ? document.documentElement.scrollLeft : 0);

    // Scroll to position the element near the top of the viewport, accounting for offset
    window.scrollTo({
      left: scrollLeft + elementRect.left,
      top: scrollTop + elementRect.top - offset,
      behavior: "smooth",
    });
  } catch (error) {
    console.warn("Error in scrollIntoViewWithKeyboardOffset:", error);
  }
}

/**
 * Attempts to keep an input element visible above the keyboard on mobile devices
 * @param inputElement The input element to keep visible
 * @param keyboardHeightEstimate Estimated height of the keyboard (default: 300px)
 */
let keepInputVisibleTimeout1: number | null = null;
let keepInputVisibleTimeout2: number | null = null;

export function keepInputVisibleOnMobile(
  inputElement: HTMLElement,
  keyboardHeightEstimate: number = 300,
): void {
  // Clear any existing timeouts to prevent multiple executions
  if (keepInputVisibleTimeout1 !== null) {
    clearTimeout(keepInputVisibleTimeout1);
    keepInputVisibleTimeout1 = null;
  }
  if (keepInputVisibleTimeout2 !== null) {
    clearTimeout(keepInputVisibleTimeout2);
    keepInputVisibleTimeout2 = null;
  }

  // Only apply on touch devices (likely mobile)
  if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) {
    return;
  }

  // Scroll the input into view with an offset for the keyboard
  scrollIntoViewWithKeyboardOffset(inputElement, keyboardHeightEstimate);

  // Add a small delay and try again in case the keyboard hasn't fully appeared yet
  keepInputVisibleTimeout1 = window.setTimeout(() => {
    // Double-check we're still on a touch device
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      scrollIntoViewWithKeyboardOffset(inputElement, keyboardHeightEstimate);
    }
    keepInputVisibleTimeout1 = null;
  }, 100);

  // Try one more time after a longer delay
  keepInputVisibleTimeout2 = window.setTimeout(() => {
    // Double-check we're still on a touch device
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      scrollIntoViewWithKeyboardOffset(inputElement, keyboardHeightEstimate);
    }
    keepInputVisibleTimeout2 = null;
  }, 500);
}

/**
 * Focuses an element and ensures it's visible above the keyboard on mobile devices
 * @param element The element to focus
 * @param keyboardHeightEstimate Estimated height of the keyboard (default: 300px)
 */
export function focusAndKeepVisible(
  element: HTMLElement,
  keyboardHeightEstimate: number = 300,
): void {
  // Focus the element
  element.focus();

  // Keep it visible
  keepInputVisibleOnMobile(element, keyboardHeightEstimate);
}
