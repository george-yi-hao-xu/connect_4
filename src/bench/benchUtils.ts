import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

export interface Summary {
  avg: number;
  p50: number;
  p90: number;
  min: number;
  max: number;
}

export interface RunMetric {
  wallMs: number;
  cpuMs: number;
  heapUsedMb: number;
  rssMb: number;
}

export interface CheckerLog {
  log: string;
  metric: RunMetric;
}

export function summarize(values: number[]): Summary {
  const sorted = [...values].sort((a, b) => a - b);
  const avg = sorted.reduce((total, value) => total + value, 0) / sorted.length;

  return {
    avg,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

export function format_summary(label: string, unit: string, summary: Summary): string {
  return `${label}: avg=${summary.avg.toFixed(1)}${unit} p50=${summary.p50.toFixed(1)}${unit} p90=${summary.p90.toFixed(1)}${unit} min=${summary.min.toFixed(1)}${unit} max=${summary.max.toFixed(1)}${unit}`;
}

export async function checker(label: string, gameFn: () => Promise<unknown> | unknown): Promise<CheckerLog> {
  const cpuStart = process.cpuUsage();
  const start = performance.now();

  await gameFn();

  const wallMs = performance.now() - start;
  const cpu = process.cpuUsage(cpuStart);
  const memory = process.memoryUsage();
  const metric = {
    wallMs,
    cpuMs: (cpu.user + cpu.system) / 1000,
    heapUsedMb: memory.heapUsed / 1024 / 1024,
    rssMb: memory.rss / 1024 / 1024,
  };

  return {
    metric,
    log: `${label}: wall=${metric.wallMs.toFixed(1)}ms cpu=${metric.cpuMs.toFixed(1)}ms heapUsed=${metric.heapUsedMb.toFixed(1)}MB rss=${metric.rssMb.toFixed(1)}MB`,
  };
}

export function write_bench_log(prefix: string, lines: string[]): string {
  mkdirSync('bench-logs', { recursive: true });
  const logPath = join('bench-logs', `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

  writeFileSync(logPath, [...lines, `log=${logPath}`].join('\n') + '\n', 'utf8');
  return logPath;
}
