import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChartTooltip } from '@/shared/ui/charts/ChartTooltip/ChartTooltip';
import { ChartTooltipPlacement } from '@/shared/ui/charts/ChartTooltip/ChartTooltip.constants';
import { useChartHighlight } from '@/shared/ui/charts/ChartTooltip/useChartHighlight';
import { ChartColor } from '@/shared/ui/display/Legend';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/charts/ChartTooltip/ChartTooltip.module.scss';

const SIZE = { width: 120, height: 30 };
const BOUNDS = { width: 520, height: 200 };

const mockSize = () => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(SIZE.width);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(SIZE.height);
};

const press = (key: string) => ({ key, preventDefault: vi.fn<() => void>() });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChartTooltip', () => {
  it('shows the title and the value on one line above the anchor', () => {
    mockSize();
    render(
      <ChartTooltip
        title="Tue, Sep 29"
        rows={[{ id: 'value', label: null, value: '301 chats', color: null }]}
        anchor={{ x: 200, y: 100 }}
        placement={ChartTooltipPlacement.Above}
        bounds={BOUNDS}
      />,
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Tue, Sep 29 · 301 chats');
    expect(tooltip).toHaveClass(cssClass(styles.inline));
    expect(tooltip).toHaveStyle({ left: '140px', top: '62px' });
  });

  it('flips below the anchor near the top edge', () => {
    mockSize();
    render(
      <ChartTooltip
        title="Tue"
        rows={[{ id: 'value', label: null, value: '1', color: null }]}
        anchor={{ x: 200, y: 10 }}
        placement={ChartTooltipPlacement.Above}
        bounds={BOUNDS}
      />,
    );

    expect(screen.getByRole('tooltip')).toHaveStyle({ top: '18px' });
  });

  it('stacks one row per series with a coloured dot to the right of the anchor', () => {
    mockSize();
    const { container } = render(
      <ChartTooltip
        title="Mon, Sep 28"
        rows={[
          { id: 'telegram', label: 'Telegram', value: '240', color: ChartColor.Chart1 },
          { id: 'api', label: 'API', value: '96', color: ChartColor.Chart2 },
        ]}
        anchor={{ x: 100, y: 8 }}
        placement={ChartTooltipPlacement.Right}
        bounds={BOUNDS}
      />,
    );

    expect(screen.getByRole('tooltip')).toHaveClass(cssClass(styles.stacked));
    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '112px', top: '8px' });
    expect(container.querySelector(`.${cssClass(styles[ChartColor.Chart2])}`)).not.toBeNull();
  });

  it('flips to the left of the anchor near the right edge', () => {
    mockSize();
    render(
      <ChartTooltip
        title="Wed"
        rows={[{ id: 'a', label: 'A', value: '1', color: ChartColor.Chart1 }]}
        anchor={{ x: 480, y: 8 }}
        placement={ChartTooltipPlacement.Right}
        bounds={BOUNDS}
      />,
    );

    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '348px' });
  });

  it('renders nothing while hidden', () => {
    render(
      <ChartTooltip
        title="Wed"
        rows={[]}
        anchor={{ x: 0, y: 0 }}
        placement={ChartTooltipPlacement.Right}
        visible={false}
      />,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('useChartHighlight', () => {
  it('walks the data with the arrow keys and stops at the ends', () => {
    const onHighlight = vi.fn<(index: number | null) => void>();
    const { result } = renderHook(() => useChartHighlight({ count: 3, onHighlight }));

    act(() => result.current.onKeyDown(press('ArrowLeft')));
    expect(result.current.index).toBe(2);

    act(() => result.current.onKeyDown(press('ArrowRight')));
    expect(result.current.index).toBe(2);

    act(() => result.current.onKeyDown(press('Home')));
    expect(result.current.index).toBe(0);

    act(() => result.current.onKeyDown(press('Escape')));
    expect(result.current.index).toBeNull();
    expect(onHighlight.mock.calls).toEqual([[2], [0], [null]]);
  });

  it('ignores other keys and an index outside the data', () => {
    const { result } = renderHook(() => useChartHighlight({ count: 2 }));
    const event = press('Enter');

    act(() => result.current.onKeyDown(event));
    act(() => result.current.setIndex(5));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.index).toBeNull();
  });
});
