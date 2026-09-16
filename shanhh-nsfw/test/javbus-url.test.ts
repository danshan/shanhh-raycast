import assert from "node:assert/strict";
import test from "node:test";
import { resolveJavbusRequestUrl } from "../src/utils/javbus-url.ts";

const host = "https://www.javbus.com";

test("accepts URLs on the configured HTTPS origin", () => {
  assert.equal(resolveJavbusRequestUrl("/ABC-001", host), "https://www.javbus.com/ABC-001");
  assert.equal(resolveJavbusRequestUrl("https://www.javbus.com/ajax?q=1", host), "https://www.javbus.com/ajax?q=1");
});

test("rejects URLs outside the configured HTTPS origin", () => {
  for (const value of ["http://www.javbus.com/ABC-001", "https://example.com/ABC-001", "http://127.0.0.1:8080/private", "https://user:password@www.javbus.com/ABC-001"]) {
    assert.throws(() => resolveJavbusRequestUrl(value, host), /configured HTTPS origin/);
  }
});
