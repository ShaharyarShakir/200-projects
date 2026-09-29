import { loadConfig } from "./config.js";
import { createLogger, describeError, formatFields } from "./logger.js";
import { createVmsanService } from "./vmsan.js";
import { ManagerServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);

  logger.info("manager starting");

  const service = await createVmsanService(config);
  logger.info("vmsan service initialized");

  const server = new ManagerServer({ config, logger, service });
  await server.listen();

  let closing = false;
  const shutdown = (signal: string): void => {
    if (closing) {
      return;
    }
    closing = true;
    logger.info("shutdown requested", { signal });
    void server
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  process.stderr.write(
    `FATAL manager failed to start${formatFields(describeError(error))}\n`
  );
  process.exit(1);
});
