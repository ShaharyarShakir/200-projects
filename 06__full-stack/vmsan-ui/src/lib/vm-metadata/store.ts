import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { VMMetadata, VMMetadataRecord, VMMetadataStoreSchema } from "./types";
import { validateVMName, normalizeVMName } from "./validation";

export class VMMetadataConflictError extends Error {
  readonly code = "VM_NAME_ALREADY_EXISTS";
  constructor(message = "A VM with this name already exists") {
    super(message);
    this.name = "VMMetadataConflictError";
  }
}

export class VMMetadataValidationError extends Error {
  readonly code = "INVALID_REQUEST";
  constructor(message: string) {
    super(message);
    this.name = "VMMetadataValidationError";
  }
}

export interface VMMetadataStoreOptions {
  filePath?: string;
}

export class VMMetadataStore {
  private filePath: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options?: VMMetadataStoreOptions) {
    if (options?.filePath) {
      this.filePath = options.filePath;
    } else if (process.env.VMSAN_METADATA_PATH) {
      this.filePath = process.env.VMSAN_METADATA_PATH;
    } else {
      this.filePath = path.join(process.cwd(), ".vmsan-ui", "vms.json");
    }
  }

  public getFilePath(): string {
    return this.filePath;
  }

  private async serialize<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => {});
    return next;
  }

  private async readSchema(): Promise<VMMetadataStoreSchema> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as VMMetadataStoreSchema;
      if (parsed && typeof parsed === "object" && typeof parsed.vms === "object" && parsed.vms !== null) {
        return {
          version: typeof parsed.version === "number" ? parsed.version : 1,
          vms: parsed.vms,
        };
      }
      return { version: 1, vms: {} };
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "ENOENT"
      ) {
        return { version: 1, vms: {} };
      }
      // If file is corrupted, return safe fallback empty store
      return { version: 1, vms: {} };
    }
  }

  private async writeSchema(schema: VMMetadataStoreSchema): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    const tempPath = path.join(
      dir,
      `.${path.basename(this.filePath)}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    const data = JSON.stringify(schema, null, 2) + "\n";
    await fs.writeFile(tempPath, data, "utf-8");
    await fs.rename(tempPath, this.filePath);
  }

  public async get(vmsanId: string): Promise<VMMetadata | null> {
    return this.serialize(async () => {
      const schema = await this.readSchema();
      const record = schema.vms[vmsanId];
      if (!record) return null;
      return {
        vmsanId,
        name: record.name,
        createdAt: record.createdAt,
      };
    });
  }

  public async getAll(): Promise<Record<string, VMMetadataRecord>> {
    return this.serialize(async () => {
      const schema = await this.readSchema();
      return { ...schema.vms };
    });
  }

  public async findByName(name: string): Promise<VMMetadata | null> {
    return this.serialize(async () => {
      const normalizedTarget = normalizeVMName(name);
      const schema = await this.readSchema();

      for (const [vmsanId, record] of Object.entries(schema.vms)) {
        if (normalizeVMName(record.name) === normalizedTarget) {
          return {
            vmsanId,
            name: record.name,
            createdAt: record.createdAt,
          };
        }
      }
      return null;
    });
  }

  public async set(vmsanId: string, name: string): Promise<VMMetadata> {
    return this.serialize(async () => {
      const validation = validateVMName(name);
      if (!validation.valid || !validation.name) {
        throw new VMMetadataValidationError(validation.error || "Invalid VM name");
      }

      const validatedName = validation.name;
      const normalizedTarget = normalizeVMName(validatedName);
      const schema = await this.readSchema();

      for (const [id, record] of Object.entries(schema.vms)) {
        if (id !== vmsanId && normalizeVMName(record.name) === normalizedTarget) {
          throw new VMMetadataConflictError(
            `A VM with name '${record.name}' already exists`
          );
        }
      }

      const existing = schema.vms[vmsanId];
      const record: VMMetadataRecord = {
        name: validatedName,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      schema.vms[vmsanId] = record;
      await this.writeSchema(schema);

      return {
        vmsanId,
        name: record.name,
        createdAt: record.createdAt,
      };
    });
  }

  public async delete(vmsanId: string): Promise<boolean> {
    return this.serialize(async () => {
      const schema = await this.readSchema();
      if (!schema.vms[vmsanId]) {
        return false;
      }

      delete schema.vms[vmsanId];
      await this.writeSchema(schema);
      return true;
    });
  }

  public async clear(): Promise<void> {
    return this.serialize(async () => {
      const schema: VMMetadataStoreSchema = { version: 1, vms: {} };
      await this.writeSchema(schema);
    });
  }
}

export const defaultMetadataStore = new VMMetadataStore();
