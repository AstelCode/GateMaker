export const Log = {
  info: (from: string, message: string) => console.log(`[${from}]:${message}`),
  warm: (from: string, message: string) => console.warn(`[${from}]:${message}`),
  error: (from: string, message: string) =>
    console.error(`[${from}]:${message}`),
};
