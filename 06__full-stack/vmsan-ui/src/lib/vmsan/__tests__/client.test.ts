import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  runVmsan,
  listVMs,
  createVM,
  startVM,
  stopVM,
  removeVM,
} from "../client";
import { VmsanError, VmsanValidationError } from "../errors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_BIN_PATH = path.join(__dirname, "mock-vmsan.js");

const ARGV_ECHO_SCRIPT =
  "console.log(JSON.stringify({ args: process.argv.slice(1), env_path: process.env.PATH }));";

describe("vmsan client - runVmsan process execution", () => {
  it("should capture stdout and exit code 0 on success", async () => {
    const result = await runVmsan(
      ["-e", "console.log('hello from vmsan mock');"],
      {
        binPath: process.execPath,
        sudo: false,
      }
    );

    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), "hello from vmsan mock");
    assert.equal(result.stderr, "");
  });

  it("should throw VmsanError on non-zero exit code and capture stderr", async () => {
    await assert.rejects(
      () =>
        runVmsan(
          ["-e", "process.stderr.write('Error: VM not found'); process.exit(1);"],
          {
            binPath: process.execPath,
            sudo: false,
          }
        ),
      (err: unknown) => {
        assert.ok(err instanceof VmsanError);
        assert.equal(err.exitCode, 1);
        assert.equal(err.stderr.trim(), "Error: VM not found");
        assert.ok(err.message.includes("Error: VM not found"));
        return true;
      }
    );
  });

  it("should handle command timeouts cleanly", async () => {
    await assert.rejects(
      () =>
        runVmsan(["-e", "setTimeout(() => {}, 5000);"], {
          binPath: process.execPath,
          timeoutMs: 50,
          sudo: false,
        }),
      (err: unknown) => {
        assert.ok(err instanceof VmsanError);
        assert.equal(err.exitCode, null);
        assert.ok(err.message.includes("timed out after 50ms"));
        return true;
      }
    );
  });

  it("should throw VmsanError when binary cannot be executed", async () => {
    await assert.rejects(
      () =>
        runVmsan(["list"], {
          binPath: "/path/to/nonexistent/vmsan_binary_xyz",
          sudo: false,
        }),
      (err: unknown) => {
        assert.ok(err instanceof VmsanError);
        assert.equal(err.exitCode, null);
        assert.ok(err.message.includes("Failed to execute"));
        return true;
      }
    );
  });
});

