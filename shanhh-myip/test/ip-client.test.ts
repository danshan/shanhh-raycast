import assert from "node:assert/strict";
import test from "node:test";
import { extractIpAddress, parseIpAddress, parseLookupResponse } from "../src/clients/ip-client.ts";

test("parses direct and embedded IP addresses", () => {
  assert.equal(parseIpAddress(" 2001:db8::1\n"), "2001:db8::1");
  assert.equal(extractIpAddress("Current IP: 203.0.113.10 Location: Example"), "203.0.113.10");
  assert.throws(() => parseIpAddress("not-an-ip"), /did not contain/);
});

test("preserves false and zero lookup values", () => {
  assert.deepEqual(parseLookupResponse('{"ip":"203.0.113.10","in_eu":false,"latitude":0,"nested":{}}'), {
    ip: "203.0.113.10",
    in_eu: false,
    latitude: 0,
  });
});
