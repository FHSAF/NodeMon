// src/cpu-worker.js
import { parentPort } from 'worker_threads';
import os from 'os';

// Function to get CPU times for calculation
const getCpuTimes = () => {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    }
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
};

const startUsage = getCpuTimes();

// The worker will continuously calculate and post the result
setInterval(() => {
    const endUsage = getCpuTimes();
    const idleDifference = endUsage.idle - startUsage.idle;
    const totalDifference = endUsage.total - startUsage.total;

    // Calculate the percentage of time the CPU was not idle
    const percentage = 100 - Math.floor(100 * idleDifference / totalDifference);

    parentPort.postMessage({ cpu: percentage });
}, 1000); // Calculate every second