import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  VMMetadataStore,
  VMMetadataConflictError,
  VMMetadataValidationError,
} from "../store";

describe("VMMetadataStore", () => {
  let tempDir: string;
  let storeFile: string;
  let store: VMMetadataStore;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vmsan-store-test-"));
    storeFile = path.join(tempDir, ".vmsan-ui", "vms.json");
    store = new VMMetadataStore({ filePath: storeFile });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("should return null for non-existent VM", async () => {
    const result = await store.get("vm-nonexistent");
    assert.equal(result, null);
  });

  it("should set and get metadata for a VM", async () => {
    const meta = await store.set("vm-a83f19c2", "node-dev");
    assert.equal(meta.vmsanId, "vm-a83f19c2");
    assert.equal(meta.name, "node-dev");
    assert.ok(meta.createdAt);

    const fetched = await store.get("vm-a83f19c2");
    assert.notEqual(fetched, null);
    assert.equal(fetched?.vmsanId, "vm-a83f19c2");
    assert.equal(fetched?.name, "node-dev");
    assert.equal(fetched?.createdAt, meta.createdAt);
  });

  it("should preserve original name casing for display and storage", async () => {
    const meta = await store.set("vm-12345678", "Python-Sandbox-01");
    assert.equal(meta.name, "Python-Sandbox-01");

    const fetched = await store.get("vm-12345678");
    assert.equal(fetched?.name, "Python-Sandbox-01");

    // Check raw file content on disk
    const raw = await fs.readFile(storeFile, "utf-8");
    const parsed = JSON.parse(raw);
    assert.equal(parsed.vms["vm-12345678"].name, "Python-Sandbox-01");
  });

  it("should reject conflicting names case-insensitively", async () => {
    await store.set("vm-11111111", "Node-Dev");

    // Attempting to use same name with different casing on another VM should fail
    await assert.rejects(
      async () => {
        await store.set("vm-22222222", "node-dev");
      },
      (err: unknown) => {
        assert.ok(err instanceof VMMetadataConflictError);
        assert.equal(err.code, "VM_NAME_ALREADY_EXISTS");
        return true;
      }
    );

    // Attempting to use uppercase variant
    await assert.rejects(
      async () => {
        await store.set("vm-22222222", "NODE-DEV");
      },
      (err: unknown) => {
        assert.ok(err instanceof VMMetadataConflictError);
        return true;
      }
    );
  });

  it("should allow renaming the same VM or keeping its own name", async () => {
    await store.set("vm-11111111", "node-dev");

    // Updating same VM to new casing or same name should succeed
    const updated = await store.set("vm-11111111", "Node-Dev");
    assert.equal(updated.name, "Node-Dev");

    const fetched = await store.get("vm-11111111");
    assert.equal(fetched?.name, "Node-Dev");
  });

  it("should reject invalid names with VMMetadataValidationError", async () => {
    await assert.rejects(
      async () => {
        await store.set("vm-11111111", "invalid name with space");
      },
      (err: unknown) => {
        assert.ok(err instanceof VMMetadataValidationError);
        assert.equal(err.code, "INVALID_REQUEST");
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await store.set("vm-11111111", "vm-reserved");
      },
      (err: unknown) => {
        assert.ok(err instanceof VMMetadataValidationError);
        assert.equal(err.code, "INVALID_REQUEST");
        return true;
      }
    );
  });

  it("should find metadata by name case-insensitively", async () => {
    await store.set("vm-abcdef12", "Web-Server-01");

    const foundLower = await store.findByName("web-server-01");
    assert.notEqual(foundLower, null);
    assert.equal(foundLower?.vmsanId, "vm-abcdef12");
    assert.equal(foundLower?.name, "Web-Server-01");

    const foundUpper = await store.findByName("WEB-SERVER-01");
    assert.notEqual(foundUpper, null);
    assert.equal(foundUpper?.vmsanId, "vm-abcdef12");

    const notFound = await store.findByName("database");
    assert.equal(notFound, null);
  });

  it("should get all metadata records", async () => {
    await store.set("vm-1", "app-1");
    await store.set("vm-2", "app-2");

    const all = await store.getAll();
    assert.equal(Object.keys(all).length, 2);
    assert.equal(all["vm-1"].name, "app-1");
    assert.equal(all["vm-2"].name, "app-2");
  });

  it("should delete metadata and return boolean result", async () => {
    await store.set("vm-1234", "to-delete");

    const deleted = await store.delete("vm-1234");
    assert.equal(deleted, true);

    const fetched = await store.get("vm-1234");
    assert.equal(fetched, null);

    const deleteAgain = await store.delete("vm-1234");
    assert.equal(deleteAgain, false);
  });

  it("should survive reload from disk across store instances", async () => {
    await store.set("vm-persistent", "my-persistent-vm");

    // Create a new store instance pointing to same file
    const newStore = new VMMetadataStore({ filePath: storeFile });
    const fetched = await newStore.get("vm-persistent");
    assert.notEqual(fetched, null);
    assert.equal(fetched?.name, "my-persistent-vm");
  });

  it("should handle corrupted JSON file gracefully by returning empty store", async () => {
    await fs.mkdir(path.dirname(storeFile), { recursive: true });
    await fs.writeFile(storeFile, "THIS IS CORRUPTED JSON {{{", "utf-8");

    const corruptedStore = new VMMetadataStore({ filePath: storeFile });
    const all = await corruptedStore.getAll();
    assert.deepEqual(all, {});

    // Can still write new records without crashing
    await corruptedStore.set("vm-recovered", "new-vm");
    const fetched = await corruptedStore.get("vm-recovered");
    assert.equal(fetched?.name, "new-vm");
  });

  it("should handle concurrent writes without race conditions", async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      store.set(`vm-${i.toString().padStart(8, "0")}`, `concurrent-vm-${i}`)
    );

    const results = await Promise.all(promises);
    assert.equal(results.length, 10);

    const all = await store.getAll();
    assert.equal(Object.keys(all).length, 10);
  });
});
