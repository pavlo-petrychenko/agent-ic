import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/shared/ui/display/EmptyState/EmptyState';
import { EmptyStateTone } from '@/shared/ui/display/EmptyState/EmptyState.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/display/EmptyState/EmptyState.module.scss';

describe('EmptyState', () => {
  it('shows the title, the description and the next action', () => {
    render(
      <EmptyState
        icon={IconName.Send}
        tone={EmptyStateTone.Info}
        title="Check your inbox"
        description="We sent a confirmation link."
        actions={<button type="button">Resend</button>}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Check your inbox' })).toBeInTheDocument();
    expect(screen.getByText('We sent a confirmation link.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend' })).toBeInTheDocument();
  });

  it('tints the icon with the tone and leaves out what it was not given', () => {
    const { container } = render(
      <EmptyState icon={IconName.Alert} tone={EmptyStateTone.Warn} title="Link expired" />,
    );

    expect(container.querySelector(`.${styles.warn}`)).not.toBeNull();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
