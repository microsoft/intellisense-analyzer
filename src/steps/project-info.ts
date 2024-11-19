import { Server } from "@typescript/server-harness";

export const getProjectInfo = async (server: Server, seq: number) => {
  return server.message({
    seq,
    type: "request",
    command: "projectInfo",
    arguments: {
      needFileNameList: false,
      needDefaultConfiguredProjectInfo: true,
    },
  });
};
