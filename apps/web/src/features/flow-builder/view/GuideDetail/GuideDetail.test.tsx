import { AgentTemplateKey } from '@agent-ic/flow';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ComponentGuideId,
  ConceptGuideId,
  GUIDES,
} from '@/features/flow-builder/constants/guide.constants';
import type { GuideExample } from '@/features/flow-builder/typedefs/guide.typedefs';
import { GuideDetail } from '@/features/flow-builder/view/GuideDetail/GuideDetail';
import type { GuideDetailProps } from '@/features/flow-builder/view/GuideDetail/GuideDetail.typedefs';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const WORKSPACE_ID = 'wsp_demo';
const AGENT_ID = 'agt_demo';

const EXAMPLE: GuideExample = {
  key: AgentTemplateKey.IntentRouter,
  name: 'Intent router',
  description: 'A quick AI check sorts each message.',
  graph: {
    nodes: [
      { id: 'a', kind: NodeKind.Trig, label: 'Incoming message', x: 0, y: 0 },
      { id: 'b', kind: NodeKind.Router, label: 'What does the customer want?', x: 0, y: 170 },
    ],
    edges: [{ id: 'e', source: 'a', target: 'b' }],
  },
  alsoIn: [
    { key: AgentTemplateKey.CafeSupport, name: 'Café support' },
    { key: AgentTemplateKey.StoreSales, name: 'Online store sales assistant' },
  ],
};

const renderDetail = (
  id: ComponentGuideId | ConceptGuideId,
  props: Partial<GuideDetailProps> = {},
) => {
  const guide = GUIDES.find((candidate) => candidate.id === id);
  if (guide === undefined) {
    throw new Error('no guide');
  }
  const handlers = {
    onBack: vi.fn<() => void>(),
    onClose: vi.fn<() => void>(),
    onUseTemplate: vi.fn<(key: AgentTemplateKey) => void>(),
  };
  renderWithProviders(
    <MemoryRouter>
      <GuideDetail
        guide={guide}
        title="Title"
        example={null}
        workspaceId={WORKSPACE_ID}
        agentId={AGENT_ID}
        focusTitle={false}
        {...handlers}
        {...props}
      />
    </MemoryRouter>,
  );
  return handlers;
};

describe('GuideDetail', () => {
  it('shows what a step does, when to use it and what to know', async () => {
    renderDetail(ComponentGuideId.Router, { title: 'Router / condition' });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Router / condition' }),
    ).toBeVisible();
    expect(
      screen.getByText('Sends the chat down one path, based on rules you write.'),
    ).toBeVisible();
    expect(screen.getByRole('region', { name: 'What it does' })).toBeVisible();
    const when = screen.getByRole('region', { name: 'When to use it' });
    expect(within(when).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
    const tips = screen.getByRole('region', { name: 'Good to know' });
    expect(within(tips).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
  });

  it('writes variables as code', async () => {
    renderDetail(ComponentGuideId.Agent);

    expect(await screen.findByText('{{agent.messages}}', { selector: 'code' })).toBeVisible();
  });

  it('shows the example with its flow, name and description', async () => {
    renderDetail(ComponentGuideId.Router, { example: EXAMPLE });

    const section = await screen.findByRole('region', { name: 'Example' });
    expect(within(section).getByRole('img', { name: /with the Title highlighted/ })).toBeVisible();
    expect(within(section).getByText('Intent router')).toBeVisible();
    expect(within(section).getByText('A quick AI check sorts each message.')).toBeVisible();
  });

  it('uses the example as a new agent', async () => {
    const { onUseTemplate } = renderDetail(ComponentGuideId.Router, { example: EXAMPLE });

    await userEvent.click(await screen.findByRole('button', { name: 'Use as a new agent' }));

    expect(onUseTemplate).toHaveBeenCalledWith(AgentTemplateKey.IntentRouter);
  });

  it('offers the big templates that use the step', async () => {
    const { onUseTemplate } = renderDetail(ComponentGuideId.Router, { example: EXAMPLE });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Open the “Café support” template' }),
    );

    expect(onUseTemplate).toHaveBeenCalledWith(AgentTemplateKey.CafeSupport);
  });

  it('leaves out the template chips when no big template uses the step', async () => {
    renderDetail(ComponentGuideId.Router, { example: { ...EXAMPLE, alsoIn: [] } });

    await screen.findByRole('region', { name: 'Example' });
    expect(screen.queryByText('Also in')).not.toBeInTheDocument();
  });

  it('leaves the example out when there is none', async () => {
    renderDetail(ComponentGuideId.Router);

    await screen.findByRole('region', { name: 'What it does' });
    expect(screen.queryByRole('region', { name: 'Example' })).not.toBeInTheDocument();
  });

  it('shows the main ideas and the links of a concept', async () => {
    renderDetail(ConceptGuideId.InboxNotifications);

    expect(await screen.findByRole('region', { name: 'The main ideas' })).toBeVisible();
    const links = screen.getByRole('region', { name: 'Open in the app' });
    expect(within(links).getByRole('link', { name: 'Inbox' })).toHaveAttribute(
      'href',
      `/w/${WORKSPACE_ID}/inbox`,
    );
    expect(within(links).getByRole('link', { name: 'Settings · Notifications' })).toHaveAttribute(
      'href',
      `/w/${WORKSPACE_ID}/settings/notifications`,
    );
  });

  it('links the versions page for this agent', async () => {
    renderDetail(ConceptGuideId.Publishing);

    const link = await screen.findByRole('link', { name: 'Versions of this agent' });

    expect(link).toHaveAttribute('href', `/w/${WORKSPACE_ID}/testing/versions?agent=${AGENT_ID}`);
  });

  it('goes back to the list and closes', async () => {
    const { onBack, onClose } = renderDetail(ConceptGuideId.Variables);

    await userEvent.click(await screen.findByRole('button', { name: 'All guides' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close guides' }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('puts the focus on the title when it was reached from the list', async () => {
    renderDetail(ConceptGuideId.Variables, { focusTitle: true, title: 'Variables and outputs' });

    expect(await screen.findByRole('heading', { name: 'Variables and outputs' })).toHaveFocus();
  });
});
