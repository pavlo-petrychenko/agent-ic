import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initMenu } from '@/helpers/menu.helpers';

const PAGE = `
  <button class="menu-button" type="button" aria-expanded="false" aria-controls="menu" hidden>Menu</button>
  <nav id="menu" class="menu"><a href="#features">Features</a></nav>
`;

const changeListeners: Array<(query: { matches: boolean }) => void> = [];

const elements = (): { button: HTMLButtonElement; menu: HTMLElement; link: HTMLElement } => {
  const button = document.querySelector<HTMLButtonElement>('.menu-button');
  const menu = document.getElementById('menu');
  const link = document.querySelector<HTMLElement>('#menu a');
  if (button === null || menu === null || link === null) {
    throw new Error('the test page is incomplete');
  }
  return { button, menu, link };
};

describe('initMenu', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.body.innerHTML = PAGE;
    changeListeners.length = 0;
    vi.stubGlobal('matchMedia', () => ({
      addEventListener: (_type: string, listener: (query: { matches: boolean }) => void) =>
        changeListeners.push(listener),
    }));
    initMenu(document);
  });

  it('shows the button and opens and closes the menu', () => {
    const { button, menu } = elements();

    expect(button.hidden).toBe(false);
    expect(document.documentElement.classList.contains('has-menu')).toBe(true);

    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(menu.classList.contains('is-open')).toBe(true);

    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(menu.classList.contains('is-open')).toBe(false);
  });

  it('closes on Escape and returns focus to the button', () => {
    const { button, link } = elements();
    button.click();
    link.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('closes when a link is followed or the header gets wide', () => {
    const { button, link } = elements();
    button.click();
    link.click();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    changeListeners.forEach((listener) => listener({ matches: true }));
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
