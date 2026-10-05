import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatBubble } from '@/shared/ui/chat/ChatBubble/ChatBubble';
import {
  ChatBubbleFrom,
  ChatBubbleView,
  WIDGET_ACCENT_PROPERTY,
} from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/chat/ChatBubble/ChatBubble.module.scss';

const getRoot = (text: string) => {
  const root = screen.getByText(text).parentElement;
  if (root === null) {
    throw new Error('Bubble root is missing');
  }
  return root;
};

describe('ChatBubble', () => {
  it('shows the message with the author and time', () => {
    render(
      <ChatBubble from={ChatBubbleFrom.Customer} author="Marta" time="14:17">
        Hi, can I move my booking?
      </ChatBubble>,
    );

    expect(screen.getByText('Hi, can I move my booking?')).toBeInTheDocument();
    expect(screen.getByText('Marta · 14:17')).toBeInTheDocument();
  });

  it('puts the customer on the start side with a card surface', () => {
    render(
      <ChatBubble from={ChatBubbleFrom.Customer} author="Marta" time="14:17">
        Hello
      </ChatBubble>,
    );

    expect(getRoot('Hello')).toHaveClass(cssClass(styles.start));
    expect(screen.getByText('Hello')).toHaveClass(cssClass(styles.card));
  });

  it('puts the agent on the end side with a violet surface and an agent icon', () => {
    const { container } = render(
      <ChatBubble from={ChatBubbleFrom.Agent} author="Salon assistant" time="14:17">
        Sure
      </ChatBubble>,
    );

    expect(getRoot('Sure')).toHaveClass(cssClass(styles.end));
    expect(screen.getByText('Sure')).toHaveClass(cssClass(styles.violet));
    expect(container.querySelector('[data-icon="agent"]')).not.toBeNull();
  });

  it('puts the operator on the end side with an accent surface and no icon', () => {
    const { container } = render(
      <ChatBubble from={ChatBubbleFrom.Operator} author="Pavlo (you)" time="14:06">
        I will handle this
      </ChatBubble>,
    );

    expect(getRoot('I will handle this')).toHaveClass(cssClass(styles.end));
    expect(screen.getByText('I will handle this')).toHaveClass(cssClass(styles.accentLight));
    expect(screen.getByText('Pavlo (you) · 14:06')).toBeInTheDocument();
    expect(container.querySelector('[data-icon]')).toBeNull();
  });

  it('leaves out the meta line when there is no author and no time', () => {
    const { container } = render(
      <ChatBubble from={ChatBubbleFrom.Customer} author={null} time={null}>
        Hello
      </ChatBubble>,
    );

    expect(container.querySelector(`.${cssClass(styles.meta)}`)).toBeNull();
  });

  it('shows only the time when the author is missing', () => {
    render(
      <ChatBubble from={ChatBubbleFrom.Customer} author={null} time="14:17">
        Hello
      </ChatBubble>,
    );

    expect(screen.getByText('14:17')).toBeInTheDocument();
  });

  it('flips the sides in the widget view and puts the customer on the accent', () => {
    render(
      <>
        <ChatBubble
          from={ChatBubbleFrom.Agent}
          author={null}
          time={null}
          view={ChatBubbleView.Widget}
        >
          From the bot
        </ChatBubble>
        <ChatBubble
          from={ChatBubbleFrom.Customer}
          author={null}
          time={null}
          view={ChatBubbleView.Widget}
        >
          From the visitor
        </ChatBubble>
      </>,
    );

    expect(getRoot('From the bot')).toHaveClass(cssClass(styles.start));
    expect(screen.getByText('From the bot')).toHaveClass(cssClass(styles.card));
    expect(getRoot('From the visitor')).toHaveClass(cssClass(styles.end));
    expect(screen.getByText('From the visitor')).toHaveClass(cssClass(styles.widgetAccent));
  });

  it('sets the widget accent as a custom property', () => {
    render(
      <ChatBubble
        from={ChatBubbleFrom.Customer}
        author={null}
        time={null}
        view={ChatBubbleView.Widget}
        accent="#2f5bd3"
      >
        Hello
      </ChatBubble>,
    );

    expect(getRoot('Hello').style.getPropertyValue(WIDGET_ACCENT_PROPERTY)).toBe('#2f5bd3');
  });

  it('passes native attributes through', () => {
    render(
      <ChatBubble from={ChatBubbleFrom.Customer} author="Marta" time="14:17" data-testid="bubble">
        Hello
      </ChatBubble>,
    );

    expect(screen.getByTestId('bubble')).toBeInTheDocument();
  });
});
