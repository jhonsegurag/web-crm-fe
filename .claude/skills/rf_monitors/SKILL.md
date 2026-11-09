---
name: rf_monitors
description: "Export Datadog monitor JSON files for the feature `$ARGUMENTS` to `.datadog/` as infrastructure-as-code, pre-filled from the feature's SLO thresholds and metric naming conventions."
disable-model-invocation: true
argument-hint: "[feature]"
---

This command is **read-only on source files** — it only reads specs and context, then writes JSON files to `.datadog/`.

---

## Step 1 — Resolve the feature and read context

Read these files in parallel:

1. Locate the feature spec in this priority order:
   - `ai_reactive_framework/flow/4-done/$ARGUMENTS.md`
   - `ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md`
   - `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md`
   - `ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md`

   If none exist, stop and tell the user:
   "Feature '$ARGUMENTS' not found in any flow phase. Run /rf_to_do $ARGUMENTS first."

2. Read `ai_reactive_framework/context/0-context.md` to extract:
   - The Go module name (e.g. `github.com/your-org/your-service`)
   - Derive `{app_name}` as the last path segment of the module (e.g. `your-service`)

3. Read `ai_reactive_framework/3-observability_layer/metrics/suggested-monitors.md` to load the canonical monitor templates.

---

## Step 2 — Extract SLO thresholds from the spec

From the spec file found in Step 1, read **§10 Non-Functional Requirements**:

| Field to extract | Spec column | Default if missing |
|-----------------|-------------|-------------------|
| Latency p99 threshold (ms) | "Latency (p99)" | `500` |
| Availability target (%) | "Availability" | `99.9` |
| Throughput (rps) | "Throughput" | `500` |

Derive these computed values:
- `latency_threshold_ms` = numeric value extracted from p99 latency (e.g. "< 500 ms" → `500`)
- `latency_warning_ms` = `latency_threshold_ms * 0.8` (rounded to nearest integer)
- `error_rate_critical` = `100 - availability_percent` expressed as a ratio threshold (e.g. 99.9% → `5.0` default critical error rate %)
- `error_rate_warning` = `error_rate_critical * 0.5`

Also extract from the spec frontmatter:
- `priority` from the frontmatter (P0 → Datadog priority `1`, P1 → `2`, P2 → `3`, default `2`)

---

## Step 3 — Build metric name prefix

Using `{app_name}` from Step 1 and `$ARGUMENTS` as the feature name, the metric prefix is:

```
{app_name}.$ARGUMENTS
```

All monitor queries use this prefix. The feature name must be in snake_case (convert hyphens to underscores if present).

---

## Step 4 — Generate 4 monitor JSON files

Create the directory `.datadog/` in the project root if it does not already exist.

Write exactly these 4 files. Use the Datadog v1 Monitor API JSON schema. Fill all placeholder values from Steps 2 and 3.

---

### File 1: `.datadog/monitor-$ARGUMENTS-error-rate.json`

```json
{
  "name": "[{app_name}] [{FEATURE_UPPER}] High Error Rate",
  "type": "metric alert",
  "query": "sum(last_5m):sum:{app_name}.$ARGUMENTS.http.errors_total{*}.as_count() / sum:{app_name}.$ARGUMENTS.http.requests_total{*}.as_count() * 100 > {error_rate_critical}",
  "message": "## High Error Rate — $ARGUMENTS\n\nError rate exceeded **{{threshold}}%** over the last 5 minutes (current: **{{value}}%**).\n\n**Feature:** $ARGUMENTS\n**Service:** {app_name}\n\n### Immediate Actions\n1. Check recent deployments: `<your-deploy-tool> list`\n2. Review error logs for `feature=$ARGUMENTS`\n3. Check upstream dependency health\n\n@pagerduty-your-team",
  "tags": [
    "feature:$ARGUMENTS",
    "service:{app_name}",
    "team:your-team",
    "severity:high",
    "managed-by:ai-reactive-framework"
  ],
  "priority": {priority},
  "options": {
    "thresholds": {
      "critical": {error_rate_critical},
      "warning": {error_rate_warning}
    },
    "notify_no_data": false,
    "require_full_window": false,
    "evaluation_delay": 60,
    "renotify_interval": 30,
    "escalation_message": "Error rate for $ARGUMENTS is still elevated. Escalating.",
    "include_tags": true,
    "new_host_delay": 300
  }
}
```

---

### File 2: `.datadog/monitor-$ARGUMENTS-latency-p99.json`

