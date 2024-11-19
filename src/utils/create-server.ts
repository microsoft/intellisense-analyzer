import {launchServer} from "@typescript/server-harness";
import path from "path";
import fs from "fs";

export const createServer = (
  tsserverPath: string,
  silent = false,
  projectRoot: string,
  tsserverMaxOldSpaceSize: number
) => {
  const traceDir = path.join(projectRoot, "traces");
  const logDir = path.join(projectRoot, "logs");

  // Ensure that the log and trace directories exist
  fs.mkdirSync(traceDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  const server = launchServer(
    tsserverPath,
    // Arguments to tsserver.js
    [
      // ATA generates some extra network traffic and isn't usually relevant when profiling
      "--disableAutomaticTypingAcquisition",
      // // Enable this if you're emulating VS
      "--suppressDiagnosticEvents",
      // // Produce a performance trace
      "--traceDirectory",
      traceDir,
      // // Produce a server log
      "--logVerbosity",
      "info",
      "--logFile",
      path.join(logDir, "tsserver.PID.log"),
    ],
    // Arguments to node
    [
      // Enable this to debug the server process (not the driver process)
      // "--inspect-brk=9230",

      // Generate time and heap profiles (see https://github.com/jakebailey/pprof-it for config options)
      // Disable logging if profiling - their cleanup handlers conflict
      // Disable tracing if profiling - it causes unrealistic slowdowns
      // `--require=${path.join(__dirname, "node_modules", "pprof-it", "dist", "index.js")}`,

      // Increasing the heap size is just generally a good idea
      `--max-old-space-size=${tsserverMaxOldSpaceSize}`,
      // "--max-old-space-size=4096", // This works with calling-cdl stuff
      // This will enable some GC output in the server log
      "--expose-gc",
    ],
    // Environment variables for server process (mostly useful for pprof-it)
    {
      PPROF_OUT: path.join(projectRoot, "profiles"),
    }
  );

  if (!silent) {
    server.on("exit", code =>
      console.log(code ? `Exited with code ${code}` : `Terminated`)
    );
    server.on("event", async e => {
      if (e.body.telemetryEventName === "projectInfo") {
        console.log("projectInfo", e.body.payload);
      } else if (e.event === "configFileDiag") {
        console.log("configDiag", e.body);
      } else {
        console.log(e);
      }
    });
  }

  return server;
};
