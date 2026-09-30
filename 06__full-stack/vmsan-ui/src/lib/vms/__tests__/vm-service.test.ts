import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { VmService, createVmService } from "../vm-service";
import type { ManagerClient } from "../../vmsan-manager/client";
import {
  ManagerUnavailableError,
  ManagerProtocolError,
  ManagerRequestError,
} from "../../vmsan-manager/errors";
import {
  VmValidationError,
  VmNotFoundError,
  VmInvalidStateError,
  VmManagerUnavailableError,
  VmOperationFailedError,
} from "../vm-errors";
import type { ManagerVm, VmRemoveResult } from "../../vmsan-manager/protocol";

describe("VmService", () => {
  let calls: {
    list: number;
    createVm: any[];
    startVm: any[];
    stopVm: any[];
    removeVm: any[];
  };

  let mockHandlers: {
    list: () => Promise<ManagerVm[]>;
    createVm: (params?: any) => Promise<ManagerVm>;
    startVm: (id: string) => Promise<ManagerVm>;
    stopVm: (id: string) => Promise<ManagerVm>;
    removeVm: (id: string) => Promise<VmRemoveResult>;
  };

  let service: VmService;

  const sampleManagerVm: ManagerVm = {
    id: "vm-test-1",
    status: "running",
    runtime: "node22",
    vcpuCount: 2,
    memSizeMib: 512,
    createdAt: "2026-09-29T10:00:00.000Z",
    snapshot: null,
    timeoutAt: null,
    tunnelHostnames: ["test.example.com"],
  };

  beforeEach(() => {
    calls = {
      list: 0,
      createVm: [],
      startVm: [],
      stopVm: [],
      removeVm: [],
    };

    mockHandlers = {
      list: async () => [sampleManagerVm],
      createVm: async () => sampleManagerVm,
      startVm: async () => sampleManagerVm,
      stopVm: async () => sampleManagerVm,
      removeVm: async (id: string) => ({ removed: true, vmId: id }),
    };

    const mockClient: Partial<ManagerClient> = {
      list: async () => {
        calls.list++;
        return mockHandlers.list();
      },
      createVm: async (params?: any) => {
        calls.createVm.push(params);
        return mockHandlers.createVm(params);
      },
      startVm: async (id: string) => {
        calls.startVm.push(id);
        return mockHandlers.startVm(id);
      },
      stopVm: async (id: string) => {
        calls.stopVm.push(id);
        return mockHandlers.stopVm(id);
      },
      removeVm: async (id: string) => {
        calls.removeVm.push(id);
        return mockHandlers.removeVm(id);
      },
    };

    service = createVmService({ client: mockClient as ManagerClient });
  });

  describe("listVms", () => {
    it("returns mapped and sanitized Vm DTO list", async () => {
      const vms = await service.listVms();

      assert.equal(calls.list, 1);
      assert.equal(vms.length, 1);
      assert.equal(vms[0].id, "vm-test-1");
      assert.equal(vms[0].status, "running");
      assert.equal(vms[0].runtime, "node22");
      assert.equal(vms[0].vcpus, 2);
      assert.equal(vms[0].memoryMib, 512);
      assert.equal(vms[0].diskSizeGb, 1);
      assert.equal(vms[0].createdAt, "2026-09-29T10:00:00.000Z");
      assert.equal(typeof vms[0].age, "string");
      assert.equal((vms[0] as any).agentToken, undefined);
      assert.equal((vms[0] as any).hostTap, undefined);
    });

    it("translates ManagerUnavailableError to VmManagerUnavailableError (503)", async () => {
      mockHandlers.list = async () => {
        throw new ManagerUnavailableError("connect ENOENT /run/vmsan-manager.sock");
      };

      await assert.rejects(async () => service.listVms(), VmManagerUnavailableError);
    });

    it("translates ManagerProtocolError to VmOperationFailedError (502)", async () => {
      mockHandlers.list = async () => {
        throw new ManagerProtocolError("Malformed response payload");
      };

      await assert.rejects(async () => service.listVms(), (err: any) => {
        assert.equal(err instanceof VmOperationFailedError, true);
        assert.equal(err.statusCode, 502);
        assert.equal(err.code, "MANAGER_PROTOCOL_ERROR");
        return true;
      });
    });
  });

  describe("getVm", () => {
    it("validates VM ID and rejects invalid characters", async () => {
      await assert.rejects(async () => service.getVm("vm-1; rm -rf /"), VmValidationError);
      assert.equal(calls.list, 0);
    });

    it("validates VM ID and rejects empty ID", async () => {
      await assert.rejects(async () => service.getVm(""), VmValidationError);
      assert.equal(calls.list, 0);
    });

    it("returns mapped and sanitized Vm DTO when VM exists", async () => {
      const vm = await service.getVm("vm-test-1");

      assert.equal(calls.list, 1);
      assert.equal(vm.id, "vm-test-1");
      assert.equal(vm.status, "running");
      assert.equal(vm.runtime, "node22");
      assert.equal(vm.vcpus, 2);
      assert.equal(vm.memoryMib, 512);
      assert.equal(vm.diskSizeGb, 1);
      assert.equal(vm.createdAt, "2026-09-29T10:00:00.000Z");
      assert.equal(typeof vm.age, "string");
      assert.equal((vm as any).agentToken, undefined);
      assert.equal((vm as any).hostTap, undefined);
    });

    it("throws VmNotFoundError when VM does not exist in manager list", async () => {
      await assert.rejects(async () => service.getVm("vm-unknown"), (err: any) => {
        assert.equal(err instanceof VmNotFoundError, true);
        assert.equal(err.statusCode, 404);
        assert.equal(err.code, "VM_NOT_FOUND");
        assert.equal(err.vmId, "vm-unknown");
        return true;
      });
      assert.equal(calls.list, 1);
    });

    it("translates ManagerUnavailableError to VmManagerUnavailableError (503)", async () => {
      mockHandlers.list = async () => {
        throw new ManagerUnavailableError("connect ENOENT /run/vmsan-manager.sock");
      };

      await assert.rejects(async () => service.getVm("vm-test-1"), VmManagerUnavailableError);
    });

    it("translates ManagerProtocolError to VmOperationFailedError (502)", async () => {
      mockHandlers.list = async () => {
        throw new ManagerProtocolError("Malformed response payload");
      };

      await assert.rejects(async () => service.getVm("vm-test-1"), (err: any) => {
        assert.equal(err instanceof VmOperationFailedError, true);
        assert.equal(err.statusCode, 502);
        assert.equal(err.code, "MANAGER_PROTOCOL_ERROR");
        return true;
      });
    });
  });

  describe("createVm", () => {
    it("validates input before calling manager client", async () => {
      await assert.rejects(async () => service.createVm({ vcpus: 999 }), VmValidationError);
      assert.equal(calls.createVm.length, 0);
    });

    it("forwards mapped parameters to manager client", async () => {
      const vm = await service.createVm({
        runtime: "node22",
        vcpus: 4,
        memoryMib: 1024,
        diskSizeGb: 10,
        networkPolicy: "deny-all",
        timeoutMs: 60000,
      });

      assert.equal(calls.createVm.length, 1);
      assert.deepEqual(calls.createVm[0], {
        runtime: "node22",
        vcpus: 4,
        memoryMib: 1024,
        diskSizeGb: 10,
        networkPolicy: "deny-all",
        timeoutMs: 60000,
      });
      assert.equal(vm.id, "vm-test-1");
      assert.equal(vm.vcpus, 2); // from sampleManagerVm
    });

    it("handles empty create input properly", async () => {
      const vm = await service.createVm({});

      assert.equal(calls.createVm.length, 1);
      assert.equal(calls.createVm[0], undefined);
      assert.equal(vm.id, "vm-test-1");
    });

    it("translates manager VALIDATION_ERROR to VmValidationError", async () => {
      mockHandlers.createVm = async () => {
        throw new ManagerRequestError("VALIDATION_ERROR", "Invalid vcpu count");
      };

      await assert.rejects(async () => service.createVm({}), VmValidationError);
    });
  });

  describe("startVm", () => {
    it("validates VM ID and rejects invalid characters", async () => {
      await assert.rejects(async () => service.startVm("vm-1; rm -rf /"), VmValidationError);
      assert.equal(calls.startVm.length, 0);
    });

    it("calls startVm on client and returns mapped Vm DTO", async () => {
      const vm = await service.startVm("vm-test-1");

      assert.equal(calls.startVm.length, 1);
      assert.equal(calls.startVm[0], "vm-test-1");
      assert.equal(vm.id, "vm-test-1");
      assert.equal(vm.status, "running");
    });

    it("translates VM_NOT_FOUND to VmNotFoundError (404)", async () => {
      mockHandlers.startVm = async () => {
        throw new ManagerRequestError("VM_NOT_FOUND", "VM 'vm-unknown' not found");
      };

      await assert.rejects(async () => service.startVm("vm-unknown"), VmNotFoundError);
    });

    it("translates VM_INVALID_STATE to VmInvalidStateError (409)", async () => {
      mockHandlers.startVm = async () => {
        throw new ManagerRequestError("VM_INVALID_STATE", "VM is already running");
      };

      await assert.rejects(async () => service.startVm("vm-test-1"), VmInvalidStateError);
    });
  });

  describe("stopVm", () => {
    it("validates VM ID", async () => {
      await assert.rejects(async () => service.stopVm(""), VmValidationError);
      assert.equal(calls.stopVm.length, 0);
    });

    it("calls stopVm on client and returns mapped Vm DTO", async () => {
      const stoppedVm = { ...sampleManagerVm, status: "stopped" as const };
      mockHandlers.stopVm = async () => stoppedVm;

      const vm = await service.stopVm("vm-test-1");

      assert.equal(calls.stopVm.length, 1);
      assert.equal(calls.stopVm[0], "vm-test-1");
      assert.equal(vm.id, "vm-test-1");
      assert.equal(vm.status, "stopped");
    });

    it("translates VM_NOT_FOUND error", async () => {
      mockHandlers.stopVm = async () => {
        throw new ManagerRequestError("VM_NOT_FOUND", "VM not found");
      };

      await assert.rejects(async () => service.stopVm("vm-test-1"), VmNotFoundError);
    });
  });

  describe("removeVm", () => {
    it("validates VM ID", async () => {
      await assert.rejects(async () => service.removeVm("../etc/passwd"), VmValidationError);
      assert.equal(calls.removeVm.length, 0);
    });

    it("calls removeVm on client and returns removal confirmation", async () => {
      const res = await service.removeVm("vm-test-1");

      assert.equal(calls.removeVm.length, 1);
      assert.equal(calls.removeVm[0], "vm-test-1");
      assert.deepEqual(res, {
        removed: true,
        vmId: "vm-test-1",
      });
    });

    it("translates INVALID_VM_STATE to VmInvalidStateError (409)", async () => {
      mockHandlers.removeVm = async () => {
        throw new ManagerRequestError("INVALID_VM_STATE", "Cannot remove running VM");
      };

      await assert.rejects(async () => service.removeVm("vm-test-1"), VmInvalidStateError);
    });
  });
});
