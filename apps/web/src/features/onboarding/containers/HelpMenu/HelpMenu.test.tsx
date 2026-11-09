import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { createMemoryHistory } from '@tanstack/react-router';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TourStatus, TourStepId } from '@/features/onboarding/constants/tour.constants';
import { INITIAL_TOUR_STATE } from '@/features/onboarding/constants/tourSteps.constants';
import { HelpMenu } from '@/features/onboarding/containers/HelpMenu/HelpMenu';
import { ProductTour } from '@/features/onboarding/containers/ProductTour';
import {
  readTourState,
  storeTourState,
} from '@/features/onboarding/storage/helpers/tourStorage.helpers';
import { useTourStore } from '@/features/onboarding/storage/hooks/useTourStore';
import { emptyResourcePermissions } from '@/shared/api/helpers/permission.helpers';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const WORKSPACE_ID = 'wsp_1';
const USER_ID = 'usr_1';
const EDITOR = {
  ...emptyResourcePermissions(),
  [PermissionResource.Agents]: [PermissionAction.View, PermissionAction.Edit],
};

const renderHelp = (permissions = EDITOR) => {
  const history = createMemoryHistory({ initialEntries: [`/w/${WORKSPACE_ID}/inbox`] });
  renderWithProviders(
    <MemoryRouter history={history}>
      <HelpMenu workspaceId={WORKSPACE_ID} />
      <ProductTour workspaceId={WORKSPACE_ID} userId={USER_ID} permissions={permissions} />
    </MemoryRouter>,
  );
  return history;
};

describe('HelpMenu', () => {
  beforeEach(() => {
    act(() =>
      useTourStore.setState({
        userId: null,
        eligible: false,
        tour: INITIAL_TOUR_STATE,
        checklistOpen: false,
      }),
    );
  });

  it('restarts a dismissed tour from the first step', async () => {
    const user = userEvent.setup();
    storeTourState(USER_ID, {
      ...INITIAL_TOUR_STATE,
      status: TourStatus.Dismissed,
      stepId: TourStepId.Inbox,
      completedStepIds: [TourStepId.Agents],
    });
    renderHelp();

    await user.click(await screen.findByRole('button', { name: 'Help' }));
    await user.click(screen.getByRole('menuitem', { name: 'Product tour' }));

    expect(await screen.findByRole('dialog', { name: 'Agents' })).toHaveTextContent('1 of 12');
    expect(readTourState(USER_ID)).toMatchObject({
      status: TourStatus.Active,
      stepId: TourStepId.Agents,
      completedStepIds: [],
    });
  });

  it('offers to resume an active tour where it stopped', async () => {
    const user = userEvent.setup();
    storeTourState(USER_ID, {
      ...INITIAL_TOUR_STATE,
      status: TourStatus.Active,
      stepId: TourStepId.Knowledge,
    });
    renderHelp();

    await user.click(await screen.findByRole('button', { name: 'Help' }));
    await user.click(screen.getByRole('menuitem', { name: /Resume at step 3 of 12/ }));

    expect(await screen.findByRole('dialog', { name: 'Knowledge' })).toBeVisible();
  });

  it('lists the steps with their marks and jumps to one', async () => {
    const user = userEvent.setup();
    storeTourState(USER_ID, {
      ...INITIAL_TOUR_STATE,
      status: TourStatus.Completed,
      completedStepIds: [TourStepId.Agents],
      skippedStepIds: [TourStepId.Prompts],
    });
    renderHelp();

    await user.click(await screen.findByRole('button', { name: 'Help' }));
    await user.click(screen.getByRole('menuitem', { name: 'Getting started' }));

    const checklist = await screen.findByRole('dialog', { name: 'Getting started' });
    const explore = within(checklist).getByRole('region', { name: 'Explore' });
    expect(within(explore).getByRole('button', { name: /Agents/ })).toHaveTextContent('Done');
    expect(within(explore).getByRole('button', { name: /Prompts/ })).toHaveTextContent('Skipped');
    expect(within(checklist).getByRole('region', { name: 'Publish' })).toBeVisible();

    await user.click(within(checklist).getByRole('button', { name: /Publish/ }));

    expect(await screen.findByRole('dialog', { name: 'Publish' })).toHaveTextContent(
      'This step is in the agent builder.',
    );
  });

  it('opens the template gallery', async () => {
    const user = userEvent.setup();
    const history = renderHelp();

    await user.click(await screen.findByRole('button', { name: 'Help' }));
    await user.click(screen.getByRole('menuitem', { name: 'Templates' }));

    await waitFor(() => expect(history.location.pathname).toBe(`/w/${WORKSPACE_ID}/agents`));
    expect(history.location.search).toContain('templates=open');
  });

  it('is hidden from a member who cannot edit agents', async () => {
    renderHelp({ ...EDITOR, [PermissionResource.Agents]: [PermissionAction.View] });

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Help' })).toBeNull());
  });
});
