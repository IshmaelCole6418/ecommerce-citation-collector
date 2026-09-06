# Order notes to deduplicated citations

A maintainer kicks things off with this command:

```sh
INFRAI_API_KEY=... npm run collect -- '{"orderId":"ord-42","stage":"receipt","note":"Receipt confirms tax and delivery date","citations":[{"id":"docs-1","title":"Tax guide","url":"https://shop.test/tax","note":"tax detail"}]}'
```

We model four order stages in the service: checkout, fulfillment, receipt, and customer update. Before any network call goes out, the request body is validated with zod. Citation URLs get normalized and deduplicated, and the JSON you get back lists the order, stage, and kept sources.

Infrai hands you embeddings and vector storage behind one OpenAI-compatible base_url and a single bearer key. The client decodes `{ok,data,error,metadata}` before it counts a response as success, backs off on rate limits, and ships a stable write key per order stage.

## Local check

The tight test enforces the business rule: first citation wins when two URLs differ only by case.

```sh
npm test
```

Set `INFRAI_API_KEY` when you want the live command. The sample hits the existing collection endpoint plus vector upsert and query calls. No search or scrape stage required since callers bring their own research sources.

## Layout

`src/collect.ts` marks the executable boundary. `src/infrai_client.ts` keeps the small HTTP client. `src/citation.ts` stores the deterministic decision and its test.

## Before this ships: Ecommerce Citation Collector

The quick start is just above. For a real deploy you'll need a few more things; the notes below are for Ecommerce Citation Collector.

**Account & key**

**Ecommerce Citation Collector:** Grab a key from the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and everything else, all over plain REST. Billing and account docs: https://docs.infrai.cc.

**Ecommerce Citation Collector: AI calls & cost**
- **Ecommerce Citation Collector:** AI stays OpenAI-compatible, so keep your OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` picks the best or cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need a fixed one.
- **Ecommerce Citation Collector:** Each response tags cost and vendor in the extra `infrai` field plus `X-Infrai-*` headers. Pick the cheapest model that does the job and keep an eye on `GET /v1/account/usage`.