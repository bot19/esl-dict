import flatCache from "flat-cache";
import { Cache } from "flat-cache";
import { Logger } from "./Logger";
import path, { join } from "path";
import { get, isEmpty, values } from "lodash";
import { costReport } from "./costReport";
import logData from "./logData";
import { existsSync, rmSync } from "fs";
import { prettyPrint } from "./prettyPrint";
import { ModelId } from "./types";

export const cacheDir = path.resolve(path.join(".", "cache", "atomic"));

interface Tokens {
  in: number;
  out: number;
}

interface Config {
  parallel: boolean;
  dryRun: boolean;
  debugMode: boolean;
}

export class Context {
  logger: Logger = new Logger(this);
  path: string[] = [];
  tokens: Partial<Record<ModelId, Tokens>> = {};
  config: Config;
  analytics: Record<string, string | number> = {};

  private caches: Record<string, Cache> = {};
  private shuttingDown = false;

  constructor(config: Partial<Config>, path?: string[]) {
    if (path) this.path = path;

    this.config = {
      debugMode: false,
      dryRun: false,
      parallel: true,
      ...config,
    };
  }

  get parallel() {
    return this.config.parallel;
  }

  get dryRun() {
    return this.config.dryRun;
  }

  get debugMode() {
    return this.config.debugMode;
  }

  static async start(ctx: Context, fn: () => Promise<void>) {
    const logFilePath = path.join(__dirname, "../logs.txt");
    if (existsSync(logFilePath)) rmSync(logFilePath);

    try {
      await fn();
    } catch (err) {
      ctx.logger.err(`FATAL ERROR ${err}`);
      logData({ type: "FATAL", trace: get(err, "stack") }, "fatal-error");
      ctx.costReport();
      ctx.abort();
    }

    ctx.analyticsPrint();
    ctx.costReport();
    ctx.pruneCaches();
    ctx.done();
  }

  logTokens(model: ModelId, tokensIn = 0, tokensOut = 0) {
    const tokens = this.getModelTokens(model);
    tokens.in += tokensIn;
    tokens.out += tokensOut;
  }

  private getModelTokens(model: ModelId) {
    if (!this.tokens[model]) this.tokens[model] = { in: 0, out: 0 };
    return this.tokens[model];
  }

  step(breadcrumb: string) {
    // Things that need to stay the same.
    const newContext = new Context(this.config);
    newContext.tokens = this.tokens;
    newContext.caches = this.caches;

    // Things that need updating.
    newContext.path = [...this.path, breadcrumb];
    return newContext;
  }

  done() {
    console.log("Done! ✨");
    process.exit(0);
  }

  abort() {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.costReport();
    console.log("Aborted. 💥");
    process.exit();
  }

  listenForSignals() {
    process.on("SIGINT", () => this.abort());
    process.on("SIGTERM", () => this.abort());
  }

  getCache(id: string) {
    return this.caches[id] || this.loadCache(id);
  }

  private loadCache(id: string) {
    const cache = flatCache.load(id, join(cacheDir));

    this.caches[id] = cache;
    return cache;
  }

  costReport(multiplier?: number) {
    const report = { tokens: this.tokens, cost: costReport(this, multiplier) };
    logData(report, "cost-report");
    console.log(report);
  }

  pruneCaches() {
    this.logger.log("pruning caches");
    values(this.caches).forEach((c) => c.save());
  }

  analyticsLogIncrement(key: string) {
    if (typeof this.analytics[key] !== "number") throw Error();
    if (this.analytics[key] === undefined) this.analytics[key] = 0;
    this.analytics[key] += 1;
  }

  analyticsPrint() {
    if (isEmpty(this.analytics)) return;
    this.logger.headline("analytics");
    prettyPrint(this.analytics);
  }
}
