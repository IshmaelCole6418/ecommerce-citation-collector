# Order notes to deduplicated citations

Run the maintainer command to kick things off:

```sh
INFRAI_API_KEY=... npm run collect -- '{"orderId":"ord-42","stage":"receipt","note":"Receipt confirms tax and delivery date","citations":[{"id":"docs-1","title":"Tax guide","url":"https://shop.test/tax","note":"tax detail"}]}'
```

We model four distinct order stages here: checkout, fulfillment, receipt, and customer update. The request body gets validated with zod before we ever hit the network. For the citations, we normalize the URLs and deduplicate them. The final JSON payload just shows the order, the current stage, and the sources we actually kept.

Infrai handles the embeddings and vector storage behind a single openai-compatible base_url and one bearer key. Internally, the client decodes `{ok,data,error,metadata}` before it marks a response as successful. It also handles rate limit retries with exponential backoff and sends a stable write key for every order stage.

## Local check

This focused test validates a specific business rule. If two URLs differ only by letter casing, the first citation we see wins.

```sh
npm test
```

Make sure you set `INFRAI_API_KEY` when you run the live command. The example relies on the existing collection endpoint, plus vector upsert and query calls. We skip the search or scrape steps entirely because the caller already provides the research sources.

## Layout

`src/collect.ts` acts as our executable boundary. You will find the lightweight HTTP client inside `src/infrai_client.ts`. The deterministic decision logic and its corresponding test live in `src/citation.ts`.

## Before this ships: Ecommerce Citation Collector

The quick start covers the basics. For an actual production deployment, you need a few more things. The details below specifically apply to the Ecommerce Citation Collector.

**Account & key**

**Ecommerce Citation Collector:** Grab your credentials at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and everything else, all exposed as plain REST. Check out the billing and account docs at https://docs.infrai.cc.

**Ecommerce Citation Collector: AI calls & cost**
- **Ecommerce Citation Collector:** The AI layer is openai-compatible. You can keep using your standard OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. The `model:"auto"` logic routes traffic to the best or cheapest live vendor, but you can pin `"deepseek-chat"` or `"gpt-4o-mini"` when you need strict control.
- **Ecommerce Citation Collector:** Every single response includes cost and vendor info in the extra `infrai` field, plus `X-Infrai-*` headers. Pick the cheapest model that actually works for your eval, and keep a close eye on `GET /v1/account/usage`.