```json
{
  "name": "[{app_name}] [{FEATURE_UPPER}] High P99 Latency",
  "type": "metric alert",
  "query": "p99(last_5m):avg:{app_name}.$ARGUMENTS.http.latency_ms{*} > {latency_threshold_ms}",
  "message": "## High P99 Latency — $ARGUMENTS\n\nP99 latency exceeded **{{threshold}}ms** (SLO target) over the last 5 minutes (current: **{{value}}ms**).\n\n**Feature:** $ARGUMENTS\n**Service:** {app_name}\n**SLO target:** {latency_threshold_ms}ms\n\n### Immediate Actions\n1. Check repository latency: `{app_name}.$ARGUMENTS.repository.latency_ms`\n2. Review upstream service response times\n3. Check for N+1 query patterns or missing cache hits\n\n@pagerduty-your-team",
  "tags": [
    "feature:$ARGUMENTS",
    "service:{app_name}",
    "team:your-team",
    "severity:high",
    "managed-by:ai-reactive-framework"
  ],
  "priority": {priority},
  "options": {
    "thresholds": {
      "critical": {latency_threshold_ms},
      "warning": {latency_warning_ms}
    },
    "notify_no_data": false,
    "require_full_window": false,
    "evaluation_delay": 60,
    "renotify_interval": 30,
    "include_tags": true,
    "new_host_delay": 300
  }
}
```

---

### File 3: `.datadog/monitor-$ARGUMENTS-no-traffic.json`

```json
{
  "name": "[{app_name}] [{FEATURE_UPPER}] No Traffic Detected",
  "type": "metric alert",
  "query": "sum(last_10m):sum:{app_name}.$ARGUMENTS.http.requests_total{*}.as_count() < 1",
  "message": "## No Traffic Detected — $ARGUMENTS\n\nNo HTTP requests received for **$ARGUMENTS** in the last 10 minutes.\n\n**Feature:** $ARGUMENTS\n**Service:** {app_name}\n\nThis may indicate:\n- A deployment failure or rollback\n- Upstream routing misconfiguration\n- The feature endpoint is unreachable\n- Traffic was intentionally shifted (verify before escalating)\n\n### Immediate Actions\n1. Verify the service is running: `<your-platform> status {app_name}`\n2. Check load balancer routing rules\n3. Review recent deployments\n\n@slack-your-team-alerts",
  "tags": [
    "feature:$ARGUMENTS",
    "service:{app_name}",
    "team:your-team",
    "severity:warning",
    "managed-by:ai-reactive-framework"
  ],
  "priority": 3,
  "options": {
    "thresholds": {
      "critical": 1
    },
    "notify_no_data": true,
    "no_data_timeframe": 15,
    "require_full_window": false,
    "evaluation_delay": 120,
    "renotify_interval": 60,
    "include_tags": true,
    "new_host_delay": 300
  }
}
```

---

### File 4: `.datadog/monitor-$ARGUMENTS-repository-errors.json`

```json
{
  "name": "[{app_name}] [{FEATURE_UPPER}] Repository Error Spike",
  "type": "metric alert",
  "query": "sum(last_5m):sum:{app_name}.$ARGUMENTS.repository.errors_total{*}.as_count() > 10",
  "message": "## Repository Error Spike — $ARGUMENTS\n\nRepository error count for **$ARGUMENTS** exceeded **{{threshold}}** in the last 5 minutes (current: **{{value}}**).\n\n**Feature:** $ARGUMENTS\n**Service:** {app_name}\n\nRepository errors are typically caused by:\n- Downstream service unavailability\n- Network timeouts or connection pool exhaustion\n- Invalid credentials or expired tokens\n- Data consistency issues\n\n### Immediate Actions\n1. Check the downstream service health for `$ARGUMENTS`\n2. Review error types via `error_type` tag in logs\n3. Check circuit breaker state if configured\n4. Validate secrets rotation has not expired\n\n@pagerduty-your-team",
  "tags": [
    "feature:$ARGUMENTS",
    "service:{app_name}",
    "team:your-team",
    "severity:critical",
    "managed-by:ai-reactive-framework"
  ],
  "priority": {priority},
  "options": {
    "thresholds": {
      "critical": 10,
      "warning": 5
    },
    "notify_no_data": false,
    "require_full_window": false,
    "evaluation_delay": 60,
    "renotify_interval": 15,
    "escalation_message": "Repository errors for $ARGUMENTS are still spiking. Check downstream services immediately.",
    "include_tags": true,
    "new_host_delay": 300
  }
}
```

---

## Step 5 — Substitute all placeholders

Before writing each file, replace every placeholder with real values:

