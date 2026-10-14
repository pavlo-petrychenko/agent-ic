import { createContext, useContext } from 'react';

const NestedPortalContainerContext = createContext<Element | null>(null);

export const useNestedPortalContainer = (): Element | null =>
  useContext(NestedPortalContainerContext);

export const NestedPortalContainerProvider = NestedPortalContainerContext.Provider;
