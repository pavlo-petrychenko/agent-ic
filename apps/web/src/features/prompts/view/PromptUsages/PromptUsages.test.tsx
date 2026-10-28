import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
  it('shows the agent version that uses the prompt, with its step and pin', () => {
    renderWithProviders(
      <PromptUsages
        onOpenUsage={vi.fn<(item: PromptUsageItem) => void>()}
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

    expect(screen.getAllByText('Salon assistant')).toHaveLength(2);
    expect(screen.getByText('Receptionist step · v3 live')).toBeInTheDocument();
    expect(screen.getByText('Receptionist step · draft')).toBeInTheDocument();
    expect(screen.getByText('pinned v4')).toBeInTheDocument();
    expect(screen.getByText('follow latest')).toBeInTheDocument();
  });

  it('opens the agent flow when a usage is clicked', async () => {
    const onOpenUsage = vi.fn<(item: PromptUsageItem) => void>();
    const item = usage();
    renderWithProviders(<PromptUsages usages={[item]} onOpenUsage={onOpenUsage} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open the Salon assistant flow' }));

    expect(onOpenUsage).toHaveBeenCalledWith(item);
  });
});
