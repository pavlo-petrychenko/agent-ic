export const SERVER_ENV_PREFIX = 'WEB_';
export const ALLOWED_HOSTS_SEPARATOR = ',';

export enum VendorChunk {
  React = 'react',
  Apollo = 'apollo',
  Radix = 'radix',
  Router = 'router',
  I18n = 'i18n',
  Forms = 'forms',
}

export const VENDOR_CHUNK_MATCHERS: Readonly<Record<VendorChunk, RegExp>> = {
  [VendorChunk.React]: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
  [VendorChunk.Apollo]: /node_modules[\\/](@apollo|graphql|graphql-ws|rxjs|@wry|optimism)[\\/]/,
  [VendorChunk.Radix]: /node_modules[\\/](@radix-ui|radix-ui|aria-hidden|react-remove-scroll)[\\/]/,
  [VendorChunk.Router]: /node_modules[\\/]@tanstack[\\/](react-router|router-core|history)[\\/]/,
  [VendorChunk.I18n]: /node_modules[\\/](i18next|react-i18next)[\\/]/,
  [VendorChunk.Forms]:
    /node_modules[\\/](@tanstack[\\/]react-form|@tanstack[\\/]form-core|zod)[\\/]/,
};
