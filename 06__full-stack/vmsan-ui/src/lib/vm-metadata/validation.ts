export const VM_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/;
export const RESERVED_PREFIX_REGEX = /^vm-/i;

export interface VMNameValidationResult {
  valid: boolean;
  error?: string;
  name?: string;
}

export function normalizeVMName(name: string): string {
  return name.trim().toLowerCase();
}

export function validateVMName(name: unknown): VMNameValidationResult {
  if (typeof name !== "string") {
    return {
      valid: false,
      error: "VM name must be a string",
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: "VM name cannot be empty",
    };
  }

  if (trimmed.length > 63) {
    return {
      valid: false,
      error: "VM name must be 63 characters or fewer",
    };
  }

  if (RESERVED_PREFIX_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "VM name cannot start with reserved prefix 'vm-'",
    };
  }

  if (!VM_NAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        "VM name must start with an alphanumeric character and contain only alphanumeric characters, dots, underscores, or hyphens",
    };
  }

  return {
    valid: true,
    name: trimmed,
  };
}

export function isValidVMName(name: unknown): boolean {
  return validateVMName(name).valid;
}
