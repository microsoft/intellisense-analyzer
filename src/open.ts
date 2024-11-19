#!/usr/bin/env node

import path from "path";
import process from "process";
import { performance } from "perf_hooks";
import { program } from "commander";
import { openFiles } from "./steps/open-files";
import { createServer } from "./utils/create-server";
import { getStats } from "./utils/telemetry";
import { formatTable, startProgress } from "./utils/formatter";
import { Stats } from "./types/stats";

/**
 * @param {string} file
 */
async function main(projectRoot: string, file: string, tsserverPath: string, tsserverMaxOldSpaceSize: number, format: "json" | 'table') {
  const stopProgress = startProgress();
  const server = createServer(
    tsserverPath,
    true,
    projectRoot,
    tsserverMaxOldSpaceSize
  );

  let seq = 1;

  await server.message({
    seq: seq++,
    type: "request",
    command: "configure",
    arguments: {
      preferences: {
        includePackageJsonAutoImports: "off",
      },
      watchOptions: {
        excludeDirectories: ["**/node_modules"],
      },
    },
  });

  // Open a file
  const start = performance.now();
  const openFilePath = file;
  const updateOpenResponse = await openFiles(server, seq++, [openFilePath]);
  const end = performance.now();
  
  const openTime = end - start;
  const updateGraphTime =
    updateOpenResponse.performanceData.updateGraphDurationMs;

  const { memory } = await getStats(server.pid!);

  const resp = await server.message({
    seq: seq++,
    type: "request",
    command: "projectInfo",
    arguments: {
      file,
      needFileNameList: true,
      needDefaultConfiguredProjectInfo: true,
    },
  });

  const fileCount = resp.body.fileNames.length;
  const stats: Stats = {openTime, updateGraphTime, memory, fileCount};
  stopProgress();
  // write stats data
  if (format === 'json') {
    console.log(stats);
  } else {
    formatTable(stats);
  }
  await server.exitOrKill(1);
}

program
  .argument("<file>", "File to open")
  .option("-p, --project <project>", "Project to open", process.cwd())
  .option(
    "--tsserver-max-old-space-size <tsserver-max-old-space-size>",
    "Max old space size for tsserver",
    "65536"
  )
  .option(
    "--tsserver-path <tsserver-path>",
    "Path to tsserver.js",
    path.join(process.cwd(), "node_modules", "typescript", "lib", "tsserver.js")
  )
  .option("-f, --format <format>", "Style of format of the output", "json")
  .action(file => {
    const options = program.opts<{project: string, tsserverPath: string, tsserverMaxOldSpaceSize: number, format: 'json' | 'table'}>();

    main(
      options.project,
      path.resolve(options.project, file),
      options.tsserverPath,
      options.tsserverMaxOldSpaceSize,
      options.format
    ).catch(e => console.error(e));
  });

program.parse(process.argv);
