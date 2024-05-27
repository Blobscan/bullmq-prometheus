# bullmq-prometheus

Prometheus metrics exporter for Blobscan bullmq queues

<p align="center">
  <img src="./media/splash.png" width="400" />
<p>

## Start

```bash
docker run -it -p 3000:3000 -e REDIS_URI=redis://127.0.0.1:6379 blossomlabs/bullmq-prometheus
```

## Environments

- `HOST` - HTTP server host (default: 0.0.0.0)
- `PORT` - HTTP server port (default: 3000)
- `PROM_PREFIX` - Prometheus metric prefix (default: bull)
- `BULL_PREFIX` - BullMQ prefix (default: bull)
- `REDIS_URI` - Redis URI (default: redis://127.0.0.1:6379)
- `REDIS_DB` - Redis databases (comma separated list of colon separated tuples `index:alias`) (default: `0:default`)
  - For example `0:staging,1:mainnet,2:sepolia`, the alias will be used as a label

## Endpoints

- `/metrics` - Prometheus metrics
  - `HTTP 200` - Metrics per queue
    - `active_total` - Number of jobs in processing
    - `wait_total` - Number of pending jobs
    - `waiting_children_total` - Number of pending children jobs
    - `prioritized_total` - Number of prioritized jobs
    - `delayed_total` - Number of delayed jobs
    - `failed_total` - Number of failed jobs
    - `completed_total` - Number of completed jobs (last 1 minute)
- `/health` - Health endpoint
  - `HTTP 200` - Redis is available
  - `HTTP 503` - Redis is unavailable

## Example

```
# HELP bull_active_total Number of jobs in processing
# TYPE bull_active_total gauge
bull_active_total{queue="overall-stats-syncer",db="sepolia"} 0
bull_active_total{queue="google-worker",db="sepolia"} 0
bull_active_total{queue="overall",db="sepolia"} 0
bull_active_total{queue="finalizer-worker",db="sepolia"} 0
bull_active_total{queue="daily",db="sepolia"} 0
bull_active_total{queue="daily-stats-syncer",db="sepolia"} 0

# HELP bull_wait_total Number of pending jobs
# TYPE bull_wait_total gauge
bull_wait_total{queue="overall-stats-syncer",db="sepolia"} 0
bull_wait_total{queue="google-worker",db="sepolia"} 0
bull_wait_total{queue="overall",db="sepolia"} 0
bull_wait_total{queue="finalizer-worker",db="sepolia"} 0
bull_wait_total{queue="daily",db="sepolia"} 0
bull_wait_total{queue="daily-stats-syncer",db="sepolia"} 0

# HELP bull_waiting_children_total Number of pending children jobs
# TYPE bull_waiting_children_total gauge
bull_waiting_children_total{queue="overall-stats-syncer",db="sepolia"} 0
bull_waiting_children_total{queue="google-worker",db="sepolia"} 0
bull_waiting_children_total{queue="overall",db="sepolia"} 0
bull_waiting_children_total{queue="finalizer-worker",db="sepolia"} 20
bull_waiting_children_total{queue="daily",db="sepolia"} 0
bull_waiting_children_total{queue="daily-stats-syncer",db="sepolia"} 0

# HELP bull_prioritized_total Number of prioritized jobs
# TYPE bull_prioritized_total gauge
bull_prioritized_total{queue="overall-stats-syncer",db="sepolia"} 0
bull_prioritized_total{queue="google-worker",db="sepolia"} 0
bull_prioritized_total{queue="overall",db="sepolia"} 0
bull_prioritized_total{queue="finalizer-worker",db="sepolia"} 0
bull_prioritized_total{queue="daily",db="sepolia"} 0
bull_prioritized_total{queue="daily-stats-syncer",db="sepolia"} 0

# HELP bull_delayed_total Number of delayed jobs
# TYPE bull_delayed_total gauge
bull_delayed_total{queue="overall-stats-syncer",db="sepolia"} 0
bull_delayed_total{queue="google-worker",db="sepolia"} 0
bull_delayed_total{queue="overall",db="sepolia"} 1
bull_delayed_total{queue="finalizer-worker",db="sepolia"} 0
bull_delayed_total{queue="daily",db="sepolia"} 1
bull_delayed_total{queue="daily-stats-syncer",db="sepolia"} 0

# HELP bull_failed_total Number of failed jobs
# TYPE bull_failed_total gauge
bull_failed_total{queue="overall-stats-syncer",db="sepolia"} 1
bull_failed_total{queue="google-worker",db="sepolia"} 0
bull_failed_total{queue="overall",db="sepolia"} 0
bull_failed_total{queue="finalizer-worker",db="sepolia"} 0
bull_failed_total{queue="daily",db="sepolia"} 0
bull_failed_total{queue="daily-stats-syncer",db="sepolia"} 21

# HELP bull_completed_total Number of completed jobs
# TYPE bull_completed_total gauge
bull_completed_total{queue="overall-stats-syncer",db="sepolia"} 5276
bull_completed_total{queue="google-worker",db="sepolia"} 19092
bull_completed_total{queue="overall",db="sepolia"} 1949
bull_completed_total{queue="finalizer-worker",db="sepolia"} 19092
bull_completed_total{queue="daily",db="sepolia"} 487
bull_completed_total{queue="daily-stats-syncer",db="sepolia"} 1299
```
