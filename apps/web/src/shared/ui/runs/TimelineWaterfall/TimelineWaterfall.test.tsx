import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimelineWaterfall } from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall';
import {
  TIMELINE_BAR_TOP,
  TIMELINE_FALLBACK_TRACK_WIDTH,
  TIMELINE_MIN_BAR_WIDTH,
} from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.constants';
import type {
  TimelineRowData,
  TimelineWaterfallProps,
} from '@/shared/ui/runs/TimelineWaterfall/TimelineWaterfall.typedefs';
import { TraceStepKind } from '@/shared/ui/runs/TraceRow/TraceRow.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import rowStyles from '@/shared/ui/runs/TimelineWaterfall/TimelineRow/TimelineRow.module.scss';

const TOTAL_MS = 3000;
const SCALE = TIMELINE_FALLBACK_TRACK_WIDTH / TOTAL_MS;

const AGENT_ROW: TimelineRowData = {
  id: 'agent',
  label: 'Receptionist',
  depth: 0,
  startMs: 0,
  durationMs: 3000,
  kind: TraceStepKind.Agent,
  durationLabel: '3.0 s',
  description: 'Receptionist, starts at 0 s, lasts 3.0 s',
};

const MODEL_ROW: TimelineRowData = {
  id: 'model',
  label: 'gpt-4.1',
  depth: 1,
  startMs: 300,
  durationMs: 1200,
  kind: TraceStepKind.Model,
  durationLabel: '1.2 s',
  description: 'gpt-4.1, starts at 0.3 s, lasts 1.2 s',
};

const TOOL_ROW: TimelineRowData = {
  id: 'tool',
  label: 'create_booking',
  depth: 1,
  startMs: 2400,
  durationMs: 600,
  kind: TraceStepKind.Tool,
  durationLabel: '0.6 s',
  description: 'create_booking, starts at 2.4 s, lasts 0.6 s',
};

const ROWS: TimelineRowData[] = [AGENT_ROW, MODEL_ROW, TOOL_ROW];

const TICKS = [
  { valueMs: 0, label: '0 s' },
  { valueMs: 1500, label: '1.5 s' },
  { valueMs: 3000, label: '3 s' },
];

const LEGEND_LABELS = {
  [TraceStepKind.Agent]: 'Agent',
  [TraceStepKind.Model]: 'Model',
  [TraceStepKind.Tool]: 'Tool',
  [TraceStepKind.Completion]: 'Completion',
  [TraceStepKind.Knowledge]: 'Knowledge',
};

function renderWaterfall(props: Partial<TimelineWaterfallProps> = {}) {
  return render(
    <TimelineWaterfall
      rows={ROWS}
      totalMs={TOTAL_MS}
      ticks={TICKS}
      ariaLabel="Run timeline"
      legendLabels={LEGEND_LABELS}
      legendAriaLabel="Step kinds"
      onSelect={vi.fn<(id: string) => void>()}
      {...props}
    />,
  );
}

const barOf = (container: HTMLElement, kind: TraceStepKind) => {
  const bar = container.querySelector(`rect[data-kind="${kind}"]`);
  if (bar === null) {
    throw new Error(`Expected a ${kind} bar`);
  }
  return bar;
};

