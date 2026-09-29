#!/usr/bin/env node

const args = process.argv.slice(2);

if (process.env.MOCK_FAIL === "true") {
  console.error("vmsan: the control socket is not reachable");
  process.exit(1);
}

if (args.includes("--json") && args.includes("list")) {
  console.log(
    JSON.stringify([
      {
        id: "vm-mock1",
        status: "running",
        memoryMiB: 256,
        vcpus: 1,
        runtime: "base",
        age: "2m",
      },
      {
        id: "vm-mock2",
        status: "stopped",
        memoryMiB: 512,
        vcpus: 2,
        runtime: "node22",
        age: "1h",
      },
    ])
  );
  process.exit(0);
}

if (args[0] === "create") {
  console.log("Created VM vm-created1");
  process.exit(0);
}

if (args[0] === "start") {
  console.log(`Started VM ${args[1]}`);
  process.exit(0);
}

if (args[0] === "stop") {
  console.log(`Stopped VM ${args[1]}`);
  process.exit(0);
}

if (args[0] === "remove") {
  console.log(`Removed VM ${args[1]}`);
  process.exit(0);
}

if (args[0] === "error") {
  console.error("Mock error occurred");
  process.exit(1);
}

console.log("Mock vmsan CLI received:", args);
process.exit(0);
