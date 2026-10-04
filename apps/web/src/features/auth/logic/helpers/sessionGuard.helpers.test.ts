import { isRedirect } from '@tanstack/react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { requireSession, toSafeRedirect } from '@/features/auth/logic/helpers/sessionGuard.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const LOCATION = { href: '/w/ws_1/agents' };

describe('toSafeRedirect', () => {
  it('keeps a path inside the app and drops anything that leaves it', () => {
    expect(toSafeRedirect('/w/ws_1')).toBe('/w/ws_1');
    expect(toSafeRedirect('//evil.example')).toBeNull();
    expect(toSafeRedirect('https://evil.example')).toBeNull();
    expect(toSafeRedirect(null)).toBeNull();
  });
});

describe('requireSession', () => {
  afterEach(signOutForTest);

  it('sends a visitor without a session to log in and remembers where they were going', () => {
    let thrown: unknown = null;
    try {
      requireSession(LOCATION);
    } catch (error) {
      thrown = error;
    }

    expect(isRedirect(thrown)).toBe(true);
    expect(thrown).toMatchObject({
      options: { to: '/auth/login', search: { redirect: LOCATION.href } },
    });
  });

  it('lets a signed-in user through', () => {
    signInForTest();

    expect(() => requireSession(LOCATION)).not.toThrow();
  });
});
