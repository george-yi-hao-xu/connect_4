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
  wall_ms: number;
  cpu_ms: number;
  heap_used_mb: number;
  rss_mb: number;
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
  const cpu_start = process.cpuUsage();
  const start = performance.now();

  await gameFn();

  const wall_ms = performance.now() - start;
  const cpu = process.cpuUsage(cpu_start);
  const memory = process.memoryUsage();
  const metric = {
    wall_ms,
    cpu_ms: (cpu.user + cpu.system) / 1000,
    heap_used_mb: memory.heapUsed / 1024 / 1024,
    rss_mb: memory.rss / 1024 / 1024,
  };

  return {
    metric,
    log: `${label}: wall=${metric.wall_ms.toFixed(1)}ms cpu=${metric.cpu_ms.toFixed(1)}ms heap_used=${metric.heap_used_mb.toFixed(1)}MB rss=${metric.rss_mb.toFixed(1)}MB`,
  };
}

export function write_bench_log(prefix: string, lines: string[]): string {
  mkdirSync('bench-logs', { recursive: true });
  const log_path = join('bench-logs', `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

  writeFileSync(log_path, [...lines, `log=${log_path}`].join('\n') + '\n', 'utf8');
  return log_path;
}
