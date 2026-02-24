import { computeSessionMetrics_v1_0 } from "../lib/computeSessionMetrics_v1_0";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { session, events } = await req.json();
  const metrics = computeSessionMetrics_v1_0(session, events);

  return new Response(JSON.stringify(metrics), {
    headers: { "Content-Type": "application/json" }
  });
}