import { Stats } from "../types/stats";

export const formatTable = (stats: Stats) => {
  const b = 1024;
  console.log('─────────────────────────────────────');
  console.log('Open time:', stats.openTime);
  console.log('Update graph time:', stats.updateGraphTime);
  console.log('Memory', `${stats.memory / b / b / b}GB`);
  console.log('File count', stats.fileCount);
  console.log('─────────────────────────────────────')
}

export function startProgress() {
  const spinnerFrames = ['-', '\\', '|', '/']; // Frames for the spinner
  let frameIndex = 0;
  const spinner = setInterval(() => {
    // Clear the current line in the terminal
    process.stdout.write('\r' + spinnerFrames[frameIndex]); // Write the current spinner frame
    frameIndex = (frameIndex + 1) % spinnerFrames.length;   // Move to the next frame
  }, 100); // Update spinner every 100ms

  return () => {
    process.stdout.write('\r')
    clearInterval(spinner)
  }
}
