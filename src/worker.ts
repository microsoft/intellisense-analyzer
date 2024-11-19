import { parentPort, workerData } from "worker_threads";
import { promises as fs, existsSync } from "fs";
import { launch } from "./scenarios/launch.js";
import path from "path";

// Destructure the workerData (filePath and value)
const { filePath } = workerData;

const outputFile = path.join(process.cwd(), "tsserver-stats.txt");
// Function to append the value to the file
async function appendToFile(value: string) {
  try {
    await fs.appendFile(outputFile, `${value}\n`, "utf8");
    // await fs.appendFile(outputFile, `${value}\n`, "utf8");
    // Notify the main thread that the work is done
    parentPort?.postMessage("File updated");
  } catch (error: any) {
    parentPort?.postMessage(`Error: ${error.message}`);
  }
}

async function readJsonFile(filePath: string) {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function run() {
  const inputPackageJson = await readJsonFile(filePath);
  const name = inputPackageJson.name;
  const main = inputPackageJson.main;
  if (!name && parentPort) {
    const err = `Error: No package.json found at ${filePath}`
    console.error(err);
    parentPort.postMessage(`Error: ${err}`);
    return;
  }

  const mainPath: string = filePath.replace("package.json", main);
  if (existsSync(mainPath)) {
    // TODO: Pass in real values 
    const projectRoot = process.cwd();
    const tsserverPath = '';
    const tsserverMaxOldSpaceSize = 65536;
    // launch ts server with the main file
    const memDur = await launch(projectRoot, mainPath, tsserverPath, tsserverMaxOldSpaceSize);
    
    const stats = {...memDur, name, filePath: mainPath}
    // log metrics to file
    console.log("Stats: ", stats);
    await appendToFile(JSON.stringify(stats));
    parentPort?.postMessage("File updated");
  } else {
    parentPort?.postMessage(`Error: No main file found at ${mainPath}`);
  }
}

// Execute the function
run();
