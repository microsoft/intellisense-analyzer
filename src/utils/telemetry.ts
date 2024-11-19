import pidusage from "pidusage";

export const logMemory = async (pid: number) => {
  const { memory, cpu } = await getStats(pid);

  const b = 1024;
  console.log("*******************");
  console.log(
    `Memory usage for tsserver (PID: ${pid}): ${memory / b / b / b} GB`
  );
  console.log(`CPU usage for tsserver: ${cpu}%`);
  console.log("*******************");
};

export const getStats = async (pid: number) => {
  const data = await pidusage(pid);
  
  return {memory: data.memory, cpu: data.cpu};
}