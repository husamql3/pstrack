# Runtime hardening measurements

Issue [#291](https://github.com/husamql3/pstrack/issues/291) requires measured
resource limits. Limits must be based on both steady-state production samples
and controlled staging load; a quiet production snapshot is not a peak.

## Capture a sanitized steady-state window

The operator SSH alias `pstrack` must already be configured. The command reads
Docker metadata and stats only; it does not read container environments, logs,
mount contents, hostnames, addresses, or container IDs.

```bash
bun run ops:measure-resources
```

Defaults: 12 samples, five seconds between samples. Override the bounded run
for a longer observation window when needed:

```bash
RESOURCE_SAMPLE_COUNT=60 RESOURCE_SAMPLE_INTERVAL_MS=10000 \
  bun run ops:measure-resources
```

The ignored `resource-measurement-evidence.json` contains host CPU/memory
capacity and average/maximum CPU, memory, and PID use grouped into `app`,
`database`, `mail`, `backup`, service-level Coolify categories, a
`coolify-total` reserve, and `other`. Runtime names and images
are used only in memory for categorization and never enter the evidence file.

## Before choosing or applying limits

1. Capture several steady-state windows, including an hourly backup and normal
   mail/job activity.
2. Repeat the same measurement during the #287 staging stress suite and a
   synthetic backup/restore drill.
3. Choose service-specific headroom from the observed peaks while reserving
   host capacity for Coolify, the proxy, and recovery operations.
4. Apply one service at a time in staging. Verify health, latency, restart/OOM
   behavior, scheduled jobs, mail, backup creation, and isolated restore.
5. Promote only after rollback settings and pre-change evidence are recorded.

Do not infer a safe production limit from a single quiet window.
