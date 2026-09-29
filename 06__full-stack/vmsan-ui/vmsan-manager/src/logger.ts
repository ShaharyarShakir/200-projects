import type { LogLevel } from "./config.js";

const SEVERITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export type LogFields = Record<string, string | number | boolean | null | undefined>;

export type LogSink = (line: string) => void;

export interface Logger {
  readonly level: LogLevel;
  error(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  debug(message: string, fields?: LogFields): void;
}

const CONTROL_CHARS = /[\r\n\t]+/g;

/**
 * Render a value so a single log record always occupies a single line.
 * Values containing whitespace or separators are quoted so that `a=b c` is
 * never ambiguous with `a=b` followed by `c`.
 */
function formatValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  const text = typeof value === "string" ? value : String(value);
  const cleaned = text.replace(CONTROL_CHARS, " ");
  if (cleaned.length === 0) {
    return '""';
  }
  if (/[\s"'=]/.test(cleaned)) {
    return `"${cleaned.replace(/"/g, '\\"')}"`;
  }
  return cleaned;
}

export function formatFields(fields: LogFields | undefined): string {
  if (!fields) {
    return "";
  }
  const parts: string[] = [];
  for (const key of Object.keys(fields).sort()) {
    parts.push(`${key}=${formatValue(fields[key])}`);
  }
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

export const defaultSink: LogSink = (line) => {
  process.stderr.write(`${line}\n`);
};

export const MAX_ERROR_DETAIL = 200;
/** Long unbroken hex/base64-ish runs are the shape of a secret. */
const SECRET_LIKE = /[A-Za-z0-9+/_-]{32,}/g;

/**
 * Turn an unknown thrown value into loggable fields.
 *
 * Logging only `error.name` makes an operator unable to tell a missing socket
 * directory (`ENOENT`) from a permissions problem (`EACCES`) from a stale
 * socket (`SocketPathError`). This keeps `name` but adds the errno `code` and a
 * capped `message`. The stack is deliberately omitted: it names host paths and
 * adds nothing an operator can act on, and any long token-like run in the
 * message is replaced so a native error can never echo an `agentToken`.
 */
export function describeError(error: unknown): LogFields {
  if (!(error instanceof Error)) {
    return { reason: typeof error };
  }
  const fields: LogFields = { reason: error.name };
  const code = (error as NodeJS.ErrnoException).code;
  if (typeof code === "string" && code.length > 0) {
    fields.code = code;
  }
  const message = error.message.replace(SECRET_LIKE, "[redacted]").trim();
  if (message.length > 0) {
    fields.detail =
      message.length > MAX_ERROR_DETAIL
        ? `${message.slice(0, MAX_ERROR_DETAIL)}...`
        : message;
  }
  return fields;
}

/**
 * Create a level-filtered structured logger.
 *
 * The logger has no access to `process.env` and no accessor for request bodies
 * or VM records, so a caller can only log what it explicitly passes. Callers
 * are responsible for passing method and request id rather than payloads.
 */
export function createLogger(level: LogLevel, sink: LogSink = defaultSink): Logger {
  const threshold = SEVERITY[level];

  const emit = (
    recordLevel: LogLevel,
    message: string,
    fields?: LogFields
  ): void => {
    if (SEVERITY[recordLevel] > threshold) {
      return;
    }
    sink(`${recordLevel.toUpperCase()} ${message}${formatFields(fields)}`);
  };

  return {
    level,
    error: (message, fields) => emit("error", message, fields),
    warn: (message, fields) => emit("warn", message, fields),
    info: (message, fields) => emit("info", message, fields),
    debug: (message, fields) => emit("debug", message, fields),
  };
}
