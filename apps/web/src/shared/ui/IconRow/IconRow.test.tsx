import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { IconRow } from '@/shared/ui/IconRow/IconRow';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';

describe('IconRow', () => {
  it('shows the label and the trailing value', () => {
    render(<IconRow icon={IconName.Esc} tone={NodeKind.Esc} label="Escalate" trailing="yes" />);

    expect(screen.getByText('Escalate')).toBeInTheDocument();
    expect(screen.getByText('yes')).toBeInTheDocument();
  });

  it('renders no trailing slot when it is null', () => {
    const { container } = render(<IconRow icon={IconName.Esc} label="Escalate" trailing={null} />);

    expect(container.querySelectorAll('span > span')).toHaveLength(1);
  });

  it('keeps the tile decorative', () => {
    render(<IconRow icon={IconName.Esc} label="Escalate" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('passes through div attributes', () => {
    render(<IconRow icon={IconName.Esc} label="Escalate" data-testid="row" />);

    expect(screen.getByTestId('row')).toHaveTextContent('Escalate');
  });
});
