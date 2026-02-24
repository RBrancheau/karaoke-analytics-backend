import { percentile, median } from "./stats";
import { detectChurnSpikes } from "./churnDetection";

export function computeSessionMetrics_v1_0(session: any, events: any[]) {
  const schema_version = "1.0";
  const bin_minutes = 5;

  const joins = events.filter(e => e.type === "JOIN");
  const completed = events.filter(e => e.type === "SINGING");
  const drops = events.filter(e =>
    ["NO_SHOW", "TIMEOUT_90", "MANUAL_REMOVE"].includes(e.type)
  );

  const waitTimes: number[] = [];

  completed.forEach(c => {
    const join = joins.find(j => j.userId === c.userId);
    if (join) {
      waitTimes.push((c.timestamp - join.timestamp) / 1000);
    }
  });

  const durationSeconds = (session.ended_at - session.started_at) / 1000;
  const durationHours = durationSeconds / 3600;

  const dropTimestamps = drops.map(d => d.timestamp);

  return {
    session_id: session.id,
    venue_id: session.venue_id,
    dj_id: session.dj_id,

    started_at: session.started_at,
    ended_at: session.ended_at,
    duration_seconds: durationSeconds,

    total_joins: joins.length,
    unique_singers: new Set(joins.map(j => j.userId)).size,
    completed_performances: completed.length,
    no_shows: events.filter(e => e.type === "NO_SHOW").length,
    timeout_drops_90s: events.filter(e => e.type === "TIMEOUT_90").length,
    manual_removals: events.filter(e => e.type === "MANUAL_REMOVE").length,

    completion_rate: completed.length / joins.length || 0,
    drop_rate: drops.length / joins.length || 0,

    avg_wait_seconds: waitTimes.length ? waitTimes.reduce((a,b)=>a+b,0)/waitTimes.length : 0,
    median_wait_seconds: median(waitTimes),
    p90_wait_seconds: percentile(waitTimes, 0.9),

    peak_queue_depth: 0,
    avg_queue_depth: 0,

    queue_turnover_rate: durationHours ? completed.length / durationHours : 0,

    churn_spike_windows: detectChurnSpikes(
      dropTimestamps,
      session.started_at,
      session.ended_at,
      bin_minutes
    ),

    schema_version,
    bin_minutes,
    spike_threshold_sigma: 2
  };
}