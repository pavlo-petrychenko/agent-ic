import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SourceBadges } from '@/shared/ui/SourceBadges/SourceBadges';
import { SourceKind } from '@/shared/ui/SourceBadges/SourceBadges.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import badgeStyles from '@/shared/ui/Badge/Badge.module.scss';

describe('SourceBadges', () => {
  it('lists every source by its visible name', () => {
    render(
      <SourceBadges
        sources={[
          { kind: SourceKind.Channel, label: 'Channel' },
          { kind: SourceKind.Operator, label: 'Operator' },
        ]}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
  });

  it('tints each badge by where the value came from', () => {
    render(
      <SourceBadges
        sources={[
          { kind: SourceKind.Flow, label: 'Flow' },
          { kind: SourceKind.Operator, label: 'Operator' },
          { kind: SourceKind.Api, label: 'API' },
          { kind: SourceKind.System, label: 'System' },
        ]}
      />,
    );

    expect(screen.getByText('Flow')).toHaveClass(cssClass(badgeStyles.violet));
    expect(screen.getByText('Operator')).toHaveClass(cssClass(badgeStyles.accent));
    expect(screen.getByText('API')).toHaveClass(cssClass(badgeStyles.warn));
    expect(screen.getByText('System')).toHaveClass(cssClass(badgeStyles.neutral));
  });
});
