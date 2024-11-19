import { Worker } from "worker_threads";
import path from "path";
import fs from "fs";

function runWorker(filePath: string) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "worker.mjs"), {
      workerData: { filePath },
    });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

async function workerPool(files: string[], poolSize: number) {
  let activeWorkers = 0;
  let idx = 0;

  async function startNextWorker(): Promise<void> {
    if (idx < files.length) {
      const file = files[idx++];
      activeWorkers++;
      return runWorker(file).then(() => {
        activeWorkers--;
        return startNextWorker();
      });
    }
  }

  const pool: any[] = [];
  for (let i = 0; i < poolSize; i++) {
    pool.push(startNextWorker());
  }

  return Promise.all(pool);
}

const files = JSON.parse(
  fs.readFileSync(`${process.cwd()}/packageJsonFiles.json`, {encoding: 'utf8'})
);

const ten = 10;
workerPool(files, ten).then(() => console.log("All tasks completed"));
