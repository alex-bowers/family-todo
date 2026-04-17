type LogContext = Record<string, unknown>;

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }

  return ` ${JSON.stringify(context)}`;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    console.info(`[familytodo] ${message}${formatContext(context)}`);
  },

  warn(message: string, context?: LogContext): void {
    console.warn(`[familytodo] ${message}${formatContext(context)}`);
  },

  error(message: string, context?: LogContext): void {
    console.error(`[familytodo] ${message}${formatContext(context)}`);
  }
};
