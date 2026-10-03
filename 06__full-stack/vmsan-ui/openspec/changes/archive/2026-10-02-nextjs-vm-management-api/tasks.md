# Tasks

## 1. Domain Types and Models

- [x] 1.1 Create `src/lib/vms/types.ts` defining application domain types (`Vm`, `VmStatus`, `VmNetwork`, `CreateVmInput`) and verify compilation with `npx tsc --noEmit`
- [x] 1.2 Update `src/lib/api/types.ts` to re-export domain models for browser consumers and verify absence of Node.js net/server imports

## 2. Validation and Domain Mapping

- [x] 2.1 Implement `validateVmId` and `validateCreateVmInput` in `src/lib/vms/validation.ts` with strict regex and resource bounds
- [x] 2.2 Implement `toVmDto` and presentation mappers in `src/lib/vms/vm-mapper.ts` stripping sensitive host internals (`agentToken`, TAP interfaces, host paths, Jailer paths, PIDs)
- [x] 2.3 Implement error classes and HTTP status mapping in `src/lib/vms/vm-errors.ts`
- [x] 2.4 Add unit tests for validation, mappers, and error translation in `src/lib/vms/__tests__/` and verify with `npx vitest run src/lib/vms/__tests__/`

## 3. Application VM Service

- [x] 3.1 Implement `VmService` class and `createVmService` in `src/lib/vms/vm-service.ts` wrapping `ManagerClient` for `listVms`, `createVm`, `startVm`, `stopVm`, and `removeVm`
- [x] 3.2 Add unit tests for `VmService` in `src/lib/vms/__tests__/vm-service.test.ts` verifying error translation, parameter forwarding, and presentation mapping with `npx vitest run src/lib/vms/__tests__/vm-service.test.ts`

## 4. HTTP API Route Handlers

- [x] 4.1 Update `src/app/api/vms/route.ts` (`GET` and `POST`) to delegate to `VmService` with 201 Created on VM creation
- [x] 4.2 Update `src/app/api/vms/[id]/route.ts` (`DELETE`) to return `{ removed: true, vmId: string }`
- [x] 4.3 Update `src/app/api/vms/[id]/start/route.ts` and `src/app/api/vms/[id]/stop/route.ts` to delegate to `VmService`
- [x] 4.4 Update and run existing route tests in `src/app/api/vms/__tests__/` and verify with `npx vitest run src/app/api/vms/__tests__/`

## 5. Security Validation, Integration Tests, and Documentation

- [x] 5.1 Add security tests verifying no direct `vmsan` imports in `src/`, no child process spawning, command injection rejection, and sensitive field omission
- [x] 5.2 Add integration test for VM lifecycle against the manager control socket in `src/__tests__/vm-lifecycle.integration.test.ts`
- [x] 5.3 Author `docs/api/vms.md` documenting all endpoints, request/response formats, validation limits, and error codes
- [x] 5.4 Run full test suite and type check with `npm test` and `npx tsc --noEmit` to verify all components pass
