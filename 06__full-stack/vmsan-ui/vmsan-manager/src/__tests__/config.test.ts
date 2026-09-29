import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEFAULT_MAX_REQUEST_BYTES,
  loadConfig,
  resolveLogLevel,
  resolveMaxRequestBytes,
  resolveSocketGroup,
  resolveSocketPath,
  resolveVmsanDir,
  SOCKET_FILE_NAME,
} from "../config.js";

describe("manager config - socket path", () => {
  it("honors an explicit socket override", () => {
    const path = resolveSocketPath(
      { VMSAN_MANAGER_SOCKET: "/run/vmsan-manager.sock" },
      1000
    );
    assert.equal(path, "/run/vmsan-manager.sock");
  });

  it("prefers XDG_RUNTIME_DIR for the development default", () => {
    const path = resolveSocketPath({ XDG_RUNTIME_DIR: "/run/user/1000" }, 1000);
    assert.equal(path, `/run/user/1000/${SOCKET_FILE_NAME}`);
  });

  it("falls back to /run/user/<uid> when XDG_RUNTIME_DIR is absent", () => {
    const path = resolveSocketPath({}, 4242);
    assert.equal(path, `/run/user/4242/${SOCKET_FILE_NAME}`);
  });

  it("ignores an empty override and uses the runtime directory", () => {
    const path = resolveSocketPath(
      { VMSAN_MANAGER_SOCKET: "", XDG_RUNTIME_DIR: "/run/user/7" },
      7
    );
    assert.equal(path, `/run/user/7/${SOCKET_FILE_NAME}`);
  });
});

describe("manager config - vmsan directory", () => {
  it("honors an explicit VMSAN_DIR", () => {
    assert.equal(
      resolveVmsanDir({ VMSAN_DIR: "/var/lib/vmsan" }, "/home/example"),
      "/var/lib/vmsan"
    );
  });

  it("derives a tilde-relative default from the provided home", () => {
    assert.equal(
      resolveVmsanDir({}, "/home/example"),
      "/home/example/.vmsan"
    );
  });

  it("does not consult SUDO_USER, which would point root at another user's directory", () => {
    const path = resolveVmsanDir(
      { SUDO_USER: "someone-else" },
      "/home/manager-user"
    );
    assert.equal(path, "/home/manager-user/.vmsan");
  });
});

describe("manager config - log level and frame cap", () => {
  it("accepts the four supported levels", () => {
    for (const level of ["error", "warn", "info", "debug"] as const) {
      assert.equal(resolveLogLevel({ VMSAN_MANAGER_LOG_LEVEL: level }), level);
    }
  });

  it("falls back to info for an unrecognized level", () => {
    assert.equal(resolveLogLevel({ VMSAN_MANAGER_LOG_LEVEL: "verbose" }), "info");
  });

  it("defaults the frame cap to 64 KiB", () => {
    assert.equal(resolveMaxRequestBytes({}), DEFAULT_MAX_REQUEST_BYTES);
    assert.equal(DEFAULT_MAX_REQUEST_BYTES, 64 * 1024);
  });

  it("falls back to the default for a non-positive or invalid cap", () => {
    assert.equal(
      resolveMaxRequestBytes({ VMSAN_MANAGER_MAX_REQUEST_BYTES: "0" }),
      DEFAULT_MAX_REQUEST_BYTES
    );
    assert.equal(
      resolveMaxRequestBytes({ VMSAN_MANAGER_MAX_REQUEST_BYTES: "lots" }),
      DEFAULT_MAX_REQUEST_BYTES
    );
  });
});

describe("manager config - socket group", () => {
  it("honors an explicit VMSAN_MANAGER_SOCKET_GROUP", () => {
    assert.equal(
      resolveSocketGroup({ VMSAN_MANAGER_SOCKET_GROUP: "vmsan" }),
      "vmsan"
    );
  });

  it("is undefined when no group is configured", () => {
    assert.equal(resolveSocketGroup({}), undefined);
  });

  it("treats an empty value as unset rather than as an empty group name", () => {
    assert.equal(resolveSocketGroup({ VMSAN_MANAGER_SOCKET_GROUP: "" }), undefined);
  });

  it("is carried into the loaded config", () => {
    const config = loadConfig({
      env: { VMSAN_MANAGER_SOCKET_GROUP: "vmsan" },
      home: "/tmp",
      uid: 1,
    });
    assert.equal(config.socketGroup, "vmsan");
  });

  it("leaves socketGroup undefined in the loaded config when unset", () => {
    const config = loadConfig({ env: {}, home: "/tmp", uid: 1 });
    assert.equal(config.socketGroup, undefined);
  });
});

describe("manager config - no hard-coded home path in source", () => {
  it("resolves the default directory from the home passed in, not a literal", () => {
    const fromOneHome = loadConfig({ env: {}, home: "/home/aaa", uid: 1 });
    const fromAnotherHome = loadConfig({ env: {}, home: "/home/bbb", uid: 1 });
    assert.equal(fromOneHome.vmsanDir, "/home/aaa/.vmsan");
    assert.equal(fromAnotherHome.vmsanDir, "/home/bbb/.vmsan");
  });

  it("embeds no user home directory literal in the config source", () => {
    const source = readFileSync(
      new URL("../config.ts", import.meta.url),
      "utf8"
    );
    assert.equal(
      /\/home\/[A-Za-z0-9._-]+/.test(source),
      false,
      "config.ts must not embed a user home path"
    );
    assert.equal(
      /shaharyar/.test(source),
      false,
      "config.ts must not embed a specific username"
    );
  });

  it("embeds no concrete socket path in executable code", () => {
    // Comments may name a path to explain the deployment; code may not bake
    // one in, because the socket location is a configured value.
    const code = readFileSync(new URL("../config.ts", import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");
    assert.equal(
      /\/run\/vmsan-manager\.sock/.test(code),
      false,
      "config.ts must not embed a concrete socket path in code"
    );
  });
});
