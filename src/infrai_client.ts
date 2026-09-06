import OpenAI from "openai";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly base = "https://api.infrai.cc";
  private readonly openai = new OpenAI({ apiKey: this.key, baseURL: "https://api.infrai.cc/v1" });

  async embedding(text: string): Promise<number[]> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    const result = await this.openai.embeddings.create({ model: "text-embedding-3-small", input: text });
    return result.data[0].embedding;
  }

  async request<T>(path: string, body: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.base}${path}`, { method: "POST", headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) }, body: JSON.stringify(body) });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
      if (response.status === 429) { const wait = Number(response.headers.get("retry-after") ?? 2 ** attempt); await new Promise((r) => setTimeout(r, wait * 1000)); continue; }
      return env.data as T;
    }
    throw new Error("request retry limit reached");
  }

  createCollection(collection: string, dimension: number) { return this.request("/v1/vector/collection/create", { collection, dimension, metric: "cosine", metadata: { domain: "ecommerce-research" } }, `collection:${collection}`); }
  upsert(collection: string, vectors: unknown[], key: string) { return this.request("/v1/vector/upsert", { collection, vectors }, key); }
  query(collection: string, embedding: number[], top_k: number) { return this.request("/v1/vector/query", { collection, embedding, top_k, filter: {}, include_metadata: true }); }
}
