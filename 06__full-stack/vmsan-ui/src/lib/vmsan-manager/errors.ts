/**
 * Error types raised by the manager client.
 *
 * The manager returns structured error codes; these classes preserve the code
 * so a route handler can map it to a status without parsing strings, while
 * keeping host detail out of anything user-visible.
 */

export class ManagerUnavailableError extends Error {
  /** The manager socket could not be reached, or did not answer in time. */
  readonly code = "MANAGER_UNAVAILABLE" as const;

  constructor(message = "vmsan manager is not available", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ManagerUnavailableError";
  }
}

export class ManagerProtocolError extends Error {
  /** The manager answered with something that does not match the contract. */
  readonly code = "MANAGER_PROTOCOL_ERROR" as const;

  constructor(message = "vmsan manager returned an invalid response", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ManagerProtocolError";
  }
}

export class ManagerRequestError extends Error {
  /** The manager rejected the request; `managerCode` is its error code. */
  readonly code = "MANAGER_REQUEST_FAILED" as const;
  readonly managerCode: string;

  constructor(managerCode: string, message: string) {
    super(message);
    this.name = "ManagerRequestError";
    this.managerCode = managerCode;
  }
}
