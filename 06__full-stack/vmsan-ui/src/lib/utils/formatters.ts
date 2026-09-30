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
 * Formats disk storage allocation in GB.
 * Returns `${diskSizeGb} GB` or '—' if null/undefined/NaN.
 */
export function formatDiskSize(diskSizeGb: number | null | undefined): string {
  if (diskSizeGb === null || diskSizeGb === undefined || Number.isNaN(diskSizeGb)) {
    return "—";
  }
  return `${diskSizeGb} GB`;
}

/**
 * Formats an ISO timestamp or date into a readable string.
 * Returns '—' if null, undefined, empty string, or invalid date.
 */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) {
    return "—";
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

