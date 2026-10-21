import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';
import { DeletePromptInUseModal } from '@/features/prompts/view/DeletePromptInUseModal';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const LIVE_USAGE: PromptUsageItem = {
  agentId: 'agt_1',
  agentName: 'Salon assistant',
  versionId: 'agv_live',
  live: true,
  versionNumber: 3,
  nodeId: 'n_reception',
  nodeKey: 'reception',
  nodeLabel: 'Receptionist step',
  pinned: true,
  pinNumber: 3,
};

const DRAFT_USAGE: PromptUsageItem = {
  ...LIVE_USAGE,
  versionId: 'agv_draft',
  live: false,
  versionNumber: null,
};

describe('DeletePromptInUseModal', () => {
  it('shows the usages, the published tag and the open-step action', async () => {
    const onOpenStep = vi.fn<(usage: PromptUsageItem) => void>();
    const onClose = vi.fn<() => void>();
    renderWithProviders(
      <DeletePromptInUseModal
        promptName="Receptionist"
        stepsCount={1}
        versionCount={4}
        usages={[LIVE_USAGE, DRAFT_USAGE]}
        onOpenStep={onOpenStep}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Can’t delete Receptionist yet')).toBeInTheDocument();
    expect(screen.getByText('4 versions · used in 2 agent versions')).toBeInTheDocument();
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete prompt' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Open step' }));

    expect(onOpenStep).toHaveBeenCalledWith(DRAFT_USAGE);
  });

  it('leaves the version count out until the versions load', () => {
    renderWithProviders(
      <DeletePromptInUseModal
        promptName="Receptionist"
        stepsCount={1}
        versionCount={null}
        usages={[DRAFT_USAGE]}
        onOpenStep={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText('used in 1 agent version')).toBeInTheDocument();
  });
});
