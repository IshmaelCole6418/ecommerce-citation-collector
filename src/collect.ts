import { z } from "zod";
import { dedupeCitations, type Citation } from "./citation.ts";
import { InfraiClient } from "./infrai_client.ts";

const Request = z.object({ orderId: z.string().min(1), stage: z.enum(["checkout", "fulfillment", "receipt", "update"]), note: z.string().min(1), citations: z.array(z.object({ id: z.string(), title: z.string(), url: z.string().url(), note: z.string() })) });

export async function collect(input: unknown) {
  const request = Request.parse(input);
  const citations = dedupeCitations(request.citations as Citation[]);
  const client = new InfraiClient();
  const embedding = await client.embedding(request.note);
  const collection = "ecommerce-research-citations";
  await client.createCollection(collection, embedding.length);
  await client.upsert(collection, citations.map((c) => ({ id: c.id, vector: embedding, metadata: c })), `order:${request.orderId}:${request.stage}`);
  await client.query(collection, embedding, citations.length);
  return { orderId: request.orderId, stage: request.stage, citations };
}

if (import.meta.url === `file://${process.argv[1]}`) collect(JSON.parse(process.argv[2] ?? "{}" )).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
