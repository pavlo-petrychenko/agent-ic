import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

interface OpenAgentMenuLabels {
  trigger?: string;
  menu?: string;
}

export const openAgentMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  agentName: string,
  { trigger = 'More actions for', menu = 'Agent actions' }: OpenAgentMenuLabels = {},
) => {
  await user.click(await screen.findByRole('button', { name: `${trigger} ${agentName}` }));
  return screen.getByRole('listbox', { name: menu });
};
