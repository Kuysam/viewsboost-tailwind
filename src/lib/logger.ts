type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Console output with color
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m'  // red
    };

    const reset = '\x1b[0m';
    console.log(
      `${colors[level]}[${entry.timestamp}] ${level.toUpperCase()}: ${message}${reset}`,
      context || ''
    );

    // For errors, also log the stack trace if available
    if (level === 'error' && context?.error instanceof Error) {
      console.error(context.error);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  // Get recent logs
  getLogs(level?: LogLevel): LogEntry[] {
    return this.logs
      .filter(entry => !level || entry.level === level)
      .slice(-100);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance(); 