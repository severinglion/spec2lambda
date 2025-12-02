import process from 'node:process';

// Use native ANSI codes to avoid extra dependencies
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

interface LoggerOptions {
  level?: LogLevel;
  color?: boolean;
  transports?: Array<(level: LogLevel, message: string) => void>;
}

function isTTY() {
  return process.stdout.isTTY;
}

function shouldUseColor() {
  if (process.env.NO_COLOR === '1' || process.env.NO_COLOR === 'true') return false;
  if (process.env.CI === '1' || process.env.CI === 'true') return false;
  return isTTY();
}

const LEVELS: LogLevel[] = ['debug', 'info', 'success', 'warn', 'error'];
const LEVEL_PREFIX: Record<LogLevel, string> = {
  debug: '[spec2lambda][debug]',
  info: '[spec2lambda]',
  success: '[spec2lambda][success]',
  warn: '[spec2lambda][warn]',
  error: '[spec2lambda][error]',
};
const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: COLORS.dim,
  info: COLORS.blue,
  success: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
};

export class Logger {
  private level: LogLevel;
  private color: boolean;
  private transports: Array<(level: LogLevel, message: string) => void>;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.color = options.color ?? shouldUseColor();
    this.transports = options.transports || [this.consoleTransport];
  }

  private shouldLog(level: LogLevel) {
    return LEVELS.indexOf(level) >= LEVELS.indexOf(this.level);
  }

  private format(level: LogLevel, message: string) {
    const prefix = LEVEL_PREFIX[level];
    if (this.color) {
      return `${LEVEL_COLOR[level]}${prefix}${COLORS.reset} ${message}`;
    }
    return `${prefix} ${message}`;
  }

  private consoleTransport(level: LogLevel, message: string) {
    if (level === 'error') {
      console.error(message);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  log(level: LogLevel, ...args: unknown[]) {
    if (!this.shouldLog(level)) return;
    // Compose message like console.log does
    const message = args.map(arg =>
      typeof arg === 'string' ? arg :
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    const formatted = this.format(level, message);
    for (const transport of this.transports) {
      transport(level, formatted);
    }
  }

  info(...args: unknown[]) { this.log('info', ...args); }
  warn(...args: unknown[]) { this.log('warn', ...args); }
  error(...args: unknown[]) { this.log('error', ...args); }
  success(...args: unknown[]) { this.log('success', ...args); }
  debug(...args: unknown[]) { this.log('debug', ...args); }
}

export const logger = new Logger();
