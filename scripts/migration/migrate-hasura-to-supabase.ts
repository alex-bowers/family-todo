import fs from "node:fs/promises";
import path from "node:path";

interface MigrationRunSummary {
  startedAt: string;
  finishedAt?: string;
  status: "pending" | "running" | "succeeded" | "failed";
  dryRun: boolean;
  rowsRead: number;
  rowsWritten: number;
  notes: string[];
}

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const outputDir = getArg("--output") ?? "test-results/migration";
  const startedAt = new Date().toISOString();

  const summary: MigrationRunSummary = {
    startedAt,
    status: "running",
    dryRun,
    rowsRead: 0,
    rowsWritten: 0,
    notes: [
      "Skeleton migration runner created. Implement source and target adapters before cutover.",
    ],
  };

  try {
    const outputPath = path.resolve(
      outputDir,
      `migration-run-${Date.now()}.json`,
    );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    summary.status = "succeeded";
    summary.finishedAt = new Date().toISOString();
    await fs.writeFile(outputPath, JSON.stringify(summary, null, 2), "utf-8");
    console.info(`Migration summary written: ${outputPath}`);
  } catch (error) {
    summary.status = "failed";
    summary.finishedAt = new Date().toISOString();
    console.error("Migration runner failed", error);
    process.exitCode = 1;
  }
}

void main();
