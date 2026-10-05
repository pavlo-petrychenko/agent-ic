import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Legend } from '@/shared/ui/display/Legend/Legend';
import { ChartColor, LegendMarkerKind } from '@/shared/ui/display/Legend/Legend.constants';
import type { LegendItem } from '@/shared/ui/display/Legend/Legend.typedefs';
import { StatusKind } from '@/shared/ui/display/StatusDot';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/display/Legend/Legend.module.scss';

const SERIES: LegendItem[] = [
  {
    id: 'sent',
    label: 'Sent',
    marker: { kind: LegendMarkerKind.Series, color: ChartColor.Chart1 },
  },
  {
    id: 'read',
    label: 'Read',
    marker: { kind: LegendMarkerKind.Series, color: ChartColor.Chart2 },
  },
];

const STATUSES: LegendItem[] = [
  { id: 'ran', label: 'Ran', marker: { kind: LegendMarkerKind.Status, status: StatusKind.Ok } },
  {
    id: 'running',
    label: 'Running',
    marker: { kind: LegendMarkerKind.Status, status: StatusKind.Run },
  },
];

describe('Legend', () => {
  it('lists the items as text with a marker for each', () => {
    const { container } = render(<Legend items={STATUSES} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Ran')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-kind]')).toHaveLength(2);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('colours a series swatch from the chart palette', () => {
    const { container } = render(<Legend items={SERIES} />);

    const swatches = container.querySelectorAll(`.${cssClass(styles.swatch)}`);
    expect(swatches[0]).toHaveClass(cssClass(styles[ChartColor.Chart1]));
    expect(swatches[1]).toHaveClass(cssClass(styles[ChartColor.Chart2]));
  });

  it('turns items into toggle buttons and reports the one clicked', async () => {
    const onToggle = vi.fn<(id: string) => void>();
    render(<Legend items={SERIES} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: 'Read' }));

    expect(onToggle).toHaveBeenCalledWith('read');
    expect(screen.getByRole('button', { name: 'Read' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a hidden series with the muted swatch and a struck label', () => {
    const { container } = render(
      <Legend items={SERIES} hiddenIds={['read']} onToggle={vi.fn<(id: string) => void>()} />,
    );

    expect(screen.getByRole('button', { name: 'Read' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Read')).toHaveClass(cssClass(styles.hiddenLabel));
    expect(container.querySelector(`.${cssClass(styles[ChartColor.Muted])}`)).not.toBeNull();
  });

  it('keeps the last visible series from being hidden', async () => {
    const onToggle = vi.fn<(id: string) => void>();
    render(<Legend items={SERIES} hiddenIds={['read']} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sent' }));

    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sent' })).toHaveAttribute('aria-disabled', 'true');
  });
});
