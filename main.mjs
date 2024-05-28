import { once } from "events";
import IORedis from "ioredis"
import fastify from "fastify";

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number.parseInt(process.env.PORT ?? 3000);
const PROM_PREFIX = process.env.PROM_PREFIX ?? "bull";
const BULL_PREFIX = process.env.BULL_PREFIX ?? "bull";
const REDIS_DB = process.env.REDIS_DB ?? "0:default";
const REDIS_URI = process.env.REDIS_URI ?? "redis://127.0.0.1:6379"
const app = fastify({ logger: true });

const databases = REDIS_DB.split(",").map((val) => val.split(":"));

const descriptions = {
  [`${PROM_PREFIX}_active_total`]: "Number of jobs in processing",
  [`${PROM_PREFIX}_wait_total`]: "Number of pending jobs",
  [`${PROM_PREFIX}_waiting_children_total`]: "Number of pending children jobs",
  [`${PROM_PREFIX}_prioritized_total`]: "Number of prioritized jobs",
  [`${PROM_PREFIX}_delayed_total`]: "Number of delayed jobs",
  [`${PROM_PREFIX}_failed_total`]: "Number of failed jobs",
  [`${PROM_PREFIX}_completed_total`]: "Number of completed jobs",
};

const redis = new IORedis(REDIS_URI, { maxRetriesPerRequest: null });

app.get("/health", (_, res) => {
  res.code(redis.status === "ready" ? 200 : 503).send();
});

app.get("/metrics", async (_, res) => {
  const metrics = {};

  for (const [index, db] of databases) {
    await redis.select(index);

    const names = [
      "google",
      "google-worker",
      "swarm",
      "swarm-worker",
      "overall",
      "overall-stats-syncer",
      "daily",
      "daily-stats-syncer",
      "finalizer-worker",
    ];
    const multi = redis.multi();

    names.forEach((name) => {
      multi.llen(`${BULL_PREFIX}:${name}:active`);
      multi.llen(`${BULL_PREFIX}:${name}:wait`);
      multi.zcard(`${BULL_PREFIX}:${name}:waiting-children`);
      multi.zcard(`${BULL_PREFIX}:${name}:prioritized`);
      multi.zcard(`${BULL_PREFIX}:${name}:delayed`);
      multi.zcard(`${BULL_PREFIX}:${name}:failed`);
      multi.zcard(`${BULL_PREFIX}:${name}:completed`);
    });

    const results = await multi.exec();

    const offset = 7;

    for (let i = 0; i < results.length / offset; i++) {
      const name = names[i];

      const [
        [, active_total],
        [, wait_total],
        [, waiting_children_total],
        [, prioritized_total],
        [, delayed_total],
        [, failed_total],
        [, completed_total],
      ] = results.slice(i * offset, (i + 1) * offset);

      const data = {
        [`${PROM_PREFIX}_active_total`]: active_total,
        [`${PROM_PREFIX}_wait_total`]: wait_total,
        [`${PROM_PREFIX}_waiting_children_total`]: waiting_children_total,
        [`${PROM_PREFIX}_prioritized_total`]: prioritized_total,
        [`${PROM_PREFIX}_delayed_total`]: delayed_total,
        [`${PROM_PREFIX}_failed_total`]: failed_total,
        [`${PROM_PREFIX}_completed_total`]: completed_total,
      };

      for (const metric in data) {
        const value = data[metric];
        metrics[metric] ??= {};
        metrics[metric][db] ??= {};
        metrics[metric][db][name] ??= value;
      }
    }
  }

  let output = "";

  for (const metric in metrics) {
    let hasData = false;
    for (const db in metrics[metric]) {
      for (const queue in metrics[metric][db]) {
        if (!hasData) {
          output += `# HELP ${metric} ${descriptions[metric]}\n`;
          output += `# TYPE ${metric} gauge\n`;
          hasData = true;
        }
        const value = metrics[metric][db][queue];
        output += `${metric}{queue="${queue}",db="${db}"} ${value}\n`;
      }
    }
    output += "\n";
  }

  res.code(200).header("Content-Type", "text/plain").send(output);
});

process.on("SIGINT", async () => {
  await app.close();
  redis.disconnect(false);
});

await once(redis, "ready");
await app.listen({ host: HOST, port: PORT });