describe("vmsan client - command construction & lifecycle operations", () => {
  it("listVMs should execute '--json list' and parse output", async () => {
    const vms = await listVMs({
      binPath: MOCK_BIN_PATH,
      sudo: false,
    });

    assert.equal(vms.length, 2);
    assert.deepEqual(vms[0], {
      id: "vm-mock1",
      status: "running",
      memoryMiB: 256,
      vcpus: 1,
      runtime: "base",
      age: "2m",
    });
    assert.deepEqual(vms[1], {
      id: "vm-mock2",
      status: "stopped",
      memoryMiB: 512,
      vcpus: 2,
      runtime: "node22",
      age: "1h",
    });
  });

  it("createVM should construct safe argument array and reject invalid inputs", async () => {
    // Rejects invalid options before process spawn
    await assert.rejects(
      // @ts-expect-error testing validation
      () => createVM({ runtime: "unsupported-runtime" }),
      VmsanValidationError
    );

    // Creates VM with valid options
    const result = await createVM(
      { runtime: "node24", vcpus: 4, memoryMiB: 1024 },
      { binPath: MOCK_BIN_PATH, sudo: false }
    );
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes("Created VM"));

    // Test argument structure using node helper script
    const echoResult = await runVmsan(
      [
        "-e",
        ARGV_ECHO_SCRIPT,
        "create",
        "--runtime=node24",
        "--vcpus=4",
        "--memory=1024",
      ],
      {
        binPath: process.execPath,
        sudo: false,
      }
    );

    const parsed = JSON.parse(echoResult.stdout);
    assert.deepEqual(parsed.args, [
      "create",
      "--runtime=node24",
      "--vcpus=4",
      "--memory=1024",
    ]);
  });

  it("startVM, stopVM, removeVM should construct argument arrays and validate VM IDs", async () => {
    // Validation failures
    await assert.rejects(() => startVM("invalid id with spaces"), VmsanValidationError);
    await assert.rejects(() => stopVM("vm; rm -rf /"), VmsanValidationError);
    await assert.rejects(() => removeVM("$(whoami)"), VmsanValidationError);

    // Lifecycle calls with mock CLI
    const startRes = await startVM("vm-6ce50edc", { binPath: MOCK_BIN_PATH, sudo: false });
    assert.equal(startRes.exitCode, 0);
    assert.ok(startRes.stdout.includes("Started VM vm-6ce50edc"));

    const stopRes = await stopVM("vm-6ce50edc", { binPath: MOCK_BIN_PATH, sudo: false });
    assert.equal(stopRes.exitCode, 0);
    assert.ok(stopRes.stdout.includes("Stopped VM vm-6ce50edc"));

    const removeRes = await removeVM("vm-6ce50edc", { binPath: MOCK_BIN_PATH, sudo: false });
    assert.equal(removeRes.exitCode, 0);
    assert.ok(removeRes.stdout.includes("Removed VM vm-6ce50edc"));

    // Verify exact arguments
    const startResult = await runVmsan(
      ["-e", ARGV_ECHO_SCRIPT, "start", "vm-6ce50edc"],
      { binPath: process.execPath, sudo: false }
    );
    const startParsed = JSON.parse(startResult.stdout);
    assert.deepEqual(startParsed.args, ["start", "vm-6ce50edc"]);

    const stopResult = await runVmsan(
      ["-e", ARGV_ECHO_SCRIPT, "stop", "vm-6ce50edc"],
      { binPath: process.execPath, sudo: false }
    );
    const stopParsed = JSON.parse(stopResult.stdout);
    assert.deepEqual(stopParsed.args, ["stop", "vm-6ce50edc"]);

    const removeResult = await runVmsan(
      ["-e", ARGV_ECHO_SCRIPT, "remove", "vm-6ce50edc"],
      { binPath: process.execPath, sudo: false }
    );
    const removeParsed = JSON.parse(removeResult.stdout);
    assert.deepEqual(removeParsed.args, ["remove", "vm-6ce50edc"]);
  });

  it("should configure sudo arguments correctly when sudo is requested", async () => {
    // When sudo is false: direct execution of binPath with args
    const directResult = await runVmsan(["start", "vm-1234"], {
      binPath: "/usr/local/bin/vmsan",
      sudo: false,
    }).catch((err) => err);

    assert.ok(directResult instanceof VmsanError);
    assert.equal(directResult.command, "/usr/local/bin/vmsan");
    assert.deepEqual(directResult.args, ["start", "vm-1234"]);

    // When sudo is true: executes "sudo" with ["-n", binPath, ...args]
    const sudoResult = await runVmsan(["start", "vm-1234"], {
      binPath: "/usr/local/bin/vmsan",
      sudo: true,
    }).catch((err) => err);

    assert.ok(sudoResult instanceof VmsanError);
    assert.equal(sudoResult.command, "sudo");
    assert.deepEqual(sudoResult.args, [
      "-n",
      "/usr/local/bin/vmsan",
      "start",
      "vm-1234",
    ]);
    // Ensure no 'env' or 'PATH=' in arguments
    assert.ok(!sudoResult.args.includes("env"));
    assert.ok(!sudoResult.args.some((arg: string) => arg.startsWith("PATH=")));
  });

  it("should respect VMSAN_SUDO environment variable when sudo option is not explicitly passed", async () => {
    const originalEnv = process.env.VMSAN_SUDO;
    try {
      process.env.VMSAN_SUDO = "true";
      const sudoEnvResult = await runVmsan(["create", "--runtime=base"], {
        binPath: "/usr/local/bin/vmsan",
      }).catch((err) => err);

      assert.ok(sudoEnvResult instanceof VmsanError);
      assert.equal(sudoEnvResult.command, "sudo");
      assert.deepEqual(sudoEnvResult.args, [
        "-n",
        "/usr/local/bin/vmsan",
        "create",
        "--runtime=base",
      ]);

      process.env.VMSAN_SUDO = "false";
      const noSudoEnvResult = await runVmsan(["create", "--runtime=base"], {
        binPath: "/usr/local/bin/vmsan",
      }).catch((err) => err);

      assert.ok(noSudoEnvResult instanceof VmsanError);
      assert.equal(noSudoEnvResult.command, "/usr/local/bin/vmsan");
      assert.deepEqual(noSudoEnvResult.args, ["create", "--runtime=base"]);
    } finally {
      process.env.VMSAN_SUDO = originalEnv;
    }
  });
});
