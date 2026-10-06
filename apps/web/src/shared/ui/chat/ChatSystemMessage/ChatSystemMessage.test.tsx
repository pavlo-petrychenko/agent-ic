import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatSystemMessage } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage';
import { ChatSystemMessageTone } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.module.scss';

describe('ChatSystemMessage', () => {
  it('shows the event text with its icon', () => {
    const { container } = render(
      <ChatSystemMessage icon={IconName.Hand} text="Pavlo took over · 14:05" />,
    );

    expect(screen.getByText('Pavlo took over · 14:05')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="hand"]')).not.toBeNull();
  });

  it('is neutral by default', () => {
    render(<ChatSystemMessage icon={IconName.Check} text="Chat closed by Pavlo · 14:12" />);

    expect(screen.getByText('Chat closed by Pavlo · 14:12').parentElement).toHaveClass(
      cssClass(styles.neutral),
    );
  });

  it.each(Object.values(ChatSystemMessageTone))('applies the %s tone', (tone) => {
    render(<ChatSystemMessage tone={tone} icon={IconName.Alert} text="Event" />);

    expect(screen.getByText('Event').parentElement).toHaveClass(cssClass(styles[tone]));
  });

  it('hides the icon from assistive technology and is not interactive', () => {
    const { container } = render(
      <ChatSystemMessage
        tone={ChatSystemMessageTone.Err}
        icon={IconName.Alert}
        text="Message not delivered — bot blocked by the user"
      />,
    );

    expect(container.querySelector('[data-icon="alert"]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
