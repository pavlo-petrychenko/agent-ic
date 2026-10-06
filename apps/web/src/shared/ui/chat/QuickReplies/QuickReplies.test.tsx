import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WIDGET_ACCENT_PROPERTY } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { QuickReplies } from '@/shared/ui/chat/QuickReplies/QuickReplies';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/chat/QuickReplies/QuickReplies.module.scss';

const OPTIONS = ['Tomorrow', 'This week', 'Talk to a person'];

describe('QuickReplies', () => {
  it('is a labelled group of toggle buttons', () => {
    render(
      <QuickReplies
        label="Suggested replies"
        options={OPTIONS}
        chosen={null}
        onChoose={vi.fn<(option: string) => void>()}
      />,
    );

    const group = screen.getByRole('group', { name: 'Suggested replies' });
    expect(group).toBeInTheDocument();
    OPTIONS.forEach((option) => {
      expect(screen.getByRole('button', { name: option })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('reports the option that was pressed', async () => {
    const onChoose = vi.fn<(option: string) => void>();
    render(<QuickReplies label="Replies" options={OPTIONS} chosen={null} onChoose={onChoose} />);

    await userEvent.click(screen.getByRole('button', { name: 'This week' }));

    expect(onChoose).toHaveBeenCalledWith('This week');
  });

  it('marks the chosen option and disables the others', () => {
    render(
      <QuickReplies
        label="Replies"
        options={OPTIONS}
        chosen="Tomorrow"
        onChoose={vi.fn<(option: string) => void>()}
      />,
    );

    const chosen = screen.getByRole('button', { name: 'Tomorrow' });
    expect(chosen).toHaveAttribute('aria-pressed', 'true');
    expect(chosen).toHaveClass(cssClass(styles.chosen));
    expect(chosen).toBeEnabled();
    expect(screen.getByRole('button', { name: 'This week' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Talk to a person' })).toBeDisabled();
  });

  it('does not report a second choice', async () => {
    const onChoose = vi.fn<(option: string) => void>();
    render(
      <QuickReplies label="Replies" options={OPTIONS} chosen="Tomorrow" onChoose={onChoose} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tomorrow' }));
    await userEvent.click(screen.getByRole('button', { name: 'This week' }));

    expect(onChoose).not.toHaveBeenCalled();
  });

  it('disables every option when the whole group is disabled', async () => {
    const onChoose = vi.fn<(option: string) => void>();
    render(
      <QuickReplies label="Replies" options={OPTIONS} chosen={null} onChoose={onChoose} disabled />,
    );

    OPTIONS.forEach((option) => {
      expect(screen.getByRole('button', { name: option })).toBeDisabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Tomorrow' }));
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('can be reached and pressed with the keyboard', async () => {
    const onChoose = vi.fn<(option: string) => void>();
    render(<QuickReplies label="Replies" options={OPTIONS} chosen={null} onChoose={onChoose} />);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Tomorrow' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(onChoose).toHaveBeenCalledWith('Tomorrow');
  });

  it('takes the widget accent for the chosen pill', () => {
    render(
      <QuickReplies
        label="Replies"
        options={OPTIONS}
        chosen="Tomorrow"
        onChoose={vi.fn<(option: string) => void>()}
        accent="#2f5bd3"
      />,
    );

    const group = screen.getByRole('group', { name: 'Replies' });
    expect(group.style.getPropertyValue(WIDGET_ACCENT_PROPERTY)).toBe('#2f5bd3');
    expect(group).toHaveClass(cssClass(styles.accented));
  });
});
