import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => undefined;
Element.prototype.releasePointerCapture = () => undefined;
window.scrollTo = vi.fn<() => void>();

class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;

Range.prototype.getClientRects = () => document.createElement('div').getClientRects();
Range.prototype.getBoundingClientRect = () => new DOMRect();
document.elementFromPoint = () => null;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
