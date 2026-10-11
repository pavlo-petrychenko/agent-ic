import {
  ARIA_CONTROLS,
  ARIA_EXPANDED,
  ESCAPE_KEY,
  MENU_BUTTON_SELECTOR,
  MENU_ENABLED_CLASS,
  MENU_LINK_SELECTOR,
  MENU_OPEN_CLASS,
  MenuEvent,
  WIDE_HEADER_QUERY,
} from '@/constants/menu.constants';

const setOpen = (button: HTMLButtonElement, menu: HTMLElement, open: boolean): void => {
  button.setAttribute(ARIA_EXPANDED, String(open));
  menu.classList.toggle(MENU_OPEN_CLASS, open);
};

const isOpen = (button: HTMLButtonElement): boolean =>
  button.getAttribute(ARIA_EXPANDED) === String(true);

export const initMenu = (page: Document): void => {
  const button = page.querySelector<HTMLButtonElement>(MENU_BUTTON_SELECTOR);
  const menuId = button?.getAttribute(ARIA_CONTROLS) ?? null;
  const menu = menuId === null ? null : page.getElementById(menuId);
  if (button === null || menu === null) {
    return;
  }

  page.documentElement.classList.add(MENU_ENABLED_CLASS);
  button.hidden = false;

  button.addEventListener(MenuEvent.Click, () => setOpen(button, menu, !isOpen(button)));

  menu.addEventListener(MenuEvent.Click, (event) => {
    if (event.target instanceof Element && event.target.closest(MENU_LINK_SELECTOR) !== null) {
      setOpen(button, menu, false);
    }
  });

  page.addEventListener(MenuEvent.KeyDown, (event) => {
    if (event.key === ESCAPE_KEY && isOpen(button)) {
      setOpen(button, menu, false);
      button.focus();
    }
  });

  page.defaultView?.matchMedia(WIDE_HEADER_QUERY).addEventListener(MenuEvent.Change, (query) => {
    if (query.matches) {
      setOpen(button, menu, false);
    }
  });
};
