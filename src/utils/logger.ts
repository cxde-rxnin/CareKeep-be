export const logger = (message: string) => {
  console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
};
