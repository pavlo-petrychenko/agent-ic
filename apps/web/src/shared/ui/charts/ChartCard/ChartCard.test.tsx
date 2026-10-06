import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartCard } from '@/shared/ui/charts/ChartCard/ChartCard';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { HeadingElement } from '@/shared/ui/typography/Heading';

describe('ChartCard', () => {
  it('names the card region after its title and shows the meta text', () => {
    render(
      <ChartCard title="Conversations per day" meta="Sep 24 – 30">
        <div>plot</div>
      </ChartCard>,
    );

    expect(screen.getByRole('region', { name: 'Conversations per day' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Conversations per day' })).toBeVisible();
    expect(screen.getByText('Sep 24 – 30')).toBeInTheDocument();
    expect(screen.getByText('plot')).toBeInTheDocument();
  });

  it('places the legend between the header and the chart', () => {
    render(
      <ChartCard
        title="Quality"
        meta={<Badge tone={BadgeTone.Violet}>custom</Badge>}
        legend={<ul aria-label="Series" />}
        headingAs={HeadingElement.H2}
      >
        <div>plot</div>
      </ChartCard>,
    );

    const legend = screen.getByRole('list', { name: 'Series' });
    const heading = screen.getByRole('heading', { level: 2, name: 'Quality' });
    expect(heading.compareDocumentPosition(legend)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(legend.compareDocumentPosition(screen.getByText('plot'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText('custom')).toBeInTheDocument();
  });
});
