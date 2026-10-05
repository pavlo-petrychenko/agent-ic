import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import { Notice } from '@/shared/ui/Notice/Notice';

const renderInList = (notice: React.ReactElement) => render(<ul>{notice}</ul>);

describe('Notice', () => {
  it('shows the title and the meta line as a list item', () => {
    renderInList(
      <Notice
        icon={IconName.Hand}
        tone={NodeKind.Info}
        title="2 chats are waiting for a person"
        meta="oldest 4 min"
      />,
    );

    expect(screen.getByRole('listitem')).toBeInTheDocument();
    expect(screen.getByText('2 chats are waiting for a person')).toBeInTheDocument();
    expect(screen.getByText('oldest 4 min')).toBeInTheDocument();
  });

  it('omits the meta and the action when they are null', () => {
    renderInList(<Notice icon={IconName.Hand} title="Title" meta={null} action={null} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls the action handler when the action is a button', async () => {
    const onClick = vi.fn<() => void>();
    renderInList(
      <Notice icon={IconName.Hand} title="Waiting" action={{ label: 'Open inbox', onClick }} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open inbox' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders the action as a link when it has an href', () => {
    renderInList(
      <Notice
        icon={IconName.Hand}
        title="Waiting"
        action={{ label: 'Open inbox', href: '/inbox' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Open inbox' })).toHaveAttribute('href', '/inbox');
  });

  it('describes the action by the title so its name carries context', () => {
    renderInList(
      <Notice
        icon={IconName.Hand}
        title="Waiting"
        action={{ label: 'Open inbox', href: '/inbox' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Open inbox' })).toHaveAccessibleDescription('Waiting');
  });
});
