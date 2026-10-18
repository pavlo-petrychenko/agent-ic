import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';
import { PromptUsages } from '@/features/prompts/view/PromptUsages';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const usage = (overrides: Partial<PromptUsageItem> = {}): PromptUsageItem => ({
  agentId: 'agt_1',
  agentName: 'Salon assistant',
  versionId: 'agv_live',
  live: true,
  versionNumber: 3,
  nodeId: 'n_reception',
  nodeKey: 'reception',
  nodeLabel: 'Receptionist step',
  pinned: true,
  pinNumber: 4,
  ...overrides,
});

describe('PromptUsages', () => {
  it('shows each step with its agent version and pin', () => {
    renderWithProviders(
      <PromptUsages
        usages={[
          usage(),
          usage({
            versionId: 'agv_draft',
            live: false,
            versionNumber: null,
            pinned: false,
            pinNumber: null,
          }),
        ]}
      />,
    );

    expect(screen.getAllByText('Receptionist step')).toHaveLength(2);
    expect(screen.getByText('Salon assistant · v3 live')).toBeInTheDocument();
    expect(screen.getByText('Salon assistant · draft')).toBeInTheDocument();
    expect(screen.getByText('pinned v4')).toBeInTheDocument();
    expect(screen.getByText('follow latest')).toBeInTheDocument();
  });
});
