import "@testing-library/jest-dom/vitest";

class ResizeObserverStub implements ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  disconnect() {}

  observe(): void {
    // No-op to satisfy tests that mount Radix Slider
    this.callback([], this as unknown as ResizeObserver);
  }

  unobserve(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;
}
