import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ZoomControl } from '@/shared/ui/flow/ZoomControl/ZoomControl';
import { ZOOM_MAX, ZOOM_MIN } from '@/shared/ui/flow/ZoomControl/ZoomControl.constants';
import type { ZoomControlProps } from '@/shared/ui/flow/ZoomControl/ZoomControl.typedefs';

const labels = { toolbar: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'Fit' };

const renderControl = (props: Partial<ZoomControlProps> = {}) =>
  render(
    <ZoomControl
      zoom={1}
      labels={labels}
      onZoomIn={vi.fn<() => void>()}
      onZoomOut={vi.fn<() => void>()}
      onFit={vi.fn<() => void>()}
      locale="en"
      {...props}
    />,
  );

describe('ZoomControl', () => {
  it('is a named toolbar that announces the zoom level', () => {
    renderControl({ zoom: 1.5 });

    expect(screen.getByRole('toolbar', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('150%');
  });

  it('reports zoom in, zoom out and fit', async () => {
    const onZoomIn = vi.fn<() => void>();
    const onZoomOut = vi.fn<() => void>();
    const onFit = vi.fn<() => void>();
    renderControl({ onZoomIn, onZoomOut, onFit });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fit' }));

    expect(onZoomIn).toHaveBeenCalledOnce();
    expect(onZoomOut).toHaveBeenCalledOnce();
    expect(onFit).toHaveBeenCalledOnce();
  });

  it('disables zoom out at the minimum and zoom in at the maximum', () => {
    const { rerender } = renderControl({ zoom: ZOOM_MIN });
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();

    rerender(
      <ZoomControl
        zoom={ZOOM_MAX}
        labels={labels}
        onZoomIn={vi.fn<() => void>()}
        onZoomOut={vi.fn<() => void>()}
        onFit={vi.fn<() => void>()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  });

  it('moves between its buttons with the arrow keys', async () => {
    renderControl();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveFocus();
  });
});
