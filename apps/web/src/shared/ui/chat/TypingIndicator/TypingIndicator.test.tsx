import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatBubbleView } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { TypingIndicator } from '@/shared/ui/chat/TypingIndicator/TypingIndicator';
import {
  TYPING_DOT_COUNT,
  TYPING_MAX_MS,
} from '@/shared/ui/chat/TypingIndicator/TypingIndicator.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/chat/TypingIndicator/TypingIndicator.module.scss';

const elapse = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('TypingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces the caption as a status', () => {
    render(<TypingIndicator label="Salon assistant is typing…" />);

    expect(screen.getByRole('status')).toHaveTextContent('Salon assistant is typing…');
  });

  it('hides the dots from assistive technology', () => {
    const { container } = render(<TypingIndicator label="Typing" />);

    const dots = container.querySelector('[aria-hidden="true"]');
    expect(dots?.children).toHaveLength(TYPING_DOT_COUNT);
  });

  it('hides itself once the longest typing time has passed', () => {
    render(<TypingIndicator label="Typing" />);

    elapse(TYPING_MAX_MS - 1);
    expect(screen.getByRole('status')).toBeInTheDocument();

    elapse(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('sits on the end side in the thread and on the start side in the widget', () => {
    const { rerender } = render(<TypingIndicator label="Typing" />);
    expect(screen.getByRole('status')).toHaveClass(cssClass(styles.thread));

    rerender(<TypingIndicator label="Typing" view={ChatBubbleView.Widget} />);
    expect(screen.getByRole('status')).toHaveClass(cssClass(styles.widget));
  });
});
