import { Locale } from '@agent-ic/contracts';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { TimeZoneField } from '@/shared/forms/fields/TimeZoneField';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <TimeZoneField label="Time zone" hint="Used by schedules" value={value} onChange={setValue} />
  );
}

describe('TimeZoneField', () => {
  it('shows the label, hint and the chosen zone', () => {
    renderWithProviders(<Harness initial="Europe/Kyiv" />);

    expect(screen.getByRole('button', { name: /Time zone/ })).toHaveTextContent('Europe/Kyiv');
    expect(screen.getByText('Used by schedules')).toBeInTheDocument();
  });

  it('searches the zones and picks one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness initial="UTC" />);

    await user.click(screen.getByRole('button', { name: /Time zone/ }));
    await user.type(screen.getByRole('searchbox', { name: 'Search time zones' }), 'london');
    await user.click(screen.getByRole('button', { name: 'Europe/London' }));

    expect(screen.getByRole('button', { name: /Time zone/ })).toHaveTextContent('Europe/London');
  });

  it('says so when nothing matches, in Ukrainian too', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness initial="UTC" />, { locale: Locale.Uk });

    await user.click(screen.getByRole('button', { name: /Time zone/ }));
    await user.type(screen.getByRole('searchbox', { name: 'Пошук часових поясів' }), 'zzzzzz');

    expect(screen.getByText('Часовий пояс не знайдено')).toBeInTheDocument();
  });

  it('shows the error under the field', () => {
    renderWithProviders(
      <TimeZoneField
        label="Time zone"
        value="UTC"
        onChange={() => undefined}
        error="Pick a zone"
      />,
    );

    expect(screen.getByText('Pick a zone')).toBeInTheDocument();
  });
});
