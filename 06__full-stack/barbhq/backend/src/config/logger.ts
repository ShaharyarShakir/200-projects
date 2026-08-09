type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${level.toUpperCase()}] [${timestamp}] ${message}`;
  }

  public info(message: string, ...meta: unknown[]): void {
    console.log(this.formatMessage('info', message), ...meta);
  }

  public warn(message: string, ...meta: unknown[]): void {
    console.warn(this.formatMessage('warn', message), ...meta);
  }

  public error(message: string, ...meta: unknown[]): void {
    console.error(this.formatMessage('error', message), ...meta);
  }

  public success(message: string, ...meta: unknown[]): void {
    console.log(this.formatMessage('success', message), ...meta);
  }

  public debug(message: string, ...meta: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message), ...meta);
    }
  }
}

export const logger = new Logger();
