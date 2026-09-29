export class VmsanError extends Error {
  readonly command: string;
  readonly args: string[];
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;

  constructor(options: {
    message?: string;
    command: string;
    args: string[];
    exitCode: number | null;
    stdout: string;
    stderr: string;
  }) {
    const errorMsg =
      options.message ||
      options.stderr.trim() ||
      `vmsan command '${options.command}' exited with code ${options.exitCode ?? "unknown"}`;
    super(errorMsg);
    this.name = "VmsanError";
    this.command = options.command;
    this.args = options.args;
    this.exitCode = options.exitCode;
    this.stdout = options.stdout;
    this.stderr = options.stderr;

    Object.setPrototypeOf(this, VmsanError.prototype);
  }
}

export class VmsanValidationError extends Error {
  readonly field?: string;
  readonly value?: unknown;

  constructor(message: string, field?: string, value?: unknown) {
    super(message);
    this.name = "VmsanValidationError";
    this.field = field;
    this.value = value;

    Object.setPrototypeOf(this, VmsanValidationError.prototype);
  }
}
