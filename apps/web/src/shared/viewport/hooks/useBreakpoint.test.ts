import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Breakpoint } from '@/shared/viewport/constants/viewport.constants';
import { useBreakpoint } from '@/shared/viewport/hooks/useBreakpoint';
import { createFakeViewport } from '@test/support/helpers/viewport.helpers';

describe('useBreakpoint', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [1600, Breakpoint.Wide],
    [1440, Breakpoint.Wide],
    [1439, Breakpoint.Default],
    [1280, Breakpoint.Default],
    [1279, Breakpoint.Compact],
    [1024, Breakpoint.Compact],
    [1023, Breakpoint.Unsupported],
  ])('maps a %ipx viewport to %s', (width, expected) => {
    vi.stubGlobal('matchMedia', createFakeViewport(width).matchMedia);

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toBe(expected);
  });

  it('follows the viewport as it is resized', () => {
    const viewport = createFakeViewport(1500);
    vi.stubGlobal('matchMedia', viewport.matchMedia);
    const { result } = renderHook(() => useBreakpoint());

    act(() => viewport.setWidth(1100));
    expect(result.current).toBe(Breakpoint.Compact);

    act(() => viewport.setWidth(900));
    expect(result.current).toBe(Breakpoint.Unsupported);

    act(() => viewport.setWidth(1300));
    expect(result.current).toBe(Breakpoint.Default);
  });

  it('assumes a wide viewport where media queries are unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toBe(Breakpoint.Wide);
  });
});
