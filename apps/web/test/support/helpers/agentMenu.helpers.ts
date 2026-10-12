import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { AGENT_ROW_TIMEOUT_MS } from '@test/support/constants/agentMenu.constants';
import type { OpenAgentMenuLabels } from '@test/support/typedefs/agentMenu.typedefs';

export const openAgentMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  agentName: string,
  { trigger = 'More actions for', menu = 'Agent actions' }: OpenAgentMenuLabels = {},
) => {
  await user.click(
    await screen.findByRole(
      'button',
      { name: `${trigger} ${agentName}` },
      { timeout: AGENT_ROW_TIMEOUT_MS },
    ),
  );
  return screen.getByRole('listbox', { name: menu });
};
