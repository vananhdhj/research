export const getEnv = (name: string): string => {
  try {
    // This trick avoids static analysis errors in environments that don't support import.meta
    const meta = new Function('return import.meta')();
    return meta.env[name] || '';
  } catch {
    // Fallback to process.env for Jest/Node environments
    const g = globalThis as unknown as { process?: { env?: Record<string, string> } };
    return (g.process?.env?.[name]) || '';
  }
};
