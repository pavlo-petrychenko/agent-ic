import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ZoomControl } from '@/shared/ui/flow/ZoomControl/ZoomControl';
import { ZOOM_MAX, ZOOM_MIN } from '@/shared/ui/flow/ZoomControl/ZoomControl.constants';

const ZOOM_STEP = 0.25;
const noop = () => undefined;
const labels = { toolbar: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'Fit' };

const meta = {
  component: ZoomControl,
  args: { zoom: 1, onZoomIn: noop, onZoomOut: noop, onFit: noop, labels },
} satisfies Meta<typeof ZoomControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AtMinimum: Story = { args: { zoom: ZOOM_MIN } };
export const AtMaximum: Story = { args: { zoom: ZOOM_MAX } };

function InteractiveDemo() {
  const [zoom, setZoom] = useState(1);

  return (
    <ZoomControl
      zoom={zoom}
      labels={labels}
      onZoomIn={() => setZoom((value) => Math.min(ZOOM_MAX, value + ZOOM_STEP))}
      onZoomOut={() => setZoom((value) => Math.max(ZOOM_MIN, value - ZOOM_STEP))}
      onFit={() => setZoom(1)}
    />
  );
}

export const Interactive: Story = { render: () => <InteractiveDemo /> };
