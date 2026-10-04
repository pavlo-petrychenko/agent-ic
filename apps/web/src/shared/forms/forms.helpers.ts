const isMessageCarrier = (value: unknown): value is { readonly message: unknown } =>
  typeof value === 'object' && value !== null && 'message' in value;

const toMessage = (error: unknown): string | null => {
  if (typeof error === 'string') {
    return error;
  }
  if (isMessageCarrier(error) && typeof error.message === 'string') {
    return error.message;
  }
  return null;
};

export const firstErrorMessage = (errors: readonly unknown[]): string | null => {
  for (const error of errors) {
    const message = toMessage(error);
    if (message !== null) {
      return message;
    }
  }
  return null;
};
