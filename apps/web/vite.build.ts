import type { BuildOptions } from 'vite';

import { VENDOR_CHUNK_MATCHERS, VendorChunk } from './vite.constants.ts';

export const buildOptions: BuildOptions = {
  rolldownOptions: {
    output: {
      codeSplitting: {
        groups: Object.values(VendorChunk).map((name) => ({
          name,
          test: VENDOR_CHUNK_MATCHERS[name],
        })),
      },
    },
  },
};
