import type { ScanResult } from "../types.js";

export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatJsonBatch(results: ScanResult[]): string {
  return JSON.stringify(results, null, 2);
}
