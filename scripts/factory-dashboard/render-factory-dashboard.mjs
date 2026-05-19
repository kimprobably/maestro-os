#!/usr/bin/env node

import {
  buildFactoryDashboard,
  discoverReportArtifacts,
  displayLocalPath,
  readJsonFile,
  readDefaultRunLedgerEvents,
  readRunLedgerSource,
  renderFactoryDashboard,
  writeTextFile,
} from "./dashboard-lib.mjs";

function parseArgs(argv) {
  const args = {
    evalIndex: "reports/eval-index.json",
    reportsRoot: "reports",
    runLedger: null,
    out: "reports/factory-dashboard.md",
    jsonOut: "reports/factory-health.json",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new Error(`unknown argument ${arg}`);
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value`);

    if (key === "eval-index") args.evalIndex = value;
    else if (key === "reports-root") args.reportsRoot = value;
    else if (key === "run-ledger") args.runLedger = value;
    else if (key === "json-out") args.jsonOut = value;
    else if (key === "out") args.out = value;
    else throw new Error(`unknown argument ${arg}`);

    index += 1;
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const evalIndex = readJsonFile(args.evalIndex, null);
  const artifacts = discoverReportArtifacts(args.reportsRoot);
  const ledger = args.runLedger
    ? { source: args.runLedger, ...readRunLedgerSource(args.runLedger) }
    : readDefaultRunLedgerEvents();
  const dashboard = buildFactoryDashboard({
    evalIndex,
    artifacts,
    ledgerEvents: ledger.events,
    ledgerIssues: ledger.issues,
    sources: {
      eval_index: args.evalIndex,
      reports_root: args.reportsRoot,
      run_ledger: displayLocalPath(ledger.source),
    },
  });

  writeTextFile(args.out, renderFactoryDashboard(dashboard));
  if (args.jsonOut) writeTextFile(args.jsonOut, `${JSON.stringify(dashboard, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
