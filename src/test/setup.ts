import '@testing-library/jest-dom/vitest'

class MockResizeObserver implements ResizeObserver {
  observe(): void {
    // No-op for tests.
  }

  unobserve(): void {
    // No-op for tests.
  }

  disconnect(): void {
    // No-op for tests.
  }
}

if (!window.ResizeObserver) {
  window.ResizeObserver = MockResizeObserver
}
