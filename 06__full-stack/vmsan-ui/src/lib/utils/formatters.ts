/**
 * Formats an arbitrary string or number value with null safety.
 * Returns an em dash ('—') for null, undefined, empty strings, or NaN.
 */
export function formatValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") {
    return "—";
  }
  if (typeof val === "number" && Number.isNaN(val)) {
    return "—";
  }
  return String(val);
}

/**
 * Formats memory allocation in MiB.
 * Returns `${memoryMiB} MiB` or '—' if null/undefined/NaN.
 */
export function formatMemory(memoryMiB: number | null | undefined): string {
  if (memoryMiB === null || memoryMiB === undefined || Number.isNaN(memoryMiB)) {
    return "—";
  }
  return `${memoryMiB} MiB`;
}

/**
 * Formats total VM count with singular/plural suffix.
 * Returns '0 VMs', '1 VM', '2 VMs', etc.
 */
export function formatVmCount(count: number): string {
  if (count === 1) {
    return "1 VM";
  }
  return `${count} VMs`;
}
