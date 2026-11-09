import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import type { ResourcePermissions } from '@agent-ic/contracts';
import { createMemoryHistory } from '@tanstack/react-router';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TourStatus, TourStepId } from '@/features/onboarding/constants/tour.constants';
import { TourAnchor } from '@/features/onboarding/constants/tourAnchor.constants';
import { INITIAL_TOUR_STATE } from '@/features/onboarding/constants/tourSteps.constants';
import { ProductTour } from '@/features/onboarding/containers/ProductTour/ProductTour';
import { tourAnchor } from '@/features/onboarding/logic/helpers/tourAnchor.helpers';
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
const AGENTS_URL = `/w/${WORKSPACE_ID}/agents`;

const permissionsWith = (...actions: PermissionAction[]): ResourcePermissions => ({
  ...emptyResourcePermissions(),
  [PermissionResource.Agents]: actions,
});

const EDITOR = permissionsWith(PermissionAction.View, PermissionAction.Edit);
const VIEWER = permissionsWith(PermissionAction.View);

const renderTour = ({ path = AGENTS_URL, permissions = EDITOR } = {}) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  renderWithProviders(
    <MemoryRouter history={history}>
      <nav>
        <a href="#agents" {...tourAnchor(TourAnchor.NavAgents)}>
          Agents
        </a>
        <a href="#prompts" {...tourAnchor(TourAnchor.NavPrompts)}>
          Prompts
        </a>
      </nav>
      <ProductTour workspaceId={WORKSPACE_ID} userId={USER_ID} permissions={permissions} />
    </MemoryRouter>,
  );
  return history;
};

const startAt = (stepId: TourStepId) =>
  storeTourState(USER_ID, {
    ...INITIAL_TOUR_STATE,
    status: TourStatus.Active,
    stepId,
  });

describe('ProductTour', () => {
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

  it('welcomes an editor on the first visit and remembers a skip', async () => {
    const user = userEvent.setup();
    renderTour();

    expect(await screen.findByRole('dialog', { name: 'Welcome to agent-ic' })).toHaveTextContent(
      'Help → Product tour',
    );
    await user.click(screen.getByRole('button', { name: 'Skip for now' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readTourState(USER_ID)?.status).toBe(TourStatus.Dismissed);
  });

  it('never welcomes a member who cannot edit agents', async () => {
    renderTour({ permissions: VIEWER });

    await waitFor(() => expect(screen.getByRole('link', { name: 'Agents' })).toBeVisible());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('walks forward, back, past a skipped step and out of the tour', async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(
      await screen.findByRole('button', { name: 'Take the tour (about 3 minutes)' }),
    );
    const first = screen.getByRole('dialog', { name: 'Agents' });
    expect(first).toHaveTextContent('1 of 12');
    expect(document.querySelector('[data-coachmark-spotlight]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Prompts' })).toHaveTextContent('2 of 12');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('dialog', { name: 'Agents' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Skip step' }));
    expect(screen.getByRole('dialog', { name: 'Prompts' })).toBeVisible();
    expect(readTourState(USER_ID)?.skippedStepIds).toEqual([TourStepId.Agents]);

    await user.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readTourState(USER_ID)).toMatchObject({
      status: TourStatus.Dismissed,
      stepId: TourStepId.Prompts,
    });
  });

  it('offers to go to a step that is on another page, and only moves on a click', async () => {
    const user = userEvent.setup();
    startAt(TourStepId.Build);
    const history = renderTour({ path: `/w/${WORKSPACE_ID}/inbox` });

    const card = await screen.findByRole('dialog', { name: 'Build your first agent' });
    expect(card).toHaveTextContent('This step is on the Agents page.');
    expect(document.querySelector('[data-coachmark-spotlight]')).toBeNull();
    expect(history.location.pathname).toBe(`/w/${WORKSPACE_ID}/inbox`);

    await user.click(screen.getByRole('button', { name: 'Go to Agents' }));

    await waitFor(() => expect(history.location.pathname).toBe(AGENTS_URL));
    await user.click(await screen.findByRole('button', { name: 'Open templates' }));
    await waitFor(() => expect(history.location.search).toContain('templates=open'));
  });

  it('finishes the build step when the builder opens and remembers the agent', async () => {
    startAt(TourStepId.Build);
    const history = renderTour();
    await screen.findByRole('dialog', { name: 'Build your first agent' });

    act(() => history.push(`/w/${WORKSPACE_ID}/agents/agt_42`));

    expect(await screen.findByRole('dialog', { name: 'Your flow' })).toBeVisible();
    expect(readTourState(USER_ID)).toMatchObject({
      stepId: TourStepId.Canvas,
      agentId: 'agt_42',
      completedStepIds: [TourStepId.Build],
    });
  });

  it('asks for a template before a builder step when there is no agent yet', async () => {
    const user = userEvent.setup();
    startAt(TourStepId.Palette);
    const history = renderTour();

    expect(await screen.findByRole('dialog', { name: 'Add steps' })).toHaveTextContent(
      'Start an agent from a template first.',
    );
    await user.click(screen.getByRole('button', { name: 'Open templates' }));

    await waitFor(() => expect(history.location.search).toContain('templates=open'));
  });

  it('closes with links to what comes next', async () => {
    const user = userEvent.setup();
    startAt(TourStepId.Done);
    const history = renderTour();

    await screen.findByRole('dialog', { name: "You're set" });
    expect(screen.queryByRole('button', { name: 'Skip step' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect Telegram' }));

    expect(readTourState(USER_ID)?.status).toBe(TourStatus.Completed);
    await waitFor(() => expect(history.location.pathname).toBe(`/w/${WORKSPACE_ID}/channels`));
  });
});
