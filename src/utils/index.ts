import { Server } from "@typescript/server-harness";
import { logMemory } from "./telemetry.js";

export const harnessUtils = (server: Server) => {
  return {
    logMemory: async () => {
      if (server.pid) {
        await logMemory(server.pid);
      }
    },
  };
};
