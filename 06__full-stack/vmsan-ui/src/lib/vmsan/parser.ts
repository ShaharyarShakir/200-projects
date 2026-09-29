import { VM, VMStatus } from "./types";
import { VmsanError } from "./errors";

// Strip ANSI escape sequences
function stripAnsi(text: string): string {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

function normalizeStatus(statusRaw: unknown): VMStatus {
  if (typeof statusRaw !== "string") {
    return "unknown";
  }
  const s = statusRaw.toLowerCase().trim();
  if (s === "running" || s === "active" || s.startsWith("run")) {
    return "running";
  }
  if (s === "stopped" || s === "inactive" || s.startsWith("stop")) {
    return "stopped";
  }
  return "unknown";
}

function parseMemory(memoryRaw: unknown): number | null {
  if (typeof memoryRaw === "number" && !isNaN(memoryRaw)) {
    return memoryRaw;
  }
  if (typeof memoryRaw === "string") {
    const match = memoryRaw.match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return isNaN(num) ? null : num;
    }
  }
  return null;
}

function parseVcpus(vcpusRaw: unknown): number | null {
  if (typeof vcpusRaw === "number" && !isNaN(vcpusRaw)) {
    return vcpusRaw;
  }
  if (typeof vcpusRaw === "string") {
    const num = parseInt(vcpusRaw.trim(), 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

function normalizeVmObject(raw: Record<string, unknown>): VM {
  const id = String(raw.id || raw.vmId || raw.name || "").trim();
  const status = normalizeStatus(raw.status || raw.state);
  const memoryMiB = parseMemory(raw.memoryMiB ?? raw.memory ?? raw.mem);
  const vcpus = parseVcpus(raw.vcpus ?? raw.vcpu ?? raw.cpus ?? raw.cpu);
  const runtime = raw.runtime || raw.image ? String(raw.runtime || raw.image).trim() : null;
  const age = raw.age || raw.uptime || raw.created || raw.createdAt ? String(raw.age || raw.uptime || raw.created || raw.createdAt).trim() : null;

  return {
    id,
    status,
    memoryMiB,
    vcpus,
    runtime,
    age,
  };
}

export function parseVmList(rawOutput: string): VM[] {
  const clean = stripAnsi(rawOutput).trim();

  if (!clean || clean.includes("No VMs found")) {
    return [];
  }

  // 1. Try direct JSON parsing of the entire string
  try {
    const directParsed = JSON.parse(clean);
    if (Array.isArray(directParsed)) {
      return directParsed.map((item) => normalizeVmObject(item as Record<string, unknown>));
    }
    if (directParsed && typeof directParsed === "object") {
      if (Array.isArray(directParsed.vms)) {
        return directParsed.vms.map((item: unknown) => normalizeVmObject(item as Record<string, unknown>));
      }
      if (Array.isArray(directParsed.data)) {
        return directParsed.data.map((item: unknown) => normalizeVmObject(item as Record<string, unknown>));
      }
    }
  } catch {
    // Continue to JSON line / substring extraction
  }

  // 2. Try JSON substring extraction (e.g. if CLI prefixed/suffixed logs)
  const firstBracket = clean.indexOf("[");
  const lastBracket = clean.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      const jsonArr = JSON.parse(clean.substring(firstBracket, lastBracket + 1));
      if (Array.isArray(jsonArr)) {
        return jsonArr.map((item) => normalizeVmObject(item as Record<string, unknown>));
      }
    } catch {
      // Continue to next attempts
    }
  }

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonObj = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      if (Array.isArray(jsonObj.vms)) {
        return jsonObj.vms.map((item: unknown) => normalizeVmObject(item as Record<string, unknown>));
      }
      if (Array.isArray(jsonObj.data)) {
        return jsonObj.data.map((item: unknown) => normalizeVmObject(item as Record<string, unknown>));
      }
    } catch {
      // Continue to fallback
    }
  }

  // 3. Fallback: Parse tabular text output
  // Example table:
  // ID             STATUS   RUNTIME  VCPUS  MEMORY  AGE
  // vm-6ce50edc    running  base     1      128MB   5m
  const lines = clean.split("\n");
  const hasTableHeader = lines.some((l) => {
    const lower = l.toLowerCase();
    return lower.includes("id") && lower.includes("status");
  });

  const nonHeaderLines = lines.filter(
    (l) =>
      l.trim() &&
      !l.toLowerCase().startsWith("id ") &&
      !l.toLowerCase().startsWith("---") &&
      !l.includes("[list]")
  );

  if (nonHeaderLines.length > 0) {
    const vms: VM[] = [];
    for (const line of nonHeaderLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const id = parts[0];
        const status = normalizeStatus(parts[1]);
        // Only accept if status is a recognized status or table header was explicitly present
        if (status === "running" || status === "stopped" || hasTableHeader) {
          const runtime = parts.length > 2 ? parts[2] : null;
          const vcpus = parts.length > 3 ? parseVcpus(parts[3]) : null;
          const memoryMiB = parts.length > 4 ? parseMemory(parts[4]) : null;
          const age = parts.length > 5 ? parts.slice(5).join(" ") : null;

          vms.push({
            id,
            status,
            memoryMiB,
            vcpus,
            runtime,
            age,
          });
        }
      }
    }
    if (vms.length > 0) {
      return vms;
    }
  }

  throw new VmsanError({
    message: "Failed to parse vmsan list output",
    command: "list",
    args: ["list"],
    exitCode: 0,
    stdout: rawOutput,
    stderr: "",
  });
}
