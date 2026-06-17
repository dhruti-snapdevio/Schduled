import { QueuesClient } from "@/components/orbit/queues-client";
import { getQueueSummary } from "@/lib/worker/queue-inspection";

export const metadata = { title: "Queues" };

export default async function OrbitQueuesPage() {
  const queues = await getQueueSummary();
  const fetchedAt = new Date().toISOString();

  return <QueuesClient queues={queues} fetchedAt={fetchedAt} />;
}
