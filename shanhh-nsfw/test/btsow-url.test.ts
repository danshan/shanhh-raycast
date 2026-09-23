import assert from "node:assert/strict";
import test from "node:test";
import { resolveBtsowUrl } from "../src/utils/btsow-url.ts";

test("builds API and detail URLs from the configured host", () => {
  const host = "https://btsow.live/old-path?source=test#section";

  assert.equal(resolveBtsowUrl("/bts/data/api/search", host), "https://btsow.live/bts/data/api/search");
  assert.equal(resolveBtsowUrl("/bts/data/api/magnet", host), "https://btsow.live/bts/data/api/magnet");
  assert.equal(resolveBtsowUrl("/detail/hash%2Fvalue", host), "https://btsow.live/detail/hash%2Fvalue");
});

test("rejects insecure hosts, credentials, and paths that can change the host", () => {
  assert.throws(() => resolveBtsowUrl("/detail/hash", "http://btsow.live"), /HTTPS/);
  assert.throws(() => resolveBtsowUrl("/detail/hash", "https://user:password@btsow.live"), /credentials/);
  assert.throws(() => resolveBtsowUrl("//example.com/path", "https://btsow.live"), /absolute path/);
});
