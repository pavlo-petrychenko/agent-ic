import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SubnavItem } from '@/shared/ui/SubnavItem/SubnavItem';
import { SubnavItemDepth, SubnavItemMetaKind } from '@/shared/ui/SubnavItem/SubnavItem.constants';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/SubnavItem/SubnavItem.module.scss';

describe('SubnavItem', () => {
  it('links to its destination with a trailing count', async () => {
    render(
      <MemoryRouter>
        <SubnavItem to="/auth/sign-up" label="Roles" meta="4" />
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: /^Roles/ });
    expect(link).toHaveAttribute('href', '/auth/sign-up');
    expect(screen.getByText('4')).toHaveClass(cssClass(styles.count));
    expect(link).not.toHaveAttribute('aria-current');
  });

  it('marks the selected row as the current page and shows a version', async () => {
    render(
      <MemoryRouter>
        <SubnavItem
          to="/auth/login"
          label="Receptionist"
          meta="v4"
          metaKind={SubnavItemMetaKind.Version}
          depth={SubnavItemDepth.Nested}
          selected
        />
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: /^Receptionist/ });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass(cssClass(styles.nested));
    expect(screen.getByText('v4')).toHaveClass(cssClass(styles.version));
  });

  it('ignores clicks and leaves the tab order when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <MemoryRouter>
        <SubnavItem to="/auth/sign-up" label="API tokens" disabled onClick={onClick} />
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: 'API tokens' });
    await userEvent.click(link, { pointerEventsCheck: 0 });

    expect(onClick).not.toHaveBeenCalled();
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });
});