describe('TimelineWaterfall', () => {
  it('lists one button per step in a labelled list, named with its start and duration', () => {
    renderWaterfall();

    const list = screen.getByRole('list', { name: 'Run timeline' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(
      within(list).getByRole('button', { name: 'create_booking, starts at 2.4 s, lasts 0.6 s' }),
    ).toBeInTheDocument();
  });

  it('draws each bar at its start and duration on the track scale', () => {
    const { container } = renderWaterfall();

    const model = barOf(container, TraceStepKind.Model);
    expect(Number(model.getAttribute('x'))).toBeCloseTo(300 * SCALE);
    expect(Number(model.getAttribute('width'))).toBeCloseTo(1200 * SCALE);
    expect(Number(model.getAttribute('y'))).toBe(TIMELINE_BAR_TOP);
  });

  it('keeps a very short step visible', () => {
    const { container } = renderWaterfall({
      rows: [{ ...TOOL_ROW, durationMs: 1 }],
    });

    expect(Number(barOf(container, TraceStepKind.Tool).getAttribute('width'))).toBe(
      TIMELINE_MIN_BAR_WIDTH,
    );
  });

  it('survives a run with no duration', () => {
    const { container } = renderWaterfall({ totalMs: 0 });

    expect(Number(barOf(container, TraceStepKind.Agent).getAttribute('width'))).toBe(
      TIMELINE_MIN_BAR_WIDTH,
    );
  });

  it('writes the duration after a bar with room and before one near the end', () => {
    const { container } = renderWaterfall();

    const labels = Array.from(container.querySelectorAll('text'));
    expect(labels[1]).toHaveAttribute('text-anchor', 'start');
    expect(labels[2]).toHaveAttribute('text-anchor', 'end');
  });

  it('indents a nested step by its depth', () => {
    renderWaterfall();

    expect(screen.getByText('Receptionist').parentElement).toHaveStyle({ paddingLeft: '0px' });
    expect(screen.getByText('gpt-4.1').parentElement).toHaveStyle({ paddingLeft: '12px' });
  });

  it('labels the axis ticks', () => {
    renderWaterfall();

    expect(screen.getByText('0 s')).toBeInTheDocument();
    expect(screen.getByText('1.5 s')).toHaveStyle({ left: '50%' });
    expect(screen.getByText('3 s')).toHaveStyle({ left: '100%' });
  });

  it('marks the selected step as current', () => {
    renderWaterfall({ selectedId: 'model' });

    expect(screen.getByRole('button', { name: /^gpt-4.1/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Receptionist/ })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('button', { name: /^gpt-4.1/ }).parentElement).toHaveClass(
      cssClass(rowStyles.selected),
    );
  });

  it('reports the step clicked and the one chosen with the keyboard', async () => {
    const onSelect = vi.fn<(id: string) => void>();
    renderWaterfall({ onSelect });

    await userEvent.click(screen.getByRole('button', { name: /^gpt-4.1/ }));
    screen.getByRole('button', { name: /^create_booking/ }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenNthCalledWith(1, 'model');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'tool');
  });

  it('shows the step name and duration in a tooltip while the pointer is on a row', async () => {
    renderWaterfall();
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();

    await userEvent.hover(screen.getByRole('button', { name: /^gpt-4.1/ }));
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveTextContent('gpt-4.1');
    expect(tooltip).toHaveTextContent('1.2 s');

    await userEvent.unhover(screen.getByRole('button', { name: /^gpt-4.1/ }));
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('shows the tooltip for a focused row too', async () => {
    renderWaterfall();

    await userEvent.tab();

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Receptionist');
  });

  it('keeps the drawing out of the accessibility tree', () => {
    const { container } = renderWaterfall();

    expect(container.querySelectorAll('svg')).toHaveLength(3);
    container.querySelectorAll('svg').forEach((svg) => {
      expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  it('lists only the step kinds that are drawn, with their labels', () => {
    renderWaterfall();

    const legend = screen.getByRole('list', { name: 'Step kinds' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Agent', 'Model', 'Tool']);
  });

  it('shows no legend without rows', () => {
    renderWaterfall({ rows: [] });

    expect(screen.queryByRole('list', { name: 'Step kinds' })).toBeNull();
  });

  it('shows the caption only when given', () => {
    const { rerender } = renderWaterfall();
    expect(screen.queryByText('Linked run · Tool event')).toBeNull();

    rerender(
      <TimelineWaterfall
        rows={ROWS}
        totalMs={TOTAL_MS}
        ticks={TICKS}
        ariaLabel="Run timeline"
        legendLabels={LEGEND_LABELS}
        legendAriaLabel="Step kinds"
        caption="Linked run · Tool event"
        onSelect={vi.fn<(id: string) => void>()}
      />,
    );
    expect(screen.getByText('Linked run · Tool event')).toBeInTheDocument();
  });
});
