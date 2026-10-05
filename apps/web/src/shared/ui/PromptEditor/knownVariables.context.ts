import { createContext } from 'react';

export const KnownVariablesContext = createContext<ReadonlySet<string>>(new Set());
