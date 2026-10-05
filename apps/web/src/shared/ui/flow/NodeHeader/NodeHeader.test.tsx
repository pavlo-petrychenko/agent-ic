import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { NodeHeader } from '@/shared/ui/flow/NodeHeader/NodeHeader';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/NodeHeader/NodeHeader.module.scss';

describe('NodeHeader', () => {
  it('shows the kind overline and the node name', () => {
    render(<NodeHeader kind={NodeKind.Agent} overline="Agent" name="Receptionist" />);

    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Receptionist')).toBeInTheDocument();
  });

  it('draws the default icon of the kind, hidden from assistive technology', () => {
    const { container } = render(
      <NodeHeader kind={NodeKind.Router} overline="Decision" name="Needs a person?" />,
    );

    expect(container.querySelector('[data-icon="router"]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('prefers an explicit icon', () => {
    const { container } = render(
      <NodeHeader kind={NodeKind.Tool} overline="Tool" name="Lookup" icon={IconName.Key} />,
    );

    expect(container.querySelector('[data-icon="key"]')).toBeInTheDocument();
  });

  it('tints the overline by kind', () => {
    const { container } = render(<NodeHeader kind={NodeKind.Send} overline="Send" name="Reply" />);

    expect(container.firstElementChild).toHaveClass(cssClass(styles.send));
  });

  it('names the problem of an invalid node', () => {
    render(
      <NodeHeader
        kind={NodeKind.Agent}
        overline="Agent"
        name="Receptionist"
        invalidLabel="This step has no prompt"
      />,
    );

    expect(screen.getByRole('img', { name: 'This step has no prompt' })).toBeInTheDocument();
  });
});
