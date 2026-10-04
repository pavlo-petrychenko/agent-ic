import type { CSSProperties } from 'react';

export const EMAIL_CHARSET = 'utf-8';

export const EMAIL_BODY_STYLE: CSSProperties = {
  backgroundColor: '#f6f7f9',
  color: '#1f2933',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  padding: '32px 16px',
};

export const EMAIL_CONTAINER_STYLE: CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '480px',
  padding: '32px',
};

export const EMAIL_BUTTON_STYLE: CSSProperties = {
  backgroundColor: '#2f54eb',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
};

export const EMAIL_MUTED_STYLE: CSSProperties = {
  color: '#7b8794',
  fontSize: '14px',
};
