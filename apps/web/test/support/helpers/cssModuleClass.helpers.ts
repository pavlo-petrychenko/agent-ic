export const cssClass = (name: string | undefined): string => {
  if (name === undefined) {
    throw new Error('CSS module class is not defined');
  }
  return name;
};
