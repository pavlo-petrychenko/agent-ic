import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaneHeader } from '@/shared/ui/layout/PaneHeader/PaneHeader';
import { PaneHeaderHeight } from '@/shared/ui/layout/PaneHeader/PaneHeader.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/layout/PaneHeader/PaneHeader.module.scss';

const AVATAR = { initials: 'OK', name: 'Olena Kovalenko' };

describe('PaneHeader', () => {
  it('shows the title as a heading with its subtitle and the actions on the right', () => {
    render(
      <PaneHeader
        title="Olena Kovalenko"
        subtitle="Telegram · 2 min ago"
        actions={<button type="button">Details</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Olena Kovalenko' })).toBeInTheDocument();
    expect(screen.getByText('Telegram · 2 min ago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it('shows the avatar only in the chat header', () => {
    const { rerender } = render(<PaneHeader title="Chat" avatar={AVATAR} />);
    expect(screen.queryByRole('img', { name: 'Olena Kovalenko' })).not.toBeInTheDocument();

    rerender(<PaneHeader title="Chat" avatar={AVATAR} height={PaneHeaderHeight.Chat} />);
    expect(screen.getByRole('img', { name: 'Olena Kovalenko' })).toBeInTheDocument();
  });

  it('uses the panel height unless it is the chat header', () => {
    const { container, rerender } = render(<PaneHeader title="Details" />);
    expect(container.firstElementChild).toHaveClass(cssClass(styles.panel));

    rerender(<PaneHeader title="Chat" height={PaneHeaderHeight.Chat} />);
    expect(container.firstElementChild).toHaveClass(cssClass(styles.chat));
  });
});
