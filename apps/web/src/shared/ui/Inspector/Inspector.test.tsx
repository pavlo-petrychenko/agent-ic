import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/Icon';
import { Inspector } from '@/shared/ui/Inspector/Inspector';
import { InspectorSection } from '@/shared/ui/Inspector/InspectorSection';
import { NodeKind } from '@/shared/ui/NodeTile';

function renderInspector(onClose = vi.fn<() => void>()) {
  render(
    <Inspector
      kind={{ label: 'Send message', kind: NodeKind.Send }}
      title="Welcome message"
      subtitle="Runs when a chat starts"
      closeLabel="Close inspector"
      onClose={onClose}
    >
      <InspectorSection title="Message" note="Markdown">
        <p>Hello there</p>
      </InspectorSection>
      <InspectorSection title="Behaviour">
        <p>Wait for reply</p>
      </InspectorSection>
    </Inspector>,
  );
  return onClose;
}

describe('Inspector', () => {
  it('is a complementary region named after the node with its kind, title and subtitle', () => {
    renderInspector();

    const region = screen.getByRole('complementary', { name: 'Welcome message' });
    expect(within(region).getByText('Send message')).toBeInTheDocument();
    expect(
      within(region).getByRole('heading', { level: 2, name: 'Welcome message' }),
    ).toBeInTheDocument();
    expect(within(region).getByText('Runs when a chat starts')).toBeInTheDocument();
  });

  it('groups its content in sections named by their titles', () => {
    renderInspector();

    const message = screen.getByRole('region', { name: 'Message' });
    expect(message).toHaveTextContent('Markdown');
    expect(message).toHaveTextContent('Hello there');
    expect(screen.getByRole('region', { name: 'Behaviour' })).toHaveTextContent('Wait for reply');
  });

  it('closes through its close button', async () => {
    const onClose = renderInspector();

    await userEvent.click(screen.getByRole('button', { name: 'Close inspector' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the kind icon unless another one is given', () => {
    const { container, rerender } = render(
      <Inspector
        kind={{ label: 'Send', kind: NodeKind.Send }}
        title="A"
        closeLabel="Close"
        onClose={vi.fn<() => void>()}
      >
        {null}
      </Inspector>,
    );
    expect(container.querySelector('[data-icon="send"]')).toBeInTheDocument();

    rerender(
      <Inspector
        kind={{ label: 'Send', kind: NodeKind.Send, icon: IconName.Key }}
        title="A"
        closeLabel="Close"
        onClose={vi.fn<() => void>()}
      >
        {null}
      </Inspector>,
    );
    expect(container.querySelector('[data-icon="key"]')).toBeInTheDocument();
  });

  it('leaves out the subtitle when it is not given one', () => {
    render(
      <Inspector
        kind={{ label: 'Send', kind: NodeKind.Send }}
        title="A"
        closeLabel="Close"
        onClose={vi.fn<() => void>()}
      >
        {null}
      </Inspector>,
    );

    expect(screen.getByRole('complementary').querySelectorAll('p')).toHaveLength(0);
  });
});
