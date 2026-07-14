import pino from "pino";

// One structured logger for both the web process and the worker process.
// Dev gets human-readable pretty-printed output; production emits plain JSON
// lines so a log aggregator (or `docker logs` piped through anything) can
// parse level/module/fields without regexing free-text console output.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" } },
});

/** Scope a logger to a subsystem, e.g. `createLogger("worker")`. */
export function createLogger(module: string) {
  return logger.child({ module });
}
