export const when = (
  baseText: string,
  cond: boolean,
  extraText: string,
  separator = " ",
) => (cond ? [baseText, separator, extraText].join("") : baseText);
