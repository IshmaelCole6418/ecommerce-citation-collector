import test from "node:test";
import assert from "node:assert/strict";
import { dedupeCitations } from "./citation.ts";

test("keeps the first citation for a URL", () => {
  const result = dedupeCitations([{ id: "a", title: "Checkout", url: "https://shop.test/a", note: "one" }, { id: "b", title: "Duplicate", url: "HTTPS://SHOP.TEST/a", note: "two" }, { id: "c", title: "Receipt", url: "https://shop.test/c", note: "three" }]);
  assert.deepEqual(result.map((item) => item.id), ["a", "c"]);
});
