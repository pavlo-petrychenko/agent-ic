import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Coachmark } from '@/shared/ui/overlays/Coachmark/Coachmark';
import {
  COACHMARK_CENTERED,
  COACHMARK_SPOTLIGHT_PADDING,
  CoachmarkPlacement,
} from '@/shared/ui/overlays/Coachmark/Coachmark.constants';
import type { CoachmarkProps } from '@/shared/ui/overlays/Coachmark/Coachmark.typedefs';

const TARGET_RECT = { top: 200, left: 300, width: 120, height: 40 };
const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 768;
const targets: HTMLElement[] = [];

function createTarget(rect = TARGET_RECT): HTMLButtonElement {
  const target = document.createElement('button');
  document.body.append(target);
  targets.push(target);
  target.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
  return target;
}

function renderCoachmark(overrides: Partial<CoachmarkProps> = {}) {
  const props: CoachmarkProps = {
    open: true,
    target: null,
    title: 'Publish your agent',
    children: 'Publishing puts the agent on your channels.',
    progress: null,
    formatProgress: ({ current, total }) => `${current} of ${total}`,
    primaryAction: { label: 'Next', onClick: vi.fn<() => void>() },
    secondaryAction: null,
    skipStepAction: null,
    onDismiss: vi.fn<() => void>(),
    dismissLabel: 'Skip tour',
    closeLabel: 'Close tour',
    ...overrides,
  };
  return { props, ...render(<Coachmark {...props} />) };
}

beforeEach(() => {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT_WIDTH);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(VIEWPORT_HEIGHT);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const target of targets.splice(0)) {
    target.remove();
  }
});

