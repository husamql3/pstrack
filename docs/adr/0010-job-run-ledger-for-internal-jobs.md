# Job run ledger for internal jobs

PStrack records internal job executions in a durable `JobRun` ledger.

After the VPS migration, Trigger.dev Cloud dispatches authenticated HTTP requests to PStrack internal job endpoints. Those requests may be retried by Trigger.dev, so each job execution needs a durable idempotency boundary and an operational audit trail.

`JobRun` records the job name, idempotency key, status, timestamps, non-sensitive summary data, and failure message. Domain-level constraints still protect business invariants, but the job run ledger answers operational questions such as whether the midnight assignment ran, whether a retry reused the same execution key, and what summary the job produced.

Successful and failed records are retained for one month, then removed by the
monthly purge job. A failed run can be retried with the same key; a running run
can only be reclaimed after its 15-minute lease becomes stale.