| Placeholder | Replace with |
|------------|-------------|
| `{app_name}` | Actual app name derived from module (e.g. `your-service`) |
| `{FEATURE_UPPER}` | `$ARGUMENTS` in UPPER_SNAKE_CASE (e.g. `get_configurations` → `GET_CONFIGURATIONS`) |
| `{error_rate_critical}` | Computed critical error rate threshold (numeric, e.g. `5.0`) |
| `{error_rate_warning}` | Computed warning error rate threshold (numeric, e.g. `2.5`) |
| `{latency_threshold_ms}` | Extracted p99 latency threshold (integer ms, e.g. `500`) |
| `{latency_warning_ms}` | 80% of latency_threshold_ms (integer, e.g. `400`) |
| `{priority}` | Integer 1–3 from spec priority (P0→1, P1→2, P2→3) |

The resulting JSON files must be **valid JSON** with no template placeholders remaining.

---

## Step 6 — Write a README index

Write `.datadog/README-$ARGUMENTS.md` with this structure:

```markdown
# Datadog Monitors — $ARGUMENTS

Generated by `/rf_monitors` on <today's date>.
Service: {app_name} | Feature: $ARGUMENTS | Priority: P{X}

## Monitors

| File | Alert Type | Threshold | Severity |
|------|-----------|-----------|----------|
| `monitor-$ARGUMENTS-error-rate.json` | High Error Rate | > {error_rate_critical}% over 5m | high |
| `monitor-$ARGUMENTS-latency-p99.json` | P99 Latency | > {latency_threshold_ms}ms over 5m | high |
| `monitor-$ARGUMENTS-no-traffic.json` | No Traffic | < 1 req over 10m | warning |
| `monitor-$ARGUMENTS-repository-errors.json` | Repository Errors | > 10 errors over 5m | critical |

## SLO Reference (from spec §10)

| SLI | Target | Monitor |
|-----|--------|---------|
| Availability | ≥ {availability_percent}% | error-rate monitor |
| Latency p99 | ≤ {latency_threshold_ms}ms | latency-p99 monitor |
| Repository success | ≥ 99.5% | repository-errors monitor |

## Import Instructions

### Datadog Terraform (recommended)
```hcl
resource "datadog_monitor" "$ARGUMENTS_error_rate" {
  name    = jsondecode(file(".datadog/monitor-$ARGUMENTS-error-rate.json"))["name"]
  type    = jsondecode(file(".datadog/monitor-$ARGUMENTS-error-rate.json"))["type"]
  query   = jsondecode(file(".datadog/monitor-$ARGUMENTS-error-rate.json"))["query"]
  message = jsondecode(file(".datadog/monitor-$ARGUMENTS-error-rate.json"))["message"]
}
```

### Datadog API (curl)
```bash
# Import all monitors for this feature
for f in .datadog/monitor-$ARGUMENTS-*.json; do
  curl -s -X POST "https://api.datadoghq.com/api/v1/monitor" \
    -H "DD-API-KEY: ${DD_API_KEY}" \
    -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$f" | jq '.id'
done
```

### Your platform's monitors CLI (if available)
```bash
<your-platform> monitors import .datadog/monitor-$ARGUMENTS-*.json
```

## Tuning Guide

- **Error rate threshold**: Adjust `options.thresholds.critical` in `monitor-$ARGUMENTS-error-rate.json` if the feature has a different SLO.
- **Latency threshold**: Edit `options.thresholds.critical` in `monitor-$ARGUMENTS-latency-p99.json` to match the p99 target from spec §10.
- **Repository errors**: Change the `> 10` threshold in `monitor-$ARGUMENTS-repository-errors.json` based on expected baseline error volume.
- **Notification routing**: Replace `@pagerduty-your-team` and `@slack-your-team-alerts` with the actual handles for your team.
```

---

## Step 7 — Confirm

Print this summary to the user:

```
✓ Datadog monitors exported: $ARGUMENTS

  Files written:
  .datadog/monitor-$ARGUMENTS-error-rate.json         [metric alert · P{X}]
  .datadog/monitor-$ARGUMENTS-latency-p99.json        [metric alert · P{X}]
  .datadog/monitor-$ARGUMENTS-no-traffic.json         [metric alert · P3]
  .datadog/monitor-$ARGUMENTS-repository-errors.json  [metric alert · P{X}]
  .datadog/README-$ARGUMENTS.md

  Thresholds applied (from spec §10):
  Error rate critical  : > {error_rate_critical}%
  Latency p99 critical : > {latency_threshold_ms}ms
  Latency p99 warning  : > {latency_warning_ms}ms
  Repository errors    : > 10 in 5m

  App prefix: {app_name}.$ARGUMENTS.*

  To import via Datadog API, see: .datadog/README-$ARGUMENTS.md
  To tune thresholds, edit the JSON files directly and re-import.
```
