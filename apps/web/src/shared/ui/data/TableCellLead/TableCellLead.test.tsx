import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableCellLead } from '@/shared/ui/data/TableCellLead/TableCellLead';
import {
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/data/TableCellLead/TableCellLead.constants';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

describe('TableCellLead', () => {
  it('shows the title and subtitle beside a decorative icon tile', () => {
    const { container } = render(
      <TableCellLead
        title="Booking assistant"
        subtitle="Agent · 4 versions"
        lead={{ kind: TableCellLeadKind.Icon, tone: NodeKind.Agent }}
      />,
    );

    expect(screen.getByText('Booking assistant')).toBeInTheDocument();
    expect(screen.getByText('Agent · 4 versions')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="agent"]')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('uses the given icon at the md size', () => {
    const { container } = render(
      <TableCellLead
        title="Gift card helper"
        size={TableCellLeadSize.Md}
        lead={{ kind: TableCellLeadKind.Icon, tone: NodeKind.Tool, icon: IconName.Star }}
      />,
    );

    expect(container.querySelector('[data-icon="star"]')).toBeInTheDocument();
  });

  it('shows initials for a person and omits a missing subtitle', () => {
    render(
      <TableCellLead title="Olena K." lead={{ kind: TableCellLeadKind.Avatar, initials: 'OK' }} />,
    );

    expect(screen.getByText('OK')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Olena K.').parentElement?.children).toHaveLength(1);
  });
});