describe('Coachmark', () => {
  it('renders the title, body and progress as a described dialog', () => {
    renderCoachmark({ progress: { current: 2, total: 9 } });

    const dialog = screen.getByRole('dialog', { name: 'Publish your agent' });
    expect(dialog).toHaveAccessibleDescription('Publishing puts the agent on your channels.');
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(within(dialog).getByText('2 of 9')).toBeInTheDocument();
  });

  it('omits the progress label without progress', () => {
    renderCoachmark();

    expect(screen.queryByText(/ of /)).not.toBeInTheDocument();
  });

  it('renders nothing while closed', () => {
    renderCoachmark({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelector('[data-coachmark-spotlight]')).toBeNull();
    expect(document.querySelector('[data-coachmark-backdrop]')).toBeNull();
  });

  it('runs the primary, secondary and skip step actions', async () => {
    const { props } = renderCoachmark({
      secondaryAction: { label: 'Back', onClick: vi.fn<() => void>() },
      skipStepAction: { label: 'Skip step', onClick: vi.fn<() => void>() },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await userEvent.click(screen.getByRole('button', { name: 'Skip step' }));

    expect(props.primaryAction.onClick).toHaveBeenCalledOnce();
    expect(props.secondaryAction?.onClick).toHaveBeenCalledOnce();
    expect(props.skipStepAction?.onClick).toHaveBeenCalledOnce();
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it('leaves out the optional actions when they are null', () => {
    renderCoachmark();

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip step' })).not.toBeInTheDocument();
  });

  it('dismisses through the skip tour button and the close icon', async () => {
    const { props } = renderCoachmark();

    await userEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close tour' }));

    expect(props.onDismiss).toHaveBeenCalledTimes(2);
  });

  it('dismisses on Escape', async () => {
    const { props } = renderCoachmark();

    await userEvent.keyboard('{Escape}');

    expect(props.onDismiss).toHaveBeenCalledOnce();
  });

  it('ignores Escape that another layer already handled', () => {
    const { props } = renderCoachmark();

    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    event.preventDefault();
    document.dispatchEvent(event);

    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it('stops listening for Escape once closed', async () => {
    const { props, rerender } = renderCoachmark();

    rerender(<Coachmark {...props} open={false} />);
    await userEvent.keyboard('{Escape}');

    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it('moves focus to the primary action without trapping it', async () => {
    render(<button type="button">Outside</button>);
    renderCoachmark();

    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  it('keeps focus where it is when the same step reappears', async () => {
    render(<button type="button">Outside</button>);
    const { props, rerender } = renderCoachmark();

    rerender(<Coachmark {...props} open={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    rerender(<Coachmark {...props} open target={createTarget()} />);

    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  it('moves focus to the primary action again when the step changes', () => {
    render(<button type="button">Outside</button>);
    const { props, rerender } = renderCoachmark();

    screen.getByRole('button', { name: 'Outside' }).focus();
    rerender(<Coachmark {...props} title="Test your agent" />);

    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('centres the card and dims the page when there is no target', () => {
    renderCoachmark();

    expect(screen.getByRole('dialog')).toHaveAttribute('data-placement', COACHMARK_CENTERED);
    expect(document.querySelector('[data-coachmark-backdrop]')).not.toBeNull();
    expect(document.querySelector('[data-coachmark-spotlight]')).toBeNull();
  });

  it('cuts a padded spotlight around the target and places the card beside it', () => {
    renderCoachmark({ target: createTarget(), placement: CoachmarkPlacement.Bottom });

    const spotlight = document.querySelector<HTMLElement>('[data-coachmark-spotlight]');
    expect(spotlight).not.toBeNull();
    expect(spotlight?.style.top).toBe(`${TARGET_RECT.top - COACHMARK_SPOTLIGHT_PADDING}px`);
    expect(spotlight?.style.left).toBe(`${TARGET_RECT.left - COACHMARK_SPOTLIGHT_PADDING}px`);
    expect(spotlight?.style.width).toBe(`${TARGET_RECT.width + 2 * COACHMARK_SPOTLIGHT_PADDING}px`);
    expect(spotlight?.style.height).toBe(
      `${TARGET_RECT.height + 2 * COACHMARK_SPOTLIGHT_PADDING}px`,
    );
    expect(document.querySelector('[data-coachmark-backdrop]')).toBeNull();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-placement', COACHMARK_CENTERED);
  });

  it('follows the target when the window resizes', async () => {
    const target = createTarget();
    renderCoachmark({ target });
    const moved = { ...TARGET_RECT, left: 480 };
    target.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: moved.left, y: moved.top, width: moved.width, height: moved.height });

    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      expect(document.querySelector<HTMLElement>('[data-coachmark-spotlight]')?.style.left).toBe(
        `${moved.left - COACHMARK_SPOTLIGHT_PADDING}px`,
      );
    });
  });

  it('follows the target when any scroll container scrolls', async () => {
    const target = createTarget();
    renderCoachmark({ target });
    const moved = { ...TARGET_RECT, top: 90 };
    target.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: moved.left, y: moved.top, width: moved.width, height: moved.height });

    target.dispatchEvent(new Event('scroll'));
    document.body.dispatchEvent(new Event('scroll'));

    await waitFor(() => {
      expect(document.querySelector<HTMLElement>('[data-coachmark-spotlight]')?.style.top).toBe(
        `${moved.top - COACHMARK_SPOTLIGHT_PADDING}px`,
      );
    });
  });

  it('scrolls a target that is out of view into view', () => {
    const target = createTarget({ ...TARGET_RECT, top: 4000 });
    const scrollIntoView = vi.fn<HTMLElement['scrollIntoView']>();
    target.scrollIntoView = scrollIntoView;

    renderCoachmark({ target });

    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it('does not scroll a target that is already in view', () => {
    const target = createTarget({ top: 20, left: 20, width: 10, height: 10 });
    const scrollIntoView = vi.fn<HTMLElement['scrollIntoView']>();
    target.scrollIntoView = scrollIntoView;

    renderCoachmark({ target });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('falls back to the centred card when the target leaves the page', async () => {
    const target = createTarget();
    renderCoachmark({ target });

    target.remove();
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveAttribute('data-placement', COACHMARK_CENTERED);
    });
  });
});
