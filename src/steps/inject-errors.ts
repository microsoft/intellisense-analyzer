import { Server } from "@typescript/server-harness";

export const injectError = async (server: Server, seq: number, fileName: string) => {
  await server.message({
    seq,
    type: "request",
    command: "updateOpen",
    arguments: {
      closedFiles: [],
      openFiles: [],
      changedFiles: [
        {
          fileName,
          textChanges: [
            {
              newText: `import fs = require("fs1");
              `,
              start: { line: 1, offset: 0 },
            },
          ],
        },
      ],
    },
  });

  const revert = async (seq: number) => {
    await server.message({
      seq: seq++,
      type: "request",
      command: "updateOpen",
      arguments: {
        closedFiles: [],
        openFiles: [],
        changedFiles: [
          {
            fileName,
            textChanges: [
              {
                newText: "",
                start: { line: 1, offset: 0 },
                end: { line: 1, offset: 28 },
              },
            ],
          },
        ],
      },
    });
  };
  return revert;
};
