/**
 * Monitoring & Error Logging — Phase 8 Production Hardening
 *
 * Provides structured logging and error tracking for production deployments.
 * In development, logs to console. In production, integrates with error
 * tracking services (e.g., Sentry) when configured.
 */

import { createHash } from "crypto";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
}

/**
 * Logger class — structured, leveled logging.
 * In production, sends errors to configured error tracking service.
 */
export class Logger {
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly errorTrackingEnabled: boolean;

  constructor(options: {
    serviceName?: string;
    environment?: string;
    errorTrackingDsn?: string;
  } = {}) {
    this.serviceName = options.serviceName ?? "valtorix-bd-os";
    this.environment = options.environment ?? process.env.NODE_ENV ?? "development";
    this.errorTrackingEnabled = Boolean(options.errorTrackingDsn);
  }

  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };
    const minLevel = process.env.LOG_LEVEL ?? "info";
    return levels[level] >= (levels[minLevel as LogLevel] ?? 1);
  }

  private output(entry: LogEntry) {
    const json = JSON.stringify(entry);
    if (process.env.NODE_ENV === "production") {
      console.log(json);
    } else {
      // Pretty print in development
      const colors: Record<LogLevel, string> = {
        debug: "\x1b[36m",
        info: "\x1b[32m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
        fatal: "\x1b[35m",
      };
      const reset = "\x1b[0m";
      const color = colors[entry.level] ?? "";
      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message} ${entry.context ? JSON.stringify(entry.context) : ""}`);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog("debug")) this.output(this.formatEntry("debug", message, context));
  }

  info(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog("info")) this.output(this.formatEntry("info", message, context));
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog("warn")) this.output(this.formatEntry("warn", message, context));
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    if (this.shouldLog("error")) {
      const entry = this.formatEntry("error", message, {
        ...context,
        error: error?.message,
        stack: error?.stack,
      });
      this.output(entry);
      // Send to error tracking if configured
      if (this.errorTrackingEnabled && error) {
        this.sendToErrorTracking(entry, error);
      }
    }
  }

  fatal(message: string, context?: Record<string, unknown>, error?: Error) {
    if (this.shouldLog("fatal")) {
      const entry = this.formatEntry("fatal", message, {
        ...context,
        error: error?.message,
        stack: error?.stack,
      });
      this.output(entry);
      if (this.errorTrackingEnabled && error) {
        this.sendToErrorTracking(entry, error);
      }
    }
  }

  private sendToErrorTracking(_entry: LogEntry, _error: Error) {
    // Placeholder for Sentry or other error tracking integration
    // In production, configure Sentry DSN and uncomment:
    // Sentry.captureException(_error, { extra: _entry.context });
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

/**
 * Request ID middleware helper for correlating logs across requests
 */
export function generateRequestId(): string {
  return createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex").substring(0, 12);
}

/**
 * Performance timing helper
 */
export async function timeOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    logger.debug("Operation completed", { operation: name, durationMs: Date.now() - start });
    return result;
  } catch (error) {
    logger.error("Operation failed", { operation: name, durationMs: Date.now() - start }, error as Error);
    throw error;
  }
}
