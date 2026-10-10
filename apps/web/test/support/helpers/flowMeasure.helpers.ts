import { vi } from 'vitest';
import { FLOW_NODE_SELECTOR } from '@test/support/constants/flowMeasure.constants';
import type { FlowNodeSize } from '@test/support/typedefs/flowMeasure.typedefs';

const UNMEASURED: FlowNodeSize = { width: 0, height: 0 };
const IDENTITY_SCALE = 1;

class IdentityMatrix {
  readonly m22 = IDENTITY_SCALE;
}

class MeasuringResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect(),
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }

  unobserve() {}

  disconnect() {}
}

export const measureFlowNodes = (size: FlowNodeSize) => {
  const sizeOf = (element: HTMLElement): FlowNodeSize =>
    element.matches(FLOW_NODE_SELECTOR) ? size : UNMEASURED;
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function width(
    this: HTMLElement,
  ) {
    return sizeOf(this).width;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function height(
    this: HTMLElement,
  ) {
    return sizeOf(this).height;
  });
  vi.stubGlobal('ResizeObserver', MeasuringResizeObserver);
  vi.stubGlobal('DOMMatrixReadOnly', IdentityMatrix);
};
